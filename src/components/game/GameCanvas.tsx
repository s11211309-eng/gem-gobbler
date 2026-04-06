import { useRef, useEffect, useState, useCallback } from 'react';
import type { GameState, Upgrade, Enemy, Projectile, XpGem, GameStats } from './types';
import GameHUD from './GameHUD';
import LevelUpModal from './LevelUpModal';
import GameOverScreen from './GameOverScreen';
import VirtualJoystick from './VirtualJoystick';
import PauseMenu, { PauseButton } from './PauseMenu';
import { SFX } from '@/lib/sounds';

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
  state.stats.upgradesChosen.push(id);
}

function createInitialStats(): GameStats {
  return { enemiesKilled: 0, xpCollected: 0, damageDealt: 0, damageTaken: 0, upgradesChosen: [], noHitTime: 0, lastHitTime: 0 };
}

function createInitialState(gameMode: 'infinite' | 'stage'): GameState {
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
    gameMode,
    currentStage: 1,
    stageEnemiesRemaining: gameMode === 'stage' ? 10 : 0,
    bossSpawned: false,
    bossDefeated: false,
    stats: createInitialStats(),
  };
}

function getRandomUpgrades(): Upgrade[] {
  const shuffled = [...ALL_UPGRADES].sort(() => Math.random() - 0.5).slice(0, 3);
  return shuffled.map(u => ({ ...u, apply: (s: GameState) => applyUpgrade(u.id, s) }));
}

function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

const STAGE_CONFIG = (stage: number) => ({
  enemyCount: 8 + stage * 4,
  enemyHp: 15 + stage * 8,
  enemySpeed: 1 + stage * 0.1,
  bossHp: 100 + stage * 80,
  bossSize: 50,
  bossDamage: 20,
});

function spawnBoss(gs: GameState) {
  const p = gs.player;
  const angle = Math.random() * Math.PI * 2;
  const cfg = STAGE_CONFIG(gs.currentStage);
  const boss: Enemy = {
    x: p.x + Math.cos(angle) * 500,
    y: p.y + Math.sin(angle) * 500,
    size: cfg.bossSize,
    hp: cfg.bossHp,
    maxHp: cfg.bossHp,
    speed: 0.8 + gs.currentStage * 0.05,
    isBoss: true,
    bossType: `boss_stage_${gs.currentStage}`,
  };
  gs.enemies.push(boss);
  gs.bossSpawned = true;
  SFX.bossAppear();
}

interface Props {
  onGameOver: (time: number, stats: GameStats) => void;
  onQuit: () => void;
  playerName: string;
  playerColor: string;
  inputMode: 'pc' | 'tablet';
  gameMode: 'infinite' | 'stage';
}

const SPAWN_RADIUS = 500;
const DESPAWN_RADIUS = 800;

