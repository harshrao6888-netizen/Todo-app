import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { computeNotifications } from '../lib/notifications.js';
import { load, save } from '../lib/storage.js';
import { useTasks } from './TasksContext.jsx';
import { useSettings } from './SettingsContext.jsx';
import { useToast } from './ToastContext.jsx';

const READ_KEY = 'todo.notifications.read';
const SEEN_KEY = 'todo.notifications.seen';
const TICK_MS = 30_000;

const NotificationsContext = createContext(null);

export const browserNotificationsSupported = () => typeof window !== 'undefined' && 'Notification' in window;

export function NotificationsProvider({ children }) {
  const { tasks, loading } = useTasks();
  const { settings } = useSettings();
  const toast = useToast();
  const [now, setNow] = useState(() => new Date());
  const [read, setRead] = useState(() => new Set(load(READ_KEY, [])));
  const seen = useRef(new Set(load(SEEN_KEY, [])));

  // Re-evaluate periodically so "ended" / "starting soon" fire while the app is open.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), TICK_MS);
    return () => clearInterval(id);
  }, []);

  const notifications = useMemo(
    () => computeNotifications(tasks, now, settings),
    [tasks, now, settings]
  );

  // Alert once (toast + optional system notification) for each notification not seen before.
  useEffect(() => {
    if (loading) return;
    const fresh = notifications.filter((n) => !seen.current.has(n.id));
    if (!fresh.length) return;
    fresh.forEach((n) => seen.current.add(n.id));
    save(SEEN_KEY, [...seen.current].slice(-500));

    const important = fresh.filter((n) => n.type !== 'daily-summary');
    if (important.length) {
      toast.show(
        important.length === 1 ? important[0].message : `You have ${important.length} new task alerts`
      );
    }
    if (
      settings.browserNotifications &&
      browserNotificationsSupported() &&
      Notification.permission === 'granted'
    ) {
      fresh.forEach((n) => {
        try {
          new Notification(n.title, { body: n.message, tag: n.id, icon: '/favicon.svg' });
        } catch {
          /* some mobile browsers only allow notifications from a service worker */
        }
      });
    }
  }, [notifications, loading, settings.browserNotifications, toast]);

  const persistRead = (next) => {
    save(READ_KEY, [...next].slice(-500));
    return next;
  };

  const markRead = useCallback((id) => {
    setRead((prev) => persistRead(new Set(prev).add(id)));
  }, []);

  const markAllRead = useCallback(() => {
    setRead((prev) => persistRead(new Set([...prev, ...notifications.map((n) => n.id)])));
  }, [notifications]);

  const unreadCount = notifications.filter((n) => !read.has(n.id)).length;

  const value = useMemo(
    () => ({ notifications, read, unreadCount, markRead, markAllRead }),
    [notifications, read, unreadCount, markRead, markAllRead]
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export const useNotifications = () => useContext(NotificationsContext);
