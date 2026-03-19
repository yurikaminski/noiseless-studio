import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

const ORG_TYPES = [
  { value: 'freelancer', label: 'Freelancer', description: 'Independent creator' },
  { value: 'agency',     label: 'Agência',    description: 'Creative or marketing agency' },
  { value: 'company',    label: 'Empresa',    description: 'Business or corporation' },
];

export function OnboardingScreen() {
  const { user, refetch } = useAuth();
  const [orgName, setOrgName] = useState(() => {
    if (!user?.email) return '';
    const domain = user.email.split('@')[1] || '';
    const isGeneric = ['gmail.com','hotmail.com','outlook.com','yahoo.com','icloud.com','live.com','me.com','protonmail.com'].includes(domain);
    return isGeneric ? user.name || '' : domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
  });
  const [orgType, setOrgType] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgType) { setError('Please select an organization type'); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/org/setup', {
        method: 'POST',
        body: JSON.stringify({ name: orgName, type: orgType }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Setup failed'); return; }
      await refetch();
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
          <h1 className="text-3xl font-light tracking-tight text-white/90">Set up your workspace</h1>
          <p className="text-sm text-white/40 mt-2">Almost there, {user?.name?.split(' ')[0] || 'there'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Org name */}
          <div>
            <label className="block text-xs font-medium text-white/40 uppercase tracking-wider mb-2">
              Organization name
            </label>
            <input
              type="text"
              value={orgName}
              onChange={e => setOrgName(e.target.value)}
              placeholder="My Studio"
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-white/25 text-sm transition-all"
            />
          </div>

          {/* Org type */}
          <div>
            <label className="block text-xs font-medium text-white/40 uppercase tracking-wider mb-2">
              Type
            </label>
            <div className="space-y-2">
              {ORG_TYPES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setOrgType(t.value)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition-all text-left ${
                    orgType === t.value
                      ? 'bg-purple-500/20 border-purple-500/50 text-white'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/8 hover:border-white/20'
                  }`}
                >
                  <span className="font-medium">{t.label}</span>
                  <span className="text-xs text-white/40">{t.description}</span>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !orgType || !orgName.trim()}
            className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-all flex items-center justify-center gap-2 mt-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Get Started
          </button>
        </form>
      </div>
    </div>
  );
}
