# 🛡️ Failure Scenarios & Resilience

> "Real-time audio is unforgiving. A slight delay ruins the experience."

This document details how LiveNexus AI handles network jitter, CPU saturation, and VAD failures.

## 1. Failure Matrix

| Component | Failure Mode | Impact | Recovery Strategy |
| :--- | :--- | :--- | :--- |
| **User Network** | High Packet Loss | **Major**. Audio roboting. | **WebRTC PLC**. Packet Loss Concealment in Opus codec automatically fills gaps. |
| **AI Worker** | CPU Saturation (100%) | **Critical**. Lag > 2s. | **Resource Intelligence**. The system detects >80% load and hot-swaps the model to `tiny.en` (3x faster). |
| **VAD** | False Positive (Noise) | **Minor**. Garbage text. | **Confidence Threshold**. We increase the VAD aggression (Mode 3) to filter fan noise/typing. |
| **LiveKit API** | Connection Drop | **Major**. Room disconnect. | **Auto-Reconnect**. The Client SDK implements exponential backoff reconnection logic. |

---

## 2. Deep Dive: Resource Intelligence

### The Problem
Running ML inference (Whisper) on a CPU is intensive. If the User starts speaking rapidly, the queue of audio chunks grows faster than the processing speed. This leads to **Latency Drift** (Text appears 10s after speech).

### The Solution: Auto-Downgrade
The Worker runs a background thread checking `psutil.cpu_percent()`.
```python
if avg_load > 80:
    print("⚠️ High Load! Downgrading Model...")
    active_model = load_model("tiny.en")
elif avg_load < 40:
    print("✅ Load Normalized. Upgrading Model...")
    active_model = load_model("base.en")
```
This trade-off (Accuracy vs Latency) preserves the real-time feel at all costs.

---

## 3. Resilience Testing

### Test 1: The "Scream" Test (VAD)
1.  Make loud non-speech noises (Clapping, Banging).
2.  **Expectation**: The VAD filter should reject these as "Non-Speech". The Inference engine should NOT trigger (Saving CPU).

### Test 2: Network Cut
1.  Connect to the room.
2.  Turn off WiFi.
3.  **Expectation**: UI shows "Reconnecting...".
4.  Turn WiFi on.
5.  **Expectation**: Audio resumes, transcription continues without reloading the page.
