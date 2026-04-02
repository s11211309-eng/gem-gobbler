import { useState, useCallback } from 'react';
import StartScreen from '@/components/game/StartScreen';
import GameCanvas from '@/components/game/GameCanvas';
import type { GameScreen } from '@/components/game/types';

const Index = () => {
  const [screen, setScreen] = useState<GameScreen>('start');

  const handleStart = useCallback(() => setScreen('playing'), []);
  const handleGameOver = useCallback(() => {
    // game over is handled inside GameCanvas with overlay
  }, []);

  if (screen === 'start') {
    return <StartScreen onStart={handleStart} />;
  }

  return <GameCanvas onGameOver={handleGameOver} />;
};

export default Index;
