import { useState } from 'react';

const PLAYER_COLORS = [
  { name: '藍', value: '#3b82f6' },
  { name: '紅', value: '#ef4444' },
  { name: '綠', value: '#22c55e' },
  { name: '紫', value: '#a855f7' },
  { name: '橙', value: '#f97316' },
  { name: '青', value: '#06b6d4' },
];

interface StartScreenProps {
  onStart: (playerName: string, color: string, inputMode: 'pc' | 'tablet') => void;
}

function CharacterPreview({ color }: { color: string }) {
  return (
    <div className="relative w-24 h-24 mb-6">
      {/* Glow */}
      <div
        className="absolute inset-0 rounded-full blur-xl opacity-40"
        style={{ backgroundColor: color }}
      />
      {/* Body */}
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Shadow */}
        <ellipse cx="50" cy="90" rx="22" ry="5" fill="rgba(0,0,0,0.3)" />
        {/* Body circle */}
        <circle cx="50" cy="50" r="24" fill={color} />
        {/* Highlight */}
        <circle cx="42" cy="42" r="9" fill="rgba(255,255,255,0.25)" />
        {/* Eyes */}
        <circle cx="42" cy="48" r="3" fill="white" />
        <circle cx="58" cy="48" r="3" fill="white" />
        <circle cx="43" cy="48" r="1.5" fill="#111" />
        <circle cx="59" cy="48" r="1.5" fill="#111" />
        {/* Mouth */}
        <path d="M 44 56 Q 50 62 56 56" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  );
}

const StartScreen = ({ onStart }: StartScreenProps) => {
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PLAYER_COLORS[0].value);
  const [inputMode, setInputMode] = useState<'pc' | 'tablet' | null>(null);

  const handleStart = () => {
    if (!inputMode) return;
    onStart(name.trim() || '無名英雄', selectedColor, inputMode);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-game-bg">
      <h1 className="text-6xl font-black text-game-title mb-2 tracking-tighter drop-shadow-lg">
        無境求生
      </h1>
      <h2 className="text-xl font-bold text-game-muted mb-8 tracking-wide opacity-60">
        在無盡的世界中活下去
      </h2>

      <CharacterPreview color={selectedColor} />

      {/* Color picker */}
      <div className="flex gap-3 mb-6">
        {PLAYER_COLORS.map((c) => (
          <button
            key={c.value}
            onClick={() => setSelectedColor(c.value)}
            className={`w-10 h-10 rounded-full border-2 transition-all hover:scale-110 active:scale-95 ${
              selectedColor === c.value ? 'border-white scale-110 shadow-lg' : 'border-white/20'
            }`}
            style={{ backgroundColor: c.value, boxShadow: selectedColor === c.value ? `0 0 16px ${c.value}80` : undefined }}
            title={c.name}
          />
        ))}
      </div>

      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleStart()}
        placeholder="輸入你的名稱..."
        maxLength={12}
        className="mb-6 px-6 py-3 bg-white/10 border border-white/20 rounded-lg text-center text-lg text-foreground placeholder:text-game-muted focus:outline-none focus:border-game-accent/60 w-64"
      />

      {/* Platform selection */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setInputMode('pc')}
          className={`px-6 py-3 rounded-lg font-bold text-sm transition-all ${
            inputMode === 'pc'
              ? 'bg-game-accent text-game-bg shadow-lg shadow-game-accent/30'
              : 'bg-white/10 text-game-muted border border-white/20 hover:bg-white/20'
          }`}
        >
          🖥️ 電腦 (鍵盤)
        </button>
        <button
          onClick={() => setInputMode('tablet')}
          className={`px-6 py-3 rounded-lg font-bold text-sm transition-all ${
            inputMode === 'tablet'
              ? 'bg-game-accent text-game-bg shadow-lg shadow-game-accent/30'
              : 'bg-white/10 text-game-muted border border-white/20 hover:bg-white/20'
          }`}
        >
          📱 平板 (搖桿)
        </button>
      </div>

      <button
        onClick={handleStart}
        disabled={!inputMode}
        className="px-12 py-4 bg-game-accent text-game-bg font-bold text-xl rounded-lg hover:brightness-110 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-game-accent/30 disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed"
      >
        開始遊戲
      </button>
      <p className="mt-8 text-game-muted text-sm">
        {inputMode === 'tablet' ? '使用搖桿移動' : '使用 WASD 或方向鍵移動'}
      </p>
    </div>
  );
};

export default StartScreen;
