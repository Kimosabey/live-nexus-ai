'use client'

import { useState } from 'react'
import { Room } from 'livekit-client'
import {
    LinkIcon,
    MicrophoneIcon,
    ChatBubbleLeftRightIcon,
    BoltIcon,
    CodeBracketIcon,
    GlobeAltIcon,
    CpuChipIcon
} from '@heroicons/react/24/outline'
import ConnectButton from '@/components/ConnectButton'
import TranscriptView from '@/components/TranscriptView'
import ParticleBackground from '@/components/ParticleBackground'

export default function Home() {
    const [room, setRoom] = useState<Room | null>(null)
    const [isConnected, setIsConnected] = useState(false)

    const handleConnect = (connectedRoom: Room) => {
        setRoom(connectedRoom)
        setIsConnected(true)
    }

    const handleDisconnect = () => {
        if (room) {
            room.disconnect()
            setRoom(null)
            setIsConnected(false)
        }
    }

    return (
        <div className="min-h-screen relative">
            <ParticleBackground />
            <div className="max-w-6xl mx-auto space-y-8 px-4 py-12 relative z-10">
                {/* Header with Gradient */}
                <header className="text-center space-y-6 animate-fade-in">
                    <div className="inline-block">
                        <h1 className="text-6xl md:text-7xl font-bold text-gradient mb-2">
                            LiveNexus AI
                        </h1>
                        <div className="h-1 bg-gradient-to-r from-transparent via-stealth-accent to-transparent rounded-full" />
                    </div>

                    <p className="text-stealth-silver text-xl max-w-2xl mx-auto">
                        Real-Time Hybrid Audio Intelligence Platform
                    </p>

                    <div className="badge-container flex flex-wrap items-center justify-center gap-3">
                        {['CPU-Optimized', 'WebRTC Transport', 'Zero-Stutter UI'].map((badge, i) => (
                            <span
                                key={badge}
                                className="px-4 py-2 glass rounded-full border border-stealth-gray-800 text-sm font-medium hover:border-stealth-accent/50 hover:scale-110 transition-all duration-300 cursor-default"
                            >
                                {badge}
                            </span>
                        ))}
                    </div>
                </header>

                {/* Connection Card */}
                <div className="glass rounded-2xl p-6 border border-stealth-gray-800 shadow-2xl animate-slide-up">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className={`relative w-4 h-4 rounded-full transition-all duration-300 ${isConnected ? 'bg-green-400' : 'bg-stealth-gray-600'}`}>
                                {isConnected && (
                                    <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75" />
                                )}
                            </div>
                            <div>
                                <span className="font-semibold text-lg">
                                    {isConnected ? 'Live Session Active' : 'Ready to Connect'}
                                </span>
                                <p className="text-sm text-stealth-gray-700">
                                    {isConnected ? 'Transcribing in real-time' : 'Start your AI session'}
                                </p>
                            </div>
                        </div>
                        <ConnectButton
                            onConnect={handleConnect}
                            onDisconnect={handleDisconnect}
                            isConnected={isConnected}
                        />
                    </div>
                </div>

                {/* Transcript View */}
                {isConnected && room && (
                    <div>
                        <TranscriptView room={room} />
                    </div>
                )}

                {/* Getting Started (when not connected) */}
                {!isConnected && (
                    <div className="space-y-6 animate-slide-up">
                        <div className="glass rounded-2xl p-8 border border-stealth-gray-800">
                            <h2 className="text-2xl font-bold text-stealth-accent mb-6 flex items-center gap-3">
                                <span className="w-2 h-8 bg-stealth-accent rounded-full" />
                                Quick Start Guide
                            </h2>
                            <ol className="space-y-4">
                                {[
                                    { step: 1, text: 'Click "Connect" to join a LiveKit room', Icon: LinkIcon },
                                    { step: 2, text: 'Allow microphone access when prompted', Icon: MicrophoneIcon },
                                    { step: 3, text: 'Start speaking - transcription happens live', Icon: ChatBubbleLeftRightIcon },
                                    { step: 4, text: 'Watch adaptive AI inference in action', Icon: BoltIcon }
                                ].map(({ step, text, Icon }) => (
                                    <li key={step} className="step-item flex items-start gap-4 group cursor-default">
                                        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-stealth-gray-800 border border-stealth-gray-700 flex items-center justify-center text-sm font-bold group-hover:border-stealth-accent transition-colors">
                                            {step}
                                        </span>
                                        <Icon className="w-5 h-5 text-stealth-accent mt-1.5 flex-shrink-0 group-hover:rotate-12 transition-transform duration-300" />
                                        <span className="text-stealth-silver pt-1">
                                            {text}
                                        </span>
                                    </li>
                                ))}
                            </ol>
                        </div>

                        {/* Architecture Cards */}
                        <div className="grid md:grid-cols-3 gap-4">
                            {[
                                { title: 'Frontend', tech: 'Next.js 14 + LiveKit', Icon: CodeBracketIcon },
                                { title: 'Transport', tech: 'LiveKit Cloud (WebRTC)', Icon: GlobeAltIcon },
                                { title: 'AI Engine', tech: 'Python + Faster-Whisper', Icon: CpuChipIcon }
                            ].map(({ title, tech, Icon }) => (
                                <div
                                    key={title}
                                    className="arch-card glass rounded-xl p-6 border border-stealth-gray-800 hover:border-stealth-accent/30 transition-all duration-300 group cursor-default"
                                >
                                    <Icon className="w-12 h-12 text-stealth-accent mb-3 group-hover:scale-110 group-hover:-translate-y-2 transition-all duration-300" />
                                    <h3 className="font-bold text-stealth-accent mb-2">{title}</h3>
                                    <p className="text-sm text-stealth-gray-700">{tech}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
