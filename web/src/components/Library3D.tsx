'use client'

import { useState, useEffect } from 'react'

interface Book {
  id: number
  title: string
  subject: string
  color: string
  progress: number
  questionCount?: number
}

interface Library3DProps {
  books: Book[]
  onBookClick: (bookId: number) => void
}

const BOOK_THEMES: Record<string, {
  front: string; spine: string; top: string; accent: string; label: string; icon: string; badge: string
}> = {
  'Matematik':     { front: '#1565c0', spine: '#0a2f7a', top: '#1a4fa8', accent: '#90caf9', label: 'MAT', icon: '∑', badge: 'TYT/AYT' },
  'Türkçe':        { front: '#c62828', spine: '#7f0000', top: '#9a1e1e', accent: '#ef9a9a', label: 'TRK', icon: 'Aa', badge: 'TYT' },
  'Fen Bilimleri': { front: '#2e7d32', spine: '#1a4d1a', top: '#256128', accent: '#a5d6a7', label: 'FEN', icon: '🔬', badge: 'TYT' },
  'Fizik':         { front: '#6a1b9a', spine: '#3a0878', top: '#561594', accent: '#ce93d8', label: 'FİZ', icon: 'φ', badge: 'AYT' },
  'Kimya':         { front: '#e65100', spine: '#b84a00', top: '#c45700', accent: '#ffcc80', label: 'KİM', icon: '⚗', badge: 'AYT' },
  'Biyoloji':      { front: '#00695c', spine: '#003d33', top: '#00544a', accent: '#80cbc4', label: 'BİO', icon: '🌿', badge: 'AYT' },
  'Tarih':         { front: '#4e342e', spine: '#2c1810', top: '#3c2820', accent: '#d7ccc8', label: 'TAR', icon: '📜', badge: 'TYT' },
  'Coğrafya':      { front: '#01579b', spine: '#0a2744', top: '#0d3d72', accent: '#81d4fa', label: 'COĞ', icon: '🌍', badge: 'TYT' },
  'default':       { front: '#37474f', spine: '#1c2a35', top: '#2a3840', accent: '#b0bec5', label: 'SOR', icon: '📚', badge: 'TYT' },
}

const CATEGORY_GROUPS = [
  { label: 'Sayısal Dersler', subjects: ['Matematik', 'Fizik', 'Kimya', 'Biyoloji'], icon: '🔢', color: '#1565c0' },
  { label: 'Sözel Dersler',   subjects: ['Türkçe', 'Tarih', 'Coğrafya'],              icon: '📖', color: '#c62828' },
  { label: 'Fen & Karma',     subjects: ['Fen Bilimleri'],                            icon: '🔬', color: '#2e7d32' },
]

