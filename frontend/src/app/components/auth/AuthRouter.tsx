import { useEffect, useState } from 'react';
import { LoginScreen } from './LoginScreen';
import { RegisterScreen } from './RegisterScreen';
import { OnboardingScreen } from './OnboardingScreen';
import { AcceptInviteScreen } from './AcceptInviteScreen';
import { ResetPasswordScreen } from './ResetPasswordScreen';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/api';

type AuthView = 'login' | 'register' | 'forgot';

export function AuthRouter() {
  const { user, refetch } = useAuth();
  const [view, setView] = useState<AuthView>('login');
  const [inviteToken, setInviteToken] = useState<string | null>(
    () => sessionStorage.getItem('pending_invite'),
  );
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [acceptError, setAcceptError] = useState<string | null>(null);

  // Handle redirect states and invite token from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const state = params.get('auth_state');
    const error = params.get('auth_error');
    const invite = params.get('invite');
    const reset = params.get('reset_token');

    if (invite) {
      sessionStorage.setItem('pending_invite', invite);
      setInviteToken(invite);
    }
    if (reset) setResetToken(reset);

    if (state || error || invite || reset) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Logged in but no org → check for pending invite first
  useEffect(() => {
    if (!user || user.orgId || !inviteToken) return;

    apiFetch('/api/user/accept-invite', {
      method: 'POST',
      body: JSON.stringify({ token: inviteToken }),
    }).then(async res => {
      sessionStorage.removeItem('pending_invite');
      setInviteToken(null);
      if (res.ok) {
        await refetch();
      } else {
        const data = await res.json();
        setAcceptError(data.error || 'Failed to accept invite');
      }
    });
  }, [user, inviteToken]);

  // Logged in but no org yet → onboarding (only if no invite token)
  if (user && !user.orgId) {
    if (inviteToken) return null; // waiting for accept-invite effect
    if (acceptError) {
      return (
        <OnboardingScreen errorBanner={acceptError} />
      );
    }
    return <OnboardingScreen />;
  }

  // Password reset flow
  if (!user && resetToken) {
    return <ResetPasswordScreen token={resetToken} onDone={() => { setResetToken(null); setView('login'); }} />;
  }

  // Not logged in but has invite token → show invite landing
  if (!user && inviteToken) {
    return (
      <AcceptInviteScreen
        token={inviteToken}
        onShowLogin={() => setView('login')}
        onShowRegister={() => setView('register')}
      />
    );
  }

  if (view === 'register') {
    return <RegisterScreen onShowLogin={() => setView('login')} />;
  }

  if (view === 'forgot') {
    return <ResetPasswordScreen token={null} onDone={() => setView('login')} />;
  }

  return <LoginScreen onShowRegister={() => setView('register')} onShowForgotPassword={() => setView('forgot')} />;
}
