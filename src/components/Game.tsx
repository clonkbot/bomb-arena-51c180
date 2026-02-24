import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float, RoundedBox, Text } from '@react-three/drei'
import * as THREE from 'three'
import { GameState } from '../types'

interface GameProps {
  gameState: GameState
  gridSize: number
}

function Floor({ gridSize }: { gridSize: number }) {
  return (
    <group position={[gridSize / 2 - 0.5, -0.5, gridSize / 2 - 0.5]}>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[gridSize, gridSize]} />
        <meshStandardMaterial
          color="#1a1a2e"
          roughness={0.8}
          metalness={0.2}
        />
      </mesh>
      {/* Grid lines */}
      <gridHelper
        args={[gridSize, gridSize, '#2d2d4a', '#1f1f35']}
        position={[0, 0.01, 0]}
      />
    </group>
  )
}

function Wall({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0.5, z]}>
      <RoundedBox args={[0.95, 1, 0.95]} radius={0.05} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial
          color="#2d2d4a"
          roughness={0.5}
          metalness={0.3}
        />
      </RoundedBox>
      {/* Top glow */}
      <mesh position={[0, 0.51, 0]}>
        <boxGeometry args={[0.85, 0.02, 0.85]} />
        <meshBasicMaterial color="#3d3d5a" />
      </mesh>
    </group>
  )
}

function Box({ x, z }: { x: number; z: number }) {
  const ref = useRef<THREE.Group>(null!)

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5 + x * z) * 0.05
    }
  })

  return (
    <group ref={ref} position={[x, 0.4, z]}>
      <RoundedBox args={[0.8, 0.8, 0.8]} radius={0.08} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial
          color="#8b5a2b"
          roughness={0.7}
          metalness={0.1}
        />
      </RoundedBox>
      {/* Cross decoration */}
      <mesh position={[0, 0, 0.41]}>
        <boxGeometry args={[0.6, 0.1, 0.01]} />
        <meshStandardMaterial color="#654321" />
      </mesh>
      <mesh position={[0, 0, 0.41]}>
        <boxGeometry args={[0.1, 0.6, 0.01]} />
        <meshStandardMaterial color="#654321" />
      </mesh>
    </group>
  )
}

function PlayerModel({ player }: { player: { x: number; z: number; color: string; id: number; alive: boolean } }) {
  const ref = useRef<THREE.Group>(null!)

  useFrame((state) => {
    if (ref.current && player.alive) {
      ref.current.position.y = 0.5 + Math.sin(state.clock.elapsedTime * 3 + player.id) * 0.05
      ref.current.rotation.y = state.clock.elapsedTime * 0.5
    }
  })

  if (!player.alive) return null

  return (
    <Float speed={2} rotationIntensity={0} floatIntensity={0.3}>
      <group ref={ref} position={[player.x, 0.5, player.z]}>
        {/* Body */}
        <mesh castShadow>
          <capsuleGeometry args={[0.25, 0.3, 8, 16]} />
          <meshStandardMaterial
            color={player.color}
            roughness={0.3}
            metalness={0.5}
            emissive={player.color}
            emissiveIntensity={0.3}
          />
        </mesh>
        {/* Eyes */}
        <mesh position={[0.1, 0.15, 0.2]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshBasicMaterial color="white" />
        </mesh>
        <mesh position={[-0.1, 0.15, 0.2]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshBasicMaterial color="white" />
        </mesh>
        {/* Pupils */}
        <mesh position={[0.1, 0.15, 0.25]}>
          <sphereGeometry args={[0.03, 16, 16]} />
          <meshBasicMaterial color="black" />
        </mesh>
        <mesh position={[-0.1, 0.15, 0.25]}>
          <sphereGeometry args={[0.03, 16, 16]} />
          <meshBasicMaterial color="black" />
        </mesh>
        {/* Glow ring */}
        <mesh position={[0, -0.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.3, 0.35, 32]} />
          <meshBasicMaterial color={player.color} transparent opacity={0.5} />
        </mesh>
        {/* Player number */}
        <Text
          position={[0, 0.7, 0]}
          fontSize={0.2}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          P{player.id + 1}
        </Text>
      </group>
    </Float>
  )
}

function Bomb({ x, z, plantedAt }: { x: number; z: number; plantedAt: number }) {
  const ref = useRef<THREE.Group>(null!)
  const elapsed = (Date.now() - plantedAt) / 1000

  useFrame((state) => {
    if (ref.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 10) * 0.1
      ref.current.scale.setScalar(pulse)
    }
  })

  const urgency = Math.min(elapsed / 3, 1)
  const glowIntensity = 0.3 + urgency * 0.7

  return (
    <group ref={ref} position={[x, 0.3, z]}>
      {/* Main bomb body */}
      <mesh castShadow>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial
          color="#1a1a1a"
          roughness={0.3}
          metalness={0.8}
        />
      </mesh>
      {/* Fuse */}
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.02, 0.03, 0.15, 8]} />
        <meshStandardMaterial color="#8b4513" />
      </mesh>
      {/* Spark */}
      <mesh position={[0, 0.45, 0]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshBasicMaterial color={urgency > 0.7 ? '#ff0000' : '#ff6600'} />
      </mesh>
      {/* Glow */}
      <pointLight
        position={[0, 0.5, 0]}
        intensity={glowIntensity}
        distance={2}
        color={urgency > 0.7 ? '#ff0000' : '#ff6600'}
      />
    </group>
  )
}

