import { useSettings } from '../context/SettingsContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { browserNotificationsSupported } from '../context/NotificationsContext.jsx';
import { BackHeader } from '../components/TopBar.jsx';

function Toggle({ id, checked, onChange, label, hint, disabled }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <label htmlFor={id} className="flex-1">
        <span className="block text-sm font-medium text-ink">{label}</span>
        {hint && <span className="mt-0.5 block text-xs text-subtle">{hint}</span>}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-40 ${
          checked ? 'bg-primary' : 'bg-faint'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5' : ''
          }`}
        />
      </button>
    </div>
  );
}

export default function Settings() {
  const { settings, update } = useSettings();
  const toast = useToast();
  const supported = browserNotificationsSupported();
  const permission = supported ? Notification.permission : 'unsupported';

  const setBrowser = async (on) => {
    if (!on) return update({ browserNotifications: false });
    if (!supported) return toast.show('This browser does not support notifications', { tone: 'error' });
    const result = permission === 'granted' ? 'granted' : await Notification.requestPermission();
    if (result === 'granted') {
      update({ browserNotifications: true });
      toast.show('Browser notifications enabled');
    } else {
      toast.show('Permission was denied. Allow notifications for this site in your browser settings.', {
        tone: 'error',
      });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <BackHeader title="Settings" />


      <section aria-labelledby="notif-h" className="divide-y divide-line">
        <h2 id="notif-h" className="pt-2 text-xs font-medium text-muted">
          Notifications
        </h2>
        <Toggle
          id="notif-enabled"
          label="Task notifications"
          hint="Alerts when a task's time is up, when one is about to start, and a daily summary."
          checked={settings.notificationsEnabled}
          onChange={(v) => update({ notificationsEnabled: v })}
        />
        <Toggle
          id="notif-browser"
          label="Browser pop-ups"
          hint={
            !supported
              ? 'Not supported in this browser.'
              : permission === 'denied'
                ? 'Blocked in browser settings.'
                : 'Show system notifications while the app is open.'
          }
          checked={settings.browserNotifications && permission === 'granted'}
          disabled={!settings.notificationsEnabled || !supported}
          onChange={setBrowser}
        />
        <div className="flex items-center justify-between gap-4 py-4">
          <label htmlFor="lead" className="text-sm font-medium text-ink">
            &ldquo;Starting soon&rdquo; alert
          </label>
          <select
            id="lead"
            value={settings.leadMinutes}
            disabled={!settings.notificationsEnabled}
            onChange={(e) => update({ leadMinutes: Number(e.target.value) })}
            className="h-10 border border-line bg-white px-2 text-sm disabled:opacity-40"
          >
            {[15, 30, 60].map((m) => (
              <option key={m} value={m}>
                {m} min before
              </option>
            ))}
          </select>
        </div>
      </section>

      <section aria-labelledby="app-h" className="divide-y divide-line">
        <h2 id="app-h" className="pt-2 text-xs font-medium text-muted">
          App
        </h2>
        <button
          type="button"
          onClick={() => {
            update({ onboarded: false });
          }}
          className="block w-full py-4 text-left text-sm font-medium text-ink"
        >
          Show onboarding again
        </button>
      </section>
    </div>
  );
}
