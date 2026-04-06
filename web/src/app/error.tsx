'use client'

import { useEffect } from 'react'
import { ErrorFallback } from '@/components/ErrorFallback'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Page error:', error)
  }, [error])

  return (
    <ErrorFallback
      error={error}
      resetError={reset}
      title="Sayfa Yüklenemedi"
      message="Bu sayfa yüklenirken bir hata oluştu. Lütfen tekrar deneyin."
    />
  )
}
