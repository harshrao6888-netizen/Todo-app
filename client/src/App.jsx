import { useState } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext.jsx';
import { SettingsProvider, useSettings } from './context/SettingsContext.jsx';
import { TasksProvider } from './context/TasksContext.jsx';
import { UIProvider } from './context/UIContext.jsx';
import { NotificationsProvider } from './context/NotificationsContext.jsx';
import AddTaskButton from './components/AddTaskButton.jsx';
import Onboarding from './pages/Onboarding.jsx';
import Home, { initialSelected } from './pages/Home.jsx';
import Search from './pages/Search.jsx';
import Weeks from './pages/Weeks.jsx';
import Settings from './pages/Settings.jsx';
import Notifications from './pages/Notifications.jsx';

/** Phone-width column; centred with a frame on larger screens. */
function Shell({ addDate }) {
  return (
    <div className="mx-auto min-h-dvh w-full max-w-[480px] bg-canvas sm:shadow-[0_0_40px_rgba(9,14,35,0.08)]">
      <main className={`px-6 pt-[max(2.5rem,env(safe-area-inset-top))] ${addDate ? 'pb-36' : 'pb-10'}`}>
        <Outlet />
      </main>
      {addDate && <AddTaskButton date={addDate} />}
    </div>
  );
}

function AppRoutes() {
  const { settings, update } = useSettings();
  // The day selected on Home; new tasks default to it.
  const [selected, setSelected] = useState(initialSelected);

  if (!settings.onboarded) return <Onboarding onDone={() => update({ onboarded: true })} />;

  return (
    <Routes>
      <Route element={<Shell addDate={selected} />}>
        <Route index element={<Home selected={selected} onSelect={setSelected} />} />
      </Route>
      <Route element={<Shell />}>
        <Route path="search" element={<Search />} />
        <Route path="weeks" element={<Weeks />} />
        <Route path="settings" element={<Settings />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <SettingsProvider>
          <TasksProvider>
            <UIProvider>
              <NotificationsProvider>
                <AppRoutes />
              </NotificationsProvider>
            </UIProvider>
          </TasksProvider>
        </SettingsProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
