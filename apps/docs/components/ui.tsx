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

/** 醒目的重點數字摘要（結果表上方），第一眼即抓到關鍵金額。 */
export function ResultSummary({ items }: { items: { label: string; value: string; accent?: boolean }[] }) {
  return (
    <div className="mb-6 flex flex-wrap gap-x-10 gap-y-4">
      {items.map((it) => (
        <div key={it.label}>
          <div className="font-mono text-xs uppercase tracking-wider text-ink-faint">{it.label}</div>
          <div className={`mt-1 font-serif text-2xl font-bold figures ${it.accent ? 'text-cinnabar-deep' : 'text-ink'}`}>
            {it.value}
            <span className="ml-1 text-sm font-normal text-ink-faint">元</span>
          </div>
        </div>
      ))}
    </div>
  );
}
