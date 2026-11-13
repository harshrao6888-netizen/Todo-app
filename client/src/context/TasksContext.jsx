import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api/tasks.js';
import { useToast } from './ToastContext.jsx';

const TasksContext = createContext(null);

const replace = (list, task) => list.map((t) => (t._id === task._id ? task : t));

export function TasksProvider({ children }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Bumped after every mutation so views that hold their own copies (search results) can refresh.
  const [version, setVersion] = useState(0);
  const toast = useToast();

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setTasks(await api.list());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const bump = () => setVersion((v) => v + 1);

  const createTask = useCallback(async (data) => {
    const task = await api.create(data);
    setTasks((list) => [...list, task]);
    bump();
    return task;
  }, []);

  const updateTask = useCallback(async (id, patch) => {
    const task = await api.update(id, patch);
    setTasks((list) => replace(list, task));
    bump();
    return task;
  }, []);

  // Optimistic status toggle so the week's counts update instantly (requirement 3.3).
  const toggleStatus = useCallback(
    async (task) => {
      const status = task.status === 'completed' ? 'in_progress' : 'completed';
      setTasks((list) => replace(list, { ...task, status }));
      try {
        const saved = await api.update(task._id, { status });
        setTasks((list) => replace(list, saved));
        bump();
      } catch (err) {
        setTasks((list) => replace(list, task));
        toast.show(err.message, { tone: 'error' });
      }
    },
    [toast]
  );

  const deleteTask = useCallback(
    async (task) => {
      setTasks((list) => list.filter((t) => t._id !== task._id));
      try {
        await api.remove(task._id);
        bump();
        toast.show(`Deleted "${task.title}"`, {
          action: {
            label: 'Undo',
            onClick: async () => {
              const { _id, createdAt, updatedAt, __v, ...rest } = task;
              try {
                const restored = await api.create(rest);
                setTasks((list) => [...list, restored]);
                bump();
              } catch (err) {
                toast.show(err.message, { tone: 'error' });
              }
            },
          },
        });
      } catch (err) {
        setTasks((list) => (list.some((t) => t._id === task._id) ? list : [...list, task]));
        toast.show(err.message, { tone: 'error' });
      }
    },
    [toast]
  );

  const value = useMemo(
    () => ({ tasks, loading, error, version, reload, createTask, updateTask, toggleStatus, deleteTask }),
    [tasks, loading, error, version, reload, createTask, updateTask, toggleStatus, deleteTask]
  );

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
}

export const useTasks = () => useContext(TasksContext);
