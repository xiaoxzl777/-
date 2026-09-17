import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ADMIN_TOKEN_KEY, storage, USER_INFO_KEY, USER_TOKEN_KEY } from '../api/http';
import type { LoginResult, User } from '../api/types';

type ThemeMode = 'light' | 'dark';

interface AppState {
  user: User | null;
  loginUser: (result: LoginResult) => void;
  logoutUser: () => void;
  adminToken: string | null;
  loginAdmin: (token: string) => void;
  logoutAdmin: () => void;
  theme: ThemeMode;
  toggleTheme: () => void;
}

const AppContext = createContext<AppState | null>(null);

function readUser(): User | null {
  if (!storage.get(USER_TOKEN_KEY)) return null;
  try {
    return JSON.parse(storage.get(USER_INFO_KEY) ?? 'null') as User | null;
  } catch {
    return null;
  }
}

function initialTheme(): ThemeMode {
  const saved = storage.get('tour.theme');
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** 全局状态：游客登录、管理员登录、深浅色 */
export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(readUser);
  const [adminToken, setAdminToken] = useState<string | null>(() => storage.get(ADMIN_TOKEN_KEY));
  const [theme, setTheme] = useState<ThemeMode>(initialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const loginUser = useCallback((result: LoginResult) => {
    storage.set(USER_TOKEN_KEY, result.token);
    storage.set(USER_INFO_KEY, JSON.stringify(result.user));
    setUser(result.user);
  }, []);

  const logoutUser = useCallback(() => {
    storage.set(USER_TOKEN_KEY, null);
    storage.set(USER_INFO_KEY, null);
    setUser(null);
  }, []);

  const loginAdmin = useCallback((token: string) => {
    storage.set(ADMIN_TOKEN_KEY, token);
    setAdminToken(token);
  }, []);

  const logoutAdmin = useCallback(() => {
    storage.set(ADMIN_TOKEN_KEY, null);
    setAdminToken(null);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(current => {
      const next = current === 'dark' ? 'light' : 'dark';
      storage.set('tour.theme', next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ user, loginUser, logoutUser, adminToken, loginAdmin, logoutAdmin, theme, toggleTheme }),
    [user, loginUser, logoutUser, adminToken, loginAdmin, logoutAdmin, theme, toggleTheme],
  );
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const state = useContext(AppContext);
  if (!state) throw new Error('useApp 必须在 AppProvider 里使用');
  return state;
}
