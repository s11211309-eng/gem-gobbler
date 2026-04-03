import { useRef, useEffect, useState, useCallback } from 'react';
import type { GameState, Upgrade, Enemy, Projectile, XpGem } from './types';
import GameHUD from './GameHUD';
import LevelUpModal from './LevelUpModal';
import GameOverScreen from './GameOverScreen';
import VirtualJoystick from './VirtualJoystick';
import { useIsMobile } from '@/hooks/use-mobile';

const ALL_UPGRADES: Omit<Upgrade, 'apply'>[] = [
  { id: 'damage', name: '+ 傷害', description: '增加 5 點投射物傷害', icon: '⚔️' },
  { id: 'atkspeed', name: '+ 攻速', description: '減少攻擊冷卻時間', icon: '⚡' },
  { id: 'movespeed', name: '+ 移速', description: '增加移動速度', icon: '🏃' },
  { id: 'maxhp', name: '+ 血量上限', description: '增加 20 點血量上限並完全恢復', icon: '❤️' },
  { id: 'projcount', name: '+ 投射物數量', description: '每次攻擊多射一顆投射物', icon: '🔫' },
];

function applyUpgrade(id: string, state: GameState) {
  const p = state.player;
  switch (id) {
    case 'damage': p.damage += 5; break;
    case 'atkspeed': p.attackCooldown = Math.max(100, p.attackCooldown - 80); break;
    case 'movespeed': p.speed += 0.5; break;
    case 'maxhp': p.maxHp += 20; p.hp = p.maxHp; break;
    case 'projcount': p.projectileCount += 1; break;
  }
}

function createInitialState(): GameState {
  return {
    player: {
      x: 0, y: 0, radius: 18,
      hp: 100, maxHp: 100, speed: 3, xp: 0, xpToLevel: 20, level: 1,
      damage: 10, attackCooldown: 600, lastAttackTime: 0, projectileCount: 1,
      invincibleUntil: 0,
    },
    enemies: [], projectiles: [], xpGems: [],
    keys: {},
    gameTime: 0, lastSpawnTime: 0, spawnInterval: 1500,
    running: true, paused: false, gameOver: false, levelUp: false,
  };
}

function getRandomUpgrades(): Upgrade[] {
  const shuffled = [...ALL_UPGRADES].sort(() => Math.random() - 0.5).slice(0, 3);
  return shuffled.map(u => ({ ...u, apply: (s: GameState) => applyUpgrade(u.id, s) }));
}

function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

interface Props {
  onGameOver: (time: number) => void;
  playerName: string;
}

const SPAWN_RADIUS = 500; // enemies spawn this far from the player
const DESPAWN_RADIUS = 800; // entities beyond this distance get cleaned up

