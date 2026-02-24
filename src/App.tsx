import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, Stars, Float } from '@react-three/drei'
import { Suspense, useState, useCallback, useEffect } from 'react'
import { Game } from './components/Game'
import { GameUI } from './components/GameUI'
import { GameState, Player, PowerUpType } from './types'

const GRID_SIZE = 13
const PLAYER_COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3'] as const
const PLAYER_SPAWN_POSITIONS = [
  { x: 1, z: 1 },
  { x: GRID_SIZE - 2, z: 1 },
  { x: 1, z: GRID_SIZE - 2 },
  { x: GRID_SIZE - 2, z: GRID_SIZE - 2 },
]

function createInitialGameState(): GameState {
  // Create grid with walls and destructible boxes
  const grid: ('empty' | 'wall' | 'box')[][] = []

  for (let z = 0; z < GRID_SIZE; z++) {
    grid[z] = []
    for (let x = 0; x < GRID_SIZE; x++) {
      // Borders are walls
      if (x === 0 || z === 0 || x === GRID_SIZE - 1 || z === GRID_SIZE - 1) {
        grid[z][x] = 'wall'
      }
      // Checkerboard pattern of indestructible walls
      else if (x % 2 === 0 && z % 2 === 0) {
        grid[z][x] = 'wall'
      }
      // Keep spawn corners clear
      else if (
        (x <= 2 && z <= 2) ||
        (x >= GRID_SIZE - 3 && z <= 2) ||
        (x <= 2 && z >= GRID_SIZE - 3) ||
        (x >= GRID_SIZE - 3 && z >= GRID_SIZE - 3)
      ) {
        grid[z][x] = 'empty'
      }
      // Random boxes (70% chance)
      else {
        grid[z][x] = Math.random() < 0.7 ? 'box' : 'empty'
      }
    }
  }

  const players: Player[] = PLAYER_SPAWN_POSITIONS.map((pos, i) => ({
    id: i,
    x: pos.x,
    z: pos.z,
    color: PLAYER_COLORS[i],
    alive: true,
    bombCount: 1,
    maxBombs: 1,
    bombRange: 2,
    speed: 1,
  }))

  return {
    grid,
    players,
    bombs: [],
    explosions: [],
    powerUps: [],
    gameStatus: 'waiting',
    winner: null,
  }
}

