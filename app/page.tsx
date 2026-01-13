'use client'

import { useState } from 'react'
import { Room } from 'livekit-client'
import ConnectButton from '@/components/ConnectButton'
import TranscriptView from '@/components/TranscriptView'

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
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <header className="text-center space-y-4 pt-8">
                <h1 className="text-5xl font-bold text-gradient">
                    LiveNexus AI
                </h1>
                <p className="text-stealth-silver text-lg">
                    Real-Time Hybrid Audio Intelligence Platform
                </p>
                <div className="flex items-center justify-center gap-2 text-sm">
                    <span className="px-3 py-1 bg-stealth-gray-800 rounded-full border border-stealth-gray-700">
                        CPU-Optimized
                    </span>
                    <span className="px-3 py-1 bg-stealth-gray-800 rounded-full border border-stealth-gray-700">
                        WebRTC Transport
                    </span>
                    <span className="px-3 py-1 bg-stealth-gray-800 rounded-full border border-stealth-gray-700">
                        Zero-Stutter UI
                    </span>
                </div>
            </header>

            {/* Connection Status */}
            <div className="glass rounded-xl p-6 border border-stealth-gray-800">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400 glow-accent' : 'bg-stealth-gray-700'}`} />
                        <span className="font-medium">
                            {isConnected ? 'Connected to LiveKit' : 'Disconnected'}
                        </span>
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
                <TranscriptView room={room} />
            )}

            {/* Instructions (when not connected) */}
            {!isConnected && (
                <div className="transcript-card space-y-4">
                    <h2 className="text-xl font-semibold text-stealth-accent">
                        Getting Started
                    </h2>
                    <ol className="list-decimal list-inside space-y-2 text-stealth-silver">
                        <li>Click "Connect" to join a LiveKit room</li>
                        <li>Allow microphone access when prompted</li>
                        <li>Start speaking - your audio will be transcribed in real-time</li>
                        <li>Watch the magic of CPU-optimized AI inference</li>
                    </ol>
                    <div className="mt-4 p-4 bg-stealth-gray-800 rounded-lg border border-stealth-gray-700">
                        <p className="text-sm text-stealth-silver">
                            <strong className="text-stealth-accent">Note:</strong> Ensure your <code className="px-2 py-1 bg-stealth-black rounded">.env.local</code> file contains valid LiveKit credentials.
                        </p>
                    </div>
                </div>
            )}

            {/* Architecture Info */}
            <div className="grid md:grid-cols-3 gap-4">
                <div className="transcript-card">
                    <h3 className="font-semibold text-stealth-accent mb-2">Frontend</h3>
                    <p className="text-sm text-stealth-silver">Next.js 14 + LiveKit Client SDK</p>
                </div>
                <div className="transcript-card">
                    <h3 className="font-semibold text-stealth-accent mb-2">Transport</h3>
                    <p className="text-sm text-stealth-silver">LiveKit Cloud (WebRTC SFU)</p>
                </div>
                <div className="transcript-card">
                    <h3 className="font-semibold text-stealth-accent mb-2">AI Engine</h3>
                    <p className="text-sm text-stealth-silver">Python + Faster-Whisper</p>
                </div>
            </div>
        </div>
    )
}
