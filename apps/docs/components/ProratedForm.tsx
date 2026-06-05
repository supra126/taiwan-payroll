'use client';
import { useState } from 'react';
import { getAvailableYears } from 'taiwan-payroll';
import { runProrated, toRows, type ProratedForm as RForm } from '../lib/calc';
import { ResultTable } from './ResultTable';
import { Field, ErrorNote, ResultPanel, inputCls, selectCls } from './ui';

const years = getAvailableYears();
const latestYear = Math.max(...years);

export function ProratedForm() {
  const [form, setForm] = useState<RForm>({
    year: latestYear,
    monthlySalary: '29500',
    identity: 'category1',
    partTime: false,
    dependents: '0',
    employmentInsurance: true,
    pensionSelfContribution: '0',
    rounding: 'round',
    startDate: `${latestYear}-03-08`,
    endDate: '',
  });
  const set = <K extends keyof RForm>(k: K, v: RForm[K]) => setForm((f) => ({ ...f, [k]: v }));
  const out = form.monthlySalary.trim() === '' ? null : runProrated(form);

  return (
    <div>
      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="年度">
          <select className={selectCls} value={form.year} onChange={(e) => set('year', Number(e.target.value))}>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </Field>
        <Field label="月薪">
          <input className={inputCls} type="number" value={form.monthlySalary} onChange={(e) => set('monthlySalary', e.target.value)} />
        </Field>
        <Field label="身份別">
          <select className={selectCls} value={form.identity} onChange={(e) => set('identity', e.target.value as RForm['identity'])}>
            <option value="category1">本國勞工／外籍配偶</option>
            <option value="migrantGeneral">一般移工</option>
            <option value="migrantDomestic">家事移工</option>
          </select>
        </Field>
        <Field label="到職日">
          <input className={inputCls} type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} />
        </Field>
        <Field label="離職日">
          <input className={inputCls} type="date" value={form.endDate} onChange={(e) => set('endDate', e.target.value)} />
        </Field>
        <label className="flex items-center gap-2.5 self-end pb-2.5 text-sm text-ink-soft">
          <input
            type="checkbox"
            className="h-4 w-4 accent-cinnabar"
            checked={form.partTime}
            onChange={(e) => set('partTime', e.target.checked)}
          />
          部分工時
        </label>
      </div>
      <p className="mt-3 font-mono text-xs text-ink-faint">到職日或離職日擇一或皆填，且須為同一個月。</p>

      {out && out.ok && (
        <ResultPanel>
          <p className="mb-5 inline-flex items-center gap-2 rounded border border-rule bg-paper-2 px-3 py-2 text-sm text-ink">
            <span className="figures font-semibold text-cinnabar-deep">{out.result.days.insured}</span>
            <span className="text-ink-soft">日投保 ・ 健保當月{out.result.healthCharged ? '計收整月' : '不計收'}</span>
          </p>
          <ResultTable rows={toRows(out.result)} />
        </ResultPanel>
      )}
      {out && !out.ok && <ErrorNote>{out.error}</ErrorNote>}
    </div>
  );
}
