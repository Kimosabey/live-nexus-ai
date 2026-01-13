# LiveNexus AI - Quick Start Guide

Get LiveNexus AI running in under 10 minutes.

---

## ⚡ Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Docker** Desktop ([Download](https://www.docker.com/products/docker-desktop))
- **LiveKit Cloud** account (free tier)

---

## 🚀 Step 1: Get LiveKit Credentials

### Create Free Account

1. Go to [https://cloud.livekit.io](https://cloud.livekit.io)
2. Sign up with GitHub or email
3. Create a new project (name it anything, e.g., "LiveNexus Test")

### Copy Credentials

In your new project dashboard:

1. Click **"Settings"** in the left sidebar
2. Scroll to **"API Keys"**
3. Click **"Generate Key"**
4. Copy these three values:
   - **WebSocket URL**: `wss://your-project-xxxxx.livekit.cloud`
   - **API Key**: `APIxxxxxxxxx...`
   - **API Secret**: `secxxxxxxxxx...`

⚠️ **Important**: Keep the API Secret secure - treat it like a password!

---

## 📦 Step 2: Clone and Install

```bash
# Clone repository
git clone https://github.com/Kimosabey/live-nexus-ai.git
cd live-nexus-ai

# Install frontend dependencies
npm install
```

**Expected time**: 2-3 minutes

---

## 🔐 Step 3: Configure Environment

Create a file named `.env.local` in the project root:

```bash
# Windows PowerShell
New-Item .env.local

# Mac/Linux
touch .env.local
```

Open `.env.local` and paste your credentials:

```env
LIVEKIT_URL=wss://your-project-xxxxx.livekit.cloud
LIVEKIT_API_KEY=APIxxxxxxxxxxxxxxxxxx
LIVEKIT_API_SECRET=secxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Replace** with values from Step 1!

---

## 🎨 Step 4: Start the Frontend

```bash
npm run dev
```

**Output:**
```
  ▲ Next.js 14.2.24
  - Local:        http://localhost:3000
  - ready in 2.1s
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

**You should see:**
- LiveNexus AI heading
- "Disconnected" status
- Connect button

---

## 🐳 Step 5: Start the AI Worker

### Build Docker Image

Open **a new terminal** (keep the frontend running):

```bash
cd ai-worker
docker build -t livenexus-worker .
```

**Expected time**: 3-5 minutes (first time only)

### Run Worker

```bash
# Windows PowerShell
docker run --env-file ..\.env.local livenexus-worker

# Mac/Linux
docker run --env-file ../.env.local livenexus-worker
```

**Expected Output:**
```
==========================================================
LiveNexus AI Worker - Phase 1: Skeleton
CPU-Optimized Real-Time Audio Intelligence
==========================================================
🚀 Connecting to LiveKit: wss://your-project.livekit.cloud
📍 Room: livenexus-room
✅ Connected to LiveKit room successfully!
🎯 Worker is running. Waiting for audio...
```

---

## ✅ Step 6: Test the Connection

### In Browser (http://localhost:3000):

1. Click **"Connect"** button
2. Allow microphone access when prompted
3. You should see:
   - Green dot indicator
   - "Connected to LiveKit" status

### In Worker Terminal:

You should see:
```
👤 Participant connected: user-1234567890
🎤 Audio track subscribed from: user-1234567890
🔊 Starting audio processing for user-1234567890
📊 Audio Received: 100 frames processed
   Sample Rate: 48000 Hz
   Channels: 2
   Samples: 480
```

### What This Means:

✅ **Frontend → LiveKit**: Connected  
✅ **LiveKit → Worker**: Audio streaming  
✅ **Worker → Processing**: Receiving frames  

**Phase 1 Complete!** 🎉

---

## 🔧 Troubleshooting

### Error: "Failed to get LiveKit token"

**Cause**: Environment variables not loaded

**Fix:**
1. Verify `.env.local` exists in project root
2. Check no typos in variable names
3. Restart dev server: `Ctrl+C` → `npm run dev`

---

### Error: "Worker not connecting"

**Cause**: Docker can't read `.env.local`

**Fix (Windows):**
```powershell
# Absolute path
docker run -e LIVEKIT_URL=wss://... -e LIVEKIT_API_KEY=... -e LIVEKIT_API_SECRET=... livenexus-worker
```

**Fix (Mac/Linux):**
```bash
docker run --env-file "$(pwd)/../.env.local" livenexus-worker
```

---

### Warning: "No audio frames received"

**Cause**: Microphone not enabled

**Fix:**
1. Check browser permissions (click lock icon in address bar)
2. Try different browser (Chrome/Edge recommended)
3. Check system microphone settings

---

### Docker Build Error: "dial tcp: lookup index.docker.io"

**Cause**: Docker can't reach internet

**Fix:**
1. Check internet connection
2. Restart Docker Desktop
3. Try: `docker pull python:3.10-slim` manually

---

## 📋 Verification Checklist

- [ ] Frontend runs on http://localhost:3000
- [ ] "Connect" button visible
- [ ] Click Connect → green indicator appears
- [ ] Worker logs show "Participant connected"
- [ ] Worker logs show "Audio Received" every few seconds
- [ ] No error messages in browser console (F12)

**All checked?** Phase 1 is working perfectly! 🚀

---

## 🎯 Next Steps

### Phase 2: Enable AI Transcription

**Coming soon!** This will add:
- Voice Activity Detection (drop silence)
- faster-whisper inference (speech-to-text)
- Real-time transcript rendering in UI

**Status**: Currently in development

### Test Audio Processing

**Try this:**
1. Speak into your microphone
2. Watch worker terminal count frames
3. Every 100 frames = ~2 seconds of audio

**What's missing**: Actual transcription (Phase 2)

---

## 🛑 Stopping the System

### Stop Frontend:
- Terminal 1: Press `Ctrl+C`

### Stop Worker:
- Terminal 2: Press `Ctrl+C`

### Cleanup Docker:
```bash
# List running containers
docker ps

# Stop specific container
docker stop <container_id>

# Remove stopped containers
docker container prune
```

---

## 🔄 Restarting

**Next time you work on the project:**

```bash
# Terminal 1: Frontend (in project root)
npm run dev

# Terminal 2: Worker (in ai-worker folder)
docker run --env-file ../.env.local livenexus-worker
```

**Tip**: Docker image is cached - second run is instant!

---

## 📚 Additional Resources

- [LiveKit Documentation](https://docs.livekit.io/)
- [Next.js Tutorial](https://nextjs.org/learn)
- [Docker Basics](https://docs.docker.com/get-started/)

---

## 💬 Need Help?

**Common Issues:**
- Check `SETUP_GUIDE.md` for detailed troubleshooting
- Review `docs/ARCHITECTURE.md` for system design
- Check Docker logs: `docker logs <container_id>`

---

**You're all set! Welcome to LiveNexus AI. 🎙️**
