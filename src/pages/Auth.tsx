import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { SFX } from '@/lib/sounds';

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [signUpSuccess, setSignUpSuccess] = useState(false);
  const { signUp, signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    SFX.buttonClick();

    if (isSignUp) {
      const { error } = await signUp(email, password, displayName || 'Player');
      if (error) {
        setError(error);
      } else {
        setSignUpSuccess(true);
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error);
      } else {
        navigate('/');
      }
    }
    setLoading(false);
  };

  if (signUpSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-game-bg">
        <div className="bg-game-panel border border-white/10 rounded-xl p-8 max-w-sm w-full mx-4">
          <h2 className="text-2xl font-black text-game-accent text-center mb-4">📧 驗證信已發送</h2>
          <p className="text-game-muted text-center text-sm mb-6">請到信箱點擊驗證連結來啟用帳號</p>
          <button
            onClick={() => { setSignUpSuccess(false); setIsSignUp(false); }}
            className="w-full px-6 py-3 bg-game-accent text-game-bg font-bold rounded-lg hover:brightness-110 transition-all"
          >
            前往登入
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-game-bg">
      <h1 className="text-4xl font-black text-game-title mb-8">無境求生</h1>
      <form onSubmit={handleSubmit} className="bg-game-panel border border-white/10 rounded-xl p-6 max-w-sm w-full mx-4">
        <h2 className="text-xl font-bold text-foreground text-center mb-6">
          {isSignUp ? '建立帳號' : '登入'}
        </h2>

        {isSignUp && (
          <input
            type="text"
            placeholder="玩家名稱"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            maxLength={12}
            className="w-full mb-3 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-foreground placeholder:text-game-muted focus:outline-none focus:border-game-accent/60"
          />
        )}
        <input
          type="email"
          placeholder="電子信箱"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="w-full mb-3 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-foreground placeholder:text-game-muted focus:outline-none focus:border-game-accent/60"
        />
        <input
          type="password"
          placeholder="密碼（至少6位）"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          minLength={6}
          className="w-full mb-4 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-foreground placeholder:text-game-muted focus:outline-none focus:border-game-accent/60"
        />

        {error && <p className="text-destructive text-sm mb-3 text-center">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-3 bg-game-accent text-game-bg font-bold text-lg rounded-lg hover:brightness-110 transition-all disabled:opacity-50"
        >
          {loading ? '處理中...' : isSignUp ? '註冊' : '登入'}
        </button>

        <p className="text-game-muted text-sm text-center mt-4">
          {isSignUp ? '已有帳號？' : '還沒有帳號？'}
          <button
            type="button"
            onClick={() => { setIsSignUp(!isSignUp); setError(''); SFX.buttonClick(); }}
            className="text-game-accent ml-1 hover:underline"
          >
            {isSignUp ? '登入' : '註冊'}
          </button>
        </p>
      </form>

      <button
        onClick={() => navigate('/')}
        className="mt-6 text-game-muted text-sm hover:text-foreground transition-colors"
      >
        ← 以訪客身份遊玩
      </button>
    </div>
  );
};

export default Auth;