function Book3D({ book, onClick, index }: { book: Book; onClick: () => void; index: number }) {
  const [hovered, setHovered] = useState(false)
  const [mounted, setMounted] = useState(false)
  const t = BOOK_THEMES[book.subject] ?? BOOK_THEMES.default

  useEffect(() => { setMounted(true) }, [])

  const hArr = [240, 225, 252, 235, 246, 228, 220, 244]
  const H = hArr[index % hArr.length]   // kitap yüksekliği
  const W = Math.round(H * 0.68)        // kitap genişliği (ön kapak)
  const D = Math.round(W * 0.24)        // kitap kalınlığı (sırt derinliği)

  // Toplam konteyner genişliği = D + W (sırt soldan görünür)
  const totalW = W + D + 8
  const totalH = H + 40 // alt boşluk + gölge

  if (!mounted) return <div style={{ width: totalW, height: totalH, flexShrink: 0 }} />

  // Tilt açıları
  const ry = hovered ? -40 : -22   // Y rotasyon (sırtı açığa çıkarır)
  const rx = hovered ?  6  :  3    // X rotasyon (üstü görünür yapar)

  return (
    <div
      style={{ width: totalW, height: totalH, flexShrink: 0, position: 'relative', cursor: 'pointer' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      {/* Perspective wrapper */}
      <div style={{
        position: 'absolute',
        top: 4, left: D / 2,
        width: W, height: H,
        perspective: '800px',
        perspectiveOrigin: '50% 50%',
      }}>
        {/* Kitap kutusu — transform-style: preserve-3d */}
        <div style={{
          width: '100%', height: '100%',
          position: 'relative',
          transformStyle: 'preserve-3d',
          transform: `rotateX(${rx}deg) rotateY(${ry}deg)`,
          transition: 'transform 0.45s cubic-bezier(0.34,1.4,0.64,1)',
        }}>

          {/* ── ÖN YÜZ (Z = +D/2) ── */}
          <div style={{
            position: 'absolute', inset: 0,
            transform: `translateZ(${D / 2}px)`,
            background: `linear-gradient(155deg, ${t.front} 0%, ${t.spine} 100%)`,
            borderRadius: '0 3px 3px 0',
            overflow: 'hidden',
            backfaceVisibility: 'hidden',
            boxShadow: hovered ? '8px 16px 48px rgba(0,0,0,0.7)' : '4px 8px 24px rgba(0,0,0,0.5)',
          }}>
            {/* Parlaklık */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 55%)',
              pointerEvents: 'none',
            }} />
            {/* Üst bant */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 34,
              background: 'rgba(0,0,0,0.45)',
              display: 'flex', alignItems: 'center',
              paddingLeft: 12, paddingRight: 12, justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: 8, fontWeight: 900, color: t.accent, letterSpacing: '1.5px', textTransform: 'uppercase' }}>TERENCE EĞİTİM</span>
              <span style={{ fontSize: 8, fontWeight: 800, background: t.accent, color: t.spine, padding: '2px 7px', borderRadius: 4 }}>{t.badge}</span>
            </div>
            {/* Büyük arka plan ikonu */}
            <div style={{
              position: 'absolute', bottom: 28, right: -4,
              fontSize: 100, lineHeight: 1,
              opacity: 0.08, userSelect: 'none', pointerEvents: 'none', filter: 'blur(1px)',
            }}>{t.icon}</div>
            {/* Merkez */}
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%,-50%)', textAlign: 'center', width: '88%',
            }}>
              <div style={{
                width: 58, height: 58,
                background: 'rgba(255,255,255,0.14)',
                borderRadius: '50%',
                margin: '0 auto 12px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 26, border: `2px solid ${t.accent}65`,
                boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
              }}>{t.icon}</div>
              <div style={{
                fontSize: 17, fontWeight: 900, color: '#fff',
                textTransform: 'uppercase', letterSpacing: '0.8px',
                textShadow: '0 2px 10px rgba(0,0,0,0.7)', lineHeight: 1.2,
              }}>{book.title}</div>
              <div style={{ fontSize: 9, color: t.accent, marginTop: 6, fontWeight: 700, letterSpacing: '3px' }}>SORU BANKASI</div>
              <div style={{ width: 36, height: 2, background: `${t.accent}90`, margin: '8px auto', borderRadius: 1 }} />
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>2025 – 2026</div>
            </div>
            {/* İlerleme */}
            {book.progress > 0 && (
              <div style={{ position: 'absolute', bottom: 34, left: 12, right: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: 'rgba(255,255,255,0.5)', marginBottom: 3 }}>
                  <span>İlerleme</span><span>%{book.progress}</span>
                </div>
                <div style={{ height: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${book.progress}%`, background: t.accent, borderRadius: 2, transition: 'width 0.6s' }} />
                </div>
              </div>
            )}
            {/* Alt bant */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: 28,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex', alignItems: 'center',
              paddingLeft: 12, paddingRight: 12, justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                {book.progress > 0 ? `%${book.progress} Tamamlandı` : 'Başlanmadı'}
              </span>
              <span style={{ fontSize: 8, color: t.accent, fontWeight: 800 }}>{t.label}</span>
            </div>
          </div>

          {/* ── ARKA YÜZ (Z = -D/2) ── */}
          <div style={{
            position: 'absolute', inset: 0,
            transform: `translateZ(${-D / 2}px) rotateY(180deg)`,
            background: t.spine,
            borderRadius: '3px 0 0 3px',
            backfaceVisibility: 'hidden',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to right, rgba(255,255,255,0.05), transparent)',
              pointerEvents: 'none',
            }} />
          </div>

          {/* ── SOL SIRT (X = -W/2, rotateY=-90) ── */}
          <div style={{
            position: 'absolute',
            top: 0, left: 0,
            width: D, height: H,
            transform: `translateX(${-D / 2}px) rotateY(-90deg)`,
            transformOrigin: 'right center',
            background: `linear-gradient(to right, ${t.spine} 0%, #0d1520 50%, ${t.spine} 100%)`,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 0', boxSizing: 'border-box',
            overflow: 'hidden',
            boxShadow: 'inset -3px 0 12px rgba(0,0,0,0.6)',
          }}>
            {/* Sırt üst rozet */}
            <div style={{
              width: D - 8, height: D - 8,
              background: t.accent, borderRadius: 4,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 8, fontWeight: 900, color: t.spine,
              flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
            }}>{t.label}</div>
            {/* Sırt dikey başlık */}
            <div style={{
              writingMode: 'vertical-rl', transform: 'rotate(180deg)',
              fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.92)',
              letterSpacing: '0.8px', textTransform: 'uppercase',
              maxHeight: '55%', overflow: 'hidden',
              textShadow: '0 1px 4px rgba(0,0,0,0.8)',
            }}>{book.title}</div>
            <div style={{ fontSize: 8, color: t.accent, fontWeight: 800, letterSpacing: '1px' }}>2026</div>
            {/* Çizgi desen */}
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0px, transparent 8px, rgba(255,255,255,0.03) 8px, rgba(255,255,255,0.03) 9px)',
              pointerEvents: 'none',
            }} />
          </div>

          {/* ── SAĞ KENAR (X = +W/2, rotateY=+90) ── */}
          <div style={{
            position: 'absolute',
            top: 0, right: 0,
            width: D, height: H,
            transform: `translateX(${D / 2}px) rotateY(90deg)`,
            transformOrigin: 'left center',
            background: 'linear-gradient(to right, #e8e0d0 0%, #f5f0e8 40%, #e8e0d0 100%)',
            overflow: 'hidden',
          }}>
            {/* Sayfa kenar çizgileri — kitabın sağ kesiti */}
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0px, transparent 1px, rgba(0,0,0,0.06) 1px, rgba(0,0,0,0.06) 2px)',
              backgroundSize: '100% 2px',
            }} />
            {/* Hafif gölge sol kenar */}
            <div style={{
              position: 'absolute', top: 0, bottom: 0, left: 0, width: 8,
              background: 'linear-gradient(to right, rgba(0,0,0,0.18), transparent)',
            }} />
          </div>

          {/* ── ÜST YÜZEYİ (Y = -H/2, rotateX=+90) ── */}
          <div style={{
            position: 'absolute',
            top: 0, left: 0,
            width: W, height: D,
            transform: `translateY(${-D / 2}px) rotateX(90deg)`,
            transformOrigin: 'center bottom',
            background: `linear-gradient(to bottom, ${t.top} 0%, rgba(255,255,255,0.2) 50%, ${t.top} 100%)`,
            overflow: 'hidden',
          }}>
            {/* Sayfa kesiti — yatay çizgiler */}
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: 'repeating-linear-gradient(to right, transparent 0px, transparent 1.5px, rgba(255,255,255,0.12) 1.5px, rgba(255,255,255,0.12) 2px)',
              backgroundSize: '2px 100%',
            }} />
          </div>

          {/* ── ALT YÜZEYİ (Y = +H/2, rotateX=-90) ── */}
          <div style={{
            position: 'absolute',
            bottom: 0, left: 0,
            width: W, height: D,
            transform: `translateY(${D / 2}px) rotateX(-90deg)`,
            transformOrigin: 'center top',
            background: `linear-gradient(to top, ${t.spine} 0%, rgba(255,255,255,0.1) 50%, ${t.spine} 100%)`,
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: 'repeating-linear-gradient(to right, transparent 0px, transparent 1.5px, rgba(255,255,255,0.08) 1.5px, rgba(255,255,255,0.08) 2px)',
              backgroundSize: '2px 100%',
            }} />
          </div>

        </div>
      </div>

      {/* Zemin gölgesi */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: D,
        width: W * 0.9,
        height: 14,
        background: 'rgba(0,0,0,0.6)',
        borderRadius: '50%',
        filter: 'blur(8px)',
        transform: hovered ? 'scaleX(1.15) translateY(4px)' : 'scaleX(1)',
        transition: 'all 0.45s',
      }} />

      {/* Hover tooltip */}
      {hovered && (
        <div style={{
          position: 'absolute',
          bottom: '108%',
          left: D + W / 2,
          transform: 'translateX(-50%)',
          background: 'rgba(6,8,18,0.97)',
          border: `1px solid ${t.accent}55`,
          color: '#fff',
          padding: '10px 16px',
          borderRadius: 12,
          fontSize: 13, fontWeight: 600,
          whiteSpace: 'nowrap',
          zIndex: 200,
          backdropFilter: 'blur(12px)',
          boxShadow: `0 12px 36px rgba(0,0,0,0.7)`,
          pointerEvents: 'none',
        }}>
          <div style={{ color: t.accent, fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 3 }}>{t.badge}</div>
          <div style={{ fontSize: 14, fontWeight: 900 }}>{book.title}</div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 3 }}>Tıkla → soruları çöz</div>
          <div style={{
            position: 'absolute', top: '100%', left: '50%',
            transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: '7px solid transparent', borderRight: '7px solid transparent',
            borderTop: '7px solid rgba(6,8,18,0.97)',
          }} />
        </div>
      )}
    </div>
  )
}

