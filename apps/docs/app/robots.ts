import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  // 明確歡迎主流 AI 爬蟲（開源推廣工具，樂見被 LLM 收錄／引用／訓練）。
  const aiBots = [
    'GPTBot',
    'OAI-SearchBot',
    'ChatGPT-User',
    'ClaudeBot',
    'Claude-Web',
    'anthropic-ai',
    'PerplexityBot',
    'Perplexity-User',
    'Google-Extended',
    'Applebot-Extended',
    'CCBot',
  ];
  return {
    rules: [
      { userAgent: '*', allow: '/' },
      { userAgent: aiBots, allow: '/' },
    ],
    sitemap: 'https://taiwan-payroll.vercel.app/sitemap.xml',
  };
}
