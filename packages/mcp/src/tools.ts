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

// 所有工具皆為純計算：唯讀、同輸入同輸出、無破壞性、封閉計算（不連外部世界）。
const ANNOTATIONS = {
  readOnlyHint: true,
  idempotentHint: true,
  destructiveHint: false,
  openWorldHint: false,
} as const;

function ok(data: object, summary: string): CallToolResult {
  return {
    content: [{ type: 'text', text: `${summary}\n${JSON.stringify(data, null, 2)}` }],
    structuredContent: data as { [k: string]: unknown },
  };
}
function fail(err: unknown): CallToolResult {
  return { content: [{ type: 'text', text: err instanceof Error ? err.message : String(err) }], isError: true };
}

// --- 各工具回傳結構（outputSchema，對應 core 的 Result 型別）---
const calculateOutputShape = {
  brackets: z.object({ labor: z.number(), health: z.number(), pension: z.number(), occupational: z.number() }),
  employee: z.object({ labor: z.number(), health: z.number(), pensionSelf: z.number(), total: z.number() }),
  employer: z.object({ labor: z.number(), health: z.number(), pension: z.number(), occupational: z.number(), total: z.number() }),
  government: z.object({ labor: z.number(), health: z.number() }),
  meta: z.object({ year: z.number(), dataVersion: z.string() }),
};
const proratedOutputShape = {
  ...calculateOutputShape,
  days: z.object({ insured: z.number() }),
  healthCharged: z.boolean(),
};
const supplementaryOutputShape = {
  type: z.string(),
  chargeable: z.number(),
  rate: z.string(),
  premium: z.number(),
};
const employerSupplementaryOutputShape = {
  base: z.number(),
  rate: z.string(),
  premium: z.number(),
};
const withholdingOutputShape = {
  withholding: z.number(),
  rate: z.string(),
  taxableAnnual: z.number().optional(),
};
const oldAgePensionOutputShape = {
  formulaA: z.number(),
  formulaB: z.number(),
  monthly: z.number(),
  adjustmentMonths: z.number(),
  eligible: z.boolean(),
};
const oldAgeLumpSumOutputShape = {
  payment: z.number(),
  insuredMonthsCounted: z.number(),
};
const oldAgeSinglePaymentOutputShape = {
  payment: z.number(),
  basisTwelfths: z.number(),
};
const listYearsOutputShape = {
  years: z.array(
    z.object({
      year: z.number(),
      dataVersion: z.string(),
      minimumWage: z.object({ monthly: z.number(), hourly: z.number() }),
    }),
  ),
};

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
    description: `計算台灣某月薪資的勞保（含就保）、健保、勞退、職災各方（員工/雇主/政府）負擔。支援不同身份別、眷屬、自提、部分工時。回傳員工/雇主/政府各方分項與合計金額；唯讀、確定性整數運算。月中到職／離職當月的破月計算請改用 calculate_prorated。${DISCLAIMER}`,
    inputSchema: calculatePayrollShape,
    outputSchema: calculateOutputShape,
    annotations: ANNOTATIONS,
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
    description: `計算個人／受領人被扣取的二代健保補充保費（費率 2.11%）。bonus 課徵年度累計超過當月投保額 4 倍部分；其餘五類單次達門檻全額課（單次上限 1,000 萬）。投保單位（雇主）端應負擔的補充保費請改用 calculate_employer_supplementary_premium。${DISCLAIMER}`,
    inputSchema: supplementaryShape,
    outputSchema: supplementaryOutputShape,
    annotations: ANNOTATIONS,
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
    description: `計算月中到職或離職當月的破月保費。勞保/職保/勞退按日（30 日基準）；健保採官方「月底歸屬」——到職當月計整月、離職當月不計。整月（非破月）的一般計算請改用 calculate_payroll。${DISCLAIMER}`,
    inputSchema: proratedShape,
    outputSchema: proratedOutputShape,
    annotations: ANNOTATIONS,
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
    description: `計算投保單位（雇主）端二代健保補充保費（費率 2.11%）：(每月支付薪資總額 − 受僱者當月健保投保金額總額) × 費率，無上限。個人／受領人被扣取的補充保費請改用 calculate_supplementary_premium。${DISCLAIMER}`,
    inputSchema: employerSupplementaryShape,
    outputSchema: employerSupplementaryOutputShape,
    annotations: ANNOTATIONS,
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
    outputSchema: withholdingOutputShape,
    annotations: ANNOTATIONS,
  },
  handler: withholdingHandler,
};

// --- calculate_old_age_pension ---
const oldAgePensionShape = {
  year: yearField,
  avgInsuredSalary: z.number().describe('平均月投保薪資（最高 60 個月平均），新臺幣元。'),
  years: z.number().int().describe('保險年資：年。'),
  months: z.number().int().min(0).max(11).optional().describe('保險年資：月（0–11），預設 0。'),
  claimOffsetMonths: z
    .number()
    .int()
    .optional()
    .describe('提前(負)/延後(正)請領月數，相對法定請領年齡；每年 ±4%，上限 ±5 年（±20%）。預設 0。'),
};
type OldAgePensionArgs = z.infer<z.ZodObject<typeof oldAgePensionShape>>;

function oldAgePensionHandler(args: OldAgePensionArgs): CallToolResult {
  try {
    const { year, ...input } = args;
    const r = createPayrollEngine({ year: year ?? latestYear() }).calculateOldAgePension(input);
    return ok(
      r,
      `老年年金月領（擇優）：${r.monthly} 元${r.eligible ? '' : '（年資未滿 15 年，未達年金請領資格，數值僅供參考）'}。`,
    );
  } catch (err) {
    return fail(err);
  }
}

