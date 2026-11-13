import { useRef, useState } from 'react';
import { format } from 'date-fns';
import Sheet from './Sheet.jsx';
import TimePicker from './TimePicker.jsx';
import { Icon } from './Icon.jsx';
import { icons } from './icons.js';
import { useTasks } from '../context/TasksContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { PRIORITY_LABEL } from './PriorityBadge.jsx';

const toDateInput = (d) => format(d, 'yyyy-MM-dd');
const toTimeInput = (d) => format(d, 'HH:mm');
const combine = (date, time) => {
  const [y, m, d] = date.split('-').map(Number);
  const [h, min] = time.split(':').map(Number);
  return new Date(y, m - 1, d, h, min);
};
const fmtTime = (t) => (t ? format(combine('2000-01-01', t), 'h:mm a') : null);

const fieldBox = 'flex h-10 w-full items-center border border-line bg-white px-2.5 text-sm text-ink';
const label = 'mb-2 block text-xs font-medium text-muted';

/** A styled box that opens the native date/time picker when tapped. */
function PickerField({ type, value, onChange, display, placeholder, icon, iconRight, id, invalid, ...rest }) {
  const ref = useRef(null);
  return (
    <div
      className={`${fieldBox} relative gap-3 ${invalid ? 'border-danger' : ''} focus-within:border-primary`}
      onClick={() => {
        try {
          ref.current?.showPicker?.();
        } catch {
          /* showPicker unsupported -> the native input underneath still receives the tap */
        }
      }}
    >
      {icon && <Icon src={icon} size={13} className="mx-[2.5px]" />}
      <span className={`flex-1 truncate ${display ? '' : 'text-ink'}`}>{display || placeholder}</span>
      {iconRight && <Icon src={iconRight} size={14.6} className="mx-[1.7px]" />}
      <input
        ref={ref}
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        aria-invalid={invalid || undefined}
        {...rest}
      />
    </div>
  );
}

/** Start/Ends box; toggles the in-app TimePicker instead of the native popup. */
function TimeField({ id, display, placeholder, open, onToggle, invalid, ...rest }) {
  return (
    <button
      id={id}
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-invalid={invalid || undefined}
      className={`${fieldBox} gap-3 text-left ${invalid ? 'border-danger' : ''} ${open ? 'border-primary' : ''}`}
      {...rest}
    >
      <Icon src={icons.clock} size={13} className="mx-[2.5px]" />
      <span className="flex-1 truncate">{display || placeholder}</span>
    </button>
  );
}

