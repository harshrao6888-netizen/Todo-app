import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import TaskFormSheet from '../components/TaskFormSheet.jsx';
import TaskDetailSheet from '../components/TaskDetailSheet.jsx';
import { useTasks } from './TasksContext.jsx';

const UIContext = createContext(null);

/** Owns the global Add / Edit / View task sheets so any screen can open them. */
export function UIProvider({ children }) {
  const { tasks } = useTasks();
  const [sheet, setSheet] = useState(null); // { mode: 'create'|'edit'|'view', taskId?, date? }

  const openCreate = useCallback((date) => setSheet({ mode: 'create', date }), []);
  const openEdit = useCallback((task) => setSheet({ mode: 'edit', taskId: task._id }), []);
  const openView = useCallback((task) => setSheet({ mode: 'view', taskId: task._id }), []);
  const close = useCallback(() => setSheet(null), []);

  // Always render the latest copy of the task (e.g. after a status toggle).
  const task = sheet?.taskId ? tasks.find((t) => t._id === sheet.taskId) : null;

  const value = useMemo(
    () => ({ openCreate, openEdit, openView, close }),
    [openCreate, openEdit, openView, close]
  );

  return (
    <UIContext.Provider value={value}>
      {children}
      {sheet?.mode === 'create' && <TaskFormSheet initialDate={sheet.date} onClose={close} />}
      {sheet?.mode === 'edit' && task && <TaskFormSheet task={task} onClose={close} />}
      {sheet?.mode === 'view' && task && (
        <TaskDetailSheet task={task} onClose={close} onEdit={() => openEdit(task)} />
      )}
    </UIContext.Provider>
  );
}

export const useUI = () => useContext(UIContext);
