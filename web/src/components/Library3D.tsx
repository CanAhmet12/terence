'use client'

import { useState } from 'react'

interface Book {
  id: number
  title: string
  subject: string
  color: string
  progress: number
  thumbnail?: string
}

interface Library3DProps {
  books: Book[]
  onBookClick: (bookId: number) => void
}

const SUBJECT_ICONS: Record<string, string> = {
  'Matematik':      '📐',
  'Türkçe':         '📖',
  'Fen Bilimleri':  '🔬',
  'Fizik':          '⚡',
  'Kimya':          '🧪',
  'Biyoloji':       '🌿',
  'Tarih':          '🏛️',
  'Coğrafya':       '🌍',
  'default':        '📚',
}

function Book3DCard({
  book,
  onClick,
}: {
  book: Book
  onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const icon = SUBJECT_ICONS[book.subject] ?? SUBJECT_ICONS.default

  return (
    <div
      className="relative cursor-pointer select-none"
      style={{ perspective: '600px' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      {/* Kitap dış wrapper — 3D transform */}
      <div
        style={{
          transformStyle: 'preserve-3d',
          transform: hovered
            ? 'rotateY(-25deg) rotateX(5deg) translateY(-8px) scale(1.05)'
            : 'rotateY(-10deg) rotateX(2deg)',
          transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
          width: '80px',
          height: '120px',
          position: 'relative',
        }}
      >
        {/* Kitap ön yüzü */}
        <div
          className="absolute inset-0 rounded-r-md rounded-l-sm flex flex-col items-center justify-between p-2 shadow-xl"
          style={{
            background: `linear-gradient(135deg, ${book.color}ee, ${book.color}99)`,
            backfaceVisibility: 'hidden',
            boxShadow: hovered
              ? `0 20px 40px ${book.color}66, 0 0 0 1px ${book.color}44`
              : `0 8px 20px ${book.color}44`,
            border: `1px solid ${book.color}88`,
          }}
        >
          {/* Üst: İkon */}
          <div className="text-2xl mt-1">{icon}</div>

          {/* Alt: İlerleme çubuğu */}
          <div className="w-full">
            <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white/70 rounded-full transition-all duration-700"
                style={{ width: `${book.progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Kitap sol sırtı */}
        <div
          className="absolute inset-y-0 left-0 w-3 rounded-l-sm"
          style={{
            background: `linear-gradient(to right, ${book.color}55, ${book.color}bb)`,
            transform: 'rotateY(90deg) translateZ(-6px) translateX(-6px)',
            transformOrigin: 'left center',
            backfaceVisibility: 'hidden',
          }}
        />

        {/* Kitap gölgesi */}
        <div
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-full blur-md transition-all duration-300"
          style={{
            width: hovered ? '70px' : '50px',
            height: '8px',
            background: `${book.color}55`,
          }}
        />
      </div>

      {/* Tooltip */}
      {hovered && (
        <div
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-3 whitespace-nowrap px-3 py-2 rounded-xl text-xs font-semibold text-white shadow-2xl pointer-events-none"
          style={{
            background: 'rgba(15,23,42,0.95)',
            border: `1px solid ${book.color}66`,
            backdropFilter: 'blur(8px)',
          }}
        >
          <div className="font-bold">{book.title}</div>
          {book.progress > 0 && (
            <div className="text-slate-300 mt-0.5">%{book.progress} tamamlandı</div>
          )}
          {/* Ok */}
          <div
            className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 rotate-45"
            style={{ background: 'rgba(15,23,42,0.95)', marginTop: '-4px' }}
          />
        </div>
      )}
    </div>
  )
}

export default function Library3D({ books, onBookClick }: Library3DProps) {
  const [activeShelf, setActiveShelf] = useState(0)
  const booksPerShelf = 6
  const shelves = Math.ceil(books.length / booksPerShelf)

  return (
    <div
      className="w-full rounded-2xl overflow-hidden relative"
      style={{
        background: 'linear-gradient(160deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        minHeight: '380px',
      }}
    >
      {/* Arka plan desen */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(148,163,184,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148,163,184,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Tepedeki ışık efekti */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-40 opacity-20 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, #14b8a6 0%, transparent 70%)',
        }}
      />

      {/* Başlık */}
      <div className="relative z-10 px-6 pt-5 pb-2 flex items-center justify-between">
        <div>
          <h3 className="text-white font-bold text-lg">Ders Kütüphanesi</h3>
          <p className="text-slate-400 text-xs mt-0.5">Bir derse tıkla — sorularına geç</p>
        </div>
        {shelves > 1 && (
          <div className="flex gap-1.5">
            {Array.from({ length: shelves }).map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveShelf(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  activeShelf === i ? 'bg-teal-400 scale-125' : 'bg-slate-600 hover:bg-slate-400'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Raf + Kitaplar */}
      <div className="relative z-10 px-6 pb-6">
        {Array.from({ length: shelves }).map((_, shelfIdx) => {
          if (shelves > 1 && shelfIdx !== activeShelf) return null
          const shelfBooks = books.slice(shelfIdx * booksPerShelf, (shelfIdx + 1) * booksPerShelf)
          return (
            <div key={shelfIdx}>
              {/* Kitaplar */}
              <div className="flex items-end justify-center gap-5 pt-8 pb-4"
                style={{ minHeight: '180px' }}>
                {shelfBooks.map((book) => (
                  <Book3DCard
                    key={book.id}
                    book={book}
                    onClick={() => onBookClick(book.id)}
                  />
                ))}
              </div>

              {/* Raf tahtası */}
              <div className="relative h-4 mx-0 rounded-sm"
                style={{
                  background: 'linear-gradient(180deg, #92400e 0%, #78350f 60%, #451a03 100%)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
                }}>
                {/* Ahşap doku çizgileri */}
                <div className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(255,255,255,0.3) 20px, rgba(255,255,255,0.3) 21px)',
                  }}
                />
              </div>
              {/* Raf gölgesi */}
              <div className="h-2 mx-4 blur-sm opacity-40 rounded-full"
                style={{ background: 'rgba(0,0,0,0.6)' }} />
            </div>
          )
        })}
      </div>

      {/* Alt: Ders etiketleri */}
      <div className="relative z-10 px-6 pb-5">
        <div className="flex flex-wrap gap-2 justify-center">
          {books.map((book) => (
            <button
              key={book.id}
              onClick={() => onBookClick(book.id)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:scale-105 hover:brightness-110 active:scale-95"
              style={{
                background: `${book.color}cc`,
                border: `1px solid ${book.color}88`,
                backdropFilter: 'blur(4px)',
              }}
            >
              {SUBJECT_ICONS[book.subject] ?? '📚'} {book.title}
            </button>
          ))}
        </div>
      </div>

      {/* Talimat */}
      <div className="absolute bottom-16 right-4 text-xs text-slate-500 pointer-events-none hidden sm:block">
        kitaba tıkla → sorulara geç
      </div>
    </div>
  )
}
