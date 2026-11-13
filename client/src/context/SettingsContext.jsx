import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { load, save } from '../lib/storage.js';

const KEY = 'todo.settings';
export const DEFAULT_SETTINGS = {
  notificationsEnabled: true,
  browserNotifications: false,
  leadMinutes: 30,
  onboarded: false,
};

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => ({ ...DEFAULT_SETTINGS, ...load(KEY, {}) }));

  const update = useCallback((patch) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      save(KEY, next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ settings, update }), [settings, update]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export const useSettings = () => useContext(SettingsContext);
