'use client'

import { Suspense, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import * as THREE from 'three'

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

// 3D Book Component
function Book3D({ book, position, onClick }: { book: Book; position: [number, number, number]; onClick: () => void }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  useFrame((state) => {
    if (!meshRef.current) return
    
    // Gentle floating animation
    meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime + position[0]) * 0.05
    
    // Rotate on hover
    if (hovered) {
      meshRef.current.rotation.y += 0.02
    } else {
      meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, 0, 0.1)
    }
  })

  const bookColor = new THREE.Color(book.color)

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        castShadow
        receiveShadow
      >
        {/* Book spine */}
        <boxGeometry args={[0.2, 1.5, 1]} />
        <meshStandardMaterial
          color={bookColor}
          roughness={0.5}
          metalness={0.1}
          emissive={hovered ? bookColor : new THREE.Color(0x000000)}
          emissiveIntensity={hovered ? 0.2 : 0}
        />
      </mesh>

      {/* Book cover */}
      <mesh position={[0.15, 0, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
        <planeGeometry args={[1, 1.5]} />
        <meshStandardMaterial color={bookColor} roughness={0.3} />
      </mesh>

      {/* Title text on spine */}
      {hovered && (
        <Html position={[0.3, 0, 0]} center distanceFactor={3}>
          <div className="bg-black bg-opacity-80 text-white px-3 py-2 rounded-lg whitespace-nowrap text-sm pointer-events-none">
            <div className="font-bold">{book.title}</div>
            <div className="text-xs text-gray-300 mt-1">{book.subject}</div>
            <div className="text-xs text-blue-400 mt-1">İlerleme: %{book.progress}</div>
          </div>
        </Html>
      )}

      {/* Progress indicator */}
      <mesh position={[0, -0.8, 0.51]}>
        <boxGeometry args={[0.15, 0.1, book.progress / 100]} />
        <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.5} />
      </mesh>
    </group>
  )
}

// Bookshelf Component
function Bookshelf({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Shelf surface */}
      <mesh receiveShadow>
        <boxGeometry args={[10, 0.1, 1.5]} />
        <meshStandardMaterial color="#8B4513" roughness={0.8} />
      </mesh>
      
      {/* Shelf support left */}
      <mesh position={[-5, -0.5, 0]}>
        <boxGeometry args={[0.1, 1, 1.5]} />
        <meshStandardMaterial color="#654321" />
      </mesh>
      
      {/* Shelf support right */}
      <mesh position={[5, -0.5, 0]}>
        <boxGeometry args={[0.1, 1, 1.5]} />
        <meshStandardMaterial color="#654321" />
      </mesh>
    </group>
  )
}

// Main Library Scene
function LibraryScene({ books, onBookClick }: Library3DProps) {
  const booksPerShelf = 6
  const shelves = Math.ceil(books.length / booksPerShelf)

  return (
    <>
      {/* Lighting — Environment preset kaldırıldı (HDR yükleme hatası önlendi) */}
      <ambientLight intensity={0.8} />
      <directionalLight position={[10, 10, 5]} intensity={1.2} castShadow />
      <directionalLight position={[-5, 5, -5]} intensity={0.4} />
      <pointLight position={[0, 5, 0]} intensity={0.6} color="#ffe4b5" />

      {/* Bookshelves and Books */}
      {Array.from({ length: shelves }).map((_, shelfIndex) => {
        const shelfY = 2 - shelfIndex * 2
        const shelfBooks = books.slice(shelfIndex * booksPerShelf, (shelfIndex + 1) * booksPerShelf)

        return (
          <group key={shelfIndex}>
            {/* Shelf */}
            <Bookshelf position={[0, shelfY, 0]} />

            {/* Books on shelf */}
            {shelfBooks.map((book, bookIndex) => {
              const bookX = -4 + bookIndex * 1.5
              return (
                <Book3D
                  key={book.id}
                  book={book}
                  position={[bookX, shelfY + 0.8, 0]}
                  onClick={() => onBookClick(book.id)}
                />
              )
            })}
          </group>
        )
      })}

      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.9} />
      </mesh>

      {/* Camera controls */}
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={5}
        maxDistance={15}
        maxPolarAngle={Math.PI / 2}
      />
    </>
  )
}

// Main Component
export default function Library3D({ books, onBookClick }: Library3DProps) {
  return (
    <div className="w-full h-[600px] bg-gradient-to-b from-gray-900 to-black rounded-lg overflow-hidden">
      <Canvas
        shadows
        camera={{ position: [0, 2, 8], fov: 50 }}
        gl={{ antialias: true, failIfMajorPerformanceCaveat: false }}
        onCreated={({ gl }) => {
          gl.setClearColor('#111827')
        }}
      >
        <Suspense
          fallback={
            <Html center>
              <div className="text-white text-xl">Kütüphane yükleniyor...</div>
            </Html>
          }
        >
          <LibraryScene books={books} onBookClick={onBookClick} />
        </Suspense>
      </Canvas>

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg text-sm">
        <p>🖱️ Fareyle döndür | 🔍 Kaydır zoom yap | 📚 Kitaba tıkla</p>
      </div>
    </div>
  )
}
