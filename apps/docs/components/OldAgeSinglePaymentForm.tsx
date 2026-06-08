'use client';
import { useState } from 'react';
import { getAvailableYears } from 'taiwan-payroll';
import { runOldAgeSinglePayment, type OldAgeSinglePaymentForm as OForm } from '../lib/calc';
import { formatNTD } from '../lib/format';
import { Field, ErrorNote, ResultPanel, inputCls, selectCls } from './ui';

const years = getAvailableYears();

export function OldAgeSinglePaymentForm() {
  const [form, setForm] = useState<OForm>({
    year: Math.max(...years),
    avgInsuredSalary: '30000',
    preSixtyYears: '20',
    preSixtyMonths: '0',
    postSixtyYears: '0',
    postSixtyMonths: '0',
  });
  const set = <K extends keyof OForm>(k: K, v: OForm[K]) => setForm((f) => ({ ...f, [k]: v }));
  const out = form.avgInsuredSalary.trim() === '' || form.preSixtyYears.trim() === '' ? null : runOldAgeSinglePayment(form);

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
        <Field label="60 歲前年資（年）">
          <input className={inputCls} type="number" min={0} value={form.preSixtyYears} onChange={(e) => set('preSixtyYears', e.target.value)} />
        </Field>
        <Field label="60 歲前年資（月）">
          <input className={inputCls} type="number" min={0} max={11} value={form.preSixtyMonths} onChange={(e) => set('preSixtyMonths', e.target.value)} />
        </Field>
        <Field label="60 歲後年資（年）">
          <input className={inputCls} type="number" min={0} value={form.postSixtyYears} onChange={(e) => set('postSixtyYears', e.target.value)} />
        </Field>
        <Field label="60 歲後年資（月）">
          <input className={inputCls} type="number" min={0} max={11} value={form.postSixtyMonths} onChange={(e) => set('postSixtyMonths', e.target.value)} />
        </Field>
      </div>

      {out && out.ok && (
        <ResultPanel>
          <dl className="grid gap-px overflow-hidden rounded border border-rule bg-rule sm:grid-cols-2">
            {[
              { dt: '一次請領給付', dd: `${formatNTD(out.result.payment)} 元`, accent: true },
              { dt: '基數', dd: `${out.result.basisTwelfths / 12}` },
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
