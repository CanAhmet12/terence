'use client'

import { useEffect } from 'react'
import { AuthProvider } from '@/lib/auth-context'

export default function Template({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js')
        .then((reg) => console.log('SW registered:', reg))
        .catch((err) => console.log('SW registration failed:', err))
    }
  }, [])

  return <AuthProvider>{children}</AuthProvider>
}
