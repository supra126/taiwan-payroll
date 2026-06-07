import { z } from 'zod';
import { createPayrollEngine, getAvailableYears, getYearData } from 'taiwan-payroll';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

const latestYear = (): number => {
  const years = getAvailableYears();
  if (years.length === 0) throw new Error('No year data available');
  return Math.max(...years);
};

const DISCLAIMER = '結果僅供參考，以勞保局、健保署核發之繳款單為準，不構成法律或會計建議。';

const yearField = z
  .number()
  .int()
  .optional()
  .describe('年度（西元，如 2026）。省略則使用最新可用年度；可先用 list_years 查可用年度。');
const roundingField = z
  .enum(['round', 'ceil', 'aggregate-then-round'])
  .optional()
  .describe('進位策略：round=四捨五入（預設）、ceil=無條件進位、aggregate-then-round=合計後分配（政府方吸收進位差）。');

function ok(data: unknown, summary: string): CallToolResult {
  return { content: [{ type: 'text', text: `${summary}\n${JSON.stringify(data, null, 2)}` }] };
}
function fail(err: unknown): CallToolResult {
  return { content: [{ type: 'text', text: err instanceof Error ? err.message : String(err) }], isError: true };
}

// --- calculate_payroll ---
const calculatePayrollShape = {
  year: yearField,
  monthlySalary: z.number().describe('月薪資總額（經常性薪資），新臺幣元／月。'),
  identity: z
    .enum(['category1', 'migrantGeneral', 'migrantDomestic'])
    .optional()
    .describe(
      '身份別（預設 category1）：category1=本國勞工或外籍配偶；migrantGeneral=一般移工（勞保僅普通事故 11.5%、無就保/勞退）；migrantDomestic=家事移工（僅健保＋職災，職災費率請以 occupationalRate 傳 0.0018）。不適用的險種回傳 0。',
    ),
  dependents: z.number().int().optional().describe('健保眷屬人數（計費上限 3 口），預設 0。'),
  employmentInsurance: z
    .boolean()
    .optional()
    .describe('是否參加就業保險（勞保費率 12.5% 或 11.5%），預設 true。一般移工/家事移工一律視為不參加。'),
  pensionSelfContribution: z
    .number()
    .optional()
    .describe('勞工自願提繳率，小數（0~0.06，如 0.06 表 6%），預設 0。'),
  occupationalRate: z
    .number()
    .optional()
    .describe('職災行業別費率，小數比例（如 0.0021 表 0.21%；家事移工 0.0018），範圍 [0, 0.02)。省略則用該年度平均費率。'),
  partTime: z
    .boolean()
    .optional()
    .describe('是否為部分工時：true 時未達基本工資者勞保/健保對到官方低級距（職保仍歸第 1 級）。預設 false。'),
  rounding: roundingField,
};
type CalculatePayrollArgs = z.infer<z.ZodObject<typeof calculatePayrollShape>>;

function calculatePayrollHandler(args: CalculatePayrollArgs): CallToolResult {
  try {
    const { year, ...input } = args;
    const r = createPayrollEngine({ year: year ?? latestYear() }).calculate(input);
    return ok(r, `${r.meta.year} 年：員工自付合計 ${r.employee.total} 元、雇主負擔 ${r.employer.total} 元。`);
  } catch (err) {
    return fail(err);
  }
}

export const calculatePayrollTool = {
  name: 'calculate_payroll',
  config: {
    title: '計算台灣勞健保勞退',
    description: `計算台灣某月薪資的勞保（含就保）、健保、勞退、職災各方（員工/雇主/政府）負擔。支援不同身份別、眷屬、自提、部分工時。${DISCLAIMER}`,
    inputSchema: calculatePayrollShape,
  },
  handler: calculatePayrollHandler,
};

// --- calculate_supplementary_premium ---
const supplementaryShape = {
  year: yearField,
  type: z
    .enum(['bonus', 'parttime', 'professional', 'dividend', 'interest', 'rent'])
    .describe('所得類別：bonus=高額獎金、parttime=兼職薪資、professional=執行業務、dividend=股利、interest=利息、rent=租金。'),
  amount: z.number().describe('單次給付金額，新臺幣元。'),
  monthlyInsuredSalary: z
    .number()
    .optional()
    .describe('（僅 bonus 必填）給付當月之投保金額，新臺幣元／月；門檻為其 4 倍。'),
  ytdBonus: z
    .number()
    .optional()
    .describe('（僅 bonus）本次給付前、同雇主同年度已累計之獎金，預設 0。'),
  rounding: roundingField,
};
type SupplementaryArgs = z.infer<z.ZodObject<typeof supplementaryShape>>;

function supplementaryHandler(args: SupplementaryArgs): CallToolResult {
  try {
    const { year, ...input } = args;
    const r = createPayrollEngine({ year: year ?? latestYear() }).calculateSupplementary(input);
    return ok(r, `補充保費：應計 ${r.chargeable} 元 × ${r.rate} = ${r.premium} 元。`);
  } catch (err) {
    return fail(err);
  }
}

export const supplementaryTool = {
  name: 'calculate_supplementary_premium',
  config: {
    title: '二代健保補充保費',
    description: `計算二代健保補充保費（費率 2.11%）。bonus 課徵年度累計超過當月投保額 4 倍部分；其餘五類單次達門檻全額課（單次上限 1,000 萬）。${DISCLAIMER}`,
    inputSchema: supplementaryShape,
  },
  handler: supplementaryHandler,
};

