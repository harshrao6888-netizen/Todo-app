import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { useNotifications } from '../context/NotificationsContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { useTasks } from '../context/TasksContext.jsx';
import { useUI } from '../context/UIContext.jsx';
import { BackHeader } from '../components/TopBar.jsx';
import { EmptyState } from '../components/States.jsx';

const TONE = {
  ended: 'bg-pending',
  'starting-soon': 'bg-[#fff4dc]',
  'daily-summary': 'bg-complete',
};

export default function Notifications() {
  const { notifications, read, unreadCount, markRead, markAllRead } = useNotifications();
  const { settings } = useSettings();
  const { tasks, toggleStatus } = useTasks();
  const { openView } = useUI();

  return (
    <div className="flex flex-col gap-6">
      <BackHeader
        title="Notifications"
        right={
          unreadCount > 0 && (
            <button type="button" onClick={markAllRead} className="text-sm font-medium text-primary">
              Mark all read
            </button>
          )
        }
      />

      {!settings.notificationsEnabled ? (
        <EmptyState title="Notifications are off">
          Turn them on in <Link to="/settings" className="text-primary underline">Settings</Link>.
        </EmptyState>
      ) : notifications.length === 0 ? (
        <EmptyState title="You're all caught up">Nothing needs your attention right now.</EmptyState>
      ) : (
        <ul className="flex flex-col gap-3">
          {notifications.map((n) => {
            const task = n.taskId && tasks.find((t) => t._id === n.taskId);
            const unread = !read.has(n.id);
            return (
              <li key={n.id} className={`relative p-4 ${TONE[n.type]}`} data-testid="notification">
                {unread && (
                  <span className="absolute top-4 right-4 size-2 rounded-full bg-primary" aria-label="Unread" />
                )}
                <p className="pr-4 text-sm font-semibold text-ink">{n.title}</p>
                <p className="mt-1 text-xs text-ink">{n.message}</p>
                <p className="mt-1 text-[10px] text-subtle">{formatDistanceToNow(n.at, { addSuffix: true })}</p>
                <div className="mt-3 flex gap-4 text-xs font-medium">
                  {task && (
                    <button
                      type="button"
                      className="text-primary"
                      onClick={() => {
                        markRead(n.id);
                        openView(task);
                      }}
                    >
                      View task
                    </button>
                  )}
                  {task && task.status !== 'completed' && (
                    <button
                      type="button"
                      className="text-primary"
                      onClick={() => {
                        markRead(n.id);
                        toggleStatus(task);
                      }}
                    >
                      Mark completed
                    </button>
                  )}
                  {unread && (
                    <button type="button" className="text-subtle" onClick={() => markRead(n.id)}>
                      Mark read
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
