import { useState, useCallback } from 'react';
import StartScreen from '@/components/game/StartScreen';
import GameCanvas from '@/components/game/GameCanvas';
import type { GameScreen, GameStats } from '@/components/game/types';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const [screen, setScreen] = useState<GameScreen>('start');
  const [playerName, setPlayerName] = useState('');
  const [playerColor, setPlayerColor] = useState('#3b82f6');
  const [inputMode, setInputMode] = useState<'pc' | 'tablet'>('pc');
  const [gameMode, setGameMode] = useState<'infinite' | 'stage'>('infinite');
  const { user } = useAuth();

  const handleStart = useCallback((name: string, color: string, mode: 'pc' | 'tablet', gMode: 'infinite' | 'stage') => {
    setPlayerName(name);
    setPlayerColor(color);
    setInputMode(mode);
    setGameMode(gMode);
    setScreen('playing');
  }, []);

  const handleGameOver = useCallback(async (time: number, stats: GameStats) => {
    if (user) {
      await supabase.from('game_records').insert({
        user_id: user.id,
        game_mode: gameMode,
        survival_time: time,
        enemies_killed: stats.enemiesKilled,
        xp_earned: stats.xpCollected,
        score: Math.floor(time * 10 + stats.enemiesKilled * 5),
      });
    }
  }, [user, gameMode]);

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
      gameMode={gameMode}
    />
  );
};

export default Index;
