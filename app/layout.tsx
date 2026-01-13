import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
    title: 'LiveNexus AI - Real-Time Audio Intelligence',
    description: 'CPU-optimized real-time speech-to-text platform with LiveKit and Faster-Whisper',
    keywords: ['AI', 'Speech-to-Text', 'LiveKit', 'WebRTC', 'Real-time Transcription'],
    authors: [{ name: 'Kimo' }],
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className="min-h-screen">
                <main className="container mx-auto px-4 py-8">
                    {children}
                </main>
            </body>
        </html>
    )
}
