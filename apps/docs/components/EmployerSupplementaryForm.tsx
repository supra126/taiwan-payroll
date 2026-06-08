'use client';
import { useState } from 'react';
import { getAvailableYears } from 'taiwan-payroll';
import { runEmployerSupplementary, type EmployerSupplementaryForm as EForm } from '../lib/calc';
import { formatNTD, formatRate } from '../lib/format';
import { Field, ErrorNote, ResultPanel, inputCls, selectCls } from './ui';

const years = getAvailableYears();

export function EmployerSupplementaryForm() {
  const [form, setForm] = useState<EForm>({
    year: Math.max(...years),
    monthlyPaidTotal: '5000000',
    monthlyInsuredTotal: '4200000',
    rounding: 'round',
  });
  const set = <K extends keyof EForm>(k: K, v: EForm[K]) => setForm((f) => ({ ...f, [k]: v }));
  const out =
    form.monthlyPaidTotal.trim() === '' || form.monthlyInsuredTotal.trim() === ''
      ? null
      : runEmployerSupplementary(form);

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
        <Field label="每月支付薪資所得總額">
          <input className={inputCls} type="number" value={form.monthlyPaidTotal} onChange={(e) => set('monthlyPaidTotal', e.target.value)} />
        </Field>
        <Field label="受僱者當月投保金額總額">
          <input className={inputCls} type="number" value={form.monthlyInsuredTotal} onChange={(e) => set('monthlyInsuredTotal', e.target.value)} />
        </Field>
      </div>

      {out && out.ok && (
        <ResultPanel>
          <dl className="grid gap-px overflow-hidden rounded border border-rule bg-rule sm:grid-cols-3">
            {[
              { dt: '計費基礎', dd: `${formatNTD(out.result.base)} 元` },
              { dt: '費率', dd: formatRate(out.result.rate) },
              { dt: '補充保費', dd: `${formatNTD(out.result.premium)} 元`, accent: true },
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
