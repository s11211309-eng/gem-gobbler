import type { Upgrade } from './types';

interface LevelUpModalProps {
  upgrades: Upgrade[];
  onSelect: (upgrade: Upgrade) => void;
  level: number;
}

const LevelUpModal = ({ upgrades, onSelect, level }: LevelUpModalProps) => (
  <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-50">
    <div className="bg-game-panel border border-white/10 rounded-xl p-6 max-w-lg w-full mx-4 shadow-2xl">
      <h2 className="text-2xl font-black text-game-accent text-center mb-1">LEVEL UP!</h2>
      <p className="text-game-muted text-center text-sm mb-6">Level {level} — Choose an upgrade</p>
      <div className="flex flex-col gap-3">
        {upgrades.map((u) => (
          <button
            key={u.id}
            onClick={() => onSelect(u)}
            className="flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-game-accent/50 rounded-lg transition-all text-left group"
          >
            <span className="text-3xl">{u.icon}</span>
            <div>
              <p className="font-bold text-foreground group-hover:text-game-accent transition-colors">{u.name}</p>
              <p className="text-sm text-game-muted">{u.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  </div>
);

export default LevelUpModal;
