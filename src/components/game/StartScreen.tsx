import { useState } from 'react';

interface StartScreenProps {
  onStart: (playerName: string) => void;
}

const StartScreen = ({ onStart }: StartScreenProps) => {
  const [name, setName] = useState('');

  const handleStart = () => {
    onStart(name.trim() || '無名英雄');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-game-bg">
      <h1 className="text-6xl font-black text-game-title mb-2 tracking-tighter drop-shadow-lg">
        無境求生
      </h1>
      <h2 className="text-xl font-bold text-game-muted mb-12 tracking-wide opacity-60">
        在無盡的世界中活下去
      </h2>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleStart()}
        placeholder="輸入你的名稱..."
        maxLength={12}
        className="mb-6 px-6 py-3 bg-white/10 border border-white/20 rounded-lg text-center text-lg text-foreground placeholder:text-game-muted focus:outline-none focus:border-game-accent/60 w-64"
      />
      <button
        onClick={handleStart}
        className="px-12 py-4 bg-game-accent text-game-bg font-bold text-xl rounded-lg hover:brightness-110 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-game-accent/30"
      >
        開始遊戲
      </button>
      <p className="mt-8 text-game-muted text-sm">使用 WASD 或方向鍵移動</p>
    </div>
  );
};

export default StartScreen;
