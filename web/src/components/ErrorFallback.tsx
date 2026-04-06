'use client'

interface ErrorFallbackProps {
  error?: Error | null
  resetError?: () => void
  title?: string
  message?: string
}

export function ErrorFallback({
  error,
  resetError,
  title = 'Bir hata oluştu',
  message = 'Üzgünüz, bir şeyler yanlış gitti.',
}: ErrorFallbackProps) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="text-red-500 text-5xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-600 mb-6">{message}</p>
        
        {process.env.NODE_ENV === 'development' && error && (
          <div className="mb-4 p-3 bg-red-50 rounded text-left max-h-40 overflow-auto">
            <p className="text-xs font-mono text-red-700 break-all">
              {error.toString()}
            </p>
          </div>
        )}

        <div className="space-x-3">
          {resetError && (
            <button
              onClick={resetError}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Tekrar Dene
            </button>
          )}
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Sayfayı Yenile
          </button>
        </div>
      </div>
    </div>
  )
}

export function NotFound({
  title = 'Sayfa Bulunamadı',
  message = 'Aradığınız sayfa mevcut değil.',
}: {
  title?: string
  message?: string
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-gray-300">404</h1>
        <h2 className="text-3xl font-bold text-gray-900 mt-4">{title}</h2>
        <p className="text-gray-600 mt-2 mb-8">{message}</p>
        <button
          onClick={() => (window.location.href = '/')}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Ana Sayfaya Dön
        </button>
      </div>
    </div>
  )
}

export function Unauthorized({
  title = 'Yetkisiz Erişim',
  message = 'Bu sayfaya erişim yetkiniz yok.',
}: {
  title?: string
  message?: string
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <div className="text-red-500 text-6xl mb-4">🔒</div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-600 mb-8">{message}</p>
        <button
          onClick={() => (window.location.href = '/dashboard')}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Dashboard'a Dön
        </button>
      </div>
    </div>
  )
}

export default ErrorFallback
