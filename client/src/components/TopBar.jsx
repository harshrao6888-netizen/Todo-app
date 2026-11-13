import { Link, useNavigate } from 'react-router-dom';
import { Icon } from './Icon.jsx';
import { icons } from './icons.js';
import { useNotifications } from '../context/NotificationsContext.jsx';

/** Figma "Header": settings (left), search + notifications (right). */
export function HomeHeader() {
  const { unreadCount } = useNotifications();
  return (
    <header className="flex items-center justify-between">
      <Link to="/settings" aria-label="Settings" className="-m-2 flex size-10 items-center justify-center">
        <Icon src={icons.settings} size={22} />
      </Link>
      {/* Figma: 24px icons 20px apart -> 40px tap boxes with a 4px gap. */}
      <div className="-m-2 flex items-center gap-1">
        <Link to="/search" aria-label="Search tasks" className="flex size-10 items-center justify-center">
          <Icon src={icons.search} size={17.5} />
        </Link>
        <Link
          to="/notifications"
          aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'}
          className="relative flex size-10 items-center justify-center"
        >
          <Icon src={icons.bell} size={16.7} />
          {unreadCount > 0 && (
            <span
              data-testid="notif-badge"
              className="absolute top-1 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] leading-none font-semibold text-white"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}

/** Back arrow + title, as in the Figma search frame. */
export function BackHeader({ title, right }) {
  const navigate = useNavigate();
  return (
    <header className="flex min-h-10 items-center gap-3">
      <button
        type="button"
        aria-label="Back"
        onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
        className="-m-2 flex size-10 items-center justify-center"
      >
        <Icon src={icons.arrowLeft} size={24} />
      </button>
      {title && <h1 className="flex-1 text-lg font-semibold text-ink">{title}</h1>}
      {right}
    </header>
  );
}
