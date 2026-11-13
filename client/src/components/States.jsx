export function EmptyState({ title, children }) {
  return (
    <div className="border border-dashed border-line px-4 py-8 text-center">
      <p className="text-sm font-medium text-ink">{title}</p>
      {children && <p className="mt-1 text-xs text-subtle">{children}</p>}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div role="alert" className="bg-pending px-4 py-4 text-sm text-[#b3282d]">
      <p>{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="mt-2 font-semibold underline">
          Try again
        </button>
      )}
    </div>
  );
}

export function LoadingRows({ count = 3 }) {
  return (
    <ul aria-busy="true" aria-label="Loading" className="flex flex-col gap-5">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="flex animate-pulse gap-3">
          <span className="size-5 bg-line" />
          <span className="h-4 flex-1 bg-line" />
        </li>
      ))}
    </ul>
  );
}
