interface StartScreenProps {
  onStart: () => void;
}

const StartScreen = ({ onStart }: StartScreenProps) => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-game-bg">
    <h1 className="text-6xl font-black text-game-title mb-2 tracking-tighter drop-shadow-lg">
      ENDLESS CANVAS
    </h1>
    <h2 className="text-3xl font-bold text-game-subtitle mb-12 tracking-wide">
      SURVIVOR
    </h2>
    <button
      onClick={onStart}
      className="px-12 py-4 bg-game-accent text-game-bg font-bold text-xl rounded-lg hover:brightness-110 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-game-accent/30"
    >
      PLAY
    </button>
    <p className="mt-8 text-game-muted text-sm">WASD or Arrow Keys to move</p>
  </div>
);

export default StartScreen;
