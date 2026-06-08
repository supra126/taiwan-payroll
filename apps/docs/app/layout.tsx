import type { Metadata } from 'next';
import Link from 'next/link';
import { Noto_Serif_TC, Noto_Sans_TC, IBM_Plex_Mono } from 'next/font/google';
import { Nav } from '../components/Nav';
import './globals.css';

const serif = Noto_Serif_TC({ weight: ['700'], variable: '--font-serif-tc', display: 'swap', preload: false });
const sans = Noto_Sans_TC({ weight: ['400', '700'], variable: '--font-sans-tc', display: 'swap', preload: false });
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-mono-latin', display: 'swap' });

const SITE_URL = 'https://taiwan-payroll.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: '勞健保勞退試算 2026｜勞保‧健保‧勞退‧補充保費‧老年給付線上計算機',
    template: '%s｜台灣勞健保勞退試算',
  },
  description:
    '免費線上試算台灣勞保、健保、勞退、職災與二代健保補充保費各方負擔，並含薪資所得扣繳與勞保老年給付（年金／一次金）試算。涵蓋民國113–115（2024–2026）年最新費率，資料逐級取自官方公告。開源計算引擎，結果僅供參考。',
  keywords: [
    '勞保試算', '健保費試算', '勞退試算', '二代健保補充保費', '補充保費計算',
    '勞保老年年金試算', '老年給付試算', '薪資所得扣繳', '勞健保計算機', '投保薪資分級表',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'zh_TW',
    url: SITE_URL,
    siteName: '台灣勞健保勞退試算',
    title: '台灣勞健保勞退試算｜2026 最新費率線上計算機',
    description:
      '勞保、健保、勞退、職災、二代健保補充保費、薪資扣繳、勞保老年給付一站試算。涵蓋民國113–115年官方費率。',
  },
  twitter: {
    card: 'summary_large_image',
    title: '台灣勞健保勞退試算｜2026 最新費率線上計算機',
    description: '勞保、健保、勞退、補充保費、薪資扣繳、老年給付一站試算。開源計算引擎。',
  },
  robots: { index: true, follow: true },
  verification: { google: 'Tf2AUtRWadV22JrNqG0AeVIIad_SViZoauF8CBZgOV8' },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#org`,
      name: '台灣勞健保勞退試算',
      url: SITE_URL,
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: '台灣勞健保勞退試算',
      url: SITE_URL,
      inLanguage: 'zh-TW',
      publisher: { '@id': `${SITE_URL}/#org` },
    },
    {
      '@type': 'WebApplication',
      name: '台灣勞健保勞退試算',
      url: SITE_URL,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web',
      inLanguage: 'zh-TW',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
      publisher: { '@id': `${SITE_URL}/#org` },
      description:
        '免費線上試算台灣勞保、健保、勞退、職災、二代健保補充保費、薪資所得扣繳與勞保老年給付，涵蓋民國113–115年官方費率。',
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW" className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <header className="border-b border-rule-strong">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
            <Link href="/" aria-label="台灣勞健保勞退試算 首頁" className="group flex items-center gap-3">
              {/* 篆刻／朱印風：朱紅方塊＋內框（印章邊框）＋白文「算」 */}
              <span
                aria-hidden
                className="relative grid h-8 w-8 shrink-0 place-items-center rounded-[4px] bg-cinnabar shadow-sm"
              >
                <span className="absolute inset-[2.5px] rounded-[2px] border border-paper/45" />
                <span className="relative font-serif text-[1.15rem] font-bold leading-none text-paper">算</span>
              </span>
              <span className="hidden font-serif text-lg font-bold tracking-tight text-ink sm:inline">台灣勞健保勞退</span>
            </Link>
            <Nav />
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-6 py-12 md:py-16">{children}</main>

        <footer className="mt-8 border-t border-rule">
          <div className="mx-auto max-w-5xl px-6 py-8">
            <div className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs uppercase tracking-widest text-ink-soft">
              <Link href="/docs" className="transition-colors hover:text-cinnabar-deep">文件</Link>
              <Link href="/docs/api" className="transition-colors hover:text-cinnabar-deep">API</Link>
              <a href="https://github.com/supra126/taiwan-payroll" target="_blank" rel="noreferrer" className="transition-colors hover:text-cinnabar-deep">GitHub</a>
              <a href="https://www.npmjs.com/package/taiwan-payroll" target="_blank" rel="noreferrer" className="transition-colors hover:text-cinnabar-deep">npm</a>
              <a href="https://pypi.org/project/taiwan-payroll/" target="_blank" rel="noreferrer" className="transition-colors hover:text-cinnabar-deep">PyPI</a>
            </div>
            <p className="mt-4 max-w-3xl text-xs leading-relaxed text-ink-faint">
              資料年度 民國 113–115（2024–2026）。本站依公開法規與主管機關公告實作，計算結果僅供參考，實際應繳金額以勞保局、健保署核發之繳款單為準。本站不構成法律或會計建議。
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
