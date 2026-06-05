import { formatNTD } from '../lib/format';
import type { Row } from '../lib/calc';

const cell = (v: number | undefined) =>
  v === undefined ? <span className="text-ink-faint">—</span> : <span className="figures">{formatNTD(v)}</span>;

export function ResultTable({ rows }: { rows: Row[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-rule-strong text-left">
            <th className="py-2.5 pr-4 font-mono text-xs font-medium uppercase tracking-wider text-ink-faint">項目</th>
            <th className="py-2.5 px-4 text-right font-mono text-xs font-medium uppercase tracking-wider text-ink-faint">員工</th>
            <th className="py-2.5 px-4 text-right font-mono text-xs font-medium uppercase tracking-wider text-ink-faint">雇主</th>
            <th className="py-2.5 pl-4 text-right font-mono text-xs font-medium uppercase tracking-wider text-ink-faint">政府</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const isTotal = i === rows.length - 1;
            return (
              <tr
                key={r.label}
                className={
                  isTotal
                    ? 'border-t-2 border-rule-strong font-semibold text-ink'
                    : 'border-b border-rule/70 text-ink-soft'
                }
              >
                <td className={`py-2.5 pr-4 ${isTotal ? 'text-cinnabar-deep' : 'text-ink'}`}>{r.label}</td>
                <td className="py-2.5 px-4 text-right tabular-nums">{cell(r.employee)}</td>
                <td className="py-2.5 px-4 text-right tabular-nums">{cell(r.employer)}</td>
                <td className="py-2.5 pl-4 text-right tabular-nums">{cell(r.government)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
