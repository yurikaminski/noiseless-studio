import { useState } from 'react';
import { Sparkles, Loader2, Eye, EyeOff, Mail } from 'lucide-react';
import { apiFetch } from '../../lib/api';

interface RegisterScreenProps {
  onShowLogin: () => void;
}

export function RegisterScreen({ onShowLogin }: RegisterScreenProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'verify_email' | 'access_requested'>('idle');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/user/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Registration failed'); return; }
      setStatus(data.status);
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'verify_email') {
    return (
      <div className="size-full flex items-center justify-center bg-[#0a0a0a] text-white">
        <div className="relative z-10 w-full max-w-sm px-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-purple-400" />
          </div>
          <h2 className="text-2xl font-light text-white mb-3">Check your email</h2>
          <p className="text-white/50 text-sm mb-6">
            We sent a confirmation link to <strong className="text-white/80">{email}</strong>.<br />
            Click the link to activate your account.
          </p>
          <button onClick={onShowLogin} className="text-sm text-purple-400 hover:text-purple-300 transition-colors">
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  if (status === 'access_requested') {
    return (
      <div className="size-full flex items-center justify-center bg-[#0a0a0a] text-white">
        <div className="relative z-10 w-full max-w-sm px-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-yellow-400" />
          </div>
          <h2 className="text-2xl font-light text-white mb-3">Request sent</h2>
          <p className="text-white/50 text-sm mb-6">
            Solicitamos ao admin da sua organização que um novo acesso seja criado para você.
          </p>
          <button onClick={onShowLogin} className="text-sm text-purple-400 hover:text-purple-300 transition-colors">
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

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
          <h1 className="text-3xl font-light tracking-tight text-white/90">Create account</h1>
          <p className="text-sm text-white/40 mt-2">Join Noiseless Studio</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-3">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Full name"
            required
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-white/25 text-sm transition-all"
          />
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-white/25 text-sm transition-all"
          />
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password (min. 8 characters)"
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
            Create Account
          </button>
        </form>

        <p className="text-center text-sm text-white/30 mt-6">
          Already have an account?{' '}
          <button onClick={onShowLogin} className="text-purple-400 hover:text-purple-300 transition-colors">
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
