'use client'

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'

interface Toast {
    id: string
    message: string
    type: 'success' | 'error' | 'info'
}

interface ToastContextType {
    showToast: (message: string, type?: 'success' | 'error' | 'info') => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        const id = crypto.randomUUID()
        setToasts(prev => [...prev, { id, message, type }])

        // Auto dismiss
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id))
        }, 3000)
    }

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-2">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`
              px-4 py-3 rounded-lg shadow-lg backdrop-blur-md border animate-fade-in
              flex items-center gap-3 min-w-[300px]
              ${toast.type === 'success' ? 'bg-green-900/80 border-green-500/50 text-green-200' : ''}
              ${toast.type === 'error' ? 'bg-red-900/80 border-red-500/50 text-red-200' : ''}
              ${toast.type === 'info' ? 'bg-stealth-gray-900/80 border-stealth-accent/50 text-stealth-silver' : ''}
            `}
                    >
                        {toast.type === 'success' && (
                            <svg className="w-5 h-5 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                        )}
                        {toast.type === 'error' && (
                            <svg className="w-5 h-5 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                        )}
                        {toast.type === 'info' && (
                            <svg className="w-5 h-5 text-stealth-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                        )}
                        <span className="text-sm font-medium">{toast.message}</span>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    )
}

export const useToast = () => {
    const context = useContext(ToastContext)
    if (!context) throw new Error('useToast must be used within a ToastProvider')
    return context
}
