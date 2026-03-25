import { useState } from 'react';
import { Sparkles, Loader2, Mail, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { apiFetch } from '../../lib/api';

interface ResetPasswordScreenProps {
  token: string | null;  // null = "forgot" mode, string = "reset" mode
  onDone: () => void;
}

export function ResetPasswordScreen({ token, onDone }: ResetPasswordScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await apiFetch('/api/user/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setDone(true);
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/user/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Reset failed'); return; }
      setDone(true);
      setTimeout(onDone, 2000);
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="size-full flex items-center justify-center bg-[#0a0a0a] text-white overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-sm px-6">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-light tracking-tight text-white/90">
            {token ? 'New password' : 'Forgot password'}
          </h1>
          <p className="text-sm text-white/40 mt-2">
            {token ? 'Choose a new password for your account' : 'Enter your email to receive a reset link'}
          </p>
        </div>

        {done ? (
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
              {token ? <CheckCircle2 className="w-8 h-8 text-green-400" /> : <Mail className="w-8 h-8 text-green-400" />}
            </div>
            <p className="text-white/60 text-sm mb-6">
              {token ? 'Password updated! Redirecting to login…' : `We sent a reset link to ${email}`}
            </p>
            {!token && (
              <button onClick={onDone} className="text-sm text-purple-400 hover:text-purple-300 transition-colors">
                Back to sign in
              </button>
            )}
          </div>
        ) : token ? (
          <form onSubmit={handleReset} className="space-y-3">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="New password (min. 8 characters)"
                required
                minLength={8}
                className="w-full px-4 py-3 pr-11 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-white/25 text-sm transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Set new password
            </button>
          </form>
        ) : (
          <form onSubmit={handleForgot} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-white/25 text-sm transition-all"
            />
            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Send reset link
            </button>
            <p className="text-center">
              <button type="button" onClick={onDone} className="text-sm text-white/30 hover:text-white/50 transition-colors">
                Back to sign in
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
