"""
LiveNexus AI Worker - Phase 1: Skeleton
Purpose: Join LiveKit room as an agent and log audio reception
Status: Foundation Only (No AI inference yet)
"""

import os
import asyncio
import logging
from livekit import rtc, api

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


class LiveNexusWorker:
    """AI Worker that processes audio from LiveKit rooms"""
    
    def __init__(self):
        self.room = None
        self.audio_frame_count = 0
        
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
        """Process incoming audio frames (Phase 1: Just log reception)"""
        
        logger.info(f"🔊 Starting audio processing for {participant.identity}")
        
        async for audio_frame in audio_stream:
            self.audio_frame_count += 1
            
            # Phase 1: Just log every 100 frames to confirm audio reception
            if self.audio_frame_count % 100 == 0:
                logger.info(f"📊 Audio Received: {self.audio_frame_count} frames processed")
                logger.info(f"   Sample Rate: {audio_frame.sample_rate} Hz")
                logger.info(f"   Channels: {audio_frame.num_channels}")
                logger.info(f"   Samples: {audio_frame.samples_per_channel}")
            
            # TODO Phase 2: Add VAD filtering here
            # TODO Phase 3: Add Faster-Whisper inference here
            # TODO Phase 4: Send transcripts via DataChannel
            
    async def run(self):
        """Main worker loop"""
        try:
            await self.connect_to_room()
            
            # Keep the worker alive
            logger.info("🎯 Worker is running. Waiting for audio...")
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
    logger.info("LiveNexus AI Worker - Phase 1: Skeleton")
    logger.info("CPU-Optimized Real-Time Audio Intelligence")
    logger.info("=" * 60)
    
    worker = LiveNexusWorker()
    await worker.run()


if __name__ == "__main__":
    asyncio.run(main())
