interface GameHUDProps {
  hp: number;
  maxHp: number;
  xp: number;
  xpToLevel: number;
  level: number;
  time: number;
  enemiesKilled?: number;
  stage?: number;
  gameMode?: string;
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const GameHUD = ({ hp, maxHp, xp, xpToLevel, level, time, enemiesKilled, stage, gameMode }: GameHUDProps) => (
  <div className="absolute top-0 left-0 right-0 p-3 z-40 pointer-events-none">
    {/* Top row: XP bar + HP bar */}
    <div className="flex items-center gap-4 pr-14">
      {/* 經驗值條 */}
      <div className="flex-1">
        <div className="flex justify-between text-xs text-game-muted mb-1">
          <span>等級 {level}</span>
          <span>{xp}/{xpToLevel} 經驗值</span>
        </div>
        <div className="h-3 bg-black/50 rounded-full overflow-hidden border border-white/10">
          <div
            className="h-full bg-game-xp rounded-full transition-all duration-200"
            style={{ width: `${Math.min((xp / xpToLevel) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* 血量條 */}
      <div className="w-40">
        <div className="flex justify-between text-xs text-game-muted mb-1">
          <span>血量</span>
          <span>{hp}/{maxHp}</span>
        </div>
        <div className="h-3 bg-black/50 rounded-full overflow-hidden border border-white/10">
          <div
            className="h-full bg-game-hp rounded-full transition-all duration-200"
            style={{ width: `${Math.max((hp / maxHp) * 100, 0)}%` }}
          />
        </div>
      </div>
    </div>

    {/* Second row: stats */}
    <div className="flex items-center gap-3 mt-2 text-xs text-game-muted">
      <span className="font-mono text-sm font-bold text-foreground">⏱ {formatTime(time)}</span>
      {enemiesKilled !== undefined && <span>💀 {enemiesKilled}</span>}
      {gameMode === 'stage' && stage !== undefined && <span>🏰 第 {stage} 關</span>}
    </div>
  </div>
);

export default GameHUD;
