'use client';
import { useState } from 'react';
import { getAvailableYears } from 'taiwan-payroll';
import { runCalculate, toRows, type PayrollForm as PForm } from '../lib/calc';
import { ResultTable } from './ResultTable';
import { Field, ErrorNote, ResultPanel, inputCls, selectCls } from './ui';

const years = getAvailableYears();

export function PayrollForm() {
  const [form, setForm] = useState<PForm>({
    year: Math.max(...years),
    monthlySalary: '42000',
    identity: 'category1',
    partTime: false,
    dependents: '0',
    employmentInsurance: true,
    pensionSelfContribution: '0',
    rounding: 'round',
  });
  const set = <K extends keyof PForm>(k: K, v: PForm[K]) => setForm((f) => ({ ...f, [k]: v }));
  const out = form.monthlySalary.trim() === '' ? null : runCalculate(form);

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
        <Field label="月薪（經常性薪資）">
          <input className={inputCls} type="number" value={form.monthlySalary} onChange={(e) => set('monthlySalary', e.target.value)} />
        </Field>
        <Field label="身份別">
          <select className={selectCls} value={form.identity} onChange={(e) => set('identity', e.target.value as PForm['identity'])}>
            <option value="category1">本國勞工／外籍配偶</option>
            <option value="migrantGeneral">一般移工</option>
            <option value="migrantDomestic">家事移工</option>
          </select>
        </Field>
        <Field label="健保眷屬數">
          <input className={inputCls} type="number" min={0} value={form.dependents} onChange={(e) => set('dependents', e.target.value)} />
        </Field>
        <Field label="勞工自提">
          <select className={selectCls} value={form.pensionSelfContribution} onChange={(e) => set('pensionSelfContribution', e.target.value)}>
            {['0', '0.01', '0.02', '0.03', '0.04', '0.05', '0.06'].map((r) => (
              <option key={r} value={r}>
                {Number(r) * 100}%
              </option>
            ))}
          </select>
        </Field>
        <Field label="進位策略">
          <select className={selectCls} value={form.rounding} onChange={(e) => set('rounding', e.target.value as PForm['rounding'])}>
            <option value="round">四捨五入</option>
            <option value="ceil">無條件進位</option>
            <option value="aggregate-then-round">合計後分配</option>
          </select>
        </Field>
        <label className="flex items-center gap-2.5 self-end pb-2.5 text-sm text-ink-soft">
          <input
            type="checkbox"
            className="h-4 w-4 accent-cinnabar"
            checked={form.employmentInsurance}
            onChange={(e) => set('employmentInsurance', e.target.checked)}
          />
          參加就業保險
        </label>
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

      {out === null && <ResultPanel><p className="text-sm text-ink-faint">請輸入月薪。</p></ResultPanel>}
      {out && out.ok && (
        <ResultPanel>
          <ResultTable rows={toRows(out.result)} />
        </ResultPanel>
      )}
      {out && !out.ok && <ErrorNote>{out.error}</ErrorNote>}
    </div>
  );
}
