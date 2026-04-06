import { NotFound } from '@/components/ErrorFallback'

export default function NotFoundPage() {
  return (
    <NotFound
      title="Sayfa Bulunamadı"
      message="Aradığınız sayfa mevcut değil veya taşınmış olabilir."
    />
  )
}
