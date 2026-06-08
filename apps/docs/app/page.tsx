import Link from 'next/link';
import { Calculator } from '../components/Calculator';

const faqs = [
  {
    q: '勞保、健保、勞退保費怎麼計算？',
    a: '依勞工的月投保（提繳）薪資對應官方分級表級距，再乘各險費率與負擔比例：勞保普通事故 11.5%＋就保 1%（雇主 70%、勞工 20%、政府 10%）、健保 5.17%（雇主 60%、本人 30%，眷屬逐人計收最多 3 口）、勞退雇主提繳 6%（勞工可自提 0–6%）。本站費率與分級表逐級取自主管機關最新公告。',
  },
  {
    q: '二代健保補充保費什麼時候要扣？費率多少？',
    a: '補充保險費率為 2.11%。常見扣費時機：高額獎金（全年累計逾當月投保金額 4 倍部分）、兼職薪資／執行業務／股利／利息／租金等單次給付達 2 萬元以上時，由給付單位於給付時扣取。',
  },
  {
    q: '勞保老年年金幾歲可以領？金額怎麼算？',
    a: '法定請領年齡逐年調整，民國 51 年（含）以後出生者為 65 歲。年金採擇優兩式取高者：①平均月投保薪資 × 年資 × 0.775% ＋ 3,000 元；②平均月投保薪資 × 年資 × 1.55%。提前請領每年減給 4%、延後每年增給 4%（上限各 ±5 年，即 ±20%）。',
  },
  {
    q: '試算結果可以當作正式應繳／應領金額嗎？',
    a: '不行。本站為開源計算引擎，結果僅供參考；實際應繳保費以勞保局、健保署核發之繳款單為準，給付金額以勞保局核定為準。本站不構成法律或會計建議。',
  },
];

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
};

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
        <h2 className="mb-6 text-xl font-bold text-ink">能做什麼</h2>
        <p className="mb-6 max-w-2xl text-sm text-ink-soft">
          首頁計算機示範核心扣項試算；程式庫（npm／PyPI／MCP）另涵蓋所得稅扣繳、健保補充保費申報媒體檔產生與勞保老年給付試算。完整 API 見{' '}
          <Link href="/docs/api" className="font-medium text-cinnabar-deep underline decoration-rule-strong underline-offset-4 hover:decoration-cinnabar">API 參考</Link>。
        </p>
        <ul className="grid gap-x-10 gap-y-3 sm:grid-cols-2">
          {[
            '勞工保險（普通事故 11.5% ＋ 就業保險 1%）與不參加就保情境',
            '全民健康保險（第 1 類，費率 5.17%，眷屬逐人計算）',
            '勞工退休金（雇主 6% ＋ 勞工自提 0–6%）',
            '職業災害保險（雇主負擔，平均費率 0.21%）',
            '二代健保補充保費（六類所得，費率 2.11%）＋雇主端補充保費',
            '月中到職／離職破月（勞保按日、健保月底歸屬）',
            '薪資所得稅扣繳（居住者公式法、獎金、非居住者）',
            '健保補充保費明細申報媒體檔（6 類所得，CSV／Big5，逐位元對官方範例）',
            '勞保老年給付試算（年金月領／老年一次金／一次請領）',
          ].map((item) => (
            <li key={item} className="flex gap-3 text-ink-soft">
              <span aria-hidden className="mt-2.5 h-1.5 w-1.5 shrink-0 bg-cinnabar" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-14 border-t border-rule pt-10">
        <h2 className="mb-6 text-xl font-bold text-ink">常見問題</h2>
        <dl className="grid gap-6 sm:grid-cols-2">
          {faqs.map((f) => (
            <div key={f.q}>
              <dt className="font-serif text-base font-bold text-ink">{f.q}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-ink-soft">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
    </>
  );
}
