import { useState, useCallback } from 'react';
import StartScreen from '@/components/game/StartScreen';
import GameCanvas from '@/components/game/GameCanvas';
import type { GameScreen } from '@/components/game/types';

const Index = () => {
  const [screen, setScreen] = useState<GameScreen>('start');
  const [playerName, setPlayerName] = useState('');
  const [playerColor, setPlayerColor] = useState('#3b82f6');
  const [inputMode, setInputMode] = useState<'pc' | 'tablet'>('pc');

  const handleStart = useCallback((name: string, color: string, mode: 'pc' | 'tablet') => {
    setPlayerName(name);
    setPlayerColor(color);
    setInputMode(mode);
    setScreen('playing');
  }, []);

  const handleGameOver = useCallback(() => {}, []);
  const handleQuit = useCallback(() => setScreen('start'), []);

  if (screen === 'start') {
    return <StartScreen onStart={handleStart} />;
  }

  return (
    <GameCanvas
      onGameOver={handleGameOver}
      onQuit={handleQuit}
      playerName={playerName}
      playerColor={playerColor}
      inputMode={inputMode}
    />
  );
};

export default Index;
