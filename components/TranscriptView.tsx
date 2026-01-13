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

            {/* Stats & Export */}
            {transcripts.length > 0 && (
                <div className="glass rounded-lg p-4 border border-stealth-gray-800 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-6 text-sm">
                        <div className="flex flex-col">
                            <span className="text-stealth-gray-700 text-xs uppercase tracking-wider">Transcripts</span>
                            <span className="text-stealth-accent font-semibold text-lg">{transcripts.length}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-stealth-gray-700 text-xs uppercase tracking-wider">Words</span>
                            <span className="text-stealth-accent font-semibold text-lg">
                                {transcripts.reduce((acc, t) => acc + t.text.split(' ').filter(w => w.length > 0).length, 0)}
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            const text = transcripts.map(t => `[${t.timestamp.toLocaleTimeString()}] ${t.text}`).join('\n');
                            const blob = new Blob([text], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `livenexus-transcript-${new Date().toISOString().slice(0, 10)}.txt`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                        }}
                        className="px-4 py-2 bg-stealth-gray-800 hover:bg-stealth-gray-700 border border-stealth-gray-700 rounded text-sm text-stealth-silver transition-colors flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        Export TXT
                    </button>
                </div>
            )}
        </div>
    )
}
