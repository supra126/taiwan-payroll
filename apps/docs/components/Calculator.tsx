'use client';
import { useState } from 'react';
import { PayrollForm } from './PayrollForm';
import { SupplementaryForm } from './SupplementaryForm';
import { ProratedForm } from './ProratedForm';
import { WithholdingForm } from './WithholdingForm';
import { EmployerSupplementaryForm } from './EmployerSupplementaryForm';
import { OldAgePensionForm } from './OldAgePensionForm';
import { OldAgeLumpSumForm } from './OldAgeLumpSumForm';
import { OldAgeSinglePaymentForm } from './OldAgeSinglePaymentForm';

const TABS = [
  { id: 'payroll', label: '月薪計算' },
  { id: 'supplementary', label: '二代健保補充保費' },
  { id: 'prorated', label: '破月計算' },
  { id: 'withholding', label: '薪資扣繳' },
  { id: 'employerSupplementary', label: '雇主補充保費' },
  { id: 'oldAge', label: '勞保老年給付' },
] as const;

const OLD_AGE = [
  { id: 'oldAgePension', label: '年金月領' },
  { id: 'oldAgeLumpSum', label: '老年一次金' },
  { id: 'oldAgeSinglePayment', label: '一次請領' },
] as const;

/** 老年給付三式合一：以 segmented 子切換區隔（不再各佔一個頂層分頁）。 */
function OldAgeGroup() {
  const [sub, setSub] = useState<(typeof OLD_AGE)[number]['id']>('oldAgePension');
  return (
    <div>
      <div role="tablist" aria-label="老年給付種類" className="mb-6 inline-flex rounded-md border border-rule bg-paper-2 p-1">
        {OLD_AGE.map((s) => {
          const active = sub === s.id;
          return (
            <button
              key={s.id}
              role="tab"
              aria-selected={active}
              onClick={() => setSub(s.id)}
              className={`rounded px-3.5 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cinnabar ${
                active ? 'bg-panel text-cinnabar-deep shadow-sm' : 'text-ink-soft hover:text-ink'
              }`}
            >
              {s.label}
            </button>
          );
        })}
      </div>
      {sub === 'oldAgePension' && <OldAgePensionForm />}
      {sub === 'oldAgeLumpSum' && <OldAgeLumpSumForm />}
      {sub === 'oldAgeSinglePayment' && <OldAgeSinglePaymentForm />}
    </div>
  );
}

export function Calculator() {
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('payroll');
  return (
    <div className="overflow-hidden rounded-md border border-rule-strong bg-panel shadow-[0_1px_0_rgba(0,0,0,0.04),0_12px_30px_-18px_rgba(0,0,0,0.25)]">
      <div role="tablist" aria-label="計算項目" className="flex flex-wrap border-b border-rule bg-paper-2">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              id={`tab-${t.id}`}
              role="tab"
              aria-selected={active}
              // only the active panel is rendered; point aria-controls at it only when it exists
              aria-controls={active ? `panel-${t.id}` : undefined}
              onClick={() => setTab(t.id)}
              className={`relative px-5 py-3.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cinnabar focus-visible:ring-inset ${
                active ? 'text-cinnabar-deep' : 'text-ink-soft hover:text-ink'
              }`}
            >
              {t.label}
              {active && <span aria-hidden className="absolute inset-x-3 -bottom-px h-0.5 bg-cinnabar" />}
            </button>
          );
        })}
      </div>
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="p-6 md:p-8">
        {tab === 'payroll' && <PayrollForm />}
        {tab === 'supplementary' && <SupplementaryForm />}
        {tab === 'prorated' && <ProratedForm />}
        {tab === 'withholding' && <WithholdingForm />}
        {tab === 'employerSupplementary' && <EmployerSupplementaryForm />}
        {tab === 'oldAge' && <OldAgeGroup />}
      </div>
    </div>
  );
}
