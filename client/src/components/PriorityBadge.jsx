const STYLES = {
  high: 'bg-pending text-[#b3282d]',
  medium: 'bg-[#fff4dc] text-[#8a5a00]',
  low: 'bg-complete text-primary',
};

export const PRIORITY_LABEL = { low: 'Low', medium: 'Medium', high: 'High' };

export default function PriorityBadge({ priority }) {
  if (!priority) return null;
  return (
    <span className={`px-1.5 py-px text-[10px] font-medium ${STYLES[priority]}`}>
      {PRIORITY_LABEL[priority]}
    </span>
  );
}
