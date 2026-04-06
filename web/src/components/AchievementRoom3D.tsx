'use client'

import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, Text, Center, Html, SpotLight } from '@react-three/drei'
import * as THREE from 'three'

interface Achievement {
  id: number
  name: string
  description: string
  icon: string
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
  earned: boolean
  earnedAt?: string
  progress?: number
}

interface AchievementRoom3DProps {
  achievements: Achievement[]
  onAchievementClick: (achievementId: number) => void
}

// Trophy/Badge Component
function Trophy3D({
  achievement,
  position,
  onClick,
}: {
  achievement: Achievement
  position: [number, number, number]
  onClick: () => void
}) {
  const groupRef = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)

  useFrame((state) => {
    if (!groupRef.current) return

    // Rotate trophy
    groupRef.current.rotation.y += 0.01

    // Bounce on hover
    if (hovered) {
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 3) * 0.1
    }
  })

  const tierColors = {
    bronze: '#CD7F32',
    silver: '#C0C0C0',
    gold: '#FFD700',
    platinum: '#E5E4E2',
  }

  const color = achievement.earned ? tierColors[achievement.tier] : '#333333'
  const emissiveIntensity = achievement.earned ? 0.5 : 0

  return (
    <group ref={groupRef} position={position}>
      <mesh
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        castShadow
      >
        {/* Trophy cup */}
        <cylinderGeometry args={[0.3, 0.2, 0.5, 32]} />
        <meshStandardMaterial
          color={color}
          roughness={0.2}
          metalness={0.8}
          emissive={color}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Trophy base */}
      <mesh position={[0, -0.4, 0]} castShadow>
        <cylinderGeometry args={[0.35, 0.35, 0.1, 32]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
      </mesh>

      {/* Trophy handles */}
      <mesh position={[-0.3, 0, 0]} rotation={[0, 0, Math.PI / 4]}>
        <torusGeometry args={[0.15, 0.03, 16, 32, Math.PI]} />
        <meshStandardMaterial color={color} metalness={0.8} />
      </mesh>
      <mesh position={[0.3, 0, 0]} rotation={[0, 0, -Math.PI / 4]}>
        <torusGeometry args={[0.15, 0.03, 16, 32, Math.PI]} />
        <meshStandardMaterial color={color} metalness={0.8} />
      </mesh>

      {/* Glow effect for earned achievements */}
      {achievement.earned && (
        <pointLight position={[0, 0.5, 0]} color={color} intensity={2} distance={2} />
      )}

      {/* Info popup on hover */}
      {hovered && (
        <Html position={[0, 1, 0]} center distanceFactor={5}>
          <div className="bg-black bg-opacity-90 text-white px-4 py-3 rounded-lg shadow-lg min-w-[200px]">
            <div className="font-bold text-lg mb-1">{achievement.name}</div>
            <div className="text-xs text-gray-300 mb-2">{achievement.description}</div>
            <div className="flex items-center justify-between text-xs">
              <span className={`px-2 py-1 rounded ${
                achievement.tier === 'bronze' ? 'bg-orange-700' :
                achievement.tier === 'silver' ? 'bg-gray-500' :
                achievement.tier === 'gold' ? 'bg-yellow-500' :
                'bg-purple-500'
              }`}>
                {achievement.tier.toUpperCase()}
              </span>
              {achievement.earned ? (
                <span className="text-green-400">✓ Kazanıldı</span>
              ) : achievement.progress !== undefined ? (
                <span className="text-blue-400">%{achievement.progress}</span>
              ) : (
                <span className="text-gray-500">Kilitli</span>
              )}
            </div>
            {achievement.earnedAt && (
              <div className="text-xs text-gray-400 mt-2">
                {new Date(achievement.earnedAt).toLocaleDateString('tr-TR')}
              </div>
            )}
          </div>
        </Html>
      )}

      {/* Lock icon for unearned */}
      {!achievement.earned && (
        <sprite position={[0, 0.3, 0.3]} scale={[0.3, 0.3, 1]}>
          <spriteMaterial color="#999999" opacity={0.8} />
        </sprite>
      )}
    </group>
  )
}

