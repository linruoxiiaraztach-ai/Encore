import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import CloverFrame from '@/components/CloverFrame';
import { toast } from 'sonner';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    setLoading(true);
    try {
      await signIn(username.trim(), password);
      navigate('/home');
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <CloverFrame>
      <div className="flex flex-col items-center justify-center min-h-screen px-8">
        <h1 className="text-4xl font-bold text-primary mb-8">Encore</h1>
        <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
          <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>
        <p className="mt-6 text-sm text-muted-foreground">
          Don't have an account?{' '}
          <button onClick={() => navigate('/register')} className="text-primary font-semibold hover:underline">Register.</button>
        </p>
      </div>
    </CloverFrame>
  );
};

export default LoginPage;
