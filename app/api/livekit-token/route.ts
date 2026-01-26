import { NextResponse } from 'next/server'
import { AccessToken } from 'livekit-server-sdk'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const roomName = searchParams.get('room') || 'livenexus-demo'
        const participantName = `user-${Math.floor(Math.random() * 10000)}`

        const apiKey = process.env.LIVEKIT_API_KEY
        const apiSecret = process.env.LIVEKIT_API_SECRET
        const livekitUrl = process.env.LIVEKIT_URL

        if (!apiKey || !apiSecret || !livekitUrl) {
            return NextResponse.json(
                { error: 'LiveKit credentials not configured' },
                { status: 500 }
            )
        }

        // Create access token
        const at = new AccessToken(apiKey, apiSecret, {
            identity: participantName,
        })

        at.addGrant({
            roomJoin: true,
            room: roomName,
            canPublish: true,
            canSubscribe: true,
            canPublishData: true,
        })

        const token = await at.toJwt()

        return NextResponse.json({
            token,
            url: livekitUrl,
            roomName,
        })
    } catch (error) {
        console.error('Token generation error:', error)
        return NextResponse.json(
            { error: 'Failed to generate token' },
            { status: 500 }
        )
    }
}
