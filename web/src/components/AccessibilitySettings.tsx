'use client'

import { useAccessibility, useKeyboardNavigation } from '@/hooks/useAccessibility'

interface AccessibilitySettingsProps {
  onClose?: () => void
}

export default function AccessibilitySettings({ onClose }: AccessibilitySettingsProps) {
  const {
    config,
    toggleHighContrast,
    setFontSize,
    toggleReducedMotion,
    toggleScreenReaderMode,
    resetToDefaults,
  } = useAccessibility()

  useKeyboardNavigation(true)

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full" role="dialog" aria-labelledby="a11y-title">
      <div className="flex items-center justify-between mb-6">
        <h2 id="a11y-title" className="text-2xl font-bold text-gray-900">
          Erişilebilirlik Ayarları
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Kapat"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* High Contrast */}
        <div className="flex items-center justify-between">
          <div>
            <label htmlFor="high-contrast" className="text-sm font-medium text-gray-700">
              Yüksek Kontrast
            </label>
            <p className="text-xs text-gray-500">Renkler arasındaki kontrastı artırır</p>
          </div>
          <button
            id="high-contrast"
            onClick={toggleHighContrast}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              config.highContrast ? 'bg-blue-600' : 'bg-gray-200'
            }`}
            role="switch"
            aria-checked={config.highContrast}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                config.highContrast ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Font Size */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Yazı Boyutu
          </label>
          <div className="flex gap-2" role="radiogroup" aria-label="Yazı boyutu seçimi">
            {(['normal', 'large', 'x-large'] as const).map((size) => (
              <button
                key={size}
                onClick={() => setFontSize(size)}
                className={`px-4 py-2 rounded border transition-colors ${
                  config.fontSize === size
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                }`}
                role="radio"
                aria-checked={config.fontSize === size}
              >
                {size === 'normal' && 'Normal'}
                {size === 'large' && 'Büyük'}
                {size === 'x-large' && 'Çok Büyük'}
              </button>
            ))}
          </div>
        </div>

        {/* Reduced Motion */}
        <div className="flex items-center justify-between">
          <div>
            <label htmlFor="reduced-motion" className="text-sm font-medium text-gray-700">
              Azaltılmış Hareket
            </label>
            <p className="text-xs text-gray-500">Animasyonları azaltır veya kapatır</p>
          </div>
          <button
            id="reduced-motion"
            onClick={toggleReducedMotion}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              config.reducedMotion ? 'bg-blue-600' : 'bg-gray-200'
            }`}
            role="switch"
            aria-checked={config.reducedMotion}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                config.reducedMotion ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Screen Reader Mode */}
        <div className="flex items-center justify-between">
          <div>
            <label htmlFor="screen-reader" className="text-sm font-medium text-gray-700">
              Ekran Okuyucu Modu
            </label>
            <p className="text-xs text-gray-500">Ekran okuyucular için optimize eder</p>
          </div>
          <button
            id="screen-reader"
            onClick={toggleScreenReaderMode}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              config.screenReaderMode ? 'bg-blue-600' : 'bg-gray-200'
            }`}
            role="switch"
            aria-checked={config.screenReaderMode}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                config.screenReaderMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Keyboard Shortcuts Info */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Klavye Kısayolları</h3>
          <ul className="text-xs text-gray-600 space-y-1">
            <li><kbd className="px-2 py-1 bg-gray-100 rounded">?</kbd> - Kısayolları göster</li>
            <li><kbd className="px-2 py-1 bg-gray-100 rounded">/</kbd> - Arama kutusuna odaklan</li>
            <li><kbd className="px-2 py-1 bg-gray-100 rounded">Esc</kbd> - Modalı kapat</li>
            <li><kbd className="px-2 py-1 bg-gray-100 rounded">Tab</kbd> - Sonraki elemana geç</li>
            <li><kbd className="px-2 py-1 bg-gray-100 rounded">Shift + Tab</kbd> - Önceki elemana geç</li>
          </ul>
        </div>

        {/* Reset Button */}
        <div className="border-t pt-4">
          <button
            onClick={resetToDefaults}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
          >
            Varsayılan Ayarlara Dön
          </button>
        </div>
      </div>
    </div>
  )
}

// Helper: Screen reader only text
export function ScreenReaderOnly({ children }: { children: React.ReactNode }) {
  return <span className="sr-only">{children}</span>
}

// Helper: Skip to content link
export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded"
    >
      Ana içeriğe atla
    </a>
  )
}
