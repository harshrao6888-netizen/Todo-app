import { Icon } from '../components/Icon.jsx';
import { icons } from '../components/icons.js';

function Zigzag({ className }) {
  return (
    <div className={`absolute flex h-[189.2px] w-[190.4px] items-center justify-center ${className}`}>
      <Icon src={icons.zigzag} size={117.5} className="rotate-[46.43deg]" />
    </div>
  );
}

/** Figma "Onboarding" frame. Shown on first visit only. */
export default function Onboarding({ onDone }) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-primary">
      <div className="relative flex-1 overflow-hidden" aria-hidden>
        <Icon src={icons.onboardingRing} size={88} className="absolute -top-[46px] right-[-18px]" />
        {/* Same geometry as the Figma frame: a 190×189 box with the pattern rotated 46.43° inside. */}
        <Zigzag className="top-[54px] left-[-44px]" />
        <Zigzag className="top-[382px] right-[-40.4px]" />
      </div>
      <div className="flex min-h-[292px] flex-col bg-white px-6 pt-6 pb-[max(2rem,env(safe-area-inset-bottom))]">
        <h1 className="text-2xl font-semibold text-black">Manage What To Do</h1>
        <p className="mt-4 max-w-[307px] text-xs text-muted">
          The best way to manage what you have to do, don&apos;t forget your plans
        </p>
        <button
          type="button"
          onClick={onDone}
          className="mt-auto h-12 w-full bg-primary text-base font-medium text-white"
        >
          Get Started
        </button>
      </div>
    </div>
  );
}
