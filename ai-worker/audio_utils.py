"""
Audio Utilities for LiveNexus AI
Handles conversion between LiveKit audio format and Whisper requirements
"""

import numpy as np
import librosa
import logging

logger = logging.getLogger(__name__)


def convert_livekit_to_whisper(
    audio_data: bytes,
    sample_rate: int,
    num_channels: int,
    target_sample_rate: int = 16000
) -> np.ndarray:
    """
    Convert LiveKit audio format to Whisper-compatible format
    
    LiveKit format:
    - Variable sample rate (usually 48kHz)
    - 1 or 2 channels (mono/stereo)
    - int16 PCM
    
    Whisper format:
    - 16kHz sample rate
    - 1 channel (mono)
    - float32 array normalized to [-1.0, 1.0]
    
    Args:
        audio_data: Raw audio bytes (int16 PCM)
        sample_rate: Original sample rate (Hz)
        num_channels: Number of channels (1 or 2)
        target_sample_rate: Target sample rate (default: 16000)
    
    Returns:
        numpy array of float32 audio samples
    """
    
    try:
        # Step 1: Convert bytes → int16 numpy array
        audio_int16 = np.frombuffer(audio_data, dtype=np.int16)
        
        # Step 2: If stereo, convert to mono by averaging channels
        if num_channels == 2:
            # Reshape to (samples, channels) and average
            audio_int16 = audio_int16.reshape(-1, 2).mean(axis=1).astype(np.int16)
            logger.debug(f"Converted stereo → mono: {len(audio_int16)} samples")
        
        # Step 3: Normalize to float32 first (librosa expects float)
        audio_float32 = audio_int16.astype(np.float32) / 32768.0
        
        # Step 4: Resample if needed using librosa
        if sample_rate != target_sample_rate:
            audio_float32 = librosa.resample(audio_float32, orig_sr=sample_rate, target_sr=target_sample_rate)
            logger.debug(f"Resampled {sample_rate}Hz → {target_sample_rate}Hz: {len(audio_float32)} samples")
        
        return audio_float32
        
    except Exception as e:
        logger.error(f"Audio conversion failed: {e}")
        # Return empty array on failure
        return np.array([], dtype=np.float32)


def estimate_speech_duration(num_samples: int, sample_rate: int = 16000) -> float:
    """
    Estimate duration of audio in seconds
    
    Args:
        num_samples: Number of audio samples
        sample_rate: Sample rate in Hz
    
    Returns:
        Duration in seconds
    """
    return num_samples / sample_rate


def rms_energy(audio: np.ndarray) -> float:
    """
    Calculate RMS (Root Mean Square) energy of audio
    Useful for volume normalization
    
    Args:
        audio: Audio samples (float32)
    
    Returns:
        RMS energy value
    """
    return np.sqrt(np.mean(audio ** 2))
