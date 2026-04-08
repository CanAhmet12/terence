'use client'

import { useState } from 'react'

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
  spine: string; cover: string; accent: string; label: string
  spineGrad: string; pageColor: string
}> = {
  'Matematik':     { spine: '#0d2b7e', cover: 'linear-gradient(160deg,#1a73e8,#0d47a1)', accent: '#64b5f6', label: 'MAT', spineGrad: 'linear-gradient(180deg,#1a237e,#0d2b7e,#0a1f6b)', pageColor: '#e8f0fe' },
  'Türkçe':        { spine: '#8b0000', cover: 'linear-gradient(160deg,#e53935,#c62828)', accent: '#ef9a9a', label: 'TRK', spineGrad: 'linear-gradient(180deg,#b71c1c,#8b0000,#6a0000)', pageColor: '#fce4ec' },
  'Fen Bilimleri': { spine: '#1a4d1a', cover: 'linear-gradient(160deg,#388e3c,#2e7d32)', accent: '#a5d6a7', label: 'FEN', spineGrad: 'linear-gradient(180deg,#2e7d32,#1a4d1a,#133613)', pageColor: '#e8f5e9' },
  'Fizik':         { spine: '#3a0878', cover: 'linear-gradient(160deg,#7b1fa2,#6a1b9a)', accent: '#ce93d8', label: 'FİZ', spineGrad: 'linear-gradient(180deg,#6a1b9a,#4a148c,#3a0878)', pageColor: '#f3e5f5' },
  'Kimya':         { spine: '#b84a00', cover: 'linear-gradient(160deg,#f57c00,#ef6c00)', accent: '#ffcc80', label: 'KİM', spineGrad: 'linear-gradient(180deg,#ef6c00,#e65100,#b84a00)', pageColor: '#fff3e0' },
  'Biyoloji':      { spine: '#003d33', cover: 'linear-gradient(160deg,#00897b,#00695c)', accent: '#80cbc4', label: 'BİO', spineGrad: 'linear-gradient(180deg,#00695c,#004d40,#003d33)', pageColor: '#e0f2f1' },
  'Tarih':         { spine: '#2c1810', cover: 'linear-gradient(160deg,#5d4037,#4e342e)', accent: '#bcaaa4', label: 'TAR', spineGrad: 'linear-gradient(180deg,#4e342e,#3e2723,#2c1810)', pageColor: '#efebe9' },
  'Coğrafya':      { spine: '#0a2744', cover: 'linear-gradient(160deg,#1565c0,#01579b)', accent: '#81d4fa', label: 'COĞ', spineGrad: 'linear-gradient(180deg,#01579b,#0d3349,#0a2744)', pageColor: '#e3f2fd' },
  'default':       { spine: '#1c2a35', cover: 'linear-gradient(160deg,#455a64,#37474f)', accent: '#90a4ae', label: 'SOR', spineGrad: 'linear-gradient(180deg,#37474f,#263238,#1c2a35)', pageColor: '#eceff1' },
}

const EXAM_BADGES: Record<string, string> = {
  'Matematik': 'TYT/AYT', 'Türkçe': 'TYT', 'Fizik': 'AYT',
  'Kimya': 'AYT', 'Biyoloji': 'AYT', 'Tarih': 'TYT',
  'Coğrafya': 'TYT', 'Fen Bilimleri': 'TYT', 'default': 'TYT',
}

