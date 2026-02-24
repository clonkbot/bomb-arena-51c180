export type CellType = 'empty' | 'wall' | 'box'

export type PowerUpType = 'bomb' | 'range' | 'speed'

export interface Player {
  id: number
  x: number
  z: number
  color: string
  alive: boolean
  bombCount: number
  maxBombs: number
  bombRange: number
  speed: number
}

export interface Bomb {
  id: number
  x: number
  z: number
  playerId: number
  range: number
  timer: number
  plantedAt: number
}

export interface Explosion {
  x: number
  z: number
  createdAt: number
}

export interface PowerUp {
  id: number
  x: number
  z: number
  type: PowerUpType
}

export interface GameState {
  grid: CellType[][]
  players: Player[]
  bombs: Bomb[]
  explosions: Explosion[]
  powerUps: PowerUp[]
  gameStatus: 'waiting' | 'playing' | 'ended'
  winner: number | null
}
