import { Icon } from './Icon.jsx';
import { icons } from './icons.js';

function Card({ tone, icon, iconBg, label, value, caption, testId }) {
  return (
    <div className={`flex min-h-24 gap-3 px-[15px] py-4 ${tone}`} data-testid={testId}>
      <span className={`flex size-7 shrink-0 items-center justify-center ${iconBg}`}>
        <Icon src={icon} size={icon === icons.cardPending ? 19.5 : 24} />
      </span>
      <div className="min-w-0">
        <p className="text-xs leading-7 text-ink">{label}</p>
        <p className="flex items-baseline gap-1">
          <span className="text-[22px] font-semibold text-ink" data-testid={`${testId}-count`}>
            {String(value).padStart(2, '0')}
          </span>
          <span className="truncate text-[10px] text-subtle">{caption}</span>
        </p>
      </div>
    </div>
  );
}

/** Figma "Reminder" cards — completed vs open tasks for the selected week. */
export default function SummaryCards({ completed, open, caption }) {
  return (
    <div className="grid grid-cols-2 gap-[17px]">
      <Card
        testId="completed-card"
        tone="bg-complete"
        iconBg="bg-complete-icon"
        icon={icons.cardComplete}
        label="Task Complete"
        value={completed}
        caption={caption}
      />
      <Card
        testId="open-card"
        tone="bg-pending"
        iconBg="bg-pending-icon"
        icon={icons.cardPending}
        label="Task Pending"
        value={open}
        caption={caption}
      />
    </div>
  );
}
