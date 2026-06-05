import type { ReactNode } from 'react';

const base =
  'w-full rounded border border-rule bg-panel px-3 py-2 text-ink outline-none transition focus:border-cinnabar focus:ring-2 focus:ring-cinnabar/25';

/** Inputs that hold figures (numbers, dates) — tabular mono. */
export const inputCls = `${base} figures`;
/** Selects that hold text labels — sans. */
export const selectCls = `${base} font-sans`;

/** Labelled field: a small mono caption above the control, wrapping it for a11y association. */
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-[0.7rem] uppercase tracking-wider text-ink-faint">{label}</span>
      {children}
    </label>
  );
}

/** Friendly error notice (preserves role="alert"). */
export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="mt-5 rounded border border-cinnabar/40 bg-cinnabar/5 px-4 py-3 text-sm text-cinnabar-deep">
      {children}
    </p>
  );
}

/** Section wrapper for the result panel. */
export function ResultPanel({ children }: { children: ReactNode }) {
  return <div className="mt-7 border-t border-rule pt-6">{children}</div>;
}
