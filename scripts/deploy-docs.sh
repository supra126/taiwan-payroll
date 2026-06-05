#!/usr/bin/env bash
# 一鍵部署 apps/docs 到 Vercel（不關聯 GitHub）。
# 因為 docs 是 Next.js 靜態匯出（output: 'export'）＋ pnpm monorepo（workspace:* 依賴），
# 採「本機建置 → 組 Build Output API → prebuilt 上傳」，Vercel 完全不建置，避開 monorepo 安裝問題。
#
# 用法：
#   pnpm deploy:docs            # 部署 production
#   pnpm deploy:docs preview    # 部署 preview（獨立 URL，不影響正式站）
#
# 前置：已 vercel login，且 apps/docs 已 vercel link（.vercel/project.json 存在）。
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DOCS="$ROOT/apps/docs"
TARGET="${1:-prod}"

echo "▶ build core + docs"
cd "$ROOT"
pnpm --filter taiwan-payroll build
pnpm --filter @taiwan-payroll/docs build

echo "▶ assemble Build Output API (.vercel/output)"
OUT="$DOCS/.vercel/output"
rm -rf "$OUT"
mkdir -p "$OUT/static"
cp -R "$DOCS/out/." "$OUT/static/"
# 自動為每個 .html 產生 overrides（乾淨 URL）：foo.html → /foo、index.html → /，
# 新增頁面不必改腳本。cleanUrls 在 Build Output API 不生效，故用 overrides。
node -e '
const fs=require("fs"),path=require("path");
const [staticDir,outFile]=process.argv.slice(1);
const o={};
(function walk(d){
  for(const e of fs.readdirSync(d,{withFileTypes:true})){
    const p=path.join(d,e.name);
    if(e.isDirectory())walk(p);
    else if(e.name.endsWith(".html")){
      const rel=path.relative(staticDir,p).split(path.sep).join("/");
      let clean=rel.replace(/\.html$/,"");
      if(clean==="index")clean="";
      else if(clean.endsWith("/index"))clean=clean.slice(0,-"/index".length);
      o[rel]={path:clean};
    }
  }
})(staticDir);
fs.writeFileSync(outFile,JSON.stringify({version:3,overrides:o},null,2)+"\n");
' "$OUT/static" "$OUT/config.json"

echo "▶ deploy ($TARGET)"
cd "$DOCS"
case "$TARGET" in
  preview)      vercel deploy --prebuilt --yes ;;
  prod|production) vercel deploy --prebuilt --prod --yes ;;
  *) echo "未知目標：$TARGET（請用 prod 或 preview）" >&2; exit 1 ;;
esac
