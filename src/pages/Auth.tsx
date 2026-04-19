import { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Mail, Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react';
import { signIn, signUp, type User as AuthUser } from '@/lib/auth';
import { toast } from 'sonner';
import Background3D from '@/components/Background3D';

interface AuthProps {
  onAuth: (user: AuthUser) => void;
}

export default function Auth({ onAuth }: AuthProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      let user: AuthUser;
      if (mode === 'signup') {
        user = await signUp(email, password, name);
        toast.success('Account created! Welcome to NoteFlow AI.');
      } else {
        user = await signIn(email, password);
      }
      onAuth(user);
    } catch (err: any) {
      toast.error(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      <Background3D />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, rotateY: -5 }}
        animate={{ opacity: 1, scale: 1, rotateY: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md mx-4"
        style={{ perspective: '1200px' }}
      >
        <div
          className="glass-strong rounded-2xl p-8 border border-border/40"
          style={{
            boxShadow: '0 25px 60px -12px rgba(0,0,0,0.5), 0 0 40px -8px hsl(262 80% 65% / 0.15), inset 0 1px 0 0 hsla(0,0%,100%,0.06)',
            transform: 'translateZ(20px)',
          }}
        >
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center mb-3 shadow-lg shadow-primary/30">
              <Zap className="w-7 h-7 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">NoteFlow AI</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </p>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            {mode === 'signup' && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary/50 border border-border/40 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-colors"
                />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary/50 border border-border/40 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-colors"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                className="w-full pl-10 pr-12 py-3 rounded-xl bg-secondary/50 border border-border/40 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-colors"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-6">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="text-primary hover:underline font-medium">
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
