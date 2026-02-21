import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Palette, Moon, Sun, Sparkles, Coffee, Sunset, LogOut } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { useTheme, type ThemeMode } from '@/contexts/ThemeContext';
import { useUser } from '@/contexts/UserContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { AVATAR_OPTIONS } from '@/constants/avatars';

const themeOptions: { id: ThemeMode; labelKey: string; icon: typeof Sun; descKey: string }[] = [
  { id: 'light', labelKey: 'settings.light', icon: Sun, descKey: 'settings.lightDesc' },
  { id: 'dark', labelKey: 'settings.dark', icon: Moon, descKey: 'settings.darkDesc' },
  { id: 'pastel', labelKey: 'settings.pastel', icon: Sparkles, descKey: 'settings.pastelDesc' },
  { id: 'comfort', labelKey: 'settings.comfort', icon: Coffee, descKey: 'settings.comfortDesc' },
  { id: 'sunset', labelKey: 'settings.sunset', icon: Sunset, descKey: 'settings.sunsetDesc' },
];

const languageOptions: { id: 'en' | 'es' | 'zh'; labelKey: string }[] = [
  { id: 'en', labelKey: 'settings.english' },
  { id: 'es', labelKey: 'settings.spanish' },
  { id: 'zh', labelKey: 'settings.chinese' },
];

const SettingsPage = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { currentUser, settings, updateUser, updateSettings, signOut } = useUser();
  const { t } = useLanguage();
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState(currentUser?.name || '');
  const [profileAvatar, setProfileAvatar] = useState(currentUser?.avatar || '👨');

  const handleSaveProfile = () => {
    if (currentUser && (profileName.trim() || profileAvatar)) {
      updateUser(currentUser.id, { name: profileName.trim() || currentUser.name, avatar: profileAvatar });
      setEditingProfile(false);
    }
  };

  const handleChangeUser = () => {
    signOut();
    navigate('/users');
  };

  if (!currentUser) return null;

  return (
    <div className="mobile-container pb-24">
      <PageHeader title={t('settings.title')} showBack />

      <div className="px-5 pt-4 space-y-6">
        {/* Profile */}
        <div className="card-ios p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center text-4xl shrink-0">
              {profileAvatar}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-foreground">{t('settings.profile')}</h2>
              {editingProfile ? (
                <input
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder={t('settings.profileName')}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-secondary text-foreground"
                />
              ) : (
                <p className="text-sm text-muted-foreground truncate">{currentUser.name}</p>
              )}
            </div>
            <button
              onClick={editingProfile ? handleSaveProfile : () => { setEditingProfile(true); setProfileName(currentUser.name); setProfileAvatar(currentUser.avatar); }}
              className="text-sm text-primary font-medium shrink-0"
            >
              {editingProfile ? t('common.save') : t('common.edit')}
            </button>
          </div>
          {editingProfile && (
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">{t('settings.avatar')}</p>
              <div className="flex flex-wrap gap-2">
                {AVATAR_OPTIONS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setProfileAvatar(a)}
                    className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${
                      profileAvatar === a ? 'ring-2 ring-primary bg-primary/20' : 'bg-secondary'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Theme */}
        <div className="card-ios p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <Palette size={24} className="text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">{t('settings.theme')}</h2>
              <p className="text-sm text-muted-foreground">{t('settings.themeDesc')}</p>
            </div>
          </div>
          <div className="space-y-2">
            {themeOptions.map(({ id, labelKey, icon: Icon, descKey }) => (
              <button
                key={id}
                onClick={() => setTheme(id)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all active-scale text-left ${
                  theme === id ? 'bg-primary/15 border-2 border-primary' : 'bg-secondary/50 hover:bg-secondary border-2 border-transparent'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${theme === id ? 'bg-primary text-primary-foreground' : 'bg-background'}`}>
                  <Icon size={20} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{t(labelKey)}</p>
                  <p className="text-xs text-muted-foreground">{t(descKey)}</p>
                </div>
                {theme === id && <div className="w-5 h-5 rounded-full bg-primary" />}
              </button>
            ))}
          </div>
        </div>

        {/* Language */}
        <div className="card-ios p-5">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-foreground">{t('settings.language')}</h2>
            <p className="text-sm text-muted-foreground">{t('settings.languageDesc')}</p>
          </div>
          <div className="space-y-2">
            {languageOptions.map(({ id, labelKey }) => (
              <button
                key={id}
                onClick={() => updateSettings({ language: id })}
                className={`w-full flex items-center justify-between p-4 rounded-xl transition-all active-scale text-left ${
                  settings?.language === id ? 'bg-primary/15 border-2 border-primary' : 'bg-secondary/50 hover:bg-secondary border-2 border-transparent'
                }`}
              >
                <span className="font-semibold text-foreground">{t(labelKey)}</span>
                {settings?.language === id && <div className="w-5 h-5 rounded-full bg-primary" />}
              </button>
            ))}
          </div>
        </div>

        {/* Change User */}
        <div className="card-ios p-5">
          <button
            onClick={handleChangeUser}
            className="w-full flex items-center gap-4 p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-all active-scale text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
              <LogOut size={20} className="text-foreground" />
            </div>
            <span className="font-semibold text-foreground">{t('settings.changeUser')}</span>
          </button>
        </div>

        {/* About */}
        <div className="card-ios p-5">
          <h3 className="font-semibold text-foreground mb-2">{t('settings.about')}</h3>
          <p className="text-sm text-muted-foreground">{t('app.about')}</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
