'use client'

import { useState, useEffect } from 'react'

interface Book {
  id: number
  title: string
  subject: string
  color: string
  progress: number
  questionCount?: number
  thumbnail?: string
}

interface Library3DProps {
  books: Book[]
  onBookClick: (bookId: number) => void
}

const BOOK_THEMES: Record<string, {
  front: string
  spine: string
  top: string
  accent: string
  label: string
  icon: string
  badge: string
}> = {
  'Matematik':     { front: 'linear-gradient(160deg,#1565c0 0%,#0d47a1 100%)', spine: '#0a2f7a', top: '#1a4fa8', accent: '#64b5f6', label: 'MAT', icon: '∑', badge: 'TYT/AYT' },
  'Türkçe':        { front: 'linear-gradient(160deg,#e53935 0%,#b71c1c 100%)', spine: '#7f0000', top: '#c62828', accent: '#ef9a9a', label: 'TRK', icon: 'Aa', badge: 'TYT' },
  'Fen Bilimleri': { front: 'linear-gradient(160deg,#43a047 0%,#2e7d32 100%)', spine: '#1a4d1a', top: '#388e3c', accent: '#a5d6a7', label: 'FEN', icon: '🔬', badge: 'TYT' },
  'Fizik':         { front: 'linear-gradient(160deg,#8e24aa 0%,#6a1b9a 100%)', spine: '#3a0878', top: '#7b1fa2', accent: '#ce93d8', label: 'FİZ', icon: 'φ', badge: 'AYT' },
  'Kimya':         { front: 'linear-gradient(160deg,#fb8c00 0%,#e65100 100%)', spine: '#b84a00', top: '#f57c00', accent: '#ffcc80', label: 'KİM', icon: '⚗', badge: 'AYT' },
  'Biyoloji':      { front: 'linear-gradient(160deg,#00897b 0%,#00695c 100%)', spine: '#003d33', top: '#00796b', accent: '#80cbc4', label: 'BİO', icon: '🌿', badge: 'AYT' },
  'Tarih':         { front: 'linear-gradient(160deg,#6d4c41 0%,#4e342e 100%)', spine: '#2c1810', top: '#5d4037', accent: '#d7ccc8', label: 'TAR', icon: '📜', badge: 'TYT' },
  'Coğrafya':      { front: 'linear-gradient(160deg,#1e88e5 0%,#01579b 100%)', spine: '#0a2744', top: '#1565c0', accent: '#81d4fa', label: 'COĞ', icon: '🌍', badge: 'TYT' },
  'default':       { front: 'linear-gradient(160deg,#546e7a 0%,#37474f 100%)', spine: '#1c2a35', top: '#455a64', accent: '#b0bec5', label: 'SOR', icon: '📚', badge: 'TYT' },
}

const CATEGORY_GROUPS = [
  { label: 'Sayısal Dersler', subjects: ['Matematik', 'Fizik', 'Kimya', 'Biyoloji'], icon: '🔢', color: '#1565c0' },
  { label: 'Sözel Dersler',   subjects: ['Türkçe', 'Tarih', 'Coğrafya'],              icon: '📖', color: '#c62828' },
  { label: 'Fen & Karma',     subjects: ['Fen Bilimleri'],                            icon: '🔬', color: '#2e7d32' },
]

