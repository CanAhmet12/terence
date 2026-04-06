'use client'

import { useEffect } from 'react'
import toast from 'react-hot-toast'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to error reporting service
    console.error('Global error:', error)
    
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      ;(window as any).Sentry.captureException(error)
    }

    toast.error('Beklenmeyen bir hata oluştu')
  }, [error])

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">💥</div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Kritik Hata
              </h1>
              <p className="text-gray-600 mb-6">
                Uygulama beklenmeyen bir hatayla karşılaştı. Lütfen sayfayı yenileyin.
              </p>
              {process.env.NODE_ENV === 'development' && (
                <div className="mb-4 p-3 bg-red-50 rounded text-left max-h-40 overflow-auto">
                  <p className="text-xs font-mono text-red-700">
                    {error.message}
                  </p>
                  {error.digest && (
                    <p className="text-xs text-gray-500 mt-2">
                      Digest: {error.digest}
                    </p>
                  )}
                </div>
              )}
              <div className="space-x-3">
                <button
                  onClick={reset}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Tekrar Dene
                </button>
                <button
                  onClick={() => (window.location.href = '/')}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                >
                  Ana Sayfa
                </button>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
