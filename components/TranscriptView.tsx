'use client'

import { useEffect, useState } from 'react'
import { Room, RoomEvent, DataPacket_Kind } from 'livekit-client'
import { useToast } from './ToastProvider'

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
    const { showToast } = useToast()

    useEffect(() => {
        if (!room) return

        // Listen for data messages from Python worker
        const handleDataReceived = (payload: Uint8Array, participant: any, kind: DataPacket_Kind) => {
            const decoder = new TextDecoder()
            try {
                const message = JSON.parse(decoder.decode(payload))

                if (message.type === 'transcript') {
                    if (message.isFinal) {
                        setTranscripts(prev => [...prev, {
                            id: crypto.randomUUID(),
                            text: message.text,
                            isFinal: true,
                            timestamp: new Date()
                        }])
                        setPartialTranscript('')
                    } else {
                        setPartialTranscript(message.text)
                    }
                }
            } catch (error) {
                console.error("Failed to parse data message:", error)
            }
        }

        room.on(RoomEvent.DataReceived, handleDataReceived)

        return () => {
            room.off(RoomEvent.DataReceived, handleDataReceived)
        }
    }, [room])

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        showToast('Transcript copied to clipboard', 'success')
    }

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
                    <div key={transcript.id} className="transcript-card hover:border-stealth-gray-700 transition-colors group relative">
                        <div className="flex items-start justify-between gap-4">
                            <p className="text-stealth-silver flex-1">{transcript.text}</p>
                            <span className="text-xs text-stealth-gray-700 whitespace-nowrap font-mono mt-1">
                                {transcript.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                        </div>

                        {/* Hover Copy Button */}
                        <button
                            onClick={() => copyToClipboard(transcript.text)}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-stealth-gray-800 rounded hover:bg-stealth-gray-700 text-stealth-silver"
                            title="Copy text"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        </button>
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
                            showToast('Transcript exported successfully', 'success');
                        }}
                        className="btn-stealth flex items-center gap-2 py-2 px-4 text-sm"
                    >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                        Export TXT
                    </button>
                </div>
            )}
        </div>
    )
}
