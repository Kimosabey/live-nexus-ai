# 📁 Project Structure

```
live-nexus-ai/
├── 📄 Core Files
│   ├── README.md              # Main project documentation
│   ├── LICENSE                # MIT License
│   ├── PROJECT_TRACKER.md     # Quick reference (Blueprint format)
│   ├── package.json           # Frontend dependencies
│   └── docker-compose.yml     # AI Worker container
│
├── ⚙️ Configuration
│   ├── .env.local            # LiveKit credentials (gitignored)
│   ├── .env.example          # Environment template
│   ├── next.config.js        # Next.js config
│   ├── tailwind.config.js    # Stealth design tokens
│   └── tsconfig.json         # TypeScript config
│
├── 🎨 Frontend (app/)
│   ├── layout.tsx            # Root layout + providers
│   ├── page.tsx              # Main dashboard
│   ├── globals.css           # Stealth design system
│   └── api/livekit-token/    # JWT generation
│
├── 🧩 Components (components/)
│   ├── ConnectButton.tsx     # LiveKit connection
│   ├── TranscriptView.tsx    # Double-buffer UI
│   ├── ErrorBoundary.tsx     # Fault tolerance
│   └── ToastProvider.tsx     # Notifications
│
├── 🤖 AI Worker (ai-worker/)
│   ├── main.py              # Worker + Adaptive logic
│   ├── audio_utils.py       # PCM conversion
│   ├── requirements.txt     # Python dependencies
│   └── Dockerfile           # Production build
│
└── 📚 Documentation (docs/)
    ├── ARCHITECTURE.md       # System design deep-dive
    ├── INTERVIEW.md          # Talking points
    ├── QUICKSTART.md         # Beginner setup
    └── LOCAL_DEV.md          # Development guide
```

## 🎯 Essential Files Only

**Development**: 23 files  
**Documentation**: 4 guides  
**Total Size**: ~15 MB (including node_modules)

Clean and production-ready! ✨
