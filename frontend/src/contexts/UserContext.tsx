import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { api } from '@/lib/api';
import type { Language } from '@/lib/i18n';

export interface User {
  id: string;
  name: string;
  pin: string | null;
  avatar: string;
  createdAt?: string;
}

interface UserSettings {
  theme: string;
  language: Language;
}

interface UserContextType {
  currentUser: User | null;
  settings: UserSettings | null;
  users: User[];
  loading: boolean;
  selectUser: (user: User, pin?: string) => Promise<boolean>;
  createUser: (name: string, avatar: string, pin?: string) => Promise<User | null>;
  updateUser: (id: string, updates: { name?: string; avatar?: string; pin?: string | null }) => Promise<void>;
  removeUser: (id: string) => Promise<void>;
  signOut: () => void;
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
  refetchUsers: () => Promise<void>;
}

const CURRENT_USER_KEY = 'keeper-current-user';

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem(CURRENT_USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const refetchUsers = useCallback(async () => {
    try {
      const data = await api.users.getAll();
      setUsers(data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setUsers([]);
    }
  }, []);

  useEffect(() => {
    refetchUsers().then(() => {
      // Validate stored user still exists in DB
      if (currentUser) {
        setUsers((prev) => {
          const stillExists = prev.some((u) => u.id === currentUser.id);
          if (!stillExists) {
            setCurrentUser(null);
            localStorage.removeItem(CURRENT_USER_KEY);
          }
          return prev;
        });
      }
    }).finally(() => setLoading(false));
  }, [refetchUsers]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
      api.userSettings.get(currentUser.id).then((s) => setSettings(s)).catch(() => setSettings({ theme: 'light', language: 'en' }));
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
      setSettings(null);
    }
  }, [currentUser?.id]);

  const selectUser = useCallback(
    async (user: User, pin?: string): Promise<boolean> => {
      if (user.pin && pin !== user.pin) {
        try {
          const { valid } = await api.users.verifyPin(user.id, pin || '');
          if (!valid) return false;
        } catch {
          return false;
        }
      }
      setCurrentUser(user);
      return true;
    },
    []
  );

  const createUser = useCallback(async (name: string, avatar: string, pin?: string): Promise<User | null> => {
    try {
      const id = `u_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
      const created = await api.users.create({ id, name, avatar, pin: pin || null });
      await refetchUsers();
      return created;
    } catch (err) {
      console.error('Failed to create user:', err);
      return null;
    }
  }, [refetchUsers]);

  const updateUser = useCallback(
    async (id: string, updates: { name?: string; avatar?: string; pin?: string | null }) => {
      await api.users.update(id, updates);
      await refetchUsers();
      if (currentUser?.id === id) {
        setCurrentUser((prev) => (prev ? { ...prev, ...updates } : null));
      }
    },
    [currentUser?.id, refetchUsers]
  );

  const removeUser = useCallback(
    async (id: string) => {
      await api.users.delete(id);
      await refetchUsers();
      if (currentUser?.id === id) {
        setCurrentUser(null);
      }
    },
    [currentUser?.id, refetchUsers]
  );

  const signOut = useCallback(() => {
    setCurrentUser(null);
  }, []);

  const updateSettings = useCallback(
    async (updates: Partial<UserSettings>) => {
      if (!currentUser) return;
      const newSettings = await api.userSettings.update(currentUser.id, updates);
      setSettings(newSettings);
    },
    [currentUser?.id]
  );

  return (
    <UserContext.Provider
      value={{
        currentUser,
        settings,
        users,
        loading,
        selectUser,
        createUser,
        updateUser,
        removeUser,
        signOut,
        updateSettings,
        refetchUsers,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
