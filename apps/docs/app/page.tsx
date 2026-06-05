import Link from 'next/link';
import { Calculator } from '../components/Calculator';

export default function Home() {
  return (
    <>
      <section className="mb-12">
        <p className="mb-4 font-mono text-xs uppercase tracking-[0.25em] text-cinnabar-deep">
          勞動部勞保局 ・ 衛福部健保署 ・ 113–115 年度
        </p>
        <h1 className="max-w-3xl text-4xl font-bold leading-tight text-ink md:text-5xl">
          台灣勞健保勞退試算
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-soft">
          輸入薪資與身份，立即算出勞保（含就保）、健保、勞退、職災與二代健保補充保費的各方負擔。涵蓋民國
          113–115（2024–2026）年度，資料逐級取自官方公告。
        </p>
        <p className="mt-3 text-sm text-ink-faint">
          定位是「計算引擎」而非「法遵保證」。{' '}
          <Link href="/docs" className="font-medium text-cinnabar-deep underline decoration-rule-strong underline-offset-4 hover:decoration-cinnabar">
            快速上手與資料來源 →
          </Link>
        </p>
      </section>

      <section aria-label="線上計算機" className="mb-16">
        <Calculator />
      </section>

      <section className="border-t border-rule pt-10">
        <h2 className="mb-6 text-xl font-bold text-ink">能算什麼</h2>
        <ul className="grid gap-x-10 gap-y-3 sm:grid-cols-2">
          {[
            '勞工保險（普通事故 11.5% ＋ 就業保險 1%）與不參加就保情境',
            '全民健康保險（第 1 類，費率 5.17%，眷屬逐人計算）',
            '勞工退休金（雇主 6% ＋ 勞工自提 0–6%）',
            '職業災害保險（雇主負擔，平均費率 0.21%）',
            '二代健保補充保費（六類所得，費率 2.11%）',
            '月中到職／離職破月（勞保按日、健保月底歸屬）',
          ].map((item) => (
            <li key={item} className="flex gap-3 text-ink-soft">
              <span aria-hidden className="mt-2.5 h-1.5 w-1.5 shrink-0 bg-cinnabar" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
