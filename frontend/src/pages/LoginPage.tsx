import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { AppLogo } from '@/components/AppLogo';

const LoginPage = () => {
  useDocumentTitle('Sign In');
  const navigate = useNavigate();
  const { users, loading, selectUser } = useUser();
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    const user = users.find(
      (u) => u.name.toLowerCase() === name.trim().toLowerCase()
    );

    if (!user) {
      setError('No profile found with that name');
      return;
    }

    if (user.pin) {
      if (!pin) {
        setError('PIN is required for this profile');
        return;
      }
      const ok = await selectUser(user, pin);
      if (!ok) {
        setError('Invalid PIN');
        return;
      }
    } else {
      await selectUser(user);
    }

    navigate('/');
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
          Sign in to your profile
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your profile name"
              className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground"
              autoFocus
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-2">
              PIN
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="4-digit PIN (if set)"
              className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground"
            />
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold"
          >
            Sign In
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Don't have a profile?{' '}
          <Link to="/users" className="text-primary hover:underline font-medium">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
