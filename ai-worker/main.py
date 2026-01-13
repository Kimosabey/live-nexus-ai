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
ROOM_NAME = 'livenexus-room'

# Whisper Configuration
WHISPER_MODEL_SIZE = os.getenv('WHISPER_MODEL', 'base')  # tiny, base, small, medium
WHISPER_SAMPLE_RATE = 16000

# Audio Buffer Configuration
BUFFER_DURATION_SECONDS = 3  # Accumulate 3 seconds before transcribing
SAMPLES_PER_BUFFER = BUFFER_DURATION_SECONDS * WHISPER_SAMPLE_RATE


class LiveNexusWorker:
    """AI Worker with VAD filtering and Whisper inference"""
    
    def __init__(self):
        self.room = None
        self.audio_frame_count = 0
        self.speech_frame_count = 0
        self.vad = None
        self.whisper_model = None
        self.audio_buffer = []
        self.transcription_count = 0
        
    async def initialize_ai_models(self):
        """Load AI models (VAD + Whisper)"""
        
        logger.info("=" * 60)
        logger.info("🧠 Loading AI Models...")
        logger.info("=" * 60)
        
        # Initialize VAD
        logger.info("Loading Voice Activity Detection (VAD)...")
        self.vad = webrtcvad.Vad(aggressiveness=3)  # 0-3, higher = stricter
        logger.info("✅ VAD loaded (aggressiveness: 3)")
        
        # Initialize Whisper
        logger.info(f"Loading faster-whisper model: {WHISPER_MODEL_SIZE}")
        start_time = time.time()
        
        self.whisper_model = WhisperModel(
            WHISPER_MODEL_SIZE,
            device="cpu",
            compute_type="int8",  # Quantization for speed
            num_workers=2  # Parallel processing
        )
        
        load_time = time.time() - start_time
        logger.info(f"✅ Whisper model loaded in {load_time:.2f}s")
        logger.info(f"   Model: {WHISPER_MODEL_SIZE}")
        logger.info(f"   Device: CPU (int8 quantization)")
        logger.info("=" * 60)
        
    def check_speech_activity(self, audio_data: bytes, sample_rate: int) -> bool:
        """
        Use VAD to detect if audio contains speech
        
        Args:
            audio_data: Raw audio bytes (int16 PCM)
            sample_rate: Sample rate (must be 8000, 16000, 32000, or 48000)
        
        Returns:
            True if speech detected, False otherwise
        """
        try:
            # VAD requires specific sample rates
            if sample_rate not in [8000, 16000, 32000, 48000]:
                logger.warning(f"Invalid sample rate for VAD: {sample_rate}, defaulting to True")
                return True
            
            # VAD requires specific frame lengths (10, 20, or 30 ms)
            # For now, we'll use conservative approach
            return self.vad.is_speech(audio_data, sample_rate)
            
        except Exception as e:
            logger.error(f"VAD error: {e}, defaulting to True")
            return True  # On error, process the frame
    
    async def transcribe_audio_buffer(self):
        """
        Transcribe accumulated audio buffer with Whisper
        """
        if len(self.audio_buffer) == 0:
            return
        
        try:
            # Convert buffer to numpy array
            audio_array = np.array(self.audio_buffer, dtype=np.float32)
            duration = len(audio_array) / WHISPER_SAMPLE_RATE
            
            logger.info(f"🎙️  Transcribing {duration:.2f}s of audio...")
            
            # Measure inference time
            start_time = time.time()
            cpu_before = psutil.cpu_percent(interval=0.1)
            
            # Transcribe with Whisper
            segments, info = self.whisper_model.transcribe(
                audio_array,
                language="en",
                task="transcribe",
                vad_filter=False,  # We already did VAD
                beam_size=5,
                best_of=5,
                without_timestamps=False  # Include timestamps
            )
            
            # Extract text from all segments
            transcript_parts = []
            for segment in segments:
                transcript_parts.append(segment.text.strip())
                
                # Send partial transcripts as they come (live typing effect)
                if self.room:
                    await self.send_transcript(
                        text=segment.text.strip(),
                        is_final=False
                    )
            
            # Build final transcript
            final_transcript = " ".join(transcript_parts)
            
            # Measure performance
            inference_time = time.time() - start_time
            cpu_after = psutil.cpu_percent(interval=0.1)
            
            # Log results
            if final_transcript:
                self.transcription_count += 1
                logger.info(f"📝 Transcript #{self.transcription_count}: {final_transcript}")
                logger.info(f"⚡ Performance:")
                logger.info(f"   Inference: {inference_time:.2f}s ({duration/inference_time:.1f}x realtime)")
                logger.info(f"   CPU: {cpu_after}% (peak during inference)")
                logger.info(f"   Language: {info.language} (confidence: {info.language_probability:.2%})")
                
                # Send final transcript
                await self.send_transcript(
                    text=final_transcript,
                    is_final=True
                )
            else:
                logger.warning("⚠️  No speech detected in audio buffer")
            
            # Clear buffer
            self.audio_buffer = []
            
        except Exception as e:
            logger.error(f"❌ Transcription error: {e}", exc_info=True)
            self.audio_buffer = []  # Clear buffer on error
    
    async def send_transcript(self, text: str, is_final: bool):
        """
        Send transcript to frontend via LiveKit DataChannel
        
        Args:
            text: Transcript text
            is_final: True if this is the final version, False if partial
        """
        if not self.room:
            return
        
        try:
            message = {
                "type": "transcript",
                "text": text,
                "isFinal": is_final,
                "timestamp": time.time()
            }
            
            # Encode to bytes
            payload = json.dumps(message).encode('utf-8')
            
            # Send via DataChannel
            await self.room.local_participant.publish_data(
                payload,
                kind=rtc.DataPacket_Kind.KIND_RELIABLE
            )
            
            logger.debug(f"📤 Sent {'final' if is_final else 'partial'} transcript: {text[:50]}...")
            
        except Exception as e:
            logger.error(f"Failed to send transcript: {e}")
        
    async def connect_to_room(self):
        """Connect to LiveKit room as an AI agent"""
        
        if not LIVEKIT_API_KEY or not LIVEKIT_API_SECRET:
            raise ValueError("LiveKit credentials not set in environment variables")
        
        logger.info(f"🚀 Connecting to LiveKit: {LIVEKIT_URL}")
        logger.info(f"📍 Room: {ROOM_NAME}")
        
        # Generate access token for the worker
        token_generator = api.AccessToken(
            api_key=LIVEKIT_API_KEY,
            api_secret=LIVEKIT_API_SECRET
        )
        token_generator.identity = "livenexus-worker"
        token_generator.name = "LiveNexus AI Worker"
        
        # Grant permissions
        token_generator.add_grant(
            api.VideoGrants(
                room_join=True,
                room=ROOM_NAME,
                can_subscribe=True,
                can_publish=True,
                can_publish_data=True
            )
        )
        
        token = token_generator.to_jwt()
        
        # Create room instance
        self.room = rtc.Room()
        
        # Register event handlers
        self.room.on("participant_connected", self.on_participant_connected)
        self.room.on("track_subscribed", self.on_track_subscribed)
        
        # Connect to the room
        await self.room.connect(LIVEKIT_URL, token)
        logger.info("✅ Connected to LiveKit room successfully!")
        
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
            
    async def run(self):
        """Main worker loop"""
        try:
            # Load AI models first
            await self.initialize_ai_models()
            
            # Then connect to LiveKit
            await self.connect_to_room()
            
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
