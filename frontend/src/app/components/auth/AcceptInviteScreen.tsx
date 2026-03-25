import { useEffect, useState } from 'react';
import { Sparkles, Loader2, Users } from 'lucide-react';
import { apiFetch } from '../../lib/api';

interface AcceptInviteScreenProps {
  token: string;
  onShowLogin: () => void;
  onShowRegister: () => void;
}

interface InviteInfo {
  orgName: string;
  inviterName: string;
  email: string;
}

export function AcceptInviteScreen({ token, onShowLogin, onShowRegister }: AcceptInviteScreenProps) {
  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setInfo(null);
    setError(null);
    apiFetch(`/api/user/invite-info?token=${encodeURIComponent(token)}`)
      .then(async res => {
        if (!res.ok) { setError('Este convite é inválido ou já expirou.'); return; }
        setInfo(await res.json());
      })
      .catch(() => setError('Erro ao carregar o convite.'));
  }, [token]);

  if (!info && !error) {
    return (
      <div className="size-full flex items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="w-6 h-6 text-white/30 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="size-full flex items-center justify-center bg-[#0a0a0a] text-white">
        <div className="w-full max-w-sm px-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center mx-auto mb-6">
            <Users className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-light text-white mb-3">Convite inválido</h2>
          <p className="text-white/50 text-sm mb-6">{error}</p>
          <button onClick={onShowLogin} className="text-sm text-purple-400 hover:text-purple-300 transition-colors">
            Ir para o login
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
          <h1 className="text-3xl font-light tracking-tight text-white/90">You're invited</h1>
          <p className="text-sm text-white/40 mt-2">
            <strong className="text-white/60">{info!.inviterName}</strong> convidou-te para{' '}
            <strong className="text-white/60">{info!.orgName}</strong>
          </p>
          {info!.email && (
            <p className="text-xs text-white/30 mt-1">Para: {info!.email}</p>
          )}
        </div>

        <div className="space-y-3">
          <button
            onClick={onShowRegister}
            className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm font-medium rounded-xl transition-all"
          >
            Criar conta
          </button>
          <button
            onClick={onShowLogin}
            className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm rounded-xl transition-all"
          >
            Já tenho conta — entrar
          </button>
        </div>
      </div>
    </div>
  );
}
