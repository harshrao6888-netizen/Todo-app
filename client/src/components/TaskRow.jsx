import { useEffect, useRef, useState } from 'react';
import { format, isPast } from 'date-fns';
import { Icon } from './Icon.jsx';
import { icons } from './icons.js';
import StatusCheckbox from './StatusCheckbox.jsx';
import PriorityBadge from './PriorityBadge.jsx';
import { useTasks } from '../context/TasksContext.jsx';
import { useUI } from '../context/UIContext.jsx';

const REVEAL = 88; // width of the swipe-revealed Delete button (px)

/**
 * A task row as in the Figma "Tasks Today" list.
 * Swipe left (touch or mouse drag) to reveal "Delete" (User Flow 4).
 * Tap the row to view it; the pencil opens edit; the bin deletes.
 */
export default function TaskRow({ task, showDate = false }) {
  const { toggleStatus, deleteTask } = useTasks();
  const { openView, openEdit } = useUI();
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const drag = useRef(null);
  const rowRef = useRef(null);
  const open = offset <= -REVEAL;

  // Close an open row when the user interacts elsewhere.
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (!rowRef.current?.contains(e.target)) setOffset(0);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  const onPointerDown = (e) => {
    if (e.button !== 0) return;
    drag.current = { x: e.clientX, y: e.clientY, base: offset, moved: false, axis: null };
  };

  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.axis) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      d.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (d.axis === 'x') {
        e.currentTarget.setPointerCapture?.(e.pointerId);
        setDragging(true);
      }
    }
    if (d.axis !== 'x') return;
    d.moved = true;
    setOffset(Math.max(-REVEAL - 24, Math.min(0, d.base + dx)));
  };

  const endDrag = () => {
    const d = drag.current;
    drag.current = null;
    setDragging(false);
    if (d?.axis === 'x') setOffset((o) => (o < -REVEAL / 2 ? -REVEAL : 0));
    if (d?.moved) {
      // Swallow the click that follows a drag.
      const swallow = (ev) => {
        ev.stopPropagation();
        ev.preventDefault();
      };
      window.addEventListener('click', swallow, { capture: true, once: true });
      setTimeout(() => window.removeEventListener('click', swallow, { capture: true }), 0);
    }
  };

  const done = task.status === 'completed';
  const start = new Date(task.startAt);
  const overdue = !done && isPast(task.endAt ? new Date(task.endAt) : start);

  return (
    <li ref={rowRef} className="relative overflow-hidden" data-testid="task-row">
      <button
        type="button"
        tabIndex={open ? 0 : -1}
        aria-hidden={!open}
        onClick={() => deleteTask(task)}
        className="absolute inset-y-0 right-0 flex items-center justify-center bg-danger text-sm font-medium text-white"
        style={{ width: REVEAL }}
      >
        Delete
      </button>

      <div
        className="relative flex touch-pan-y items-start gap-3 bg-canvas pt-[3px]"
        style={{
          transform: `translateX(${offset}px)`,
          transition: dragging ? 'none' : 'transform 200ms ease',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <div className="pt-px">
          <StatusCheckbox task={task} onToggle={toggleStatus} />
        </div>

        <div className="flex min-w-0 flex-1 items-start gap-2 border-b border-line pb-4">
          <button
            type="button"
            onClick={() => openView(task)}
            className="min-w-0 flex-1 text-left"
          >
            <span
              className={`block truncate text-sm font-medium text-ink ${done ? 'line-through' : ''}`}
            >
              {task.title}
            </span>
            <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-subtle">
              <span className={overdue ? 'text-danger' : ''}>
                {showDate ? format(start, 'EEE d MMM, ') : ''}
                {format(start, 'h:mm a')}
                {task.endAt ? ` – ${format(new Date(task.endAt), 'h:mm a')}` : ''}
                {overdue ? ' · overdue' : ''}
              </span>
              <PriorityBadge priority={task.priority} />
            </span>
          </button>

          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              aria-label={`Delete "${task.title}"`}
              onClick={() => deleteTask(task)}
              className="flex size-9 items-center justify-center"
            >
              <Icon src={icons.trash} size={24} />
            </button>
            <button
              type="button"
              aria-label={`Edit "${task.title}"`}
              onClick={() => openEdit(task)}
              className="-mr-1.5 flex size-9 items-center justify-center"
            >
              <Icon src={icons.edit} size={24} />
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}
