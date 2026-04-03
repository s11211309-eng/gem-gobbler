interface StartScreenProps {
  onStart: () => void;
}

const StartScreen = ({ onStart }: StartScreenProps) => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-game-bg">
    <h1 className="text-6xl font-black text-game-title mb-2 tracking-tighter drop-shadow-lg">
      無境求生
    </h1>
    <button
      onClick={onStart}
      className="px-12 py-4 bg-game-accent text-game-bg font-bold text-xl rounded-lg hover:brightness-110 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-game-accent/30"
    >
      開始遊戲
    </button>
    <p className="mt-8 text-game-muted text-sm">使用 WASD 或方向鍵移動</p>
  </div>
);

export default StartScreen;