const GameCanvas = ({ onGameOver, onQuit, playerName, playerColor, inputMode, gameMode }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState | null>(null);
  const animRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const virtualInputRef = useRef({ dx: 0, dy: 0 });
  const [menuOpen, setMenuOpen] = useState(false);

  const handleJoystickMove = useCallback((dx: number, dy: number) => {
    virtualInputRef.current = { dx, dy };
  }, []);

  const [hudData, setHudData] = useState({ hp: 100, maxHp: 100, xp: 0, xpToLevel: 20, level: 1, time: 0, enemiesKilled: 0, stage: 1, gameMode });
  const [levelUpOptions, setLevelUpOptions] = useState<Upgrade[] | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [finalTime, setFinalTime] = useState(0);
  const [stageCleared, setStageCleared] = useState(false);

  const initGame = useCallback(() => {
    stateRef.current = createInitialState(gameMode);
    lastTimeRef.current = 0;
    setIsGameOver(false);
    setLevelUpOptions(null);
    setStageCleared(false);
    setHudData({ hp: 100, maxHp: 100, xp: 0, xpToLevel: 20, level: 1, time: 0, enemiesKilled: 0, stage: 1, gameMode });
  }, [gameMode]);

  const handleLevelUpSelect = useCallback((upgrade: Upgrade) => {
    const gs = stateRef.current!;
    upgrade.apply(gs);
    gs.levelUp = false;
    gs.paused = false;
    setLevelUpOptions(null);
    SFX.levelUp();
  }, []);

  const handleNextStage = useCallback(() => {
    const gs = stateRef.current!;
    gs.currentStage += 1;
    gs.stageEnemiesRemaining = STAGE_CONFIG(gs.currentStage).enemyCount;
    gs.bossSpawned = false;
    gs.bossDefeated = false;
    gs.paused = false;
    gs.player.hp = gs.player.maxHp;
    setStageCleared(false);
  }, []);

  const handleRestart = useCallback(() => {
    setMenuOpen(false);
    initGame();
  }, [initGame]);

  const handlePause = useCallback(() => {
    if (stateRef.current && !stateRef.current.gameOver && !stateRef.current.levelUp) {
      stateRef.current.paused = true;
      setMenuOpen(true);
    }
  }, []);

  const handleResume = useCallback(() => {
    if (stateRef.current) {
      stateRef.current.paused = false;
      setMenuOpen(false);
    }
  }, []);

  const handleQuit = useCallback(() => {
    if (stateRef.current) stateRef.current.running = false;
    setMenuOpen(false);
    onQuit();
  }, [onQuit]);

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
        render(ctx, gs, W, H, timestamp, playerName, playerColor);
        return;
      }

      gs.gameTime += dt / 1000;
      const p = gs.player;
      const now = timestamp;

      // Update no-hit tracking
      if (gs.stats.lastHitTime === 0) {
        gs.stats.noHitTime = gs.gameTime;
      } else {
        gs.stats.noHitTime = Math.max(gs.stats.noHitTime, gs.gameTime - gs.stats.lastHitTime);
      }

      // --- MOVEMENT ---
      let dx = 0, dy = 0;
      const k = gs.keys;
      if (k['w'] || k['W'] || k['ArrowUp']) dy -= 1;
      if (k['s'] || k['S'] || k['ArrowDown']) dy += 1;
      if (k['a'] || k['A'] || k['ArrowLeft']) dx -= 1;
      if (k['d'] || k['D'] || k['ArrowRight']) dx += 1;
      const vi = virtualInputRef.current;
      if (vi.dx !== 0 || vi.dy !== 0) { dx += vi.dx; dy += vi.dy; }
      if (dx !== 0 || dy !== 0) {
        const len = Math.hypot(dx, dy);
        dx /= len; dy /= len;
        p.x += dx * p.speed * (dt / 16);
        p.y += dy * p.speed * (dt / 16);
      }

      // --- ENEMY SPAWN ---
      if (gs.gameMode === 'infinite') {
        const difficultyMul = 1 + gs.gameTime / 30;
        const curSpawnInterval = Math.max(300, gs.spawnInterval / difficultyMul);
        if (now - gs.lastSpawnTime > curSpawnInterval) {
          gs.lastSpawnTime = now;
          const angle = Math.random() * Math.PI * 2;
          const spawnDist = SPAWN_RADIUS + Math.random() * 100;
          const enemyHp = Math.floor(15 + difficultyMul * 5);
          gs.enemies.push({ x: p.x + Math.cos(angle) * spawnDist, y: p.y + Math.sin(angle) * spawnDist, size: 20, hp: enemyHp, maxHp: enemyHp, speed: 1 + Math.random() * 0.5 });
        }
      } else {
        // Stage mode
        if (gs.stageEnemiesRemaining > 0 && now - gs.lastSpawnTime > 1200) {
          gs.lastSpawnTime = now;
          const cfg = STAGE_CONFIG(gs.currentStage);
          const angle = Math.random() * Math.PI * 2;
          const spawnDist = SPAWN_RADIUS + Math.random() * 100;
          gs.enemies.push({
            x: p.x + Math.cos(angle) * spawnDist,
            y: p.y + Math.sin(angle) * spawnDist,
            size: 20, hp: cfg.enemyHp, maxHp: cfg.enemyHp, speed: cfg.enemySpeed + Math.random() * 0.3,
          });
          gs.stageEnemiesRemaining--;
        }
        // Spawn boss when all regular enemies are killed and none remain
        if (gs.stageEnemiesRemaining <= 0 && !gs.bossSpawned && gs.enemies.filter(e => !e.isBoss).length === 0) {
          spawnBoss(gs);
        }
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
        SFX.shoot();
        const sorted = [...gs.enemies].sort((a, b) => dist(p, a) - dist(p, b));
        for (let i = 0; i < p.projectileCount; i++) {
          const target = sorted[i % sorted.length];
          const pdx = target.x - p.x;
          const pdy = target.y - p.y;
          const plen = Math.hypot(pdx, pdy);
          if (plen > 0) {
            const speed = 7;
            gs.projectiles.push({ x: p.x, y: p.y, radius: 5, dx: (pdx / plen) * speed, dy: (pdy / plen) * speed, speed, damage: p.damage });
          }
        }
      }

      // --- PROJECTILE MOVEMENT ---
      for (const proj of gs.projectiles) {
        proj.x += proj.dx * (dt / 16);
        proj.y += proj.dy * (dt / 16);
      }
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
            gs.stats.damageDealt += proj.damage;
            usedProjectiles.add(proj);
            SFX.hit();
            if (e.hp <= 0) {
              deadEnemies.add(e);
              gs.stats.enemiesKilled++;
              const gemValue = e.isBoss ? 50 : 5;
              gs.xpGems.push({ x: e.x, y: e.y, radius: e.isBoss ? 12 : 6, value: gemValue });
              if (e.isBoss) {
                gs.bossDefeated = true;
                SFX.bossDefeat();
                if (gs.gameMode === 'stage') {
                  gs.paused = true;
                  setStageCleared(true);
                }
              }
            }
          }
        }
      }
      gs.projectiles = gs.projectiles.filter(pr => !usedProjectiles.has(pr));
      gs.enemies = gs.enemies.filter(e => !deadEnemies.has(e));

      // Despawn
      gs.enemies = gs.enemies.filter(e => dist(p, e) < DESPAWN_RADIUS);
      gs.xpGems = gs.xpGems.filter(gem => dist(p, gem) < DESPAWN_RADIUS);

      // --- COLLISIONS: enemy vs player ---
      for (const e of gs.enemies) {
        const half = e.size / 2;
        if (dist(p, e) < p.radius + half * 0.8) {
          if (now > p.invincibleUntil) {
            const dmg = e.isBoss ? 20 : 10;
            p.hp -= dmg;
            gs.stats.damageTaken += dmg;
            gs.stats.lastHitTime = gs.gameTime;
            p.invincibleUntil = now + 1000;
            SFX.playerHit();
            if (p.hp <= 0) {
              gs.gameOver = true;
              setIsGameOver(true);
              setFinalTime(gs.gameTime);
              SFX.gameOver();
              onGameOver(gs.gameTime, gs.stats);
            }
          }
        }
      }

      // --- COLLISIONS: player vs xp gems ---
      gs.xpGems = gs.xpGems.filter(gem => {
        if (dist(p, gem) < p.radius + gem.radius + 10) {
          p.xp += gem.value;
          gs.stats.xpCollected += gem.value;
          SFX.xpPickup();
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
      render(ctx, gs, W, H, timestamp, playerName, playerColor);

      // --- HUD update ---
      hudCounter++;
      if (hudCounter % 6 === 0) {
        setHudData({ hp: p.hp, maxHp: p.maxHp, xp: p.xp, xpToLevel: p.xpToLevel, level: p.level, time: gs.gameTime, enemiesKilled: gs.stats.enemiesKilled, stage: gs.currentStage, gameMode: gs.gameMode });
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
      {!isGameOver && !levelUpOptions && !menuOpen && !stageCleared && (
        <PauseButton onClick={handlePause} />
      )}
      {inputMode === 'tablet' && !isGameOver && !levelUpOptions && !menuOpen && (
        <VirtualJoystick onMove={handleJoystickMove} />
      )}
      {menuOpen && (
        <PauseMenu onResume={handleResume} onRestart={handleRestart} onQuit={handleQuit} />
      )}
      {levelUpOptions && (
        <LevelUpModal upgrades={levelUpOptions} onSelect={handleLevelUpSelect} level={hudData.level} />
      )}
      {stageCleared && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-50">
          <h2 className="text-4xl font-black text-game-accent mb-2">🏆 關卡通過！</h2>
          <p className="text-game-muted text-lg mb-8">第 {hudData.stage} 關完成</p>
          <button onClick={handleNextStage} className="px-10 py-3 bg-game-accent text-game-bg font-bold text-lg rounded-lg hover:brightness-110 transition-all active:scale-95">
            進入下一關
          </button>
        </div>
      )}
      {isGameOver && <GameOverScreen time={finalTime} onRestart={handleRestart} enemiesKilled={stateRef.current?.stats.enemiesKilled} />}
    </div>
  );
};

function render(ctx: CanvasRenderingContext2D, gs: GameState, W: number, H: number, now: number, playerName: string, playerColor: string) {
  const p = gs.player;
  const camX = p.x - W / 2;
  const camY = p.y - H / 2;

  ctx.fillStyle = '#0a0e17';
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 1;
  const gridSize = 50;
  const startX = -(camX % gridSize);
  const startY = -(camY % gridSize);
  for (let x = startX; x < W; x += gridSize) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = startY; y < H; y += gridSize) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  ctx.save();
  ctx.translate(-camX, -camY);

  // XP Gems
  for (const gem of gs.xpGems) {
    ctx.fillStyle = gem.value > 10 ? '#fbbf24' : '#22c55e';
    ctx.save();
    ctx.translate(gem.x, gem.y);
    ctx.rotate(Math.PI / 4);
    const s = gem.radius / 1.4;
    ctx.fillRect(-s, -s, s * 2, s * 2);
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
    if (e.isBoss) {
      // Boss rendering
      ctx.fillStyle = '#9333ea';
      ctx.shadowColor = '#9333ea';
      ctx.shadowBlur = 20;
      ctx.fillRect(e.x - half, e.y - half, e.size, e.size);
      ctx.shadowBlur = 0;
      // Boss crown
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(e.x - half * 0.6, e.y - half - 4);
      ctx.lineTo(e.x - half * 0.3, e.y - half - 12);
      ctx.lineTo(e.x, e.y - half - 6);
      ctx.lineTo(e.x + half * 0.3, e.y - half - 12);
      ctx.lineTo(e.x + half * 0.6, e.y - half - 4);
      ctx.fill();
    } else {
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(e.x - half, e.y - half, e.size, e.size);
    }
    if (e.hp < e.maxHp) {
      const barW = e.size;
      const barH = e.isBoss ? 5 : 3;
      const barY = e.y - half - (e.isBoss ? 18 : 6);
      ctx.fillStyle = '#333';
      ctx.fillRect(e.x - half, barY, barW, barH);
      ctx.fillStyle = e.isBoss ? '#9333ea' : '#ef4444';
      ctx.fillRect(e.x - half, barY, barW * (e.hp / e.maxHp), barH);
    }
  }

  // Player
  const flashing = now < p.invincibleUntil && Math.floor(now / 80) % 2 === 0;
  if (!flashing) {
    ctx.fillStyle = playerColor;
    ctx.shadowColor = playerColor;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(p.x - 6, p.y - 2, 3, 0, Math.PI * 2);
    ctx.arc(p.x + 6, p.y - 2, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(p.x - 5, p.y - 2, 1.5, 0, Math.PI * 2);
    ctx.arc(p.x + 7, p.y - 2, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.arc(p.x - 4, p.y - 6, p.radius * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(playerName, p.x, p.y - p.radius - 8);

  ctx.restore();
}

export default GameCanvas;
