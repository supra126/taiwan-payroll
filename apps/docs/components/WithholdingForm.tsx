'use client';
import { useState } from 'react';
import { getAvailableYears } from 'taiwan-payroll';
import { runWithholding, type WithholdingForm as WForm } from '../lib/calc';
import { formatNTD, formatRate } from '../lib/format';
import { Field, ErrorNote, ResultPanel, inputCls, selectCls } from './ui';

const years = getAvailableYears();
const TYPES: { value: WForm['type']; label: string }[] = [
  { value: 'resident', label: '本國（居住者）月薪' },
  { value: 'residentBonus', label: '本國（居住者）獎金' },
  { value: 'nonResident', label: '非居住者月薪' },
];

export function WithholdingForm() {
  const [form, setForm] = useState<WForm>({
    year: Math.max(...years),
    type: 'resident',
    monthlySalary: '100000',
    dependents: '2',
    amount: '200000',
  });
  const set = <K extends keyof WForm>(k: K, v: WForm[K]) => setForm((f) => ({ ...f, [k]: v }));
  const primary = form.type === 'residentBonus' ? form.amount : form.monthlySalary;
  const out = primary.trim() === '' ? null : runWithholding(form);

  return (
    <div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="年度">
          <select className={selectCls} value={form.year} onChange={(e) => set('year', Number(e.target.value))}>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </Field>
        <Field label="所得類別">
          <select className={selectCls} value={form.type} onChange={(e) => set('type', e.target.value as WForm['type'])}>
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>
        {form.type === 'residentBonus' ? (
          <Field label="獎金金額">
            <input className={inputCls} type="number" value={form.amount} onChange={(e) => set('amount', e.target.value)} />
          </Field>
        ) : (
          <Field label="月薪">
            <input className={inputCls} type="number" value={form.monthlySalary} onChange={(e) => set('monthlySalary', e.target.value)} />
          </Field>
        )}
        {form.type === 'resident' && (
          <Field label="扶養親屬人數">
            <input className={inputCls} type="number" min={0} value={form.dependents} onChange={(e) => set('dependents', e.target.value)} />
          </Field>
        )}
      </div>

      {out && out.ok && (
        <ResultPanel>
          <dl className="grid gap-px overflow-hidden rounded border border-rule bg-rule sm:grid-cols-3">
            {[
              { dt: '應扣繳稅額', dd: `${formatNTD(out.result.withholding)} 元`, accent: true },
              { dt: '適用稅率', dd: formatRate(out.result.rate) },
              ...(out.result.taxableAnnual !== undefined
                ? [{ dt: '估計全年應稅', dd: `${formatNTD(out.result.taxableAnnual)} 元` }]
                : []),
            ].map((item) => (
              <div key={item.dt} className="bg-panel px-4 py-4">
                <dt className="font-mono text-[0.7rem] uppercase tracking-wider text-ink-faint">{item.dt}</dt>
                <dd className={`mt-1 figures text-xl ${item.accent ? 'font-semibold text-cinnabar-deep' : 'text-ink'}`}>{item.dd}</dd>
              </div>
            ))}
          </dl>
        </ResultPanel>
      )}
      {out && !out.ok && <ErrorNote>{out.error}</ErrorNote>}
    </div>
  );
}
