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

// Kitap kapak renkleri ve gradyanları — gerçek 3D yayın görünümü
const BOOK_THEMES: Record<string, { spine: string; cover: string; accent: string; label: string }> = {
  'Matematik':     { spine: '#1a237e', cover: 'linear-gradient(160deg,#1565c0,#0d47a1)', accent: '#42a5f5', label: 'MAT' },
  'Türkçe':        { spine: '#b71c1c', cover: 'linear-gradient(160deg,#c62828,#b71c1c)', accent: '#ef9a9a', label: 'TRK' },
  'Fen Bilimleri': { spine: '#1b5e20', cover: 'linear-gradient(160deg,#2e7d32,#1b5e20)', accent: '#81c784', label: 'FEN' },
  'Fizik':         { spine: '#4a148c', cover: 'linear-gradient(160deg,#6a1b9a,#4a148c)', accent: '#ce93d8', label: 'FİZ' },
  'Kimya':         { spine: '#e65100', cover: 'linear-gradient(160deg,#ef6c00,#e65100)', accent: '#ffcc80', label: 'KİM' },
  'Biyoloji':      { spine: '#004d40', cover: 'linear-gradient(160deg,#00695c,#004d40)', accent: '#80cbc4', label: 'BİO' },
  'Tarih':         { spine: '#3e2723', cover: 'linear-gradient(160deg,#4e342e,#3e2723)', accent: '#bcaaa4', label: 'TAR' },
  'Coğrafya':      { spine: '#0d3349', cover: 'linear-gradient(160deg,#01579b,#0d3349)', accent: '#81d4fa', label: 'COĞ' },
  'default':       { spine: '#263238', cover: 'linear-gradient(160deg,#37474f,#263238)', accent: '#90a4ae', label: 'SOR' },
}

const EXAM_BADGES: Record<string, string> = {
  'Matematik': 'TYT/AYT',
  'Türkçe':    'TYT',
  'Fizik':     'TYT/AYT',
  'Kimya':     'TYT/AYT',
  'Biyoloji':  'TYT/AYT',
  'Tarih':     'TYT',
  'Coğrafya':  'TYT',
  'default':   'TYT',
}

