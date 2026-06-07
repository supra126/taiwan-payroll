# taiwan-payroll

台灣勞健保勞退計算引擎（TypeScript，零執行期依賴）。完整文件見 [GitHub repository](https://github.com/supra126/taiwan-payroll#readme)。

```ts
import { createPayrollEngine } from 'taiwan-payroll';

const engine = createPayrollEngine({ year: 2026 });
const r = engine.calculate({ monthlySalary: 42000, dependents: 1, pensionSelfContribution: 0.06 });
```

> 部分工時：`engine.calculate({ monthlySalary: 15000, partTime: true })` 會對到官方部分工時低級距（勞保／健保 15,840），職保仍歸第 1 級 29,500（官方規定）。

> 外籍：`identity: 'migrantGeneral'`（一般移工，勞保 11.5%、無就保/勞退）、`identity: 'migrantDomestic'`（家事移工，僅健保＋職災；職災費率傳 `occupationalRate: 0.0018`）。外籍配偶用預設 `category1`。

## 申報媒體檔（健保補充保費）

產生健保署「補充保險費明細申報檔」（CSV／Big5），6 類所得各一：`generateSupplementaryBonusFiling`(獎金62)、`...ParttimeFiling`(兼職63)、`...ProfessionalFiling`(執行業務65)、`...DividendFiling`(股利66)、`...InterestFiling`(利息67)、`...RentFiling`(租金68)。

```ts
import { generateSupplementaryBonusFiling } from 'taiwan-payroll';
const { filename, content } = generateSupplementaryBonusFiling({
  year: 2026, filingDate: '20260901',
  unit: { taxId: '11111111', name: '甲公司', phone: '0227065866', email: 'a@b.tw', contactName: '王小明' },
  records: [{ action: 'I', payDate: '20260615', payeeId: 'A123456789', payeeName: '李四', bonusAmount: 50000, insuredSalary: 31800, ytdBonusCumulative: 150000, unitCode: '123456789' }],
});
// content 為 Unicode 字串；檔案實際為 Big5，存檔請以 Big5 編碼寫出。
```

皆以健保署官方範例逐位元驗證。股利逐列保費由呼叫端提供（另附 `calcDividendPremium`）。完整 API 見 [文件站 /docs/api](https://taiwan-payroll-docs.vercel.app/docs/api)。

## 免責聲明

計算結果僅供參考，實際應繳金額以勞保局、健保署核發之繳款單為準。本套件不構成法律或會計建議。
