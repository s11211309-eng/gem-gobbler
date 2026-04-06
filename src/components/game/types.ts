export interface Vec2 {
  x: number;
  y: number;
}

export interface Player {
  x: number;
  y: number;
  radius: number;
  hp: number;
  maxHp: number;
  speed: number;
  xp: number;
  xpToLevel: number;
  level: number;
  damage: number;
  attackCooldown: number;
  lastAttackTime: number;
  projectileCount: number;
  invincibleUntil: number;
}

export interface Enemy {
  x: number;
  y: number;
  size: number;
  hp: number;
  maxHp: number;
  speed: number;
}

export interface Projectile {
  x: number;
  y: number;
  radius: number;
  dx: number;
  dy: number;
  speed: number;
  damage: number;
}

export interface XpGem {
  x: number;
  y: number;
  radius: number;
  value: number;
}

export interface GameState {
  player: Player;
  enemies: Enemy[];
  projectiles: Projectile[];
  xpGems: XpGem[];
  keys: Record<string, boolean>;
  gameTime: number;
  lastSpawnTime: number;
  spawnInterval: number;
  running: boolean;
  paused: boolean;
  gameOver: boolean;
  levelUp: boolean;
}

export interface Upgrade {
  id: string;
  name: string;
  description: string;
  icon: string;
  apply: (state: GameState) => void;
}

export type GameScreen = 'start' | 'playing' | 'gameover';
