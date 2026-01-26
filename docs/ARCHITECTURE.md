# 🏗️ System Architecture

## 1. High-Level Design (HLD)

LiveNexus AI implements a **Hybrid Real-Time Architecture** that combines Cloud Transport (LiveKit SFU) with Edge Inference (Local Python Worker). This allows for low-latency audio intelligence (Transcription) without requiring expensive GPU cloud clusters.

```mermaid
graph TD
    User([👤 User / Browser]) -->|WebRTC Audio| LiveKit[☁️ LiveKit Cloud SFU]
    
    subgraph "Local Execution Environment"
        Worker[🐍 Python AI Worker] -->|Subscribe Audio| LiveKit
        Worker -->|1. VAD Gate| CPU[Faster-Whisper (CPU)]
        CPU -->|2. Transcribe| Worker
        Worker -->|3. DataChannel| LiveKit
    end
    
    LiveKit -->|Real-Time Text| User
```

### Core Components
1.  **Frontend (Next.js 14)**: Handles Microphone capture, Media permissions, and rendering the "Double-Buffered" transcript UI.
2.  **LiveKit Cloud (SFU)**: The Selective Forwarding Unit that handles the heavy lifting of WebRTC signaling and media routing.
3.  **Python Worker**: A Dockerized service that joins the room as a "Silent Agent". It subscribes to audio, creates transcripts, and broadcasts them back via DataChannels.

---

## 2. Low-Level Design (LLD)

### The Audio Pipeline
To achieve <200ms latency on a standard CPU, we use an aggressive filtering pipeline:

1.  **Ingestion**: Audio packets received via LiveKit Python SDK.
2.  **VAD Gating (webrtcvad)**:
    *   **Logic**: Is this 30ms chunk human speech?
    *   **Result**: Discards 70% of silence/noise packets instantly.
3.  **Inference (Faster-Whisper)**:
    *   **Engine**: CTranslate2 (Quantized).
    *   **Model**: `tiny.en` or `base.en` (Auto-switching based on CPU load).
4.  **Egress**: Text sent via `DataChannel` (Low overhead vs WebSocket).

### Data Schema (Transcript Event)
```json
{
  "type": "transcript",
  "data": {
    "speaker": "Identity_ID",
    "text": "Hello world",
    "is_final": false, // True = Sentence complete
    "timestamp": 1715000000
  }
}
```

---

## 3. Decision Log

| Decision | Alternative | Reason for Choice |
| :--- | :--- | :--- |
| **LiveKit** | Raw WebRTC | **Reliability**. Building a stable SFU from scratch is error-prone. LiveKit handles Network traversal (STUN/TURN) and scaling. |
| **Faster-Whisper** | OpenAI Whisper API | **Latency & Cost**. Cloud APIs have ~1s latency and per-minute costs. Faster-Whisper runs locally in <200ms for free. |
| **DataChannels** | Websockets | **Sync**. DataChannels run inside the same WebRTC peer connection, ensuring text arrives synchronized with the audio stream (Lipsync). |

---

## 4. Key Patterns

### "Double-Buffer" UI Rendering
To prevent the "flickering" text common in streaming transcription:
1.  **Buffer A (Stable)**: Displays `is_final=true` text (Confirmed sentences).
2.  **Buffer B (Volatile)**: Displays `is_final=false` text (Real-time updates).
*   **Action**: When a sentence finishes, it moves from B to A. This creates a "Zero-Stutter" experience.

### Resource Intelligence (Auto-Downgrade)
The Worker monitors its own CPU usage.
*   If `CPU > 80%` for 5 seconds: Switch from `base.en` to `tiny.en` model.
*   This prevents audio lag artifacts (robotic voice) during load spikes.
