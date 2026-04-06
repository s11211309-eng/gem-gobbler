import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface DailyTask {
  id: string;
  task_type: string;
  title: string;
  description: string;
  target_value: number;
  task_category: string;
}

interface TaskProgress {
  task_id: string;
  current_value: number;
  completed: boolean;
}

const DailyTasks = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [progress, setProgress] = useState<Record<string, TaskProgress>>({});

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }
    if (!user) return;

    const fetchTasks = async () => {
      const { data: tasksData } = await supabase.from('daily_tasks').select('*');
      if (tasksData) setTasks(tasksData);

      const today = new Date().toISOString().split('T')[0];
      const { data: progressData } = await supabase
        .from('daily_task_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('task_date', today);

      if (progressData) {
        const map: Record<string, TaskProgress> = {};
        for (const p of progressData) {
          map[p.task_id] = { task_id: p.task_id, current_value: p.current_value, completed: p.completed };
        }
        setProgress(map);
      }
    };

    fetchTasks();
  }, [user, loading, navigate]);

  const simpleTasks = tasks.filter(t => t.task_category === 'simple');
  const challengeTasks = tasks.filter(t => t.task_category === 'challenge');

  const renderTask = (task: DailyTask) => {
    const p = progress[task.id];
    const current = p?.current_value ?? 0;
    const pct = Math.min((current / task.target_value) * 100, 100);
    const done = p?.completed ?? false;

    return (
      <div key={task.id} className={`p-4 rounded-lg border transition-all ${done ? 'bg-game-xp/10 border-game-xp/30' : 'bg-white/5 border-white/10'}`}>
        <div className="flex justify-between items-center mb-2">
          <h3 className={`font-bold ${done ? 'text-game-xp' : 'text-foreground'}`}>
            {done ? '✅ ' : ''}{task.title}
          </h3>
          <span className="text-xs text-game-muted">{current}/{task.target_value}</span>
        </div>
        <p className="text-sm text-game-muted mb-2">{task.description}</p>
        <div className="h-2 bg-black/50 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-300 ${done ? 'bg-game-xp' : 'bg-game-accent'}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    );
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen bg-game-bg text-foreground">載入中...</div>;

  return (
    <div className="min-h-screen bg-game-bg p-6 overflow-auto">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-black text-game-title">📋 每日任務</h1>
          <button onClick={() => navigate('/')} className="text-game-muted hover:text-foreground text-sm">← 返回</button>
        </div>

        <h2 className="text-lg font-bold text-foreground mb-3">🎯 簡單目標</h2>
        <div className="flex flex-col gap-3 mb-6">
          {simpleTasks.map(renderTask)}
        </div>

        <h2 className="text-lg font-bold text-foreground mb-3">⚡ 挑戰任務</h2>
        <div className="flex flex-col gap-3 mb-6">
          {challengeTasks.map(renderTask)}
        </div>

        <p className="text-center text-game-muted text-xs">任務每日重置，完成遊戲後自動更新進度</p>
      </div>
    </div>
  );
};

export default DailyTasks;
