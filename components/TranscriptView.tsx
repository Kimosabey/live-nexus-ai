'use client'

import { useEffect, useState } from 'react'
import { Room, RoomEvent, DataPacket_Kind } from 'livekit-client'

interface Transcript {
    id: string
    text: string
    isFinal: boolean
    timestamp: Date
}

interface TranscriptViewProps {
    room: Room
}

export default function TranscriptView({ room }: TranscriptViewProps) {
    const [transcripts, setTranscripts] = useState<Transcript[]>([])
    const [partialTranscript, setPartialTranscript] = useState<string>('')

    useEffect(() => {
        if (!room) return

        // Listen for data messages from Python worker
        const handleDataReceived = (payload: Uint8Array, participant: any, kind: DataPacket_Kind) => {
            const decoder = new TextDecoder()
            const message = JSON.parse(decoder.decode(payload))

            if (message.type === 'transcript') {
                if (message.isFinal) {
                    // Add final transcript to history
                    setTranscripts(prev => [...prev, {
                        id: crypto.randomUUID(),
                        text: message.text,
                        isFinal: true,
                        timestamp: new Date()
                    }])
                    setPartialTranscript('')
                } else {
                    // Update partial transcript (live typing effect)
                    setPartialTranscript(message.text)
                }
            }
        }

        room.on(RoomEvent.DataReceived, handleDataReceived)

        return () => {
            room.off(RoomEvent.DataReceived, handleDataReceived)
        }
    }, [room])

    return (
        <div className="space-y-4">
            {/* Live Transcript (Partial) */}
            {partialTranscript && (
                <div className="transcript-card pulse-active">
                    <div className="flex items-start gap-3">
                        <div className="w-2 h-2 mt-2 rounded-full bg-stealth-accent animate-pulse" />
                        <div>
                            <p className="text-sm text-stealth-accent font-medium mb-1">Live</p>
                            <p className="text-stealth-silver italic">{partialTranscript}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Final Transcripts */}
            <div className="space-y-3">
                {transcripts.length === 0 && !partialTranscript && (
                    <div className="transcript-card text-center py-12">
                        <p className="text-stealth-silver">
                            Waiting for audio... Start speaking to see transcripts appear here.
                        </p>
                    </div>
                )}

                {transcripts.map((transcript) => (
                    <div key={transcript.id} className="transcript-card hover:border-stealth-gray-700 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                            <p className="text-stealth-silver flex-1">{transcript.text}</p>
                            <span className="text-xs text-stealth-gray-700 whitespace-nowrap">
                                {transcript.timestamp.toLocaleTimeString()}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Stats */}
            {transcripts.length > 0 && (
                <div className="glass rounded-lg p-4 border border-stealth-gray-800">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-stealth-silver">Total Transcripts:</span>
                        <span className="text-stealth-accent font-semibold">{transcripts.length}</span>
                    </div>
                </div>
            )}
        </div>
    )
}
