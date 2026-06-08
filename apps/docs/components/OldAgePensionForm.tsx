'use client';
import { useState } from 'react';
import { getAvailableYears } from 'taiwan-payroll';
import { runOldAgePension, type OldAgePensionForm as OForm } from '../lib/calc';
import { formatNTD } from '../lib/format';
import { Field, ErrorNote, ResultPanel, inputCls, selectCls } from './ui';

const years = getAvailableYears();

export function OldAgePensionForm() {
  const [form, setForm] = useState<OForm>({
    year: Math.max(...years),
    avgInsuredSalary: '32000',
    years: '35',
    months: '6',
    claimOffsetMonths: '0',
  });
  const set = <K extends keyof OForm>(k: K, v: OForm[K]) => setForm((f) => ({ ...f, [k]: v }));
  const out = form.avgInsuredSalary.trim() === '' || form.years.trim() === '' ? null : runOldAgePension(form);

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
        <Field label="平均月投保薪資">
          <input className={inputCls} type="number" value={form.avgInsuredSalary} onChange={(e) => set('avgInsuredSalary', e.target.value)} />
        </Field>
        <Field label="年資（年）">
          <input className={inputCls} type="number" min={0} value={form.years} onChange={(e) => set('years', e.target.value)} />
        </Field>
        <Field label="年資（月）">
          <input className={inputCls} type="number" min={0} max={11} value={form.months} onChange={(e) => set('months', e.target.value)} />
        </Field>
        <Field label="提前(−)／延後(+)月數">
          <input className={inputCls} type="number" value={form.claimOffsetMonths} onChange={(e) => set('claimOffsetMonths', e.target.value)} />
        </Field>
      </div>

      {out && out.ok && (
        <ResultPanel>
          <dl className="grid gap-px overflow-hidden rounded border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-4">
            {[
              { dt: '式一', dd: `${formatNTD(out.result.formulaA)} 元` },
              { dt: '式二', dd: `${formatNTD(out.result.formulaB)} 元` },
              { dt: '月領', dd: `${formatNTD(out.result.monthly)} 元`, accent: true },
              { dt: '調整月數', dd: `${out.result.adjustmentMonths}` },
            ].map((item) => (
              <div key={item.dt} className="bg-panel px-4 py-4">
                <dt className="font-mono text-[0.7rem] uppercase tracking-wider text-ink-faint">{item.dt}</dt>
                <dd className={`mt-1 figures text-xl ${item.accent ? 'font-semibold text-cinnabar-deep' : 'text-ink'}`}>{item.dd}</dd>
              </div>
            ))}
          </dl>
          {!out.result.eligible && (
            <p className="mt-4 text-sm text-ink-faint">年資未滿 15 年，未達年金請領資格（數值僅供參考）。</p>
          )}
        </ResultPanel>
      )}
      {out && !out.ok && <ErrorNote>{out.error}</ErrorNote>}
    </div>
  );
}
