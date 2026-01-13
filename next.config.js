/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    env: {
        LIVEKIT_URL: process.env.LIVEKIT_URL,
    },
}

module.exports = nextConfig
