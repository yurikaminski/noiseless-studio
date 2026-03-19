import { useEffect, useState } from 'react';
import { LoginScreen } from './LoginScreen';
import { RegisterScreen } from './RegisterScreen';
import { OnboardingScreen } from './OnboardingScreen';
import { useAuth } from '../../context/AuthContext';

type AuthView = 'login' | 'register';

export function AuthRouter() {
  const { user } = useAuth();
  const [view, setView] = useState<AuthView>('login');

  // Handle redirect states from OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const state = params.get('auth_state');
    const error = params.get('auth_error');

    if (state || error) {
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Logged in but no org yet → onboarding
  if (user && !user.orgId) {
    return <OnboardingScreen />;
  }

  if (view === 'register') {
    return <RegisterScreen onShowLogin={() => setView('login')} />;
  }

  return <LoginScreen onShowRegister={() => setView('register')} />;
}
