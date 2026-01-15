"""
LiveNexus AI Worker - Phase 2: AI Integration
Purpose: Real-time speech-to-text with VAD + faster-whisper
Status: Production-Grade Intelligence
"""

import os
import asyncio
import logging
import time
import json
import numpy as np
import webrtcvad
import psutil
from livekit import rtc, api
from faster_whisper import WhisperModel
from audio_utils import convert_livekit_to_whisper, estimate_speech_duration

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# LiveKit Configuration
LIVEKIT_URL = os.getenv('LIVEKIT_URL', 'ws://localhost:7880')
LIVEKIT_API_KEY = os.getenv('LIVEKIT_API_KEY')
LIVEKIT_API_SECRET = os.getenv('LIVEKIT_API_SECRET')
ROOM_NAME = os.getenv('LIVEKIT_ROOM', 'livenexus-demo')

# Whisper Configuration
WHISPER_MODEL_SIZE = os.getenv('WHISPER_MODEL', 'base')  # tiny, base, small, medium
WHISPER_SAMPLE_RATE = 16000

# Audio Buffer Configuration
BUFFER_DURATION_SECONDS = 3  # Accumulate 3 seconds before transcribing
SAMPLES_PER_BUFFER = BUFFER_DURATION_SECONDS * WHISPER_SAMPLE_RATE


