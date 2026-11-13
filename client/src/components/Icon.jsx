/**
 * Renders a Figma SVG asset at its native colours.
 * `size` sets the width only; height follows the asset's own aspect ratio
 * (the exported SVGs use preserveAspectRatio="none", so forcing a square would distort them).
 */
export function Icon({ src, size = 24, className = '', alt = '' }) {
  return (
    <img
      src={src}
      alt={alt}
      aria-hidden={alt ? undefined : true}
      draggable={false}
      className={`inline-block shrink-0 select-none ${className}`}
      style={{ width: size, height: 'auto' }}
    />
  );
}


/** Chevron in the Figma icon style (1.5px round stroke). The design has no chevron asset. */
export function Chevron({ direction = 'down', size = 16, className = 'text-faint' }) {
  const rotate = { down: 0, up: 180, left: 90, right: -90 }[direction];
  return (
    <svg
      aria-hidden
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 transition-transform ${className}`}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
