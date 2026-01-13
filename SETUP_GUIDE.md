# LiveNexus AI - Setup Guide

## Phase 1: Getting LiveKit Credentials

### Step 1: Create LiveKit Account

1. Go to [https://cloud.livekit.io](https://cloud.livekit.io)
2. Sign up for a free account
3. Create a new project (name it "LiveNexus AI")

### Step 2: Get Credentials

1. In your project dashboard, click on "Settings"
2. Copy the following values:
   - **API Key** (starts with "API...")
   - **API Secret** (starts with "sec...")
   - **WebSocket URL** (wss://your-project.livekit.cloud)

### Step 3: Configure Environment

Create `.env.local` in the project root:

```bash
LIVEKIT_API_KEY=APIxxxxxxxxxxxxxxxxxxxxxxxxx
LIVEKIT_API_SECRET=secxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
LIVEKIT_URL=wss://your-project.livekit.cloud
```

**IMPORTANT**: Never commit `.env.local` to Git. It's already in `.gitignore`.

## Phase 1: Running the Skeleton

### Frontend Only (Testing UI)

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`

### Full Stack (Frontend + Worker)

#### Terminal 1: Frontend
```bash
npm run dev
```

#### Terminal 2: Worker
```bash
cd ai-worker
docker build -t livenexus-worker .
docker run --env-file ../.env.local livenexus-worker
```

## Expected Behavior (Phase 1)

1. Click "Connect" button in UI
2. Allow microphone access
3. You should see "Connected to LiveKit"
4. Worker logs should show: "Audio Received: X frames processed"

## Troubleshooting

### "Failed to get LiveKit token"
- Check `.env.local` exists in root directory
- Verify credentials are correct (no extra spaces)
- Restart dev server after creating `.env.local`

### "Worker not connecting"
- Ensure Docker is running
- Check environment variables passed to Docker container
- View worker logs: `docker logs <container_id>`

### "No audio frames received"
- Verify microphone permissions granted in browser
- Check browser console for WebRTC errors
- Try a different browser (Chrome/Edge recommended)

## Next Steps (Phases 2-5)

- [ ] Phase 2: Add VAD + Faster-Whisper
- [ ] Phase 3: Implement transcript rendering
- [ ] Phase 4: Resource monitoring
- [ ] Phase 5: Production deployment

---

For questions or issues, review the logs:
- **Frontend**: Browser console (F12)
- **Worker**: `docker logs <container_id>`
