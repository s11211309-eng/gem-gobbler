import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface GameRecord {
  id: string;
  game_mode: string;
  stage_reached: number;
  survival_time: number;
  enemies_killed: number;
  xp_earned: number;
  score: number;
  created_at: string;
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const Records = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [records, setRecords] = useState<GameRecord[]>([]);

  useEffect(() => {
    if (!loading && !user) { navigate('/auth'); return; }
    if (!user) return;

    supabase
      .from('game_records')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => { if (data) setRecords(data); });
  }, [user, loading, navigate]);

  if (loading) return <div className="flex items-center justify-center min-h-screen bg-game-bg text-foreground">載入中...</div>;

  const bestScore = records.length ? Math.max(...records.map(r => r.score)) : 0;
  const bestTime = records.length ? Math.max(...records.map(r => r.survival_time)) : 0;

  return (
    <div className="min-h-screen bg-game-bg p-6 overflow-auto">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-black text-game-title">🏆 遊戲紀錄</h1>
          <button onClick={() => navigate('/')} className="text-game-muted hover:text-foreground text-sm">← 返回</button>
        </div>

        {/* Best stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
            <p className="text-game-muted text-xs mb-1">最高分數</p>
            <p className="text-2xl font-black text-game-accent">{bestScore}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
            <p className="text-game-muted text-xs mb-1">最長存活</p>
            <p className="text-2xl font-black text-game-accent">{formatTime(bestTime)}</p>
          </div>
        </div>

        {/* Records list */}
        <div className="flex flex-col gap-2">
          {records.map(r => (
            <div key={r.id} className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-game-muted">
                    {r.game_mode === 'stage' ? `🏰 關卡 ${r.stage_reached}` : '♾️ 無限'}
                  </span>
                  <span className="text-xs text-game-muted">{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex gap-4 text-sm">
                  <span className="text-foreground font-mono">{formatTime(r.survival_time)}</span>
                  <span className="text-game-muted">💀 {r.enemies_killed}</span>
                  <span className="text-game-accent font-bold">{r.score} 分</span>
                </div>
              </div>
            </div>
          ))}
          {records.length === 0 && (
            <p className="text-center text-game-muted py-8">還沒有遊戲紀錄，去玩一場吧！</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Records;
