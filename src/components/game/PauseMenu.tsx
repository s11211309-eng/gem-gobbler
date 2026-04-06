import { useState } from 'react';

interface PauseMenuProps {
  onResume: () => void;
  onRestart: () => void;
  onQuit: () => void;
}

const PauseMenu = ({ onResume, onRestart, onQuit }: PauseMenuProps) => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-50">
      <h2 className="text-4xl font-black text-foreground mb-8">暫停</h2>
      <div className="flex flex-col gap-3 w-48">
        <button
          onClick={onResume}
          className="px-6 py-3 bg-game-accent text-game-bg font-bold text-lg rounded-lg hover:brightness-110 transition-all active:scale-95"
        >
          繼續遊戲
        </button>
        <button
          onClick={onRestart}
          className="px-6 py-3 bg-white/10 text-foreground font-bold text-lg rounded-lg border border-white/20 hover:bg-white/20 transition-all active:scale-95"
        >
          重新開始
        </button>
        <button
          onClick={onQuit}
          className="px-6 py-3 bg-white/10 text-game-enemy font-bold text-lg rounded-lg border border-white/20 hover:bg-white/20 transition-all active:scale-95"
        >
          回到主畫面
        </button>
      </div>
    </div>
  );
};

export function PauseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="absolute top-3 right-3 z-50 w-10 h-10 flex flex-col items-center justify-center gap-[3px] bg-black/40 rounded-lg border border-white/10 hover:bg-black/60 transition-all active:scale-90"
    >
      <span className="block w-5 h-[2px] bg-white/80 rounded" />
      <span className="block w-5 h-[2px] bg-white/80 rounded" />
      <span className="block w-5 h-[2px] bg-white/80 rounded" />
    </button>
  );
}

export default PauseMenu;
