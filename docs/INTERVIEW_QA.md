# 🎤 Interview Cheat Sheet: LiveNexus AI

## 1. The Elevator Pitch (2 Minutes)

"LiveNexus AI is a **Real-Time Audio Intelligence Platform**.

Most transcription apps send audio to the cloud via API, which introduces 2-3 seconds of latency.
I built a **Hybrid edge-cloud architecture**:
1.  **Cloud Transport**: Used **LiveKit** for WebRTC signaling (handling STUN/TURN complexity).
2.  **Local Intelligence**: I deployed a custom Python Agent that joins the call.
3.  **Optimization**: Instead of naive processing, I used **webrtcvad** to gate the audio (dropping 70% of silence) and run **Faster-Whisper** on CPU.
This achieves <200ms latency without needing expensive GPUs."

---

## 2. "Explain Like I'm 5" (The stenographer)

"Imagine a standard Zoom call.
*   **Usually**: The computer records the meeting, sends it to a factory, and you get the text tomorrow.
*   **LiveNexus**: I put a robot stenographer *inside* the meeting room.
*   **The Trick**: The robot is very efficient. If no one is talking (silence), it sleeps. It only wakes up when it hears a human voice. It writes down what you say instantly and passes a note to everyone in the room."

---

## 3. Tough Technical Questions

### Q: Why not use OpenAI's Whisper API?
**A:** "Latency and Cost.
1.  **Latency**: Sending an HTTP Post, processing, and receiving a response takes ~1000ms+. Real-time conversation feels broken with that delay.
2.  **Streaming**: OpenAI Whisper API is request-based. My local Faster-Whisper setup allows me to stream 30ms audio chunks continuously."

### Q: How do you handle Overlapping Speech?
**A:** "LiveKit provides **separate Audio Tracks** for each participant.
My Worker subscribes to *all* tracks independently. I run separate orchestration threads for 'Participant A' and 'Participant B'. This means even if they shout over each other, I generate two clean, distinct transcript streams."

### Q: Why DataChannels instead of WebSockets?
**A:** "Synchronization.
WebSockets run over TCP (Head-of-line blocking). DataChannels run over high-performance UDP (SCTP) inside the same Peer Connection as the audio.
This ensures that if the network lags, the text and audio packet arrive (or drop) with similar timing, keeping the lipsync tight."
