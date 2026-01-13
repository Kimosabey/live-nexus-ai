/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                // Tab 13 Stealth Design System
                stealth: {
                    black: '#000000',
                    silver: '#C0C0C0',
                    accent: '#00D9FF',  // Cyan accent for active states
                    gray: {
                        900: '#0A0A0A',
                        800: '#1A1A1A',
                        700: '#2A2A2A',
                    }
                }
            },
            fontFamily: {
                'grotesk': ['Space Grotesk', 'sans-serif'],
            },
            animation: {
                'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }
        },
    },
    plugins: [],
}
