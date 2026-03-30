import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { AVATAR_OPTIONS } from '@/constants/avatars';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { AppLogo } from '@/components/AppLogo';

const UsersPage = () => {
  useDocumentTitle('Create Account');
  const navigate = useNavigate();
  const { users, loading, login, createUser } = useUser();
  const { t } = useLanguage();
  const [addForm, setAddForm] = useState({
    name: '',
    username: '',
    password: '',
    confirmPassword: '',
    avatar: AVATAR_OPTIONS[0],
  });
  const [error, setError] = useState('');

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!addForm.name.trim()) {
      setError(t('auth.profileNameRequired'));
      return;
    }
    if (users.length >= 5) {
      setError(t('users.maxReached'));
      return;
    }
    if (!addForm.username.trim()) {
      setError(t('auth.usernameRequired'));
      return;
    }
    if (addForm.password.length < 8) {
      setError(t('auth.passwordMin'));
      return;
    }
    if (addForm.password !== addForm.confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }
    const created = await createUser(addForm.name, addForm.username, addForm.password, addForm.avatar);
    if (created) {
      await login(addForm.username, addForm.password);
      navigate('/');
    } else {
      setError(t('auth.createFailed'));
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
      <div className="flex justify-center mb-4">
        <AppLogo className="h-[7.5rem] w-auto max-w-[300px] object-contain" />
      </div>
      <h1 className="text-3xl font-bold text-foreground text-center mb-2">{t('app.title')}</h1>
      <p className="text-muted-foreground text-center mb-8">{t('auth.createSubtitle')}</p>
      <form onSubmit={handleCreateUser} className="w-full max-w-sm space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground block mb-2">{t('users.profileName')}</label>
          <input
            value={addForm.name}
            onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Name"
            className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground"
            autoFocus
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground block mb-2">{t('auth.username')}</label>
          <input
            value={addForm.username}
            onChange={(e) => setAddForm((f) => ({ ...f, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
            placeholder={t('auth.usernamePlaceholder')}
            className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground block mb-2">{t('auth.password')}</label>
          <input
            type="password"
            value={addForm.password}
            onChange={(e) => setAddForm((f) => ({ ...f, password: e.target.value }))}
            placeholder={t('auth.passwordPlaceholder')}
            className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground block mb-2">{t('auth.confirmPassword')}</label>
          <input
            type="password"
            value={addForm.confirmPassword}
            onChange={(e) => setAddForm((f) => ({ ...f, confirmPassword: e.target.value }))}
            placeholder={t('auth.confirmPassword')}
            className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground block mb-2">{t('users.chooseAvatar')}</label>
          <div className="flex flex-wrap gap-2">
            {AVATAR_OPTIONS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAddForm((f) => ({ ...f, avatar: a }))}
                className={`w-12 h-12 rounded-xl text-2xl flex items-center justify-center transition-all ${
                  addForm.avatar === a ? 'ring-2 ring-primary bg-primary/20' : 'bg-secondary hover:bg-secondary/80'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
        {error && <p className="text-destructive text-sm">{error}</p>}
        <button type="submit" className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold">
          {t('users.createProfile')}
        </button>
      </form>
      <p className="text-center text-sm text-muted-foreground mt-6">
        {t('auth.haveAccount')}{' '}
        <Link to="/login" className="text-primary hover:underline font-medium">
          {t('users.signIn')}
        </Link>
      </p>
    </div>
  );
};

export default UsersPage;