export default function App() {
  const [gameState, setGameState] = useState<GameState>(createInitialGameState)
  const [activePlayer, setActivePlayer] = useState(0)

  const startGame = useCallback(() => {
    setGameState(prev => ({ ...prev, gameStatus: 'playing' }))
  }, [])

  const resetGame = useCallback(() => {
    setGameState(createInitialGameState())
  }, [])

  const movePlayer = useCallback((playerId: number, dx: number, dz: number) => {
    setGameState(prev => {
      if (prev.gameStatus !== 'playing') return prev

      const player = prev.players[playerId]
      if (!player || !player.alive) return prev

      const newX = player.x + dx
      const newZ = player.z + dz

      // Check bounds
      if (newX < 0 || newX >= GRID_SIZE || newZ < 0 || newZ >= GRID_SIZE) return prev

      // Check collision with walls/boxes
      if (prev.grid[newZ][newX] !== 'empty') return prev

      // Check collision with bombs
      if (prev.bombs.some(b => b.x === newX && b.z === newZ)) return prev

      // Check collision with other players
      if (prev.players.some(p => p.id !== playerId && p.alive && p.x === newX && p.z === newZ)) return prev

      // Check for power-up pickup
      const powerUpIndex = prev.powerUps.findIndex(p => p.x === newX && p.z === newZ)
      let newPowerUps = prev.powerUps
      let updatedPlayer = { ...player, x: newX, z: newZ }

      if (powerUpIndex !== -1) {
        const powerUp = prev.powerUps[powerUpIndex]
        newPowerUps = prev.powerUps.filter((_, i) => i !== powerUpIndex)

        switch (powerUp.type) {
          case 'bomb':
            updatedPlayer.maxBombs += 1
            break
          case 'range':
            updatedPlayer.bombRange += 1
            break
          case 'speed':
            updatedPlayer.speed = Math.min(updatedPlayer.speed + 0.2, 2)
            break
        }
      }

      const newPlayers = prev.players.map(p =>
        p.id === playerId ? updatedPlayer : p
      )

      return { ...prev, players: newPlayers, powerUps: newPowerUps }
    })
  }, [])

  const placeBomb = useCallback((playerId: number) => {
    setGameState(prev => {
      if (prev.gameStatus !== 'playing') return prev

      const player = prev.players[playerId]
      if (!player || !player.alive) return prev

      // Check bomb count
      const playerBombs = prev.bombs.filter(b => b.playerId === playerId)
      if (playerBombs.length >= player.maxBombs) return prev

      // Check if bomb already exists at position
      if (prev.bombs.some(b => b.x === player.x && b.z === player.z)) return prev

      const newBomb = {
        id: Date.now() + Math.random(),
        x: player.x,
        z: player.z,
        playerId,
        range: player.bombRange,
        timer: 3000,
        plantedAt: Date.now(),
      }

      return { ...prev, bombs: [...prev.bombs, newBomb] }
    })
  }, [])

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Player 1 - WASD + Space
      if (e.key === 'w' || e.key === 'W') movePlayer(0, 0, -1)
      if (e.key === 's' || e.key === 'S') movePlayer(0, 0, 1)
      if (e.key === 'a' || e.key === 'A') movePlayer(0, -1, 0)
      if (e.key === 'd' || e.key === 'D') movePlayer(0, 1, 0)
      if (e.key === ' ') placeBomb(0)

      // Player 2 - Arrow keys + Enter
      if (e.key === 'ArrowUp') movePlayer(1, 0, -1)
      if (e.key === 'ArrowDown') movePlayer(1, 0, 1)
      if (e.key === 'ArrowLeft') movePlayer(1, -1, 0)
      if (e.key === 'ArrowRight') movePlayer(1, 1, 0)
      if (e.key === 'Enter') placeBomb(1)

      // Player 3 - IJKL + U
      if (e.key === 'i' || e.key === 'I') movePlayer(2, 0, -1)
      if (e.key === 'k' || e.key === 'K') movePlayer(2, 0, 1)
      if (e.key === 'j' || e.key === 'J') movePlayer(2, -1, 0)
      if (e.key === 'l' || e.key === 'L') movePlayer(2, 1, 0)
      if (e.key === 'u' || e.key === 'U') placeBomb(2)

      // Player 4 - Numpad 8456 + 0
      if (e.key === '8') movePlayer(3, 0, -1)
      if (e.key === '5') movePlayer(3, 0, 1)
      if (e.key === '4') movePlayer(3, -1, 0)
      if (e.key === '6') movePlayer(3, 1, 0)
      if (e.key === '0') placeBomb(3)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [movePlayer, placeBomb])

  // Bomb explosion timer
  useEffect(() => {
    if (gameState.gameStatus !== 'playing') return

    const interval = setInterval(() => {
      const now = Date.now()

      setGameState(prev => {
        const explodingBombs = prev.bombs.filter(b => now - b.plantedAt >= b.timer)
        if (explodingBombs.length === 0) {
          // Remove old explosions
          const activeExplosions = prev.explosions.filter(e => now - e.createdAt < 500)
          if (activeExplosions.length !== prev.explosions.length) {
            return { ...prev, explosions: activeExplosions }
          }
          return prev
        }

        let newGrid = prev.grid.map(row => [...row])
        let newExplosions = [...prev.explosions]
        let newPowerUps = [...prev.powerUps]
        let newPlayers = [...prev.players]
        const remainingBombs = prev.bombs.filter(b => now - b.plantedAt < b.timer)

        explodingBombs.forEach(bomb => {
          // Add center explosion
          newExplosions.push({ x: bomb.x, z: bomb.z, createdAt: now })

          // Check each direction
          const directions = [
            { dx: 1, dz: 0 },
            { dx: -1, dz: 0 },
            { dx: 0, dz: 1 },
            { dx: 0, dz: -1 },
          ]

          directions.forEach(({ dx, dz }) => {
            for (let i = 1; i <= bomb.range; i++) {
              const x = bomb.x + dx * i
              const z = bomb.z + dz * i

              if (x < 0 || x >= GRID_SIZE || z < 0 || z >= GRID_SIZE) break
              if (newGrid[z][x] === 'wall') break

              newExplosions.push({ x, z, createdAt: now })

              if (newGrid[z][x] === 'box') {
                newGrid[z][x] = 'empty'
                // Random power-up drop (40% chance)
                if (Math.random() < 0.4) {
                  const types: PowerUpType[] = ['bomb', 'range', 'speed']
                  newPowerUps.push({
                    x,
                    z,
                    type: types[Math.floor(Math.random() * types.length)],
                    id: Date.now() + Math.random(),
                  })
                }
                break
              }
            }
          })
        })

        // Check player deaths
        newPlayers = newPlayers.map(player => {
          if (!player.alive) return player
          const isHit = newExplosions.some(e =>
            e.x === player.x && e.z === player.z && now - e.createdAt < 100
          )
          return isHit ? { ...player, alive: false } : player
        })

        // Check win condition
        const alivePlayers = newPlayers.filter(p => p.alive)
        let gameStatus = prev.gameStatus
        let winner = prev.winner

        if (alivePlayers.length <= 1 && prev.gameStatus === 'playing') {
          gameStatus = 'ended'
          winner = alivePlayers.length === 1 ? alivePlayers[0].id : null
        }

        return {
          ...prev,
          grid: newGrid,
          bombs: remainingBombs,
          explosions: newExplosions,
          powerUps: newPowerUps,
          players: newPlayers,
          gameStatus,
          winner,
        }
      })
    }, 50)

    return () => clearInterval(interval)
  }, [gameState.gameStatus])

  return (
    <div className="w-screen h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950 overflow-hidden relative">
      {/* Scanline overlay effect */}
      <div
        className="absolute inset-0 pointer-events-none z-10 opacity-[0.03]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.5) 2px, rgba(0,0,0,0.5) 4px)',
        }}
      />

      {/* Vignette effect */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4) 100%)',
        }}
      />

      <Canvas
        camera={{ position: [GRID_SIZE / 2, 15, GRID_SIZE + 8], fov: 50 }}
        shadows
      >
        <Suspense fallback={null}>
          <color attach="background" args={['#0a0a0f']} />
          <fog attach="fog" args={['#0a0a0f', 20, 40]} />

          <ambientLight intensity={0.3} />
          <directionalLight
            position={[10, 20, 5]}
            intensity={1}
            castShadow
            shadow-mapSize={[2048, 2048]}
          />
          <pointLight position={[GRID_SIZE / 2, 10, GRID_SIZE / 2]} intensity={0.5} color="#ff6b6b" />
          <pointLight position={[GRID_SIZE / 2, 8, GRID_SIZE / 2]} intensity={0.3} color="#4ecdc4" />

          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

          <Game gameState={gameState} gridSize={GRID_SIZE} />

          <OrbitControls
            enablePan={false}
            minDistance={10}
            maxDistance={30}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 2.5}
            target={[GRID_SIZE / 2, 0, GRID_SIZE / 2]}
          />

          <Environment preset="night" />
        </Suspense>
      </Canvas>

      <GameUI
        gameState={gameState}
        onStart={startGame}
        onReset={resetGame}
        activePlayer={activePlayer}
        setActivePlayer={setActivePlayer}
        onMove={movePlayer}
        onBomb={placeBomb}
      />

      {/* Footer */}
      <div className="absolute bottom-2 left-0 right-0 text-center z-20">
        <p className="text-[10px] md:text-xs text-gray-600 font-mono tracking-wider">
          Requested by <span className="text-purple-500/70">@trustnoneisakey</span> · Built by <span className="text-cyan-500/70">@clonkbot</span>
        </p>
      </div>
    </div>
  )
}