function Book3D({ book, onClick, index }: { book: Book; onClick: () => void; index: number }) {
  const [hovered, setHovered] = useState(false)
  const [mounted, setMounted] = useState(false)
  const theme = BOOK_THEMES[book.subject] ?? BOOK_THEMES.default

  useEffect(() => { setMounted(true) }, [])

  // Kitap boyutları — gerçek kitap oranı: 21cm x 28cm x 2cm arası
  const heights = [240, 225, 250, 235, 245, 228, 218, 242]
  const H = heights[index % heights.length]   // yükseklik (px)
  const W = Math.round(H * 0.70)             // genişlik (px)  — A4 oranı ~0.71
  const D = Math.round(W * 0.22)             // derinlik/kalınlık (px) — kalın ansiklopedi

  // CSS 3D kutu — 6 yüzey
  // rotate X ekseninde hafifçe eğik durur
  const rotY = hovered ? -38 : -20
  const rotX = hovered ?  6  :  3

  if (!mounted) return <div style={{ width: W + D, height: H + 24 }} />

  return (
    <div
      style={{
        width:  `${W + D + 20}px`,
        height: `${H + 40}px`,
        perspective: '900px',
        cursor: 'pointer',
        flexShrink: 0,
        position: 'relative',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      title={`${book.title} — Sorularını Gör`}
    >
      {/* ── 3D kitap kutusu ── */}
      <div
        style={{
          position: 'absolute',
          top: '10px',
          left: `${D}px`,
          width:  `${W}px`,
          height: `${H}px`,
          transformStyle: 'preserve-3d',
          transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)`,
          transition: 'transform 0.5s cubic-bezier(0.34,1.4,0.64,1)',
        }}
      >

        {/* ══ ÖN YÜZ (kapak) ══ */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: theme.front,
            backfaceVisibility: 'hidden',
            overflow: 'hidden',
            borderRadius: '0 3px 3px 0',
            boxShadow: hovered
              ? '8px 12px 40px rgba(0,0,0,0.7)'
              : '4px 8px 24px rgba(0,0,0,0.5)',
          }}
        >
          {/* Parlaklık overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.22) 0%, transparent 50%)',
            pointerEvents: 'none',
          }} />

          {/* Üst bant */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            height: '36px',
            background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center',
            padding: '0 12px', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: '9px', fontWeight: 900, color: theme.accent, letterSpacing: '2px', textTransform: 'uppercase' }}>
              TERENCE EĞİTİM
            </span>
            <span style={{
              fontSize: '9px', fontWeight: 800,
              background: theme.accent, color: theme.spine,
              padding: '2px 7px', borderRadius: '4px',
            }}>{theme.badge}</span>
          </div>

          {/* Büyük arka plan ikonu */}
          <div style={{
            position: 'absolute',
            top: '38px', right: '0px',
            fontSize: '110px', lineHeight: 1,
            opacity: 0.07,
            userSelect: 'none', pointerEvents: 'none',
            filter: 'blur(1px)',
          }}>{theme.icon}</div>

          {/* Merkez içerik */}
          <div style={{
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            width: '90%',
          }}>
            {/* İkon dairesi */}
            <div style={{
              width: '60px', height: '60px',
              background: 'rgba(255,255,255,0.18)',
              borderRadius: '50%',
              margin: '0 auto 14px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '28px',
              border: `2px solid ${theme.accent}70`,
              backdropFilter: 'blur(4px)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            }}>{theme.icon}</div>

            {/* Ders adı */}
            <div style={{
              fontSize: '18px', fontWeight: 900,
              color: '#fff',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              textShadow: '0 2px 12px rgba(0,0,0,0.7)',
              lineHeight: 1.2,
            }}>{book.title}</div>

            {/* Alt etiket */}
            <div style={{
              fontSize: '10px', color: theme.accent,
              marginTop: '7px', fontWeight: 700,
              letterSpacing: '3px', textTransform: 'uppercase',
            }}>SORU BANKASI</div>

            {/* Ayraç */}
            <div style={{
              width: '40px', height: '2px',
              background: `${theme.accent}90`,
              margin: '10px auto',
              borderRadius: '1px',
            }} />

            <div style={{
              fontSize: '11px', color: 'rgba(255,255,255,0.65)',
              fontWeight: 600,
            }}>2025 – 2026</div>
          </div>

          {/* İlerleme çubuğu */}
          {book.progress > 0 && (
            <div style={{
              position: 'absolute', bottom: '36px', left: '12px', right: '12px',
            }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                fontSize: '9px', color: 'rgba(255,255,255,0.55)', marginBottom: '4px',
              }}>
                <span>İlerleme</span><span>%{book.progress}</span>
              </div>
              <div style={{
                height: '5px', background: 'rgba(255,255,255,0.18)',
                borderRadius: '3px', overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%', width: `${book.progress}%`,
                  background: theme.accent, borderRadius: '3px',
                  boxShadow: `0 0 6px ${theme.accent}`,
                  transition: 'width 0.6s',
                }} />
              </div>
            </div>
          )}

          {/* Alt bant */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: '30px',
            background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center',
            padding: '0 12px', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
              {theme.label} — {book.progress > 0 ? `%${book.progress} Tamamlandı` : 'Başlamadın'}
            </span>
            <span style={{ fontSize: '9px', color: theme.accent, fontWeight: 800 }}>
              {theme.label}
            </span>
          </div>

          {/* Sağ kenar gölgesi */}
          <div style={{
            position: 'absolute', top: 0, bottom: 0, right: 0,
            width: '20px',
            background: 'linear-gradient(to left, rgba(0,0,0,0.35), transparent)',
            pointerEvents: 'none',
          }} />
        </div>

        {/* ══ ARKA YÜZ ══ */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: theme.spine,
            transform: 'rotateY(180deg)',
            backfaceVisibility: 'hidden',
            borderRadius: '3px 0 0 3px',
          }}
        />

        {/* ══ SOL SIRT YÜZEYİ (translateX -D/2 + rotateY -90deg) ══ */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: `-${D}px`,
            width:  `${D}px`,
            height: `${H}px`,
            background: `linear-gradient(to right, ${theme.spine} 0%, #1a2535 40%, ${theme.spine} 100%)`,
            transform: `rotateY(90deg)`,
            transformOrigin: 'right center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 0',
            boxSizing: 'border-box',
            overflow: 'hidden',
            boxShadow: 'inset -4px 0 16px rgba(0,0,0,0.6), inset 3px 0 8px rgba(255,255,255,0.06)',
          }}
        >
          {/* Sırt üst rozet */}
          <div style={{
            width: `${D - 8}px`, height: `${D - 8}px`,
            background: theme.accent,
            borderRadius: '4px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '9px', fontWeight: 900, color: theme.spine,
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
          }}>{theme.label}</div>

          {/* Sırt dikey başlık */}
          <div style={{
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
            transform: 'rotate(180deg)',
            fontSize: '11px',
            fontWeight: 800,
            color: 'rgba(255,255,255,0.92)',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxHeight: `${H * 0.55}px`,
            textShadow: '0 1px 4px rgba(0,0,0,0.8)',
          }}>{book.title}</div>

          {/* Sırt yıl */}
          <div style={{
            fontSize: '9px', color: theme.accent,
            fontWeight: 800, letterSpacing: '1px',
          }}>2026</div>

          {/* Sırt çizgi deseni */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0px, transparent 10px, rgba(255,255,255,0.03) 10px, rgba(255,255,255,0.03) 11px)',
            pointerEvents: 'none',
          }} />
        </div>

        {/* ══ ÜST YÜZEYİ ══ */}
        <div
          style={{
            position: 'absolute',
            top: `-${D / 2}px`,
            left: 0,
            width:  `${W}px`,
            height: `${D}px`,
            background: `linear-gradient(to bottom, ${theme.top} 0%, rgba(255,255,255,0.15) 50%, ${theme.top} 100%)`,
            transform: 'rotateX(90deg)',
            transformOrigin: 'center bottom',
            overflow: 'hidden',
          }}
        >
          {/* Sayfa kenar çizgileri (kitabın üstünden sayfalar görünür) */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'repeating-linear-gradient(to right, transparent 0px, transparent 2px, rgba(255,255,255,0.15) 2px, rgba(255,255,255,0.15) 3px)',
            backgroundSize: '3px 100%',
          }} />
        </div>

        {/* ══ ALT YÜZEYİ ══ */}
        <div
          style={{
            position: 'absolute',
            bottom: `-${D / 2}px`,
            left: 0,
            width:  `${W}px`,
            height: `${D}px`,
            background: `linear-gradient(to top, ${theme.spine} 0%, rgba(255,255,255,0.1) 50%, ${theme.spine} 100%)`,
            transform: 'rotateX(-90deg)',
            transformOrigin: 'center top',
            overflow: 'hidden',
          }}
        >
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'repeating-linear-gradient(to right, transparent 0px, transparent 2px, rgba(255,255,255,0.12) 2px, rgba(255,255,255,0.12) 3px)',
            backgroundSize: '3px 100%',
          }} />
        </div>

      </div>

      {/* Zemin gölgesi */}
      <div style={{
        position: 'absolute',
        bottom: '0px',
        left: `${D + W * 0.1}px`,
        width:  `${W * 0.8}px`,
        height: '14px',
        background: 'rgba(0,0,0,0.6)',
        borderRadius: '50%',
        filter: 'blur(8px)',
        transform: hovered ? 'scaleX(1.15) translateY(4px)' : 'scaleX(1)',
        transition: 'all 0.5s',
      }} />

      {/* Hover tooltip */}
      {hovered && (
        <div style={{
          position: 'absolute',
          bottom: '108%',
          left: `${D + W / 2}px`,
          transform: 'translateX(-50%)',
          background: 'rgba(8,10,22,0.97)',
          border: `1px solid ${theme.accent}60`,
          color: '#fff',
          padding: '10px 16px',
          borderRadius: '12px',
          fontSize: '13px',
          fontWeight: 600,
          whiteSpace: 'nowrap',
          zIndex: 200,
          backdropFilter: 'blur(12px)',
          boxShadow: `0 12px 36px rgba(0,0,0,0.6), 0 0 0 1px ${theme.accent}20`,
          pointerEvents: 'none',
        }}>
          <div style={{ color: theme.accent, fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '4px' }}>
            {theme.badge}
          </div>
          <div style={{ fontSize: '14px', fontWeight: 900 }}>{book.title}</div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', marginTop: '3px' }}>
            Tıkla → soruları çöz
          </div>
          <div style={{
            position: 'absolute', top: '100%', left: '50%',
            transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: '7px solid transparent', borderRight: '7px solid transparent',
            borderTop: '7px solid rgba(8,10,22,0.97)',
          }} />
        </div>
      )}
    </div>
  )
}

