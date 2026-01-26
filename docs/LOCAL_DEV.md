# 🚀 Local Development Guide

## Quick Start (Minimal Setup)

### **Step 1: Start the AI Worker**
```bash
docker-compose up --build
```
This will:
- Build the Python AI worker
- Start it in the background
- Auto-restart if it crashes

### **Step 2: Start the Frontend**
Open a **new terminal**:
```bash
npm install  # First time only
npm run dev
```

### **Step 3: Access the App**
Open browser: **http://localhost:3000**

---

## 🛑 Stop Everything

**Stop Frontend**: `Ctrl+C` in the npm terminal  
**Stop Worker**: `docker-compose down`

---

## 🔧 Troubleshooting

### "Worker won't start"
```bash
# Check if .env.local exists
cat .env.local

# Should show:
# LIVEKIT_URL=wss://...
# LIVEKIT_API_KEY=...
# LIVEKIT_API_SECRET=...
```

### "Frontend can't connect"
- Make sure LiveKit credentials in `.env.local` are correct
- Check worker logs: `docker-compose logs worker`

### "Need to rebuild worker"
```bash
docker-compose down
docker-compose up --build
```

---

## 💡 Why This Setup?

**Frontend (npm)**: 
- Fast hot-reload
- No Docker overhead
- Easy debugging

**Worker (Docker)**:
- Heavy Python dependencies
- Isolated environment
- Consistent across machines

---

## 📦 What's Running?

| Service | Where | Port |
|---------|-------|------|
| Next.js Frontend | Local (npm) | 3000 |
| Python AI Worker | Docker | - |
| LiveKit Cloud | Cloud | wss:// |

---

**That's it! Simple and stress-free.** 🎯
