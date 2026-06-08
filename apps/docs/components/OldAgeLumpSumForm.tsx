'use client';
import { useState } from 'react';
import { getAvailableYears } from 'taiwan-payroll';
import { runOldAgeLumpSum, type OldAgeLumpSumForm as OForm } from '../lib/calc';
import { formatNTD } from '../lib/format';
import { Field, ErrorNote, ResultPanel, inputCls, selectCls } from './ui';

const years = getAvailableYears();

export function OldAgeLumpSumForm() {
  const [form, setForm] = useState<OForm>({
    year: Math.max(...years),
    avgInsuredSalary: '30000',
    years: '10',
    months: '0',
    postSixtyMonths: '0',
  });
  const set = <K extends keyof OForm>(k: K, v: OForm[K]) => setForm((f) => ({ ...f, [k]: v }));
  const out = form.avgInsuredSalary.trim() === '' || form.years.trim() === '' ? null : runOldAgeLumpSum(form);
  // 逾 60 歲後年資不得超過總月數（core 會丟錯）；以總月數為上限做 HTML 驗證。
  const totalMonths = (Number(form.years) || 0) * 12 + (Number(form.months) || 0);

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
        <Field label="逾 60 歲後年資（月）">
          <input className={inputCls} type="number" min={0} max={totalMonths} value={form.postSixtyMonths} onChange={(e) => set('postSixtyMonths', e.target.value)} />
        </Field>
      </div>

      {out && out.ok && (
        <ResultPanel>
          <dl className="grid gap-px overflow-hidden rounded border border-rule bg-rule sm:grid-cols-2">
            {[
              { dt: '一次金給付', dd: `${formatNTD(out.result.payment)} 元`, accent: true },
              { dt: '計入月數', dd: `${out.result.insuredMonthsCounted}` },
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
