'use client'

import { useState } from 'react'
import { Room, RoomEvent } from 'livekit-client'

interface ConnectButtonProps {
    onConnect: (room: Room) => void
    onDisconnect: () => void
    isConnected: boolean
}

export default function ConnectButton({ onConnect, onDisconnect, isConnected }: ConnectButtonProps) {
    const [isConnecting, setIsConnecting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleConnect = async () => {
        setIsConnecting(true)
        setError(null)

        try {
            // Get LiveKit credentials from API route
            const response = await fetch('/api/livekit-token')

            if (!response.ok) {
                throw new Error('Failed to get LiveKit token')
            }

            const { token, url } = await response.json()

            // Connect to LiveKit room
            const room = new Room({
                adaptiveStream: true,
                dynacast: true,
            })

            // Listen for connection events
            room.on(RoomEvent.Connected, () => {
                console.log('✅ Connected to LiveKit room')
                onConnect(room)
                setIsConnecting(false)
            })

            room.on(RoomEvent.Disconnected, () => {
                console.log('❌ Disconnected from LiveKit room')
            })

            // Connect to room
            await room.connect(url, token)

            // Enable microphone
            await room.localParticipant.setMicrophoneEnabled(true)

        } catch (err) {
            console.error('Connection error:', err)
            setError(err instanceof Error ? err.message : 'Failed to connect')
            setIsConnecting(false)
        }
    }

    return (
        <div className="space-y-2">
            <button
                onClick={isConnected ? onDisconnect : handleConnect}
                disabled={isConnecting}
                className={isConnected ? 'btn-stealth' : 'btn-stealth-primary'}
            >
                {isConnecting ? (
                    <span className="flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Connecting...
                    </span>
                ) : isConnected ? (
                    'Disconnect'
                ) : (
                    'Connect'
                )}
            </button>

            {error && (
                <p className="text-red-400 text-sm">
                    {error}
                </p>
            )}
        </div>
    )
}