class LiveNexusWorker:
    """AI Worker with VAD filtering, Whisper inference, and Adaptive Resource Management"""
    
    def __init__(self):
        self.room = None
        self.audio_frame_count = 0
        self.speech_frame_count = 0
        self.vad = None
        self.whisper_model = None
        self.current_model_size = WHISPER_MODEL_SIZE
        self.audio_buffer = []
        self.transcription_count = 0
        self.is_switching_model = False
        self.cpu_history = []
        
    async def initialize_ai_models(self):
        """Load AI models (VAD + Whisper)"""
        
        logger.info("=" * 60)
        logger.info("🧠 Loading AI Models...")
        logger.info("=" * 60)
        
        # Initialize VAD
        logger.info("Loading Voice Activity Detection (VAD)...")
        self.vad = webrtcvad.Vad(aggressiveness=3)
        logger.info("✅ VAD loaded (aggressiveness: 3)")
        
        # Initialize Whisper
        await self._load_whisper_model(self.current_model_size)
        logger.info("=" * 60)

    async def _load_whisper_model(self, size: str):
        """Internal method to load/switch model"""
        self.is_switching_model = True
        logger.info(f"🔄 Loading faster-whisper model: {size}...")
        
        start_time = time.time()
        
        # Clean up old model if exists to free memory
        if self.whisper_model:
            del self.whisper_model
            import gc
            gc.collect()

        try:
            # We use a wrapper to avoid blocking the event loop during heavy model loading
            self.whisper_model = await asyncio.to_thread(
                WhisperModel,
                size,
                device="cpu",
                compute_type="int8",
                num_workers=2
            )
            
            load_time = time.time() - start_time
            self.current_model_size = size
            logger.info(f"✅ Model {size} loaded in {load_time:.2f}s")
            
            # Notify UI
            await self.send_system_status()
        except Exception as e:
            logger.error(f"Failed to load model {size}: {e}")
        finally:
            self.is_switching_model = False

    async def monitor_resources(self):
        """Background task to monitor CPU and adapt model sizing"""
        logger.info("📊 Resource Monitor Started")
        
        while self.room and self.room.isconnected():
            try:
                cpu = psutil.cpu_percent(interval=2)
                self.cpu_history.append(cpu)
                if len(self.cpu_history) > 5:
                    self.cpu_history.pop(0)

                avg_cpu = sum(self.cpu_history) / len(self.cpu_history)
                
                # Logic for Adaptive Sizing
                if avg_cpu > 85 and self.current_model_size != "tiny" and not self.is_switching_model:
                    logger.warning(f"⚠️ High CPU Load ({avg_cpu:.1f}%). Downgrading to ECO MODE (tiny)...")
                    await self._load_whisper_model("tiny")
                
                elif avg_cpu < 40 and self.current_model_size == "tiny" and not self.is_switching_model:
                    logger.info(f"📈 CPU Load Normalized ({avg_cpu:.1f}%). Upgrading to PERFORMANCE MODE (base)...")
                    await self._load_whisper_model("base")

            except Exception as e:
                logger.error(f"Monitor error: {e}")
            
            await asyncio.sleep(5)

    async def send_system_status(self):
        """Notify UI of current model and mode"""
        mode = "ECO" if self.current_model_size == "tiny" else "PERFORMANCE"
        status = {
            "type": "system_status",
            "model": self.current_model_size,
            "mode": mode,
            "cpu": psutil.cpu_percent()
        }
        await self._send_data(status)

    async def _send_data(self, data: dict):
        if not self.room: return
        try:
            payload = json.dumps(data).encode('utf-8')
            await self.room.local_participant.publish_data(
                payload,
                kind=rtc.DataPacket_Kind.KIND_RELIABLE
            )
        except Exception as e:
            logger.error(f"Data send error: {e}")

    def check_speech_activity(self, audio_data: bytes, sample_rate: int) -> bool:
        """
        Use VAD to detect if audio contains speech
        """
        try:
            # VAD requires specific sample rates
            if sample_rate not in [8000, 16000, 32000, 48000]:
                return True
            return self.vad.is_speech(audio_data, sample_rate)
        except Exception as e:
            return True
    
    async def transcribe_audio_buffer(self):
        """
        Transcribe accumulated audio buffer with Whisper
        """
        if len(self.audio_buffer) == 0 or self.is_switching_model:
            return
        
        try:
            # Convert buffer to numpy array
            audio_array = np.array(self.audio_buffer, dtype=np.float32)
            duration = len(audio_array) / WHISPER_SAMPLE_RATE
            
            logger.info(f"🎙️  Transcribing {duration:.2f}s ({self.current_model_size})...")
            
            # Measure inference time
            start_time = time.time()
            
            # Transcribe
            segments, info = await asyncio.to_thread(
                self.whisper_model.transcribe,
                audio_array,
                language="en",
                task="transcribe",
                vad_filter=False,
                beam_size=5
            )
            
            transcript_parts = []
            for segment in segments:
                transcript_parts.append(segment.text.strip())
                await self.send_transcript(text=segment.text.strip(), is_final=False)
            
            final_transcript = " ".join(transcript_parts)
            inference_time = time.time() - start_time
            
            # Log results
            if final_transcript:
                self.transcription_count += 1
                logger.info(f"📝 [{self.current_model_size.upper()}] Transcript #{self.transcription_count}: {final_transcript}")
                logger.debug(f"⚡ Inference: {inference_time:.2f}s ({duration/inference_time:.1f}x)")
                
                await self.send_transcript(text=final_transcript, is_final=True)
            
            self.audio_buffer = []
        except Exception as e:
            logger.error(f"❌ Transcription error: {e}")
            self.audio_buffer = []
    
    async def send_transcript(self, text: str, is_final: bool):
        """Send transcript to frontend"""
        message = {
            "type": "transcript",
            "text": text,
            "isFinal": is_final,
            "model": self.current_model_size,
            "timestamp": time.time()
        }
        await self._send_data(message)
        
    async def connect_to_room(self):
        """Connect to LiveKit room as an AI agent"""
        
        if not LIVEKIT_API_KEY or not LIVEKIT_API_SECRET:
            raise ValueError("LiveKit credentials not set in environment variables")
        
        logger.info(f"🚀 Connecting to LiveKit: {LIVEKIT_URL}")
        
        # Generate access token
        token_generator = api.AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET)
        token_generator.identity = "livenexus-worker"
        token_generator.name = "LiveNexus AI Worker"
        token_generator.add_grant(api.VideoGrants(
            room_join=True, room=ROOM_NAME,
            can_subscribe=True, can_publish=True, can_publish_data=True
        ))
        
        token = token_generator.to_jwt()
        self.room = rtc.Room()
        self.room.on("participant_connected", self.on_participant_connected)
        self.room.on("track_subscribed", self.on_track_subscribed)
        
        await self.room.connect(LIVEKIT_URL, token)
        logger.info("✅ Connected! Starting Monitoring...")
        
        # Start monitoring task
        asyncio.create_task(self.monitor_resources())
        
        # Initial status send
        await self.send_system_status()
        
    async def on_participant_connected(self, participant: rtc.RemoteParticipant):
        """Called when a participant joins the room"""
        logger.info(f"👤 Participant connected: {participant.identity}")
        
    async def on_track_subscribed(
        self,
        track: rtc.Track,
        publication: rtc.RemoteTrackPublication,
        participant: rtc.RemoteParticipant
    ):
        """Called when we subscribe to a participant's track"""
        
        if track.kind == rtc.TrackKind.KIND_AUDIO:
            logger.info(f"🎤 Audio track subscribed from: {participant.identity}")
            
            # Create audio stream
            audio_stream = rtc.AudioStream(track)
            
            # Start processing audio frames
            asyncio.create_task(self.process_audio_stream(audio_stream, participant))
            
    async def process_audio_stream(self, audio_stream: rtc.AudioStream, participant: rtc.RemoteParticipant):
        """
        Process incoming audio frames with VAD + Whisper
        """
        
        logger.info(f"🔊 Starting real-time audio processing for {participant.identity}")
        logger.info(f"💡 VAD enabled - will filter silence for CPU efficiency")
        
        async for audio_frame in audio_stream:
            self.audio_frame_count += 1
            
            try:
                # Get audio data
                audio_data = audio_frame.data.tobytes()
                sample_rate = audio_frame.sample_rate
                num_channels = audio_frame.num_channels
                
                # Step 1: Voice Activity Detection (VAD)
                is_speech = self.check_speech_activity(audio_data, sample_rate)
                
                if not is_speech:
                    # Drop silence frames
                    if self.audio_frame_count % 100 == 0:
                        dropped = self.audio_frame_count - self.speech_frame_count
                        drop_rate = (dropped / self.audio_frame_count) * 100
                        logger.debug(f"⏭️  Dropped {dropped} silence frames ({drop_rate:.1f}% reduction)")
                    continue
                
                self.speech_frame_count += 1
                
                # Step 2: Convert audio format (LiveKit → Whisper)
                audio_converted = convert_livekit_to_whisper(
                    audio_data,
                    sample_rate,
                    num_channels,
                    WHISPER_SAMPLE_RATE
                )
                
                if len(audio_converted) == 0:
                    logger.warning("Audio conversion produced empty array, skipping")
                    continue
                
                # Step 3: Accumulate in buffer
                self.audio_buffer.extend(audio_converted)
                
                # Step 4: When buffer full, transcribe
                if len(self.audio_buffer) >= SAMPLES_PER_BUFFER:
                    logger.info(f"🎯 Buffer full ({len(self.audio_buffer)} samples ~3s), transcribing...")
                    await self.transcribe_audio_buffer()
                
                # Log progress every 100 speech frames
                if self.speech_frame_count % 100 == 0:
                    total_dropped = self.audio_frame_count - self.speech_frame_count
                    drop_rate = (total_dropped / self.audio_frame_count) * 100
                    logger.info(f"📊 Processed {self.speech_frame_count} speech frames")
                    logger.info(f"   Dropped: {total_dropped} silence frames ({drop_rate:.1f}% VAD reduction)")
                    logger.info(f"   Buffer: {len(self.audio_buffer)} samples ({len(self.audio_buffer)/WHISPER_SAMPLE_RATE:.1f}s)")
                    
            except Exception as e:
                logger.error(f"Error processing audio frame: {e}", exc_info=True)
                continue
            
    async def monitor_health(self):
        """Touch a file to signal health to Docker"""
        health_file = "/tmp/worker_health"
        while self.room and self.room.isconnected():
            try:
                with open(health_file, "w") as f:
                    f.write(str(time.time()))
            except Exception as e:
                logger.error(f"Health check failed: {e}")
            await asyncio.sleep(30)

    async def run(self):
        """Main worker loop"""
        try:
            # Load AI models first
            await self.initialize_ai_models()
            
            # Then connect to LiveKit
            await self.connect_to_room()
            
            # Start health monitor
            asyncio.create_task(self.monitor_health())
            
            # Keep the worker alive
            logger.info("🎯 Worker is running. Listening for audio...")
            await asyncio.Future()  # Run forever
            
        except KeyboardInterrupt:
            logger.info("⏹️  Shutting down worker...")
        except Exception as e:
            logger.error(f"❌ Worker error: {e}", exc_info=True)
        finally:
            if self.room:
                await self.room.disconnect()
                logger.info("👋 Disconnected from room")


async def main():
    """Entry point"""
    logger.info("=" * 60)
    logger.info("LiveNexus AI Worker - Phase 2: AI Integration")
    logger.info("CPU-Optimized Real-Time Audio Intelligence")
    logger.info("=" * 60)
    
    worker = LiveNexusWorker()
    await worker.run()


if __name__ == "__main__":
    asyncio.run(main())
