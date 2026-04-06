import { useState, useCallback } from 'react';
import StartScreen from '@/components/game/StartScreen';
import GameCanvas from '@/components/game/GameCanvas';
import type { GameScreen } from '@/components/game/types';

const Index = () => {
  const [screen, setScreen] = useState<GameScreen>('start');
  const [playerName, setPlayerName] = useState('');

  const handleStart = useCallback((name: string) => {
    setPlayerName(name);
    setScreen('playing');
  }, []);
  const handleGameOver = useCallback(() => {}, []);

  if (screen === 'start') {
    return <StartScreen onStart={handleStart} />;
  }

  return <GameCanvas onGameOver={handleGameOver} playerName={playerName} />;
};

export default Index;
