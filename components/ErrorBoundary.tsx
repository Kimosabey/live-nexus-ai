'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
    children: ReactNode
}

interface State {
    hasError: boolean
    error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    }

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo)
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="p-6 rounded-lg glass border border-red-900/50 bg-red-900/10 text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-900/30 text-red-500 mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                            <line x1="12" y1="9" x2="12" y2="13"></line>
                            <line x1="12" y1="17" x2="12.01" y2="17"></line>
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-red-400">Something went wrong</h2>
                    <p className="text-stealth-silver text-sm max-w-md mx-auto">
                        The application encountered an unexpected error.
                        <br />
                        <span className="font-mono text-xs opacity-70 mt-2 block bg-black/50 p-2 rounded">
                            {this.state.error?.message}
                        </span>
                    </p>
                    <button
                        onClick={() => this.setState({ hasError: false })}
                        className="px-4 py-2 bg-stealth-gray-800 hover:bg-stealth-gray-700 rounded text-sm text-stealth-silver transition-colors border border-stealth-gray-700"
                    >
                        Try Again
                    </button>
                </div>
            )
        }

        return this.props.children
    }
}
