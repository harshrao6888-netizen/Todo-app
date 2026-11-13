export default function ProgressBar({ value, height = 24, label = 'Weekly progress' }) {
  const pct = Math.round(value * 100);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      className="w-full bg-primary-soft"
      style={{ height }}
    >
      <div className="h-full bg-primary-dark transition-[width] duration-300" style={{ width: `${pct}%` }} />
    </div>
  );
}
