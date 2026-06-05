'use client';
import { useState } from 'react';
import { getAvailableYears } from 'taiwan-payroll';
import { runSupplementary, type SupplementaryForm as SForm } from '../lib/calc';
import { formatNTD, formatRate } from '../lib/format';
import { Field, ErrorNote, ResultPanel, inputCls, selectCls } from './ui';

const years = getAvailableYears();
const TYPES: { value: SForm['type']; label: string }[] = [
  { value: 'bonus', label: '高額獎金' },
  { value: 'parttime', label: '兼職薪資' },
  { value: 'professional', label: '執行業務' },
  { value: 'dividend', label: '股利' },
  { value: 'interest', label: '利息' },
  { value: 'rent', label: '租金' },
];

export function SupplementaryForm() {
  const [form, setForm] = useState<SForm>({
    year: Math.max(...years),
    type: 'bonus',
    amount: '200000',
    monthlyInsuredSalary: '42000',
    ytdBonus: '0',
    rounding: 'round',
  });
  const set = <K extends keyof SForm>(k: K, v: SForm[K]) => setForm((f) => ({ ...f, [k]: v }));
  const out = form.amount.trim() === '' ? null : runSupplementary(form);

  return (
    <div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="所得類別">
          <select className={selectCls} value={form.type} onChange={(e) => set('type', e.target.value as SForm['type'])}>
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="給付金額">
          <input className={inputCls} type="number" value={form.amount} onChange={(e) => set('amount', e.target.value)} />
        </Field>
        {form.type === 'bonus' && (
          <>
            <Field label="當月投保金額">
              <input className={inputCls} type="number" value={form.monthlyInsuredSalary} onChange={(e) => set('monthlyInsuredSalary', e.target.value)} />
            </Field>
            <Field label="本年度累計獎金（本次前）">
              <input className={inputCls} type="number" value={form.ytdBonus} onChange={(e) => set('ytdBonus', e.target.value)} />
            </Field>
          </>
        )}
      </div>

      {out && out.ok && (
        <ResultPanel>
          <dl className="grid gap-px overflow-hidden rounded border border-rule bg-rule sm:grid-cols-3">
            {[
              { dt: '應計金額', dd: `${formatNTD(out.result.chargeable)} 元` },
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
