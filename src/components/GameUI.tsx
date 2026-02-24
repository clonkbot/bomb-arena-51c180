import { GameState } from '../types'

interface GameUIProps {
  gameState: GameState
  onStart: () => void
  onReset: () => void
  activePlayer: number
  setActivePlayer: (id: number) => void
  onMove: (playerId: number, dx: number, dz: number) => void
  onBomb: (playerId: number) => void
}

const PLAYER_COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3']

export function GameUI({
  gameState,
  onStart,
  onReset,
  activePlayer,
  setActivePlayer,
  onMove,
  onBomb,
}: GameUIProps) {
  const alivePlayers = gameState.players.filter(p => p.alive)

  return (
    <>
      {/* Title */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
        <h1
          className="text-3xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text"
          style={{
            fontFamily: "'Press Start 2P', system-ui",
            background: 'linear-gradient(135deg, #ff6b6b 0%, #4ecdc4 50%, #ffe66d 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 30px rgba(255,107,107,0.5)',
          }}
        >
          BOMB ARENA
        </h1>
      </div>

      {/* Player Stats */}
      <div className="absolute top-16 md:top-20 left-2 md:left-4 z-20 space-y-2">
        {gameState.players.map(player => (
          <div
            key={player.id}
            className={`flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-lg backdrop-blur-md transition-all duration-300 ${
              player.alive
                ? 'bg-black/40 border border-white/10'
                : 'bg-black/20 opacity-50'
            }`}
            style={{
              borderLeft: `3px solid ${player.color}`,
            }}
          >
            <div
              className="w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm font-bold"
              style={{
                backgroundColor: player.color,
                fontFamily: "'Press Start 2P', system-ui",
              }}
            >
              {player.id + 1}
            </div>
            <div className="text-white text-[10px] md:text-xs font-mono">
              {player.alive ? (
                <div className="flex gap-2 md:gap-3">
                  <span title="Bombs">💣{player.maxBombs}</span>
                  <span title="Range">🔥{player.bombRange}</span>
                  <span title="Speed">⚡{player.speed.toFixed(1)}</span>
                </div>
              ) : (
                <span className="text-red-400">ELIMINATED</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Controls Info */}
      <div className="absolute top-16 md:top-20 right-2 md:right-4 z-20 hidden md:block">
        <div className="bg-black/40 backdrop-blur-md rounded-lg p-3 md:p-4 border border-white/10 text-[10px] md:text-xs font-mono text-gray-300">
          <div className="text-white font-bold mb-2" style={{ fontFamily: "'Press Start 2P', system-ui", fontSize: '8px' }}>
            CONTROLS
          </div>
          <div className="space-y-1">
            <div><span className="text-[#FF6B6B]">P1:</span> WASD + Space</div>
            <div><span className="text-[#4ECDC4]">P2:</span> Arrows + Enter</div>
            <div><span className="text-[#FFE66D]">P3:</span> IJKL + U</div>
            <div><span className="text-[#95E1D3]">P4:</span> 8456 + 0</div>
          </div>
        </div>
      </div>

      {/* Mobile Controls */}
      <div className="absolute bottom-16 left-2 right-2 z-20 md:hidden">
        {gameState.gameStatus === 'playing' && (
          <div className="bg-black/60 backdrop-blur-md rounded-xl p-3 border border-white/10">
            {/* Player selector */}
            <div className="flex justify-center gap-2 mb-3">
              {gameState.players.map(player => (
                <button
                  key={player.id}
                  onClick={() => setActivePlayer(player.id)}
                  disabled={!player.alive}
                  className={`w-10 h-10 rounded-full font-bold text-sm transition-all ${
                    activePlayer === player.id
                      ? 'ring-2 ring-white scale-110'
                      : 'opacity-60'
                  } ${!player.alive ? 'opacity-20' : ''}`}
                  style={{
                    backgroundColor: player.color,
                    fontFamily: "'Press Start 2P', system-ui",
                  }}
                >
                  {player.id + 1}
                </button>
              ))}
            </div>

            {/* D-Pad */}
            <div className="flex justify-center items-center gap-1">
              <div className="grid grid-cols-3 gap-1">
                <div />
                <button
                  onClick={() => onMove(activePlayer, 0, -1)}
                  className="w-12 h-12 bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-lg flex items-center justify-center text-white text-xl transition-all"
                >
                  ↑
                </button>
                <div />
                <button
                  onClick={() => onMove(activePlayer, -1, 0)}
                  className="w-12 h-12 bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-lg flex items-center justify-center text-white text-xl transition-all"
                >
                  ←
                </button>
                <button
                  onClick={() => onBomb(activePlayer)}
                  className="w-12 h-12 bg-red-500/50 hover:bg-red-500/70 active:bg-red-500 rounded-lg flex items-center justify-center text-2xl transition-all"
                >
                  💣
                </button>
                <button
                  onClick={() => onMove(activePlayer, 1, 0)}
                  className="w-12 h-12 bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-lg flex items-center justify-center text-white text-xl transition-all"
                >
                  →
                </button>
                <div />
                <button
                  onClick={() => onMove(activePlayer, 0, 1)}
                  className="w-12 h-12 bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-lg flex items-center justify-center text-white text-xl transition-all"
                >
                  ↓
                </button>
                <div />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Start Screen */}
      {gameState.gameStatus === 'waiting' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="text-center p-6 md:p-8">
            <h2
              className="text-2xl md:text-4xl font-black mb-4 text-white"
              style={{ fontFamily: "'Press Start 2P', system-ui" }}
            >
              READY?
            </h2>
            <p className="text-gray-300 mb-6 md:mb-8 text-sm md:text-base max-w-md mx-auto px-4">
              4 players battle it out! Destroy boxes, collect power-ups, and be the last one standing!
            </p>
            <button
              onClick={onStart}
              className="px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-[#ff6b6b] to-[#4ecdc4] text-white rounded-lg font-bold text-lg md:text-xl hover:scale-105 transition-transform active:scale-95"
              style={{ fontFamily: "'Press Start 2P', system-ui" }}
            >
              START GAME
            </button>

            <div className="mt-6 md:mt-8 text-gray-400 text-xs md:text-sm">
              <p className="mb-2">Power-ups:</p>
              <div className="flex justify-center gap-4 md:gap-6">
                <span>💣 +Bomb</span>
                <span>🔥 +Range</span>
                <span>⚡ +Speed</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {gameState.gameStatus === 'ended' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="text-center p-6 md:p-8">
            <h2
              className="text-3xl md:text-5xl font-black mb-4 text-white"
              style={{ fontFamily: "'Press Start 2P', system-ui" }}
            >
              GAME OVER
            </h2>
            {gameState.winner !== null ? (
              <div className="mb-6 md:mb-8">
                <p className="text-lg md:text-xl text-gray-300 mb-4">Winner:</p>
                <div
                  className="inline-block px-6 md:px-8 py-3 md:py-4 rounded-lg text-2xl md:text-3xl font-bold text-black"
                  style={{
                    backgroundColor: PLAYER_COLORS[gameState.winner],
                    fontFamily: "'Press Start 2P', system-ui",
                  }}
                >
                  PLAYER {gameState.winner + 1}
                </div>
              </div>
            ) : (
              <p className="text-xl md:text-2xl text-gray-300 mb-6 md:mb-8">It's a draw!</p>
            )}
            <button
              onClick={onReset}
              className="px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-[#4ecdc4] to-[#ffe66d] text-black rounded-lg font-bold text-lg md:text-xl hover:scale-105 transition-transform active:scale-95"
              style={{ fontFamily: "'Press Start 2P', system-ui" }}
            >
              PLAY AGAIN
            </button>
          </div>
        </div>
      )}

      {/* Live Players Counter */}
      {gameState.gameStatus === 'playing' && (
        <div className="absolute bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-20">
          <div className="bg-black/40 backdrop-blur-md rounded-full px-4 md:px-6 py-2 border border-white/10">
            <span className="text-white font-bold text-sm md:text-base" style={{ fontFamily: "'Press Start 2P', system-ui", fontSize: '10px' }}>
              {alivePlayers.length} ALIVE
            </span>
          </div>
        </div>
      )}
    </>
  )
}