export const oldAgePensionTool = {
  name: 'calculate_old_age_pension',
  config: {
    title: '計算勞保老年年金（月領）',
    description: `依勞保老年年金法定公式（擇優兩式、提前/延後增減給每年 ±4%，上限 ±5 年（±20%））試算「按月領取」金額；年資未滿 15 年不符年金請領資格。若要「一次領清」：新制一次金請用 calculate_old_age_lump_sum，98 年前已有年資之舊制一次請領請用 calculate_old_age_single_payment。回傳為估算，整數元。${DISCLAIMER}`,
    inputSchema: oldAgePensionShape,
    outputSchema: oldAgePensionOutputShape,
    annotations: ANNOTATIONS,
  },
  handler: oldAgePensionHandler,
};

// --- calculate_old_age_lump_sum ---
const oldAgeLumpSumShape = {
  year: yearField,
  avgInsuredSalary: z.number().describe('平均月投保薪資（最高 60 個月平均），新臺幣元。'),
  years: z.number().int().describe('保險年資：年。'),
  months: z.number().int().min(0).max(11).optional().describe('保險年資：月（0–11），預設 0。'),
  postSixtyMonths: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe('逾 60 歲以後之保險年資（月），最多計入 5 年（60 個月），超過部分不計。不得超過總保險月數。預設 0。'),
};
type OldAgeLumpSumArgs = z.infer<z.ZodObject<typeof oldAgeLumpSumShape>>;

function oldAgeLumpSumHandler(args: OldAgeLumpSumArgs): CallToolResult {
  try {
    const { year, ...input } = args;
    const r = createPayrollEngine({ year: year ?? latestYear() }).calculateOldAgeLumpSum(input);
    return ok(r, `老年一次金：${r.payment} 元（計入 ${r.insuredMonthsCounted} 個月投保年資）。`);
  } catch (err) {
    return fail(err);
  }
}

export const oldAgeLumpSumTool = {
  name: 'calculate_old_age_lump_sum',
  config: {
    title: '計算勞保老年一次金',
    description: `依勞保老年一次金法定公式（平均月投保薪資 × 給付月數；年資每滿 1 年給 1 個月、逾 60 歲後之年資最多計入 5 年）試算「新制一次領清」給付。回傳給付金額（整數元）與計入投保月數，為唯讀、確定性整數運算之估算。按月領取請改用 calculate_old_age_pension；98 年前已有年資之舊制一次請領（基數制）請改用 calculate_old_age_single_payment。${DISCLAIMER}`,
    inputSchema: oldAgeLumpSumShape,
    outputSchema: oldAgeLumpSumOutputShape,
    annotations: ANNOTATIONS,
  },
  handler: oldAgeLumpSumHandler,
};

// --- calculate_old_age_single_payment ---
const oldAgeSinglePaymentShape = {
  year: yearField,
  avgInsuredSalary: z.number().describe('平均月投保薪資（採退保前 3 年內最高 36 個月平均），新臺幣元。'),
  preSixtyYears: z.number().int().min(0).describe('60 歲（含）以前之保險年資：年。'),
  preSixtyMonths: z
    .number()
    .int()
    .min(0)
    .max(11)
    .optional()
    .describe('60 歲（含）以前之保險年資：月（0–11），預設 0。'),
  postSixtyYears: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe('逾 60 歲以後之保險年資：年。逾 60 歲後最多計入 5 年，超過部分不計。預設 0。'),
  postSixtyMonths: z
    .number()
    .int()
    .min(0)
    .max(11)
    .optional()
    .describe('逾 60 歲以後之保險年資：月（0–11），預設 0。'),
};
type OldAgeSinglePaymentArgs = z.infer<z.ZodObject<typeof oldAgeSinglePaymentShape>>;

function oldAgeSinglePaymentHandler(args: OldAgeSinglePaymentArgs): CallToolResult {
  try {
    const { year, ...input } = args;
    const r = createPayrollEngine({ year: year ?? latestYear() }).calculateOldAgeSinglePayment(input);
    return ok(r, `一次請領老年給付：${r.payment} 元（給付基數 ${r.basisTwelfths / 12}）。`);
  } catch (err) {
    return fail(err);
  }
}

export const oldAgeSinglePaymentTool = {
  name: 'calculate_old_age_single_payment',
  config: {
    title: '計算勞保一次請領老年給付',
    description: `依勞保一次請領老年給付法定公式（基數制：前 15 年每年 1 個基數、第 16 年起每年 2 個基數、60 歲前最高 45 個基數、逾 60 歲後年資每年 2 個基數最多計 5 年、合併最高 50 個基數）試算給付金額。適用 98 年前已有保險年資、選舊制一次請領者；與新制一次金 calculate_old_age_lump_sum（月數制）不同。按月領取請改用 calculate_old_age_pension。${DISCLAIMER}`,
    inputSchema: oldAgeSinglePaymentShape,
    outputSchema: oldAgeSinglePaymentOutputShape,
    annotations: ANNOTATIONS,
  },
  handler: oldAgeSinglePaymentHandler,
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
    return ok({ years }, `可用年度：${years.map((y) => y.year).join('、')}。`);
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
    outputSchema: listYearsOutputShape,
    annotations: ANNOTATIONS,
  },
  handler: listYearsHandler,
};

export const allTools = [calculatePayrollTool, supplementaryTool, employerSupplementaryTool, withholdingTool, oldAgePensionTool, oldAgeLumpSumTool, oldAgeSinglePaymentTool, proratedTool, listYearsTool];
