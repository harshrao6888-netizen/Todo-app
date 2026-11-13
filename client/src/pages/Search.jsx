import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/tasks.js';
import { useTasks } from '../context/TasksContext.jsx';
import { BackHeader } from '../components/TopBar.jsx';
import TaskRow from '../components/TaskRow.jsx';
import { Icon } from '../components/Icon.jsx';
import { icons } from '../components/icons.js';
import { EmptyState, ErrorState, LoadingRows } from '../components/States.jsx';

/** Figma search frame: keyword search on title & description via the API. */
export default function Search() {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') ?? '');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { tasks, version } = useTasks();
  const input = useRef(null);

  useEffect(() => {
    input.current?.focus();
  }, []);

  useEffect(() => {
    const q = query.trim();
    setParams(q ? { q } : {}, { replace: true });
    if (!q) {
      setResults(null);
      setError(null);
      return;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        setResults(await api.search(q, ctrl.signal));
      } catch (err) {
        if (err.name !== 'AbortError') setError(err.message);
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
    // `version` re-runs the search after any edit/delete/status change.
  }, [query, version, setParams]);

  // Prefer the live copy from the store so status toggles reflect immediately.
  const live = results?.map((r) => tasks.find((t) => t._id === r._id) ?? r);

  return (
    <div className="flex flex-col gap-6">
      <BackHeader />
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          input.current?.blur();
        }}
        className="flex h-[47px] items-center rounded border border-line-strong bg-white pr-[14px] pl-5"
      >
        <label htmlFor="search-input" className="sr-only">
          Search tasks
        </label>
        <input
          ref={input}
          id="search-input"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a task"
          enterKeyHint="search"
          autoComplete="off"
          className="h-full flex-1 bg-transparent text-xs font-light text-ink placeholder:text-black/60 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        <button type="submit" aria-label="Search" className="flex size-6 items-center justify-center">
          <Icon src={icons.search} size={17.5} />
        </button>
      </form>

      <div aria-live="polite">
        {error ? (
          <ErrorState message={error} />
        ) : loading && !results ? (
          <LoadingRows />
        ) : results === null ? (
          <p className="text-center text-xs text-subtle">Search by keywords in a task&apos;s title or description.</p>
        ) : live.length === 0 ? (
          <EmptyState title={`No tasks match "${query.trim()}"`}>Try a different keyword.</EmptyState>
        ) : (
          <>
            <p className="mb-4 text-xs text-subtle">
              {live.length} result{live.length === 1 ? '' : 's'}
            </p>
            <ul className="flex flex-col gap-4">
              {live.map((t) => (
                <TaskRow key={t._id} task={t} showDate />
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