const GameCanvas = ({ onGameOver, playerName }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState | null>(null);
  const animRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const virtualInputRef = useRef({ dx: 0, dy: 0 });
  const isMobile = useIsMobile();

  const handleJoystickMove = useCallback((dx: number, dy: number) => {
    virtualInputRef.current = { dx, dy };
  }, []);

  const [hudData, setHudData] = useState({ hp: 100, maxHp: 100, xp: 0, xpToLevel: 20, level: 1, time: 0 });
  const [levelUpOptions, setLevelUpOptions] = useState<Upgrade[] | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [finalTime, setFinalTime] = useState(0);

  const initGame = useCallback(() => {
    stateRef.current = createInitialState();
    lastTimeRef.current = 0;
    setIsGameOver(false);
    setLevelUpOptions(null);
    setHudData({ hp: 100, maxHp: 100, xp: 0, xpToLevel: 20, level: 1, time: 0 });
  }, []);

  const handleLevelUpSelect = useCallback((upgrade: Upgrade) => {
    const gs = stateRef.current!;
    upgrade.apply(gs);
    gs.levelUp = false;
    gs.paused = false;
    setLevelUpOptions(null);
  }, []);

  const handleRestart = useCallback(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const container = containerRef.current!;

    const resize = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };

    resize();
    initGame();
    window.addEventListener('resize', resize);

    const onKeyDown = (e: KeyboardEvent) => {
      if (stateRef.current) stateRef.current.keys[e.key] = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (stateRef.current) stateRef.current.keys[e.key] = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    const ctx = canvas.getContext('2d')!;
    let hudCounter = 0;

    const loop = (timestamp: number) => {
      animRef.current = requestAnimationFrame(loop);
      const gs = stateRef.current!;
      if (!gs.running) return;

      if (lastTimeRef.current === 0) lastTimeRef.current = timestamp;
      const dt = Math.min(timestamp - lastTimeRef.current, 50);
      lastTimeRef.current = timestamp;

      const W = canvas.width;
      const H = canvas.height;

      if (gs.paused || gs.gameOver) {
        render(ctx, gs, W, H, timestamp, playerName);
        return;
      }

      gs.gameTime += dt / 1000;
      const p = gs.player;
      const now = timestamp;

      // --- MOVEMENT (infinite world, no clamping) ---
      let dx = 0, dy = 0;
      const k = gs.keys;
      if (k['w'] || k['W'] || k['ArrowUp']) dy -= 1;
      if (k['s'] || k['S'] || k['ArrowDown']) dy += 1;
      if (k['a'] || k['A'] || k['ArrowLeft']) dx -= 1;
      if (k['d'] || k['D'] || k['ArrowRight']) dx += 1;
      const vi = virtualInputRef.current;
      if (vi.dx !== 0 || vi.dy !== 0) {
        dx += vi.dx;
        dy += vi.dy;
      }
      if (dx !== 0 || dy !== 0) {
        const len = Math.hypot(dx, dy);
        dx /= len; dy /= len;
        p.x += dx * p.speed * (dt / 16);
        p.y += dy * p.speed * (dt / 16);
      }
      // No clamping — player moves freely in infinite space

      // --- ENEMY SPAWN (around player) ---
      const difficultyMul = 1 + gs.gameTime / 30;
      const curSpawnInterval = Math.max(300, gs.spawnInterval / difficultyMul);
      if (now - gs.lastSpawnTime > curSpawnInterval) {
        gs.lastSpawnTime = now;
        const angle = Math.random() * Math.PI * 2;
        const spawnDist = SPAWN_RADIUS + Math.random() * 100;
        const ex = p.x + Math.cos(angle) * spawnDist;
        const ey = p.y + Math.sin(angle) * spawnDist;
        const enemyHp = Math.floor(15 + difficultyMul * 5);
        gs.enemies.push({ x: ex, y: ey, size: 20, hp: enemyHp, maxHp: enemyHp, speed: 1 + Math.random() * 0.5 });
      }

      // --- ENEMY MOVEMENT ---
      for (const e of gs.enemies) {
        const edx = p.x - e.x;
        const edy = p.y - e.y;
        const elen = Math.hypot(edx, edy);
        if (elen > 0) {
          e.x += (edx / elen) * e.speed * (dt / 16);
          e.y += (edy / elen) * e.speed * (dt / 16);
        }
      }

      // --- AUTO ATTACK ---
      if (now - p.lastAttackTime > p.attackCooldown && gs.enemies.length > 0) {
        p.lastAttackTime = now;
        const sorted = [...gs.enemies].sort((a, b) => dist(p, a) - dist(p, b));
        for (let i = 0; i < p.projectileCount; i++) {
          const target = sorted[i % sorted.length];
          const pdx = target.x - p.x;
          const pdy = target.y - p.y;
          const plen = Math.hypot(pdx, pdy);
          if (plen > 0) {
            const speed = 7;
            gs.projectiles.push({
              x: p.x, y: p.y, radius: 5,
              dx: (pdx / plen) * speed, dy: (pdy / plen) * speed,
              speed, damage: p.damage,
            });
          }
        }
      }

      // --- PROJECTILE MOVEMENT ---
      for (const proj of gs.projectiles) {
        proj.x += proj.dx * (dt / 16);
        proj.y += proj.dy * (dt / 16);
      }
      // Remove projectiles too far from player
      gs.projectiles = gs.projectiles.filter(pr => dist(p, pr) < DESPAWN_RADIUS);

      // --- COLLISIONS: projectile vs enemy ---
      const deadEnemies: Set<Enemy> = new Set();
      const usedProjectiles: Set<Projectile> = new Set();
      for (const proj of gs.projectiles) {
        for (const e of gs.enemies) {
          if (deadEnemies.has(e) || usedProjectiles.has(proj)) continue;
          const half = e.size / 2;
          if (proj.x > e.x - half && proj.x < e.x + half && proj.y > e.y - half && proj.y < e.y + half) {
            e.hp -= proj.damage;
            usedProjectiles.add(proj);
            if (e.hp <= 0) {
              deadEnemies.add(e);
              gs.xpGems.push({ x: e.x, y: e.y, radius: 6, value: 5 });
            }
          }
        }
      }
      gs.projectiles = gs.projectiles.filter(pr => !usedProjectiles.has(pr));
      gs.enemies = gs.enemies.filter(e => !deadEnemies.has(e));

      // --- Despawn far-away enemies ---
      gs.enemies = gs.enemies.filter(e => dist(p, e) < DESPAWN_RADIUS);
      gs.xpGems = gs.xpGems.filter(gem => dist(p, gem) < DESPAWN_RADIUS);

      // --- COLLISIONS: enemy vs player ---
      for (const e of gs.enemies) {
        const half = e.size / 2;
        if (dist(p, e) < p.radius + half * 0.8) {
          if (now > p.invincibleUntil) {
            p.hp -= 10;
            p.invincibleUntil = now + 1000;
            if (p.hp <= 0) {
              gs.gameOver = true;
              setIsGameOver(true);
              setFinalTime(gs.gameTime);
              onGameOver(gs.gameTime);
            }
          }
        }
      }

      // --- COLLISIONS: player vs xp gems ---
      gs.xpGems = gs.xpGems.filter(gem => {
        if (dist(p, gem) < p.radius + gem.radius + 10) {
          p.xp += gem.value;
          if (p.xp >= p.xpToLevel) {
            p.xp -= p.xpToLevel;
            p.level += 1;
            p.xpToLevel = Math.floor(p.xpToLevel * 1.4);
            gs.paused = true;
            gs.levelUp = true;
            setLevelUpOptions(getRandomUpgrades());
          }
          return false;
        }
        return true;
      });

      // --- RENDER ---
      render(ctx, gs, W, H, timestamp, playerName);

      // --- HUD update (throttled) ---
      hudCounter++;
      if (hudCounter % 6 === 0) {
        setHudData({ hp: p.hp, maxHp: p.maxHp, xp: p.xp, xpToLevel: p.xpToLevel, level: p.level, time: gs.gameTime });
      }
    };

    animRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [initGame, onGameOver]);

  return (
    <div ref={containerRef} className="relative w-full h-screen bg-game-bg overflow-hidden">
      <canvas ref={canvasRef} className="block w-full h-full" />
      <GameHUD {...hudData} />
      {isMobile && !isGameOver && !levelUpOptions && (
        <VirtualJoystick onMove={handleJoystickMove} />
      )}
      {levelUpOptions && (
        <LevelUpModal
          upgrades={levelUpOptions}
          onSelect={handleLevelUpSelect}
          level={hudData.level}
        />
      )}
      {isGameOver && <GameOverScreen time={finalTime} onRestart={handleRestart} />}
    </div>
  );
};

