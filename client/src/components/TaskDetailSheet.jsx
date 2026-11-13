import { format } from 'date-fns';
import Sheet from './Sheet.jsx';
import PriorityBadge from './PriorityBadge.jsx';
import { useTasks } from '../context/TasksContext.jsx';

/** Read-only view of a task with status control, edit and delete. */
export default function TaskDetailSheet({ task, onClose, onEdit }) {
  const { deleteTask, toggleStatus } = useTasks();
  const start = new Date(task.startAt);
  const done = task.status === 'completed';

  return (
    <Sheet title="Task Details" onClose={onClose}>
      <div className="flex flex-col gap-5">
        <div>
          <h3 className={`text-lg font-semibold text-ink ${done ? 'line-through' : ''}`}>{task.title}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-subtle">
            <span>
              {format(start, 'EEEE d MMMM yyyy, h:mm a')}
              {task.endAt ? ` – ${format(new Date(task.endAt), 'h:mm a')}` : ''}
            </span>
            <PriorityBadge priority={task.priority} />
          </div>
        </div>

        <div>
          <span className="mb-2 block text-xs font-medium text-muted">Status</span>
          <div className="grid grid-cols-2 border border-line" role="radiogroup" aria-label="Status">
            {[
              ['in_progress', 'In Progress'],
              ['completed', 'Completed'],
            ].map(([value, text]) => {
              const active = task.status === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => !active && toggleStatus(task)}
                  className={`h-10 text-sm ${active ? 'bg-primary text-white' : 'bg-white text-ink'}`}
                >
                  {text}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <span className="mb-2 block text-xs font-medium text-muted">Description</span>
          <p className="min-h-[60px] border border-line bg-white px-2.5 py-2.5 text-sm whitespace-pre-wrap text-ink">
            {task.description || <span className="text-faint">No description</span>}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              onClose();
              deleteTask(task);
            }}
            className="h-12 border border-danger text-base font-medium text-danger"
          >
            Delete
          </button>
          <button type="button" onClick={onEdit} className="h-12 bg-primary text-base font-medium text-white">
            Edit
          </button>
        </div>
      </div>
    </Sheet>
  );
}
