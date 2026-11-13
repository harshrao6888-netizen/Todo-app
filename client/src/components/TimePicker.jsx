import { useEffect, useRef } from 'react';

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
const pad = (n) => String(n).padStart(2, '0');

/** "HH:mm" (24h) -> { h12, m, pm } */
function parse(value) {
  const [h, m] = value.split(':').map(Number);
  return { h12: h % 12 || 12, m, pm: h >= 12 };
}
const build = (h12, m, pm) => `${pad((h12 % 12) + (pm ? 12 : 0))}:${pad(m)}`;

function Column({ label, items, selected, render, onPick }) {
  const list = useRef(null);
  // Bring the selected item into view when the picker opens.
  useEffect(() => {
    // Scroll only this column (scrollIntoView would also move the sheet).
    const el = list.current;
    const item = el?.querySelector('[aria-pressed="true"]');
    if (el && item) el.scrollTop = item.offsetTop - el.clientHeight / 2 + item.offsetHeight / 2;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div role="group" aria-label={label} ref={list} className="relative h-40 flex-1 overflow-y-auto overscroll-contain py-1">
      {items.map((it) => {
        const active = it === selected;
        return (
          <button
            key={String(it)}
            type="button"
            aria-pressed={active}
            onClick={() => onPick(it)}
            className={`block h-9 w-full rounded text-sm ${active ? 'bg-primary font-medium text-white' : 'text-ink hover:bg-complete'}`}
          >
            {render(it)}
          </button>
        );
      })}
    </div>
  );
}

/**
 * In-app time picker rendered inline inside the sheet. The native
 * <input type="time"> popup is positioned by the browser and spills
 * outside the phone-width column on desktop, so we draw our own.
 */
export default function TimePicker({ value, fallback, onChange, onDone, onClear, label }) {
  const { h12, m, pm } = parse(value || fallback);

  // Commit the fallback straight away so opening the picker selects a time.
  useEffect(() => {
    if (!value) onChange(fallback);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mt-3 border border-line bg-white p-2" role="group" aria-label={label}>
      <div className="flex gap-2">
        <Column label="Hour" items={HOURS} selected={h12} render={(h) => h} onPick={(h) => onChange(build(h, m, pm))} />
        <Column label="Minute" items={MINUTES} selected={m} render={pad} onPick={(x) => onChange(build(h12, x, pm))} />
        <Column
          label="AM or PM"
          items={[false, true]}
          selected={pm}
          render={(p) => (p ? 'PM' : 'AM')}
          onPick={(p) => onChange(build(h12, m, p))}
        />
      </div>
      <div className="mt-2 flex justify-end gap-2 border-t border-line pt-2">
        {onClear && (
          <button type="button" onClick={onClear} className="px-3 py-1.5 text-sm text-muted">
            Clear
          </button>
        )}
        <button type="button" onClick={onDone} className="bg-primary px-4 py-1.5 text-sm font-medium text-white">
          Done
        </button>
      </div>
    </div>
  );
}
