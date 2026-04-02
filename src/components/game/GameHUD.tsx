interface GameHUDProps {
  hp: number;
  maxHp: number;
  xp: number;
  xpToLevel: number;
  level: number;
  time: number;
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const GameHUD = ({ hp, maxHp, xp, xpToLevel, level, time }: GameHUDProps) => (
  <div className="absolute top-0 left-0 right-0 p-3 flex items-center gap-4 z-40 pointer-events-none">
    {/* XP Bar */}
    <div className="flex-1">
      <div className="flex justify-between text-xs text-game-muted mb-1">
        <span>Lv {level}</span>
        <span>{xp}/{xpToLevel} XP</span>
      </div>
      <div className="h-3 bg-black/50 rounded-full overflow-hidden border border-white/10">
        <div
          className="h-full bg-game-xp rounded-full transition-all duration-200"
          style={{ width: `${Math.min((xp / xpToLevel) * 100, 100)}%` }}
        />
      </div>
    </div>

    {/* HP Bar */}
    <div className="w-40">
      <div className="flex justify-between text-xs text-game-muted mb-1">
        <span>HP</span>
        <span>{hp}/{maxHp}</span>
      </div>
      <div className="h-3 bg-black/50 rounded-full overflow-hidden border border-white/10">
        <div
          className="h-full bg-game-hp rounded-full transition-all duration-200"
          style={{ width: `${Math.max((hp / maxHp) * 100, 0)}%` }}
        />
      </div>
    </div>

    {/* Timer */}
    <div className="text-foreground font-mono text-lg font-bold min-w-[60px] text-right">
      {formatTime(time)}
    </div>
  </div>
);

export default GameHUD;
