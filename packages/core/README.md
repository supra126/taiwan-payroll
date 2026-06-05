# taiwan-payroll

台灣勞健保勞退計算引擎（TypeScript，零執行期依賴）。完整文件見 [GitHub repository](https://github.com/supra126/taiwan-payroll#readme)。

```ts
import { createPayrollEngine } from 'taiwan-payroll';

const engine = createPayrollEngine({ year: 2026 });
const r = engine.calculate({ monthlySalary: 42000, dependents: 1, pensionSelfContribution: 0.06 });
```

> 部分工時：`engine.calculate({ monthlySalary: 15000, partTime: true })` 會對到官方部分工時低級距（勞保／健保 15,840），職保仍歸第 1 級 29,500（官方規定）。

> 外籍：`identity: 'migrantGeneral'`（一般移工，勞保 11.5%、無就保/勞退）、`identity: 'migrantDomestic'`（家事移工，僅健保＋職災；職災費率傳 `occupationalRate: 0.0018`）。外籍配偶用預設 `category1`。

## 免責聲明

計算結果僅供參考，實際應繳金額以勞保局、健保署核發之繳款單為準。本套件不構成法律或會計建議。
