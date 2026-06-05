import type { Metadata } from 'next';
import Link from 'next/link';
import { Noto_Serif_TC, Noto_Sans_TC, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

const serif = Noto_Serif_TC({ weight: ['600', '700'], variable: '--font-serif-tc', display: 'swap', preload: false });
const sans = Noto_Sans_TC({ weight: ['400', '500', '700'], variable: '--font-sans-tc', display: 'swap', preload: false });
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-mono-latin', display: 'swap' });

export const metadata: Metadata = {
  title: '台灣勞健保勞退試算 | taiwan-payroll',
  description: '台灣民國113–115（2024–2026）年勞保、健保、勞退、職災、二代健保補充保費線上試算。開源計算引擎，結果僅供參考。',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW" className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
      <body>
        <header className="border-b border-rule-strong">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
            <Link href="/" className="group flex items-center gap-3">
              <span
                aria-hidden
                className="grid h-8 w-8 place-items-center rounded-sm bg-cinnabar font-serif text-paper shadow-sm"
              >
                算
              </span>
              <span className="font-serif text-lg font-bold tracking-tight text-ink">台灣勞健保勞退</span>
            </Link>
            <nav className="flex items-center gap-6 font-mono text-xs uppercase tracking-widest text-ink-soft">
              <Link href="/" className="transition-colors hover:text-cinnabar-deep">
                計算機
              </Link>
              <Link href="/docs" className="transition-colors hover:text-cinnabar-deep">
                文件
              </Link>
              <a
                href="https://www.npmjs.com/package/taiwan-payroll"
                className="transition-colors hover:text-cinnabar-deep"
                rel="noreferrer"
              >
                npm
              </a>
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-6 py-12 md:py-16">{children}</main>

        <footer className="mt-8 border-t border-rule">
          <p className="mx-auto max-w-5xl px-6 py-8 text-xs leading-relaxed text-ink-faint">
            本站依公開法規與主管機關公告實作，計算結果僅供參考，實際應繳金額以勞保局、健保署核發之繳款單為準。本站不構成法律或會計建議。
          </p>
        </footer>
      </body>
    </html>
  );
}
