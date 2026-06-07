import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'API 參考 | taiwan-payroll',
  description:
    'taiwan-payroll 完整 API 參考：createPayrollEngine、calculate、calculateSupplementary、calculateEmployerSupplementary、calculateProrated、calculateWithholding、generateSupplementaryBonusFiling、generateSupplementaryParttimeFiling、generateSupplementaryProfessionalFiling 各函數的參數、預設值、範圍與回傳結構，TypeScript 與 Python 並列。',
};

const pre = 'mt-3 overflow-x-auto rounded-md border border-rule bg-ink px-4 py-3.5 text-sm leading-relaxed text-paper figures';
const th = 'py-2.5 px-3 font-mono text-xs uppercase tracking-wider text-ink-faint';
const td = 'py-2.5 px-3 align-top';

/** 參數表：每列 [TS 名稱, Python 名稱, 型別, 預設, 說明]。Python 同名則留空。 */
function ParamTable({ rows }: { rows: [string, string, string, string, string][] }) {
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-rule-strong text-left">
            <th className={th}>參數（TS · Python）</th>
            <th className={th}>型別</th>
            <th className={th}>預設</th>
            <th className={th}>說明</th>
          </tr>
        </thead>
        <tbody className="text-ink-soft">
          {rows.map(([ts, py, type, def, desc]) => (
            <tr key={ts} className="border-b border-rule/70">
              <td className={`${td} whitespace-nowrap`}>
                <code className="text-ink">{ts}</code>
                {py && <div className="font-mono text-xs text-ink-faint">{py}</div>}
              </td>
              <td className={`${td} font-mono text-xs`}>{type}</td>
              <td className={`${td} figures whitespace-nowrap`}>{def}</td>
              <td className={td}>{desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ApiReference() {
  return (
    <article className="max-w-3xl">
      <p className="mb-8">
        <Link href="/docs" className="font-mono text-xs uppercase tracking-widest text-cinnabar-deep hover:underline">
          ← 回快速上手
        </Link>
      </p>

      <h1 className="text-3xl font-bold text-ink">API 參考</h1>
      <p className="mt-4 leading-relaxed text-ink-soft">
        TypeScript（npm <code>taiwan-payroll</code>）與 Python（PyPI <code>taiwan-payroll</code>）為同一套引擎的鏡像實作，讀同一份分級表、跑通同一套黃金測試向量，結果逐位元一致。差別僅命名慣例：TS 用 <code>camelCase</code>、Python 用 <code>snake_case</code>；下方參數表並列兩者。金額一律為整數新台幣元。
      </p>

      <h2 className="mt-12 text-xl font-bold text-ink">建立引擎</h2>
      <p className="mt-3 text-ink-soft">
        <code>createPayrollEngine</code> / <code>create_payroll_engine</code>：傳入年度，回傳引擎物件。內建 2024–2026；年度不存在會丟錯。
      </p>
      <pre className={pre}>
        <code>{`// TypeScript
import { createPayrollEngine } from 'taiwan-payroll';
const engine = createPayrollEngine({ year: 2026 });`}</code>
      </pre>
      <pre className={pre}>
        <code>{`# Python
from taiwan_payroll import create_payroll_engine, CalculateInput
engine = create_payroll_engine(year=2026)`}</code>
      </pre>

      <h2 className="mt-12 text-xl font-bold text-ink">
        <code>calculate</code> — 勞保＋健保＋勞退＋職災
      </h2>
      <p className="mt-3 text-ink-soft">當月各方法定負擔。輸入 <code>CalculateInput</code>，回傳 <code>CalculateResult</code>。</p>
      <pre className={pre}>
        <code>{`// TS
engine.calculate({ monthlySalary: 42000, dependents: 1, pensionSelfContribution: 0.06 });
# Python
engine.calculate(CalculateInput(monthly_salary=42000, dependents=1, pension_self_contribution=0.06))`}</code>
      </pre>
      <ParamTable
        rows={[
          ['monthlySalary', 'monthly_salary', 'number', '（必填）', '月薪資總額；自動對應各保險投保級距。'],
          ['identity', 'identity', 'Identity', "'category1'", '身份別，見下方 enum；移工身份會停用就保／勞退等。'],
          ['dependents', 'dependents', 'number', '0', '健保眷屬數；計費上限由年度資料定，達上限不再加計。'],
          ['employmentInsurance', 'employment_insurance', 'boolean', 'true', '是否參加就業保險（影響勞保合併費率）。'],
          ['pensionSelfContribution', 'pension_self_contribution', 'number', '0', '勞退自願提繳比例，範圍 0–0.06。'],
          ['occupationalRate', 'occupational_rate', 'number', '年度預設', '職災行業別費率（小數比例），範圍 [0, 0.02)。'],
          ['partTime', 'part_time', 'boolean', 'false', '部分工時：未達基本工資者勞保／健保適用低級距（職保仍歸第 1 類）。'],
          ['rounding', 'rounding', 'Rounding', "'round'", '進位策略，見下方 enum。'],
        ]}
      />
      <p className="mt-5 text-sm text-ink-soft">
        <span className="font-semibold text-ink">回傳 <code>CalculateResult</code>：</span> <code>brackets</code>（各保險採用的投保級距金額）、<code>employee</code>（員工負擔 <code>labor／health／pensionSelf／total</code>）、<code>employer</code>（雇主負擔 <code>labor／health／pension／occupational／total</code>）、<code>government</code>（政府負擔 <code>labor／health</code>）、<code>meta</code>（<code>year</code>、<code>dataVersion</code>）。
      </p>

      <h2 className="mt-12 text-xl font-bold text-ink">
        <code>calculateSupplementary</code> — 二代健保補充保費
      </h2>
      <p className="mt-3 text-ink-soft">六類所得的補充保費。輸入 <code>SupplementaryInput</code>，回傳 <code>SupplementaryResult</code>。</p>
      <ParamTable
        rows={[
          ['type', 'type', 'SupplementaryType', '（必填）', '所得類別，6 種見下方 enum。'],
          ['amount', 'amount', 'number', '（必填）', '該筆所得金額。'],
          ['monthlyInsuredSalary', 'monthly_insured_salary', 'number', '—', '僅 bonus：當月投保金額，用以算超過 4 倍門檻的部分。'],
          ['ytdBonus', 'ytd_bonus', 'number', '0', '僅 bonus：本筆之前年度已領獎金累計（判斷門檻）。'],
          ['rounding', 'rounding', 'Rounding', "'round'", '進位策略。'],
        ]}
      />
      <p className="mt-5 text-sm text-ink-soft">
        <span className="font-semibold text-ink">回傳 <code>SupplementaryResult</code>：</span> <code>type</code>、<code>chargeable</code>（計費金額）、<code>rate</code>（費率字串）、<code>premium</code>（補充保費）。
      </p>

      <h2 className="mt-12 text-xl font-bold text-ink">
        <code>calculateEmployerSupplementary</code> — 雇主端補充保費
      </h2>
      <p className="mt-3 text-ink-soft">
        投保單位（雇主）二代健保補充保費：<code>(每月支付薪資總額 − 受僱者當月健保投保金額總額) × 2.11%</code>，
        <strong>無上限</strong>。輸入 <code>EmployerSupplementaryInput</code>，回傳 <code>EmployerSupplementaryResult</code>。
      </p>
      <ParamTable
        rows={[
          ['monthlyPaidTotal', 'monthly_paid_total', 'number', '（必填）', '每月支付薪資所得總額 A（含薪資、獎金、兼職、車馬費、承攬等）。'],
          ['monthlyInsuredTotal', 'monthly_insured_total', 'number', '（必填）', '受僱者當月健保投保金額總額 B（全體受僱者投保金額合計）。'],
          ['rounding', 'rounding', 'Rounding', "'round'", '進位策略。'],
        ]}
      />
      <p className="mt-5 text-sm text-ink-soft">
        <span className="font-semibold text-ink">回傳 <code>EmployerSupplementaryResult</code>：</span> <code>base</code>（差額 max(0, A−B)）、<code>rate</code>（費率字串）、<code>premium</code>（補充保費）。
      </p>

      <h2 className="mt-12 text-xl font-bold text-ink">
        <code>calculateProrated</code> — 月中到職／離職破月
      </h2>
      <p className="mt-3 text-ink-soft">
        破月當月的各方負擔。輸入 <code>ProratedInput</code>（＝ <code>CalculateInput</code> 全部欄位，再加下列兩個），回傳 <code>ProratedResult</code>。勞保／職保／勞退<strong>按日</strong>（30 日基準），健保採官方<strong>月底歸屬</strong>原則。
      </p>
      <ParamTable
        rows={[
          ['startDate', 'start_date', 'string', '—', "到職日，'YYYY-MM-DD'。"],
          ['endDate', 'end_date', 'string', '—', "離職日，'YYYY-MM-DD'。"],
        ]}
      />
      <p className="mt-5 text-sm text-ink-soft">
        <span className="font-semibold text-ink">回傳 <code>ProratedResult</code>：</span> 同 <code>CalculateResult</code>，再加 <code>days.insured</code>（投保天數）與 <code>healthCharged</code> / <code>health_charged</code>（健保當月是否計費）。
      </p>

      <h2 className="mt-12 text-xl font-bold text-ink">
        <code>calculateWithholding</code> — 薪資所得扣繳
      </h2>
      <p className="mt-3 text-ink-soft">
        薪資所得稅代扣，三條路徑以 <code>type</code> 區分。輸入 <code>WithholdingInput</code>，回傳 <code>WithholdingResult</code>（<code>withholding</code> 應扣繳稅額、<code>rate</code> 適用稅率、<code>taxableAnnual</code> 僅居住者）。
      </p>
      <ParamTable
        rows={[
          ['type', 'type', "'resident'|'residentBonus'|'nonResident'", '（必填）', '居住者固定月薪(公式法)／居住者非每月給付(獎金)／非居住者。'],
          ['monthlySalary', 'monthly_salary', 'number', '—', '月薪（resident／nonResident）。'],
          ['dependents', 'dependents', 'number', '0', '配偶及受扶養親屬數（僅 resident）。'],
          ['amount', 'amount', 'number', '—', '該筆給付金額（僅 residentBonus）。'],
        ]}
      />
      <p className="mt-5 text-sm text-ink-soft">
        居住者公式法：免稅額 101,000×(本人＋扶養)＋標準扣除 272,000＋薪資特別扣除 227,000，依級距稅率減累進差額、兩步四捨五入至元。獎金按 5%（單次未達 90,501 免扣）。非居住者月薪 ≤ 1.5× 基本工資為 6%、否則 18%。僅內建 2026；其餘年度未提供時丟錯。
      </p>

      <h2 className="mt-12 text-xl font-bold text-ink">
        <code>generateSupplementaryBonusFiling</code> — 補充保費獎金申報檔（CSV）
      </h2>
      <p className="mt-3 text-ink-soft">
        產生健保署「補充保險費明細申報檔（獎金，所得類別 62）」CSV。輸入扣費單位 metadata 與獎金給付明細；逐列補充保費由 <code>calculateSupplementary</code>(bonus) 計算，回傳 <code>{'{ filename, content }'}</code>。
        <strong>檔案為 Big5 編碼</strong>：<code>content</code> 為 Unicode 字串，存檔時須以 Big5 編碼（Python 可用 <code>to_big5_bytes()</code>；TS 端請自行以 Big5 寫出）。
      </p>
      <ParamTable
        rows={[
          ['year', 'year', 'number', '（必填）', '費率年度（2024–2026）。'],
          ['unit', 'unit', 'object', '（必填）', '扣費單位：taxId(8)/name/phone/email/contactName。'],
          ['filingDate', 'filing_date', 'string', '（必填）', "申報日期 'YYYYMMDD'（用於檔名）。"],
          ['records', 'records', 'array', '（必填）', '獎金給付明細（同一給付年度）。'],
          ['sequence', 'sequence', 'string', "'001'", '檔名序號。'],
        ]}
      />

      <h2 className="mt-12 text-xl font-bold text-ink">
        <code>generateSupplementaryParttimeFiling</code> — 補充保費兼職薪資申報檔（CSV，類別63）
      </h2>
      <p className="mt-3 text-ink-soft">
        產生健保署「補充保險費明細申報檔（兼職薪資，所得類別 63）」CSV。輸入扣費單位 metadata 與兼職薪資給付明細；逐列補充保費由 <code>calculateSupplementary</code>(parttime) 計算（兼職薪資：單次達基本工資者全額×費率），回傳 <code>{'{ filename, content }'}</code>。
        <strong>檔案為 Big5 編碼</strong>：<code>content</code> 為 Unicode 字串，存檔時須以 Big5 編碼（Python 可用 <code>to_big5_bytes()</code>；TS 端請自行以 Big5 寫出）。
      </p>
      <ParamTable
        rows={[
          ['year', 'year', 'number', '（必填）', '費率年度（2024–2026）。'],
          ['unit', 'unit', 'object', '（必填）', '扣費單位：taxId(8)/name/phone/email/contactName。'],
          ['filingDate', 'filing_date', 'string', '（必填）', "申報日期 'YYYYMMDD'（用於檔名）。"],
          ['records', 'records', 'array', '（必填）', '兼職薪資給付明細（同一給付年度）：action/payDate/payeeId/payeeName/amount，選填 filingNo/trustNote/note。'],
          ['sequence', 'sequence', 'string', "'001'", '檔名序號。'],
        ]}
      />

      <h2 className="mt-12 text-xl font-bold text-ink">
        <code>generateSupplementaryProfessionalFiling</code> — 補充保費執行業務申報檔（CSV，類別65）
      </h2>
      <p className="mt-3 text-ink-soft">
        產生健保署「補充保險費明細申報檔（執行業務所得，所得類別 65）」CSV。輸入扣費單位 metadata 與執行業務所得給付明細；逐列補充保費由 <code>calculateSupplementary</code>(professional) 計算（執行業務：單次達 20,000 起扣，全額×費率），回傳 <code>{'{ filename, content }'}</code>。
        <strong>檔案為 Big5 編碼</strong>：<code>content</code> 為 Unicode 字串，存檔時須以 Big5 編碼（Python 可用 <code>to_big5_bytes()</code>；TS 端請自行以 Big5 寫出）。
      </p>
      <ParamTable
        rows={[
          ['year', 'year', 'number', '（必填）', '費率年度（2024–2026）。'],
          ['unit', 'unit', 'object', '（必填）', '扣費單位：taxId(8)/name/phone/email/contactName。'],
          ['filingDate', 'filing_date', 'string', '（必填）', "申報日期 'YYYYMMDD'（用於檔名）。"],
          ['records', 'records', 'array', '（必填）', '執行業務所得給付明細（同一給付年度）：action/payDate/payeeId/payeeName/amount，選填 filingNo/trustNote/note/incomeYear。'],
          ['sequence', 'sequence', 'string', "'001'", '檔名序號。'],
        ]}
      />

      <h2 className="mt-12 text-xl font-bold text-ink">年度資料</h2>
      <p className="mt-3 text-ink-soft">
        <code>getAvailableYears()</code> / <code>get_available_years()</code> 回傳可用年度陣列；<code>getYearData(year)</code> / <code>get_year_data(year)</code> 回傳該年度的完整分級表與費率原始資料（含 <code>sources</code> 文號）。
      </p>

      <h2 className="mt-12 text-xl font-bold text-ink">列舉值</h2>
      <div className="mt-4 space-y-4 text-sm text-ink-soft">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-ink-faint">Identity（身份別）</p>
          <ul className="mt-2 space-y-1">
            <li><code className="text-ink">category1</code> — 一般受僱者（預設）。</li>
            <li><code className="text-ink">migrantGeneral</code> — 一般移工：勞保 11.5%、無就保／勞退。</li>
            <li><code className="text-ink">migrantDomestic</code> — 家事移工：僅健保＋職災（職災費率傳 <code>occupationalRate: 0.0018</code>）。</li>
          </ul>
        </div>
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-ink-faint">Rounding（進位策略）</p>
          <ul className="mt-2 space-y-1">
            <li><code className="text-ink">round</code> — 四捨五入（預設）。</li>
            <li><code className="text-ink">ceil</code> — 無條件進位。</li>
            <li><code className="text-ink">aggregate-then-round</code> — 加總後再進位（政府方吸收進位差）。</li>
          </ul>
        </div>
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-ink-faint">SupplementaryType（補充保費所得類別）</p>
          <p className="mt-2">
            <code className="text-ink">bonus</code> 高額獎金（超過當月投保額 4 倍部分、年度累計）、
            <code className="text-ink">parttime</code> 兼職薪資、
            <code className="text-ink">professional</code> 執行業務所得、
            <code className="text-ink">dividend</code> 股利、
            <code className="text-ink">interest</code> 利息、
            <code className="text-ink">rent</code> 租金。單次達門檻全額課，上限見年度資料。
          </p>
        </div>
      </div>

      <h2 className="mt-12 text-xl font-bold text-ink">輸入驗證</h2>
      <p className="mt-3 leading-relaxed text-ink-soft">
        <code>monthlySalary</code> 須為有限非負數、<code>pensionSelfContribution</code> 與 <code>dependents</code> 須為有限數、<code>occupationalRate</code> 須落在 [0, 0.02)、<code>identity</code> 須為合法值——否則丟出 <code>Error</code>（Python 為 <code>ValueError</code>）。
      </p>

      <p className="mt-12 border-t border-rule pt-6 text-sm leading-relaxed text-ink-faint">
        計算結果僅供參考，實際應繳金額以勞保局、健保署核發之繳款單為準。本套件不構成法律或會計建議。
      </p>
    </article>
  );
}