export default function Library3D({ books, onBookClick }: Library3DProps) {
  return (
    <div style={{
      background: 'linear-gradient(180deg,#080c18 0%,#0d1525 45%,#060b14 100%)',
      borderRadius: 16, overflow: 'hidden', position: 'relative',
    }}>
      {/* Tavan spot ışığı */}
      <div style={{
        position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: '80%', height: 150,
        background: 'radial-gradient(ellipse at top,rgba(255,210,80,0.14) 0%,transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* Başlık */}
      <div style={{
        padding: '20px 28px 12px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'relative', zIndex: 1,
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>📚 Soru Bankası Kütüphanesi</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', marginTop: 4 }}>
            Kategoriye göre ders seç · Hover ile incele · Tıkla ve çöz
          </div>
        </div>
        <div style={{ display: 'flex', gap: 14, fontSize: 11, color: 'rgba(255,255,255,0.28)' }}>
          <span>🖱 Hover</span><span>·</span><span>👆 Tıkla</span>
        </div>
      </div>

      {/* Kategoriler */}
      <div style={{ padding: '0 0 24px', position: 'relative', zIndex: 1 }}>
        {CATEGORY_GROUPS.map((group) => {
          const groupBooks = books.filter(b => group.subjects.includes(b.subject))
          if (!groupBooks.length) return null

          return (
            <div key={group.label}>
              {/* Kategori başlık */}
              <div style={{
                padding: '20px 28px 6px',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{
                  width: 36, height: 36,
                  background: `${group.color}22`,
                  border: `1px solid ${group.color}45`,
                  borderRadius: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, flexShrink: 0,
                }}>{group.icon}</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{group.label}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.33)', marginTop: 1 }}>{groupBooks.length} ders kitabı</div>
                </div>
                <div style={{ flex: 1, height: 1, marginLeft: 8, background: `linear-gradient(to right,${group.color}40,transparent)` }} />
              </div>

              {/* Kitap rafı */}
              <div style={{ position: 'relative' }}>
                <div style={{
                  display: 'flex', alignItems: 'flex-end',
                  gap: 20, padding: '30px 36px 0',
                  overflowX: 'auto', scrollbarWidth: 'none',
                }}>
                  {groupBooks.map((book, i) => (
                    <Book3D key={book.id} book={book} index={i} onClick={() => onBookClick(book.id)} />
                  ))}
                </div>

                {/* Ahşap raf */}
                <div style={{ margin: '0 24px' }}>
                  <div style={{
                    height: 18,
                    background: 'linear-gradient(180deg,#c49a5a 0%,#a07840 30%,#7a5520 70%,#5a3c10 100%)',
                    borderRadius: '3px 3px 0 0',
                    boxShadow: '0 -4px 10px rgba(0,0,0,0.5),inset 0 2px 0 rgba(255,255,255,0.16)',
                    position: 'relative', overflow: 'hidden',
                  }}>
                    <div style={{
                      position: 'absolute', inset: 0,
                      backgroundImage: 'repeating-linear-gradient(90deg,transparent,transparent 22px,rgba(0,0,0,0.1) 22px,rgba(0,0,0,0.1) 23px)',
                    }} />
                  </div>
                  <div style={{
                    height: 12,
                    background: 'linear-gradient(180deg,#6b4c22 0%,#4a3010 60%,#321e08 100%)',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.75)',
                  }} />
                  <div style={{ height: 10, background: 'rgba(0,0,0,0.4)', filter: 'blur(6px)', transform: 'scaleY(0.5)' }} />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