// Kitap kalınlığını simüle eden sayfa yığını
function Book3D({ book, onClick, index }: { book: Book; onClick: () => void; index: number }) {
  const [hovered, setHovered] = useState(false)
  const theme = BOOK_THEMES[book.subject] ?? BOOK_THEMES.default
  const badge = EXAM_BADGES[book.subject] ?? EXAM_BADGES.default

  const heights = [230, 215, 240, 220, 235, 225, 210, 230]
  const h = heights[index % heights.length]
  // Kalınlık: gerçek kitap oranı (yaklaşık 1:0.7:0.25)
  const w = Math.round(h * 0.68)
  const thickness = Math.round(w * 0.28) // sırt kalınlığı

  return (
    <div
      className="relative cursor-pointer select-none"
      style={{
        perspective: '1200px',
        width: `${w + thickness}px`,
        height: `${h + 20}px`,
        flexShrink: 0,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      title={`${book.title} — Sorularını Gör`}
    >
      {/* Kitap gövdesi */}
      <div
        style={{
          display: 'flex',
          height: `${h}px`,
          transformStyle: 'preserve-3d',
          transform: hovered
            ? 'rotateY(-35deg) rotateX(6deg) translateY(-16px) scale(1.04)'
            : 'rotateY(-18deg) rotateX(3deg)',
          transition: 'transform 0.45s cubic-bezier(0.34,1.56,0.64,1)',
          filter: hovered
            ? 'drop-shadow(0 24px 40px rgba(0,0,0,0.8)) drop-shadow(0 8px 16px rgba(0,0,0,0.5))'
            : 'drop-shadow(0 10px 20px rgba(0,0,0,0.6))',
        }}
      >
        {/* ── SIRT (kalın 3D) ── */}
        <div style={{
          width: `${thickness}px`,
          height: '100%',
          background: theme.spineGrad,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 5px',
          boxSizing: 'border-box',
          boxShadow: 'inset -4px 0 12px rgba(0,0,0,0.5), inset 2px 0 6px rgba(255,255,255,0.08)',
          flexShrink: 0,
          position: 'relative',
        }}>
          {/* Sırt üst rozet */}
          <div style={{
            width: '26px', height: '26px',
            background: theme.accent,
            borderRadius: '5px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '8px', fontWeight: 900, color: theme.spine,
            boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
          }}>{theme.label}</div>

          {/* Sırt dikey başlık */}
          <div style={{
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
            transform: 'rotate(180deg)',
            fontSize: '10px',
            fontWeight: 800,
            color: 'rgba(255,255,255,0.9)',
            letterSpacing: '0.8px',
            textTransform: 'uppercase',
            maxHeight: '130px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            textShadow: '0 1px 3px rgba(0,0,0,0.6)',
          }}>{book.title}</div>

          {/* Sırt yıl etiketi */}
          <div style={{
            fontSize: '8px', color: theme.accent,
            fontWeight: 800, letterSpacing: '1px',
          }}>2026</div>

          {/* Sırt kenar çizgileri (derinlik efekti) */}
          <div style={{
            position: 'absolute', top: 0, bottom: 0, left: '2px',
            width: '2px',
            background: 'rgba(255,255,255,0.06)',
            pointerEvents: 'none',
          }} />
        </div>

        {/* ── KAPAK (ön yüz) ── */}
        <div style={{
          flex: 1,
          height: '100%',
          background: theme.cover,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: 'inset -8px 0 20px rgba(0,0,0,0.25)',
        }}>
          {/* Üst şerit */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '32px',
            background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center',
            paddingLeft: '10px', paddingRight: '10px',
            justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: '8px', fontWeight: 900, color: theme.accent, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              TERENCE
            </span>
            <span style={{
              fontSize: '8px', fontWeight: 800,
              background: theme.accent, color: theme.spine,
              padding: '2px 6px', borderRadius: '4px',
            }}>{badge}</span>
          </div>

          {/* Büyük arka plan yazı */}
          <div style={{
            position: 'absolute', top: '34px', left: 0, right: 0,
            textAlign: 'center',
            fontSize: '52px', fontWeight: 900,
            color: 'rgba(255,255,255,0.08)',
            lineHeight: 1, fontStyle: 'italic',
            letterSpacing: '-3px',
            userSelect: 'none', pointerEvents: 'none',
          }}>{theme.label}</div>

          {/* Merkez — ders adı */}
          <div style={{
            position: 'absolute',
            top: '50%', left: '8px', right: '8px',
            transform: 'translateY(-50%)',
            textAlign: 'center',
          }}>
            {/* Ders ikonu dairesi */}
            <div style={{
              width: '48px', height: '48px',
              background: 'rgba(255,255,255,0.15)',
              borderRadius: '50%',
              margin: '0 auto 10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '20px',
              border: `2px solid ${theme.accent}55`,
              backdropFilter: 'blur(4px)',
            }}>
              {({ 'Matematik': '∑', 'Türkçe': 'Aa', 'Fizik': 'φ', 'Kimya': '⚗', 'Biyoloji': '🧬', 'Tarih': '📜', 'Coğrafya': '🌍', 'Fen Bilimleri': '🔬' } as Record<string, string>)[book.subject] ?? '📚'}
            </div>
            <div style={{
              fontSize: '14px', fontWeight: 900,
              color: '#fff', lineHeight: 1.2,
              textShadow: '0 2px 10px rgba(0,0,0,0.6)',
              textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>{book.title}</div>
            <div style={{
              fontSize: '9px', color: theme.accent,
              marginTop: '5px', fontWeight: 700,
              letterSpacing: '2px',
            }}>SORU BANKASI</div>
          </div>

          {/* İlerleme çubuğu */}
          {book.progress > 0 && (
            <div style={{
              position: 'absolute', bottom: '30px', left: '10px', right: '10px',
            }}>
              <div style={{
                fontSize: '8px', color: 'rgba(255,255,255,0.55)',
                marginBottom: '3px', display: 'flex', justifyContent: 'space-between',
              }}>
                <span>İlerleme</span><span>%{book.progress}</span>
              </div>
              <div style={{
                height: '4px', background: 'rgba(255,255,255,0.15)',
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
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '26px',
            background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center',
            paddingLeft: '10px', paddingRight: '10px',
            justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
              2025-2026
            </span>
            <span style={{ fontSize: '8px', color: theme.accent, fontWeight: 800 }}>
              {book.questionCount ? `${book.questionCount} Soru` : '■■■■'}
            </span>
          </div>

          {/* Parlaklık overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 45%)',
            pointerEvents: 'none',
          }} />

          {/* Sağ kenar gölgesi (3D derinlik) */}
          <div style={{
            position: 'absolute', top: 0, bottom: 0, right: 0,
            width: '12px',
            background: 'linear-gradient(to left, rgba(0,0,0,0.3), transparent)',
            pointerEvents: 'none',
          }} />
        </div>

        {/* ── SAYFA YIĞINI (sağ kenar — kalınlık efekti) ── */}
        <div style={{
          width: '6px',
          height: '100%',
          background: `linear-gradient(to right, ${theme.pageColor}, #f5f5f0)`,
          boxShadow: 'inset -1px 0 3px rgba(0,0,0,0.15)',
          flexShrink: 0,
        }}>
          {/* Sayfa çizgileri */}
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} style={{
              height: `${100 / 12}%`,
              borderBottom: '1px solid rgba(0,0,0,0.06)',
            }} />
          ))}
        </div>
      </div>

      {/* Kitap gölgesi (zemin) */}
      <div style={{
        position: 'absolute',
        bottom: '2px',
        left: '8%', right: '3%',
        height: '14px',
        background: 'rgba(0,0,0,0.55)',
        borderRadius: '50%',
        filter: 'blur(8px)',
        transform: hovered ? 'scaleX(1.12) translateY(6px)' : 'scaleX(1) translateY(0)',
        transition: 'all 0.4s',
      }} />

      {/* Hover tooltip */}
      {hovered && (
        <div style={{
          position: 'absolute',
          bottom: 'calc(100% + 10px)',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(10,12,25,0.96)',
          border: `1px solid ${theme.accent}60`,
          color: '#fff',
          padding: '10px 14px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: 600,
          whiteSpace: 'nowrap',
          zIndex: 200,
          backdropFilter: 'blur(10px)',
          boxShadow: `0 12px 32px rgba(0,0,0,0.5), 0 0 0 1px ${theme.accent}20`,
          pointerEvents: 'none',
        }}>
          <div style={{ color: theme.accent, marginBottom: '3px', fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase' }}>
            {badge}
          </div>
          <div style={{ fontSize: '13px', fontWeight: 800 }}>{book.title}</div>
          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '10px', marginTop: '3px' }}>
            Tıkla → soruları çöz
          </div>
          <div style={{
            position: 'absolute', top: '100%', left: '50%',
            transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: '7px solid transparent',
            borderRight: '7px solid transparent',
            borderTop: '7px solid rgba(10,12,25,0.96)',
          }} />
        </div>
      )}
    </div>
  )
}

// Kategori grupları
const CATEGORY_GROUPS: { label: string; subjects: string[]; icon: string; color: string }[] = [
  { label: 'Sayısal', subjects: ['Matematik', 'Fizik', 'Kimya', 'Biyoloji'], icon: '🔢', color: '#1a73e8' },
  { label: 'Sözel', subjects: ['Türkçe', 'Tarih', 'Coğrafya'], icon: '📖', color: '#e53935' },
  { label: 'Fen & Karma', subjects: ['Fen Bilimleri'], icon: '🔬', color: '#43a047' },
]

export default function Library3D({ books, onBookClick }: Library3DProps) {
  return (
    <div style={{
      background: 'linear-gradient(180deg, #0e1a2b 0%, #111827 50%, #0a1220 100%)',
      borderRadius: '16px',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Tavan aydınlatması */}
      <div style={{
        position: 'absolute', top: 0, left: '50%',
        transform: 'translateX(-50%)',
        width: '70%', height: '100px',
        background: 'radial-gradient(ellipse at top, rgba(255,220,100,0.12) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* Kütüphane başlık */}
      <div style={{
        padding: '18px 28px 10px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'relative', zIndex: 1,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div>
          <div style={{ fontSize: '17px', fontWeight: 800, color: '#fff', letterSpacing: '0.3px' }}>
            📚 Soru Bankası Kütüphanesi
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '3px' }}>
            Kategoriye göre ders seç • Hover ile incele • Tıkla ve çöz
          </div>
        </div>
        <div style={{
          display: 'flex', gap: '12px',
          fontSize: '11px', color: 'rgba(255,255,255,0.3)',
        }}>
          <span>🖱️ Hover</span>
          <span>•</span>
          <span>👆 Tıkla</span>
        </div>
      </div>

      {/* Kategoriler */}
      <div style={{ padding: '0 0 20px', position: 'relative', zIndex: 1 }}>
        {CATEGORY_GROUPS.map((group) => {
          const groupBooks = books.filter((b) => group.subjects.includes(b.subject))
          if (groupBooks.length === 0) return null

          return (
            <div key={group.label} style={{ marginBottom: '8px' }}>
              {/* Kategori başlık */}
              <div style={{
                padding: '14px 28px 4px',
                display: 'flex', alignItems: 'center', gap: '10px',
              }}>
                <div style={{
                  width: '32px', height: '32px',
                  background: `${group.color}25`,
                  border: `1px solid ${group.color}50`,
                  borderRadius: '8px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '16px',
                }}>{group.icon}</div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#fff', letterSpacing: '0.3px' }}>
                    {group.label} Dersler
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '1px' }}>
                    {groupBooks.length} ders kitabı
                  </div>
                </div>
                <div style={{
                  marginLeft: 'auto',
                  height: '1px', flex: 1,
                  background: `linear-gradient(to right, ${group.color}40, transparent)`,
                  maxWidth: '200px',
                }} />
              </div>

              {/* Kitap rafı */}
              <div style={{ position: 'relative' }}>
                {/* Kitaplar */}
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: '14px',
                  padding: '20px 28px 0',
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
                <div style={{ margin: '0 20px 0 20px' }}>
                  {/* Raf üst yüzeyi */}
                  <div style={{
                    height: '16px',
                    background: 'linear-gradient(180deg, #a0754a 0%, #7d5230 50%, #5a3a1a 100%)',
                    borderRadius: '3px 3px 0 0',
                    boxShadow: '0 -3px 8px rgba(0,0,0,0.5), inset 0 2px 0 rgba(255,255,255,0.14)',
                    position: 'relative', overflow: 'hidden',
                  }}>
                    <div style={{
                      position: 'absolute', inset: 0,
                      backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 18px, rgba(0,0,0,0.08) 18px, rgba(0,0,0,0.08) 19px)',
                    }} />
                  </div>
                  {/* Raf ön yüzeyi */}
                  <div style={{
                    height: '10px',
                    background: 'linear-gradient(180deg, #6b4520 0%, #4a2f10 100%)',
                    boxShadow: '0 5px 15px rgba(0,0,0,0.7)',
                  }} />
                  {/* Raf alt gölgesi */}
                  <div style={{
                    height: '8px',
                    background: 'rgba(0,0,0,0.35)',
                    filter: 'blur(5px)',
                    transform: 'scaleY(0.6)',
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
