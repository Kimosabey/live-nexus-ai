# 🚀 Getting Started with LiveNexus AI

> **Prerequisites**
> *   **Docker Desktop** (For the AI Worker)
> *   **Node.js v18+**
> *   **LiveKit Cloud Account** (Free Tier is sufficient)

## 1. Environment Setup

### A. LiveKit Credentials
1.  Go to [LiveKit Cloud](https://cloud.livekit.io/).
2.  Create a Project.
3.  Generate an API Key and Secret.

### B. Configuration (`.env.local`)
Create a `.env.local` file in the root directory:
```ini
LIVEKIT_API_KEY=APIv...
LIVEKIT_API_SECRET=sec_...
LIVEKIT_URL=wss://your-project.livekit.cloud
```

---

## 2. Installation & Launch

### Step 1: Start Frontend (The UI)
The frontend handles the User connection and audio capture.
```bash
npm install
npm run dev
# Running at http://localhost:3000
```

### Step 2: Start AI Worker (The Intelligence)
The worker runs in Docker to manage Python dependencies (Whisper, VAD).
```bash
cd ai-worker
docker build -t livenexus-worker .
docker run --env-file ../.env.local livenexus-worker
```

---

## 3. Usage Guide

1.  **Open Browser**: Go to `http://localhost:3000`.
2.  **Connect**: Click **"Connect"** and allow Microphone access.
3.  **Verify**: You should see your camera/audio active.
4.  **Speak**: Say something. The AI Worker log will show "Processing Chunk...".
5.  **Observe**: Text appears on the screen in real-time.

---

## 4. Running Benchmarks

### CPU Load Test
To verify the "Resource Intelligence" feature:
1.  Open Task Manager / Activity Monitor.
2.  Start the Worker.
3.  Play a YouTube video into the microphone (Continuous Speech).
4.  **Expectation**: CPU usage spikes. If it hits >80%, the Worker logs `Downgrading to tiny.en model`.

### Latency Test
Measure the time between "Voice Start" and "Text Appear".
*   **Target**: < 500ms.
*   **Optimized**: ~200ms using VAD.