// --- calculate_prorated ---
const proratedShape = {
  ...calculatePayrollShape,
  startDate: z
    .string()
    .optional()
    .describe('到職日（YYYY-MM-DD）。startDate 與 endDate 至少擇一，且兩者須為同一月份。'),
  endDate: z.string().optional().describe('離職日（YYYY-MM-DD）。'),
};
type ProratedArgs = z.infer<z.ZodObject<typeof proratedShape>>;

function proratedHandler(args: ProratedArgs): CallToolResult {
  try {
    const { year, ...input } = args;
    const r = createPayrollEngine({ year: year ?? latestYear() }).calculateProrated(input);
    return ok(
      r,
      `投保 ${r.days.insured} 日；健保當月${r.healthCharged ? '計收整月' : '不計收'}。員工自付合計 ${r.employee.total} 元。`,
    );
  } catch (err) {
    return fail(err);
  }
}

export const proratedTool = {
  name: 'calculate_prorated',
  config: {
    title: '月中到職／離職破月計算',
    description: `計算月中到職或離職當月的破月保費。勞保/職保/勞退按日（30 日基準）；健保採官方「月底歸屬」——到職當月計整月、離職當月不計。${DISCLAIMER}`,
    inputSchema: proratedShape,
  },
  handler: proratedHandler,
};

// --- calculate_employer_supplementary_premium ---
const employerSupplementaryShape = {
  year: yearField,
  monthlyPaidTotal: z.number().describe('每月支付薪資所得總額 A，新臺幣元（含薪資、獎金、兼職、車馬費、承攬等）。'),
  monthlyInsuredTotal: z.number().describe('受僱者當月健保投保金額總額 B，新臺幣元（全體受僱者投保金額合計）。'),
  rounding: roundingField,
};
type EmployerSupplementaryArgs = z.infer<z.ZodObject<typeof employerSupplementaryShape>>;

function employerSupplementaryHandler(args: EmployerSupplementaryArgs): CallToolResult {
  try {
    const { year, ...input } = args;
    const r = createPayrollEngine({ year: year ?? latestYear() }).calculateEmployerSupplementary(input);
    return ok(r, `投保單位補充保費：差額 ${r.base} 元 × ${r.rate} = ${r.premium} 元。`);
  } catch (err) {
    return fail(err);
  }
}

export const employerSupplementaryTool = {
  name: 'calculate_employer_supplementary_premium',
  config: {
    title: '投保單位（雇主）補充保費',
    description: `計算雇主端二代健保補充保費（費率 2.11%）：(每月支付薪資總額 − 受僱者當月健保投保金額總額) × 費率，無上限。${DISCLAIMER}`,
    inputSchema: employerSupplementaryShape,
  },
  handler: employerSupplementaryHandler,
};

// --- calculate_income_tax_withholding ---
const withholdingShape = {
  year: yearField,
  type: z
    .enum(['resident', 'residentBonus', 'nonResident'])
    .describe('扣繳類型：resident=居住者固定月薪(公式法)、residentBonus=居住者非每月給付(獎金)5%、nonResident=非居住者18%/6%。'),
  monthlySalary: z.number().optional().describe('月薪資，新臺幣元（resident／nonResident 用）。'),
  dependents: z.number().int().optional().describe('配偶及受扶養親屬人數（僅 resident），預設 0。'),
  amount: z.number().optional().describe('該筆給付金額，新臺幣元（僅 residentBonus）。'),
};
type WithholdingArgs = z.infer<z.ZodObject<typeof withholdingShape>>;

function withholdingHandler(args: WithholdingArgs): CallToolResult {
  try {
    const { year, ...input } = args;
    const r = createPayrollEngine({ year: year ?? latestYear() }).calculateWithholding(
      input as Parameters<ReturnType<typeof createPayrollEngine>['calculateWithholding']>[0],
    );
    return ok(r, `應扣繳稅額 ${r.withholding} 元（稅率 ${r.rate}）。`);
  } catch (err) {
    return fail(err);
  }
}

export const withholdingTool = {
  name: 'calculate_income_tax_withholding',
  config: {
    title: '薪資所得扣繳稅額',
    description: `計算薪資所得扣繳稅額：居住者固定月薪(公式法)、非每月給付獎金(5%，未達起扣標準免扣)、非居住者(18%；月薪≤1.5倍基本工資為6%)。${DISCLAIMER}`,
    inputSchema: withholdingShape,
  },
  handler: withholdingHandler,
};

// --- list_years ---
const listYearsShape = {};
type ListYearsArgs = z.infer<z.ZodObject<typeof listYearsShape>>;

function listYearsHandler(_args: ListYearsArgs): CallToolResult {
  try {
    const years = getAvailableYears().map((year) => {
      const d = getYearData(year);
      return { year: d.year, dataVersion: d.dataVersion, minimumWage: d.minimumWage };
    });
    return ok(years, `可用年度：${years.map((y) => y.year).join('、')}。`);
  } catch (err) {
    return fail(err);
  }
}

export const listYearsTool = {
  name: 'list_years',
  config: {
    title: '列出可用年度',
    description: '列出目前支援的年度、資料版本與基本工資（月薪/時薪）。計算前可先用本工具確認有效的 year 值。',
    inputSchema: listYearsShape,
  },
  handler: listYearsHandler,
};

export const allTools = [calculatePayrollTool, supplementaryTool, employerSupplementaryTool, withholdingTool, proratedTool, listYearsTool];