// Display Pedestal
function Pedestal({ position, tier }: { position: [number, number, number]; tier: string }) {
  const tierHeights = {
    bronze: 0.5,
    silver: 0.7,
    gold: 1.0,
    platinum: 1.2,
  }

  const height = tierHeights[tier as keyof typeof tierHeights] || 0.5

  return (
    <mesh position={[position[0], position[1] - height / 2, position[2]]} receiveShadow>
      <cylinderGeometry args={[0.5, 0.6, height, 32]} />
      <meshStandardMaterial color="#2a2a2a" roughness={0.7} />
    </mesh>
  )
}

// Room Scene
function RoomScene({ achievements, onAchievementClick }: AchievementRoom3DProps) {
  const tiers = ['platinum', 'gold', 'silver', 'bronze']
  
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <SpotLight
        position={[0, 8, 0]}
        angle={0.6}
        penumbra={0.5}
        intensity={2}
        castShadow
      />

      {/* Environment */}
      <Environment preset="warehouse" />

      {/* Room Title */}
      <Center position={[0, 4, -3]}>
        <Text
          fontSize={0.8}
          color="#FFD700"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          BAŞARILARIM
        </Text>
      </Center>

      {/* Achievements organized by tier */}
      {tiers.map((tier, tierIndex) => {
        const tierAchievements = achievements.filter((a) => a.tier === tier)
        const tierY = 2 - tierIndex * 1.5
        
        return tierAchievements.map((achievement, index) => {
          const x = -4 + (index % 5) * 2
          const z = Math.floor(index / 5) * 2
          
          return (
            <group key={achievement.id}>
              <Pedestal position={[x, tierY, z]} tier={tier} />
              <Trophy3D
                achievement={achievement}
                position={[x, tierY + 1, z]}
                onClick={() => onAchievementClick(achievement.id)}
              />
            </group>
          )
        })
      })}

      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
      </mesh>

      {/* Walls */}
      <mesh position={[0, 5, -5]} receiveShadow>
        <planeGeometry args={[30, 10]} />
        <meshStandardMaterial color="#0a0a0a" />
      </mesh>

      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 10, 0]}>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#0a0a0a" />
      </mesh>

      <OrbitControls
        enablePan={true}
        enableZoom={true}
        minDistance={5}
        maxDistance={20}
        maxPolarAngle={Math.PI / 2.2}
      />
    </>
  )
}

export default function AchievementRoom3D({ achievements, onAchievementClick }: AchievementRoom3DProps) {
  const earnedCount = achievements.filter((a) => a.earned).length

  return (
    <div className="relative w-full h-[700px] bg-black rounded-lg overflow-hidden">
      <Canvas
        shadows
        camera={{ position: [0, 5, 10], fov: 60 }}
        gl={{ antialias: true }}
      >
        <Suspense
          fallback={
            <Html center>
              <div className="text-white text-xl">Başarı odası yükleniyor...</div>
            </Html>
          }
        >
          <RoomScene achievements={achievements} onAchievementClick={onAchievementClick} />
        </Suspense>
      </Canvas>

      {/* Stats Overlay */}
      <div className="absolute top-4 left-4 bg-black bg-opacity-80 text-white px-6 py-4 rounded-lg">
        <h3 className="text-xl font-bold mb-2">🏆 Başarılarım</h3>
        <p className="text-sm text-gray-300">
          {earnedCount} / {achievements.length} Kazanıldı
        </p>
        <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${(earnedCount / achievements.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-4 right-4 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg text-sm">
        <p>🖱️ Sürükle | 🔍 Zoom | 🏆 Detay için tıkla</p>
      </div>
    </div>
  )
}

// Add missing import
import { useState } from 'react'
