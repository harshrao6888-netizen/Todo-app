import { Icon } from './Icon.jsx';
import { icons } from './icons.js';
import { useUI } from '../context/UIContext.jsx';

/** Figma Home "Group 40": 76px round "+" button, centred at the bottom of the screen. */
export default function AddTaskButton({ date }) {
  const { openCreate } = useUI();
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[max(28px,env(safe-area-inset-bottom))] z-40 flex justify-center">
      <button
        type="button"
        aria-label="Add Task"
        onClick={() => openCreate(date)}
        className="pointer-events-auto relative flex size-[76px] items-center justify-center rounded-full"
      >
        <Icon src={icons.fabCircle} size={76} className="absolute inset-0" />
        <Icon src={icons.plusLarge} size={21.2} className="relative" />
      </button>
    </div>
  );
}
