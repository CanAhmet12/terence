export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 max-w-md w-full text-center min-w-0">
        <div className="text-6xl mb-4">📡</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">İnternet Bağlantın Yok</h1>
        <p className="text-gray-600 mb-6">
          Lütfen internet bağlantını kontrol et ve tekrar dene.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Tekrar Dene
        </button>
      </div>
    </div>
  )
}