const nextFiveMinutes = () => {
  const d = new Date();
  d.setMinutes(Math.ceil((d.getMinutes() + 1) / 5) * 5, 0, 0);
  return toTimeInput(d);
};
const addHour = (t) => {
  const [h, m] = t.split(':').map(Number);
  return h >= 23 ? '23:59' : `${String(h + 1).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

/** "Add New Task" / edit bottom sheet (Figma frame "New Task"). */
export default function TaskFormSheet({ task, initialDate, onClose }) {
  const editing = Boolean(task);
  const { createTask, updateTask } = useTasks();
  const toast = useToast();

  const start = task ? new Date(task.startAt) : null;
  const [title, setTitle] = useState(task?.title ?? '');
  const [date, setDate] = useState(toDateInput(start ?? initialDate ?? new Date()));
  const [startTime, setStartTime] = useState(start ? toTimeInput(start) : '');
  const [endTime, setEndTime] = useState(task?.endAt ? toTimeInput(new Date(task.endAt)) : '');
  const [priority, setPriority] = useState(task?.priority ?? null);
  const [description, setDescription] = useState(task?.description ?? '');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [openTime, setOpenTime] = useState(null); // 'start' | 'end' | null

  const validate = () => {
    const e = {};
    if (!title.trim()) e.title = 'Task title is required';
    if (!date) e.date = 'Date is required';
    if (!startTime) e.startTime = 'Start time is required';
    if (date && startTime && endTime && combine(date, endTime) < combine(date, startTime)) {
      e.endTime = 'End time must be after the start time';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    setServerError(null);
    if (!validate()) return;
    const payload = {
      title: title.trim(),
      description: description.trim(),
      startAt: combine(date, startTime).toISOString(),
      endAt: endTime ? combine(date, endTime).toISOString() : null,
      priority,
    };
    setSaving(true);
    try {
      if (editing) {
        await updateTask(task._id, payload);
        toast.show('Task updated');
      } else {
        await createTask(payload);
        toast.show('Task created');
      }
      onClose();
    } catch (err) {
      setServerError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const err = (key) =>
    errors[key] && (
      <p id={`${key}-error`} className="mt-1 text-xs text-danger">
        {errors[key]}
      </p>
    );

  return (
    <Sheet title={editing ? 'Edit Task' : 'Add New Task'} onClose={onClose}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-6">
        <div>
          <label htmlFor="task-title" className={label}>
            Task title <span className="text-danger">*</span>
          </label>
          <input
            id="task-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Doing Homework"
            maxLength={200}
            autoFocus={!editing}
            aria-invalid={Boolean(errors.title) || undefined}
            aria-describedby={errors.title ? 'title-error' : undefined}
            className={`${fieldBox} placeholder:text-faint focus:border-primary focus:outline-none ${errors.title ? 'border-danger' : ''}`}
          />
          {err('title')}
        </div>

        <div>
          <span className={label}>
            Set Time <span className="text-danger">*</span>
          </span>
          <div className="grid grid-cols-2 gap-[30px]">
            <div>
              <TimeField
                id="task-start"
                display={fmtTime(startTime)}
                placeholder="Start"
                open={openTime === 'start'}
                onToggle={() => setOpenTime((o) => (o === 'start' ? null : 'start'))}
                invalid={Boolean(errors.startTime)}
                aria-label="Start time"
              />
              {err('startTime')}
            </div>
            <div>
              <TimeField
                id="task-end"
                display={fmtTime(endTime)}
                placeholder="Ends"
                open={openTime === 'end'}
                onToggle={() => setOpenTime((o) => (o === 'end' ? null : 'end'))}
                invalid={Boolean(errors.endTime)}
                aria-label="End time (optional)"
              />
              {err('endTime')}
            </div>
          </div>
          {openTime === 'start' && (
            <TimePicker
              key="start"
              label="Choose start time"
              value={startTime}
              fallback={nextFiveMinutes()}
              onChange={setStartTime}
              onDone={() => setOpenTime(null)}
            />
          )}
          {openTime === 'end' && (
            <TimePicker
              key="end"
              label="Choose end time"
              value={endTime}
              fallback={startTime ? addHour(startTime) : nextFiveMinutes()}
              onChange={setEndTime}
              onDone={() => setOpenTime(null)}
              onClear={() => {
                setEndTime('');
                setOpenTime(null);
              }}
            />
          )}
        </div>

        <div>
          <label htmlFor="task-date" className={label}>
            Set Date <span className="text-danger">*</span>
          </label>
          <PickerField
            id="task-date"
            type="date"
            value={date}
            onChange={setDate}
            display={date ? format(combine(date, '00:00'), 'EEEE d, MMMM') : null}
            placeholder="Pick a date"
            iconRight={icons.calendarSmall}
            invalid={Boolean(errors.date)}
            required
          />
          {err('date')}
        </div>

        <fieldset>
          <legend className={label}>Priority</legend>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Priority">
            {['low', 'medium', 'high'].map((p) => {
              const active = priority === p;
              return (
                <button
                  key={p}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setPriority(active ? null : p)}
                  className={`h-10 border text-sm transition-colors ${
                    active ? 'border-primary bg-primary text-white' : 'border-line bg-white text-ink'
                  }`}
                >
                  {PRIORITY_LABEL[p]}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div>
          <label htmlFor="task-desc" className={label}>
            Description
          </label>
          <textarea
            id="task-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add Description"
            rows={4}
            maxLength={2000}
            className="block h-[100px] w-full resize-none border border-line bg-white px-2.5 py-2.5 text-sm leading-5 text-ink placeholder:text-ink focus:border-primary focus:outline-none"
          />
        </div>

        {serverError && (
          <p role="alert" className="bg-pending px-3 py-2 text-sm text-[#b3282d]">
            {serverError}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="h-12 w-full bg-primary text-base font-medium text-white disabled:opacity-60"
        >
          {saving ? 'Saving…' : editing ? 'Save changes' : 'Create task'}
        </button>
      </form>
    </Sheet>
  );
}