function Book3D({ book, onClick, index }: { book: Book; onClick: () => void; index: number }) {
  const [hovered, setHovered] = useState(false)
  const theme = BOOK_THEMES[book.subject] ?? BOOK_THEMES.default
  const examBadge = EXAM_BADGES[book.subject] ?? EXAM_BADGES.default

  // Her kitap biraz farklı yükseklikte — gerçekçilik için
  const heights = [220, 200, 230, 210, 225, 215, 205, 220]
  const h = heights[index % heights.length]
  const w = Math.round(h * 0.65)
  const spineW = Math.round(w * 0.18)

  return (
    <div
      className="relative flex-shrink-0 cursor-pointer select-none"
      style={{ perspective: '800px', width: `${w + spineW}px` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      title={`${book.title} — Sorularını Gör`}
    >
      <div
        style={{
          display: 'flex',
          height: `${h}px`,
          transformStyle: 'preserve-3d',
          transform: hovered
            ? 'rotateY(-30deg) rotateX(4deg) translateY(-12px)'
            : 'rotateY(-15deg) rotateX(2deg)',
          transition: 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1)',
          filter: hovered ? 'drop-shadow(0 20px 30px rgba(0,0,0,0.7))' : 'drop-shadow(0 8px 16px rgba(0,0,0,0.5))',
        }}
      >
        {/* ── KITAP SIRT ── */}
        <div
          style={{
            width: `${spineW}px`,
            height: '100%',
            background: theme.spine,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 4px',
            boxSizing: 'border-box',
            borderLeft: '1px solid rgba(255,255,255,0.1)',
            boxShadow: 'inset -3px 0 8px rgba(0,0,0,0.4)',
            flexShrink: 0,
          }}
        >
          {/* Yayın logosu */}
          <div style={{
            width: '20px', height: '20px',
            background: theme.accent,
            borderRadius: '3px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '8px', fontWeight: 900, color: theme.spine,
          }}>3D</div>

          {/* Dikey başlık */}
          <div style={{
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
            transform: 'rotate(180deg)',
            fontSize: '9px',
            fontWeight: 700,
            color: 'rgba(255,255,255,0.85)',
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            maxHeight: '120px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {book.title}
          </div>

          {/* Yayın kodu */}
          <div style={{
            fontSize: '7px',
            color: theme.accent,
            fontWeight: 800,
            letterSpacing: '1px',
          }}>{theme.label}</div>
        </div>

        {/* ── KITAP KAPAK ── */}
        <div
          style={{
            flex: 1,
            height: '100%',
            background: theme.cover,
            position: 'relative',
            overflow: 'hidden',
            borderRight: '2px solid rgba(0,0,0,0.4)',
            boxSizing: 'border-box',
          }}
        >
          {/* Üst şerit */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            height: '28px',
            background: 'rgba(0,0,0,0.35)',
            display: 'flex', alignItems: 'center',
            paddingLeft: '8px', paddingRight: '8px',
            justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: '8px', fontWeight: 900, color: theme.accent, letterSpacing: '2px', textTransform: 'uppercase' }}>
              3D YAYINLARI
            </span>
            <span style={{
              fontSize: '7px', fontWeight: 700,
              background: theme.accent, color: theme.spine,
              padding: '1px 5px', borderRadius: '3px',
            }}>{examBadge}</span>
          </div>

          {/* 3D büyük yazı */}
          <div style={{
            position: 'absolute',
            top: '32px', left: '6px', right: '6px',
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: '42px',
              fontWeight: 900,
              color: 'rgba(255,255,255,0.12)',
              lineHeight: 1,
              fontStyle: 'italic',
              letterSpacing: '-2px',
              userSelect: 'none',
            }}>3D</div>
          </div>

          {/* Ders adı */}
          <div style={{
            position: 'absolute',
            top: '50%', left: '6px', right: '6px',
            transform: 'translateY(-50%)',
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: '13px',
              fontWeight: 900,
              color: '#fff',
              lineHeight: 1.2,
              textShadow: '0 2px 8px rgba(0,0,0,0.5)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>{book.title}</div>
            <div style={{
              fontSize: '9px',
              color: theme.accent,
              marginTop: '4px',
              fontWeight: 600,
              letterSpacing: '1px',
            }}>SORU BANKASI</div>
          </div>

          {/* İlerleme çubuğu */}
          {book.progress > 0 && (
            <div style={{
              position: 'absolute',
              bottom: '28px', left: '8px', right: '8px',
            }}>
              <div style={{ fontSize: '7px', color: 'rgba(255,255,255,0.6)', marginBottom: '2px', textAlign: 'right' }}>
                %{book.progress}
              </div>
              <div style={{
                height: '3px', background: 'rgba(255,255,255,0.2)',
                borderRadius: '2px', overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%', width: `${book.progress}%`,
                  background: theme.accent, borderRadius: '2px',
                  transition: 'width 0.5s',
                }} />
              </div>
            </div>
          )}

          {/* Alt şerit */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: '24px',
            background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center',
            paddingLeft: '8px', paddingRight: '8px',
            justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
              2026 BASKI
            </span>
            <span style={{ fontSize: '8px', color: theme.accent, fontWeight: 700 }}>
              {theme.label}
            </span>
          </div>

          {/* Parlaklık efekti */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%)',
            pointerEvents: 'none',
          }} />
        </div>
      </div>

      {/* Kitap gölgesi */}
      <div style={{
        position: 'absolute',
        bottom: '-8px',
        left: '10%', right: '5%',
        height: '12px',
        background: 'rgba(0,0,0,0.5)',
        borderRadius: '50%',
        filter: 'blur(6px)',
        transform: hovered ? 'scaleX(1.1) translateY(4px)' : 'scaleX(1)',
        transition: 'all 0.4s',
      }} />

      {/* Hover tooltip */}
      {hovered && (
        <div style={{
          position: 'absolute',
          bottom: 'calc(100% + 12px)',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(10,10,20,0.95)',
          border: `1px solid ${theme.accent}55`,
          color: '#fff',
          padding: '8px 12px',
          borderRadius: '10px',
          fontSize: '12px',
          fontWeight: 600,
          whiteSpace: 'nowrap',
          zIndex: 100,
          backdropFilter: 'blur(8px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          pointerEvents: 'none',
        }}>
          <div style={{ color: theme.accent, marginBottom: '2px', fontSize: '11px' }}>{book.subject}</div>
          <div>{book.title}</div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', marginTop: '2px' }}>
            Tıkla — soruları gör
          </div>
          <div style={{
            position: 'absolute', top: '100%', left: '50%',
            transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: `6px solid rgba(10,10,20,0.95)`,
          }} />
        </div>
      )}
    </div>
  )
}

export default function Library3D({ books, onBookClick }: Library3DProps) {
  const booksPerRow = 6
  const rows = Math.ceil(books.length / booksPerRow)

  return (
    <div style={{
      background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)',
      borderRadius: '16px',
      overflow: 'hidden',
      padding: '0',
      position: 'relative',
    }}>
      {/* Tavan aydınlatması */}
      <div style={{
        position: 'absolute', top: 0, left: '50%',
        transform: 'translateX(-50%)',
        width: '60%', height: '80px',
        background: 'radial-gradient(ellipse at top, rgba(255,220,100,0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Başlık */}
      <div style={{
        padding: '16px 24px 8px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>
            Soru Bankası Kütüphanesi
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', marginTop: '2px' }}>
            Bir kitaba tıkla — o dersin sorularını çöz
          </div>
        </div>
        <div style={{
          fontSize: '11px', color: 'rgba(255,255,255,0.3)',
          display: 'flex', alignItems: 'center', gap: '6px',
        }}>
          <span>🖱️ hover ile incele</span>
          <span>•</span>
          <span>👆 tıkla</span>
        </div>
      </div>

      {/* Kitap rafları */}
      {Array.from({ length: rows }).map((_, rowIdx) => {
        const rowBooks = books.slice(rowIdx * booksPerRow, (rowIdx + 1) * booksPerRow)
        return (
          <div key={rowIdx} style={{ marginBottom: rowIdx < rows - 1 ? '8px' : '0' }}>
            {/* Kitaplar */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              gap: '6px',
              padding: '24px 24px 0',
              minHeight: '260px',
            }}>
              {rowBooks.map((book, i) => (
                <Book3D
                  key={book.id}
                  book={book}
                  index={rowIdx * booksPerRow + i}
                  onClick={() => onBookClick(book.id)}
                />
              ))}
            </div>

            {/* Raf tahtası */}
            <div style={{ position: 'relative', margin: '0 12px' }}>
              {/* Raf üst yüzeyi */}
              <div style={{
                height: '14px',
                background: 'linear-gradient(180deg, #8d6e3f 0%, #6d4c1f 60%, #4e3310 100%)',
                borderRadius: '2px 2px 0 0',
                boxShadow: '0 -2px 6px rgba(0,0,0,0.4), inset 0 2px 0 rgba(255,255,255,0.12)',
                position: 'relative', overflow: 'hidden',
              }}>
                {/* Ahşap çizgiler */}
                <div style={{
                  position: 'absolute', inset: 0,
                  backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 15px, rgba(0,0,0,0.1) 15px, rgba(0,0,0,0.1) 16px)',
                }} />
              </div>
              {/* Raf ön yüzeyi */}
              <div style={{
                height: '8px',
                background: 'linear-gradient(180deg, #5d4015 0%, #3e2b0d 100%)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
              }} />
              {/* Raf gölgesi */}
              <div style={{
                height: '8px',
                background: 'rgba(0,0,0,0.3)',
                filter: 'blur(4px)',
                transform: 'scaleY(0.6)',
              }} />
            </div>
          </div>
        )
      })}

      {/* Alt boşluk */}
      <div style={{ height: '16px' }} />
    </div>
  )
}