function render(ctx: CanvasRenderingContext2D, gs: GameState, W: number, H: number, now: number, playerName: string) {
  const p = gs.player;
  // Camera offset: player is always at center of screen
  const camX = p.x - W / 2;
  const camY = p.y - H / 2;

  // Clear
  ctx.fillStyle = '#0a0e17';
  ctx.fillRect(0, 0, W, H);

  // Grid (infinite, scrolling with camera)
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 1;
  const gridSize = 50;
  const startX = -(camX % gridSize);
  const startY = -(camY % gridSize);
  for (let x = startX; x < W; x += gridSize) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = startY; y < H; y += gridSize) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  // All world objects are drawn relative to camera
  ctx.save();
  ctx.translate(-camX, -camY);

  // XP Gems
  ctx.fillStyle = '#22c55e';
  for (const gem of gs.xpGems) {
    ctx.save();
    ctx.translate(gem.x, gem.y);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-gem.radius / 1.4, -gem.radius / 1.4, gem.radius * 1.4, gem.radius * 1.4);
    ctx.restore();
  }

  // Projectiles
  ctx.fillStyle = '#facc15';
  ctx.shadowColor = '#facc15';
  ctx.shadowBlur = 8;
  for (const proj of gs.projectiles) {
    ctx.beginPath();
    ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;

  // Enemies
  for (const e of gs.enemies) {
    const half = e.size / 2;
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(e.x - half, e.y - half, e.size, e.size);
    if (e.hp < e.maxHp) {
      const barW = e.size;
      const barH = 3;
      ctx.fillStyle = '#333';
      ctx.fillRect(e.x - half, e.y - half - 6, barW, barH);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(e.x - half, e.y - half - 6, barW * (e.hp / e.maxHp), barH);
    }
  }

  // Player
  const flashing = now < p.invincibleUntil && Math.floor(now / 80) % 2 === 0;
  if (!flashing) {
    ctx.fillStyle = '#3b82f6';
    ctx.shadowColor = '#3b82f6';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.arc(p.x - 4, p.y - 4, p.radius * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export default GameCanvas;
