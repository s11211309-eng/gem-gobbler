interface GameOverScreenProps {
  time: number;
  onRestart: () => void;
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const GameOverScreen = ({ time, onRestart }: GameOverScreenProps) => (
  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-50">
    <h1 className="text-5xl font-black text-game-enemy mb-4">GAME OVER</h1>
    <p className="text-game-muted text-lg mb-2">Time Survived</p>
    <p className="text-4xl font-bold text-foreground mb-10 font-mono">{formatTime(time)}</p>
    <button
      onClick={onRestart}
      className="px-10 py-3 bg-game-accent text-game-bg font-bold text-lg rounded-lg hover:brightness-110 transition-all hover:scale-105 active:scale-95"
    >
      RESTART
    </button>
  </div>
);

export default GameOverScreen;
