import { useState, useEffect } from 'react';
import { Users, Shield, ShieldOff, Trash2, Loader2, Crown } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface OrgMember {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'creator';
  is_active: number;
  created_at: string;
}

export function OrgSettings() {
  const { user } = useAuth();
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    apiFetch('/api/org/members')
      .then(r => r.json())
      .then(setMembers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const changeRole = async (memberId: number, newRole: 'admin' | 'creator') => {
    setUpdatingId(memberId);
    try {
      const res = await apiFetch(`/api/org/members/${memberId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m));
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const deactivateMember = async (memberId: number) => {
    setUpdatingId(memberId);
    try {
      const res = await apiFetch(`/api/org/members/${memberId}`, { method: 'DELETE' });
      if (res.ok) {
        setMembers(prev => prev.map(m => m.id === memberId ? { ...m, is_active: 0 } : m));
      }
    } finally {
      setUpdatingId(null);
    }
  };

  if (user?.role !== 'admin') return null;

  return (
    <div className="mt-6">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-lg bg-purple-500/10">
          <Users className="w-4 h-4 text-purple-400" />
        </div>
        <h3 className="text-sm font-medium text-white/80">Team Members</h3>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 text-white/30 animate-spin" />
        </div>
      ) : members.length === 0 ? (
        <p className="text-sm text-white/30 text-center py-6">No members yet.</p>
      ) : (
        <div className="space-y-2">
          {members.map(member => {
            const isCurrentUser = member.id === user?.id;
            const isUpdating = updatingId === member.id;
            const inactive = member.is_active === 0;

            return (
              <div
                key={member.id}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  inactive
                    ? 'bg-white/[0.02] border-white/5 opacity-50'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                {/* Avatar */}
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center text-xs font-medium text-white/70 shrink-0">
                  {(member.name || member.email).charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm text-white/80 truncate">{member.name || member.email}</p>
                    {member.role === 'admin' && (
                      <Crown className="w-3 h-3 text-yellow-400/70 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-white/40 truncate">{member.email}</p>
                </div>

                {/* Role badge + actions */}
                {!isCurrentUser && !inactive && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isUpdating ? (
                      <Loader2 className="w-4 h-4 text-white/30 animate-spin" />
                    ) : (
                      <>
                        {member.role === 'creator' ? (
                          <button
                            onClick={() => changeRole(member.id, 'admin')}
                            title="Promote to Admin"
                            className="p-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400/70 hover:bg-yellow-500/20 hover:text-yellow-400 transition-all"
                          >
                            <Shield className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => changeRole(member.id, 'creator')}
                            title="Demote to Creator"
                            className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:bg-white/10 hover:text-white/70 transition-all"
                          >
                            <ShieldOff className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => deactivateMember(member.id)}
                          title="Deactivate member"
                          className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400/70 hover:bg-red-500/20 hover:text-red-400 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                )}

                {/* Inactive label */}
                {inactive && (
                  <span className="text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded-lg shrink-0">
                    Inactive
                  </span>
                )}

                {/* Current user badge */}
                {isCurrentUser && (
                  <span className="text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded-lg shrink-0">
                    You
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
