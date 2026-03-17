import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { useUser, type User } from '@/contexts/UserContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { AVATAR_OPTIONS } from '@/constants/avatars';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const MAX_USERS = 5;

const UsersPage = () => {
  const navigate = useNavigate();
  const { users, loading, selectUser, createUser, removeUser, refetchUsers } = useUser();
  const { t } = useLanguage();
  const [showAdd, setShowAdd] = useState(false);
  const [pinInput, setPinInput] = useState<{ userId: string; pin: string } | null>(null);
  const [removeConfirm, setRemoveConfirm] = useState<User | null>(null);
  const [addForm, setAddForm] = useState({ name: '', avatar: AVATAR_OPTIONS[0], pin: '' });
  const [error, setError] = useState('');

  const handleSelectUser = async (user: User) => {
    if (user.pin) {
      setPinInput({ userId: user.id, pin: '' });
      return;
    }
    const ok = await selectUser(user);
    if (ok) navigate('/');
  };

  const handleVerifyPin = async () => {
    if (!pinInput) return;
    const user = users.find((u) => u.id === pinInput.userId);
    if (!user) return;
    const ok = await selectUser(user, pinInput.pin);
    if (ok) {
      setPinInput(null);
      navigate('/');
    } else {
      setError('Invalid PIN');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!addForm.name.trim()) {
      setError('Profile name is required');
      return;
    }
    if (users.length >= MAX_USERS) {
      setError(t('users.maxReached'));
      return;
    }
    const created = await createUser(addForm.name, addForm.avatar, addForm.pin || undefined);
    if (created) {
      setAddForm({ name: '', avatar: AVATAR_OPTIONS[0], pin: '' });
      setShowAdd(false);
      await selectUser(created);
      navigate('/');
    } else {
      setError(t('users.maxReached'));
    }
  };

  const handleRemoveUser = async () => {
    if (!removeConfirm) return;
    await removeUser(removeConfirm.id);
    setRemoveConfirm(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (pinInput) {
    const user = users.find((u) => u.id === pinInput.userId);
    if (!user) return null;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-8">
        <div className="w-24 h-24 rounded-2xl bg-secondary flex items-center justify-center text-5xl mb-4">
          {user.avatar || '👨'}
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">{user.name}</h2>
        <p className="text-sm text-muted-foreground mb-4">{t('users.enterPin')}</p>
        <input
          type="password"
          inputMode="numeric"
          maxLength={4}
          placeholder="PIN"
          value={pinInput.pin}
          onChange={(e) => setPinInput({ ...pinInput, pin: e.target.value.replace(/\D/g, '') })}
          className="w-32 px-4 py-3 rounded-xl bg-secondary text-foreground text-center text-xl tracking-widest"
        />
        {error && <p className="text-destructive text-sm mt-2">{error}</p>}
        <div className="flex gap-3 mt-6">
          <button onClick={() => { setPinInput(null); setError(''); }} className="px-6 py-2 rounded-xl bg-secondary">
            {t('users.cancel')}
          </button>
          <button onClick={handleVerifyPin} className="px-6 py-2 rounded-xl bg-primary text-primary-foreground">
            {t('users.signIn')}
          </button>
        </div>
      </div>
    );
  }

  if (showAdd) {
    return (
      <div className="min-h-screen flex flex-col items-center px-8 pt-12">
        <h2 className="text-2xl font-bold text-foreground mb-6">{t('users.createProfile')}</h2>
        <form onSubmit={handleCreateUser} className="w-full max-w-sm space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">{t('users.profileName')}</label>
            <input
              value={addForm.name}
              onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Name"
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
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">{t('users.optionalPin')}</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={addForm.pin}
              onChange={(e) => setAddForm((f) => ({ ...f, pin: e.target.value.replace(/\D/g, '') }))}
              placeholder={t('users.pinPlaceholder')}
              className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground"
            />
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={() => { setShowAdd(false); setError(''); }} className="flex-1 py-3 rounded-xl bg-secondary">
              {t('users.cancel')}
            </button>
            <button type="submit" className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-semibold">
              {t('users.createProfile')}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col px-6 pt-12 pb-8">
      <h1 className="text-3xl font-bold text-foreground mb-6 text-center">{t('users.title')}</h1>
      <div className="flex-1 overflow-y-auto flex flex-col items-center gap-4 w-full max-w-md mx-auto">
        {users.map((user) => (
          <div key={user.id} className="flex flex-col items-center w-full">
            <button
              onClick={() => handleSelectUser(user)}
              className="group flex flex-col items-center gap-3 tap-target w-full py-4 px-6 rounded-2xl bg-secondary/50 hover:bg-secondary transition-all"
            >
              <div className="w-28 h-28 rounded-2xl bg-secondary flex items-center justify-center text-6xl transition-all group-hover:scale-105 group-hover:ring-2 group-hover:ring-primary">
                {user.avatar || '👨'}
              </div>
              <span className="text-xl font-medium text-foreground">{user.name}</span>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setRemoveConfirm(user); }}
              className="mt-2 p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              title={t('users.removeProfile')}
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
        {users.length < MAX_USERS && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex flex-col items-center gap-3 tap-target w-full py-4 px-6 rounded-2xl border-2 border-dashed border-muted-foreground/50 hover:border-primary hover:text-primary transition-all"
          >
            <div className="w-28 h-28 rounded-2xl flex items-center justify-center text-5xl text-muted-foreground">
              <Plus size={48} />
            </div>
            <span className="text-xl font-medium text-muted-foreground">{t('users.addProfile')}</span>
          </button>
        )}
      </div>

      <p className="text-center text-sm text-muted-foreground mt-4">
        Already have an account?{' '}
        <Link to="/login" className="text-primary hover:underline font-medium">
          Sign in
        </Link>
      </p>

      <AlertDialog open={!!removeConfirm} onOpenChange={() => setRemoveConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('users.removeProfile')}</AlertDialogTitle>
            <AlertDialogDescription>{t('users.removeConfirm')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('users.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveUser} className="bg-destructive text-destructive-foreground">
              {t('users.remove')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UsersPage;