export default function Library3D({ books, onBookClick }: Library3DProps) {
  return (
    <div style={{
      background: 'linear-gradient(180deg, #080c18 0%, #0d1525 45%, #060b14 100%)',
      borderRadius: '16px',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Tavan spot ışığı */}
      <div style={{
        position: 'absolute', top: 0, left: '50%',
        transform: 'translateX(-50%)',
        width: '80%', height: '140px',
        background: 'radial-gradient(ellipse at top, rgba(255,200,80,0.14) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* Kütüphane başlık */}
      <div style={{
        padding: '20px 28px 12px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'relative', zIndex: 1,
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: 900, color: '#fff', letterSpacing: '0.3px' }}>
            📚 Soru Bankası Kütüphanesi
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.38)', marginTop: '4px' }}>
            Kategoriye göre ders seç · Hover ile incele · Tıkla ve çöz
          </div>
        </div>
        <div style={{ display: 'flex', gap: '14px', fontSize: '11px', color: 'rgba(255,255,255,0.28)' }}>
          <span>🖱 Hover</span><span>·</span><span>👆 Tıkla</span>
        </div>
      </div>

      {/* Kategoriler */}
      <div style={{ padding: '0 0 24px', position: 'relative', zIndex: 1 }}>
        {CATEGORY_GROUPS.map((group) => {
          const groupBooks = books.filter((b) => group.subjects.includes(b.subject))
          if (groupBooks.length === 0) return null

          return (
            <div key={group.label}>
              {/* Kategori başlık çizgisi */}
              <div style={{
                padding: '20px 28px 6px',
                display: 'flex', alignItems: 'center', gap: '12px',
              }}>
                <div style={{
                  width: '36px', height: '36px',
                  background: `${group.color}22`,
                  border: `1px solid ${group.color}45`,
                  borderRadius: '10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '18px', flexShrink: 0,
                }}>{group.icon}</div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#fff' }}>
                    {group.label}
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.33)', marginTop: '1px' }}>
                    {groupBooks.length} ders kitabı
                  </div>
                </div>
                <div style={{
                  flex: 1, height: '1px', marginLeft: '8px',
                  background: `linear-gradient(to right, ${group.color}40, transparent)`,
                }} />
              </div>

              {/* Kitap rafı */}
              <div style={{ position: 'relative' }}>
                {/* Kitaplar */}
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: '18px',
                  padding: '28px 36px 0',
                  overflowX: 'auto',
                  scrollbarWidth: 'none',
                }}>
                  {groupBooks.map((book, i) => (
                    <Book3D
                      key={book.id}
                      book={book}
                      index={i}
                      onClick={() => onBookClick(book.id)}
                    />
                  ))}
                </div>

                {/* Ahşap raf */}
                <div style={{ margin: '0 24px' }}>
                  <div style={{
                    height: '18px',
                    background: 'linear-gradient(180deg, #c49a5a 0%, #a07840 30%, #7a5520 70%, #5a3c10 100%)',
                    borderRadius: '3px 3px 0 0',
                    boxShadow: '0 -4px 10px rgba(0,0,0,0.5), inset 0 2px 0 rgba(255,255,255,0.16), inset 0 -1px 0 rgba(0,0,0,0.3)',
                    position: 'relative', overflow: 'hidden',
                  }}>
                    {/* Ahşap çizgi deseni */}
                    <div style={{
                      position: 'absolute', inset: 0,
                      backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 22px, rgba(0,0,0,0.1) 22px, rgba(0,0,0,0.1) 23px)',
                    }} />
                    {/* Parlaklık */}
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
                      background: 'linear-gradient(to bottom, rgba(255,255,255,0.2), transparent)',
                    }} />
                  </div>
                  {/* Raf ön paneli */}
                  <div style={{
                    height: '12px',
                    background: 'linear-gradient(180deg, #6b4c22 0%, #4a3010 60%, #321e08 100%)',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.75)',
                  }} />
                  {/* Raf altı gölge */}
                  <div style={{
                    height: '10px',
                    background: 'rgba(0,0,0,0.4)',
                    filter: 'blur(6px)',
                    transform: 'scaleY(0.5)',
                  }} />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
