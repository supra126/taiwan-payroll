'use client';
import { useState } from 'react';
import { PayrollForm } from './PayrollForm';
import { SupplementaryForm } from './SupplementaryForm';
import { ProratedForm } from './ProratedForm';

const TABS = [
  { id: 'payroll', label: '月薪計算' },
  { id: 'supplementary', label: '二代健保補充保費' },
  { id: 'prorated', label: '破月計算' },
] as const;

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
      </div>
    </div>
  );
}