function Explosion({ x, z, createdAt }: { x: number; z: number; createdAt: number }) {
  const ref = useRef<THREE.Group>(null!)
  const age = (Date.now() - createdAt) / 500 // 0 to 1 over 500ms

  if (age > 1) return null

  const scale = 0.5 + Math.sin(age * Math.PI) * 0.5
  const opacity = 1 - age

  return (
    <group ref={ref} position={[x, 0.5, z]} scale={scale}>
      {/* Core */}
      <mesh>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshBasicMaterial
          color="#ff6600"
          transparent
          opacity={opacity}
        />
      </mesh>
      {/* Outer glow */}
      <mesh scale={1.5}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshBasicMaterial
          color="#ff0000"
          transparent
          opacity={opacity * 0.5}
        />
      </mesh>
      <pointLight
        intensity={2 * opacity}
        distance={3}
        color="#ff4400"
      />
    </group>
  )
}

function PowerUpItem({ x, z, type, id }: { x: number; z: number; type: string; id: number }) {
  const ref = useRef<THREE.Mesh>(null!)

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 2
      ref.current.position.y = 0.4 + Math.sin(state.clock.elapsedTime * 3 + id) * 0.1
    }
  })

  const colors = {
    bomb: '#ff6b6b',
    range: '#4ecdc4',
    speed: '#ffe66d',
  }

  const color = colors[type as keyof typeof colors] || '#ffffff'

  return (
    <Float speed={3} floatIntensity={0.5}>
      <group position={[x, 0.4, z]}>
        <mesh ref={ref} castShadow>
          <octahedronGeometry args={[0.2, 0]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.5}
            roughness={0.2}
            metalness={0.8}
          />
        </mesh>
        {/* Glow effect */}
        <pointLight intensity={0.5} distance={1.5} color={color} />
        {/* Label */}
        <Text
          position={[0, 0.5, 0]}
          fontSize={0.15}
          color={color}
          anchorX="center"
          anchorY="middle"
        >
          {type === 'bomb' ? '+B' : type === 'range' ? '+R' : '+S'}
        </Text>
      </group>
    </Float>
  )
}

export function Game({ gameState, gridSize }: GameProps) {
  return (
    <group>
      <Floor gridSize={gridSize} />

      {/* Render walls and boxes */}
      {gameState.grid.map((row, z) =>
        row.map((cell, x) => {
          if (cell === 'wall') {
            return <Wall key={`wall-${x}-${z}`} x={x} z={z} />
          }
          if (cell === 'box') {
            return <Box key={`box-${x}-${z}`} x={x} z={z} />
          }
          return null
        })
      )}

      {/* Render players */}
      {gameState.players.map(player => (
        <PlayerModel key={`player-${player.id}`} player={player} />
      ))}

      {/* Render bombs */}
      {gameState.bombs.map(bomb => (
        <Bomb key={`bomb-${bomb.id}`} x={bomb.x} z={bomb.z} plantedAt={bomb.plantedAt} />
      ))}

      {/* Render explosions */}
      {gameState.explosions.map((explosion, i) => (
        <Explosion
          key={`explosion-${explosion.x}-${explosion.z}-${explosion.createdAt}-${i}`}
          x={explosion.x}
          z={explosion.z}
          createdAt={explosion.createdAt}
        />
      ))}

      {/* Render power-ups */}
      {gameState.powerUps.map(powerUp => (
        <PowerUpItem
          key={`powerup-${powerUp.id}`}
          x={powerUp.x}
          z={powerUp.z}
          type={powerUp.type}
          id={powerUp.id}
        />
      ))}

      {/* Arena boundary glow */}
      <mesh position={[gridSize / 2 - 0.5, 0, gridSize / 2 - 0.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[gridSize / 2 + 0.5, gridSize / 2 + 1, 4]} />
        <meshBasicMaterial color="#6b21a8" transparent opacity={0.3} />
      </mesh>
    </group>
  )
}
