import { Icon } from './Icon.jsx';
import { icons } from './icons.js';

/** Figma checkbox: empty square = In Progress, ticked = Completed. */
export default function StatusCheckbox({ task, onToggle }) {
  const done = task.status === 'completed';
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={done}
      aria-label={done ? `Mark "${task.title}" as in progress` : `Mark "${task.title}" as completed`}
      onClick={(e) => {
        e.stopPropagation();
        onToggle(task);
      }}
      className="-m-2.5 flex size-10 shrink-0 items-center justify-center"
    >
      <span className="relative block size-5 border border-primary bg-white">
        {done && <Icon src={icons.check} size={20} className="absolute -inset-px" />}
      </span>
    </button>
  );
}
