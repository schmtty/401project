import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { AppLogo } from '@/components/AppLogo';

const LoginPage = () => {
  useDocumentTitle('Sign In');
  const navigate = useNavigate();
  const { loading, login, setPassword } = useUser();
  const { t } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPasswordInput] = useState('');
  const [error, setError] = useState('');
  const [showReset, setShowReset] = useState(false);
  const [resetFor, setResetFor] = useState<{ id: string; username: string } | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetError, setResetError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError(t('auth.enterCredentials'));
      return;
    }

    const user = await login(username.trim(), password);
    if (!user) {
      setError(t('auth.invalidCredentials'));
      return;
    }

    if (user.mustResetPassword) {
      setShowReset(true);
      setResetFor({ id: user.id, username: user.username });
      setResetError('');
      return;
    }

    navigate('/');
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    if (newPassword.length < 8) {
      setResetError(t('auth.passwordMin'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError(t('auth.passwordMismatch'));
      return;
    }
    if (!resetFor) return;
    try {
      await setPassword(resetFor.id, password, newPassword);
      setShowReset(false);
      navigate('/');
    } catch (err) {
      setResetError((err as Error).message || t('auth.resetFailed'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-8">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-4">
          <AppLogo className="h-[7.5rem] w-auto max-w-[300px] object-contain" />
        </div>
        <h1 className="text-3xl font-bold text-foreground text-center mb-2">
          {t('app.title')}
        </h1>
        <p className="text-muted-foreground text-center mb-8">
          {t('auth.signInSubtitle')}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">
              {t('auth.username')}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t('auth.usernamePlaceholder')}
              className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground"
              autoFocus
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-2">
              {t('auth.password')}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder={t('auth.passwordPlaceholder')}
              className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground"
            />
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold"
          >
            {t('users.signIn')}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          {t('auth.noAccount')}{' '}
          <Link to="/users" className="text-primary hover:underline font-medium">
            {t('users.createProfile')}
          </Link>
        </p>

        {showReset && (
          <form onSubmit={handleResetSubmit} className="mt-8 space-y-4 border-t border-border pt-6">
            <h2 className="text-lg font-semibold text-foreground">{t('auth.resetRequired')}</h2>
            <p className="text-sm text-muted-foreground">
              {t('auth.resetRequiredDesc')} {resetFor?.username}
            </p>
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">{t('auth.newPassword')}</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('auth.newPassword')}
                className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">{t('auth.confirmPassword')}</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('auth.confirmPassword')}
                className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground"
              />
            </div>
            {resetError && <p className="text-destructive text-sm">{resetError}</p>}
            <button type="submit" className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold">
              {t('auth.setPassword')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
