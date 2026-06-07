// 由 data/schema.json 生成 packages/core/src/types.generated.ts 的「資料型別」。
// 只負責對應 schema 的 data 形狀（YearData 與具名 definitions）；API 型別（CalculateInput…）仍手寫於 types.ts。
// 用法：`pnpm gen:types`（寫檔）／`pnpm gen:types:check`（漂移檢查，CI 用）。
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

type Node = Record<string, any>;

const schemaPath = fileURLToPath(new URL('../data/schema.json', import.meta.url));
const outPath = fileURLToPath(new URL('../packages/core/src/types.generated.ts', import.meta.url));
const schema: Node = JSON.parse(readFileSync(schemaPath, 'utf8'));
const defs: Record<string, Node> = schema.definitions ?? {};

const pascal = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

function primitive(t: string): string {
  if (t === 'integer' || t === 'number') return 'number';
  if (t === 'string') return 'string';
  if (t === 'boolean') return 'boolean';
  if (t === 'null') return 'null';
  throw new Error(`unsupported primitive type: ${t}`);
}

function resolveType(node: Node): string {
  if (node.$ref) {
    const name = String(node.$ref).split('/').pop() as string;
    const target = defs[name];
    if (!target) throw new Error(`unknown $ref: ${node.$ref}`);
    // object definitions become named interfaces; array/primitive defs inline at use site.
    return target.type === 'object' ? pascal(name) : resolveType(target);
  }
  if (Array.isArray(node.type)) return node.type.map(primitive).join(' | ');
  if (node.type === 'array') return `${resolveType(node.items)}[]`;
  if (node.type === 'object') return node.properties ? inlineObject(node) : 'Record<string, unknown>';
  return primitive(node.type);
}

function props(node: Node): string[] {
  const required: string[] = node.required ?? [];
  return Object.entries(node.properties as Record<string, Node>).map(
    ([k, v]) => `${k}${required.includes(k) ? '' : '?'}: ${resolveType(v)}`,
  );
}

const inlineObject = (node: Node): string => `{ ${props(node).join('; ')} }`;

const emitInterface = (name: string, node: Node): string =>
  `export interface ${name} {\n${props(node)
    .map((p) => `  ${p};`)
    .join('\n')}\n}`;

const blocks: string[] = [];
for (const [key, def] of Object.entries(defs)) {
  if (def.type === 'object') blocks.push(emitInterface(pascal(key), def));
}
blocks.push(emitInterface('YearData', schema));

const output =
  '// AUTO-GENERATED from data/schema.json by scripts/gen-types.ts — do not edit by hand.\n' +
  '// Run `pnpm gen:types` to regenerate after changing the schema.\n\n' +
  blocks.join('\n\n') +
  '\n';

if (process.argv.includes('--check')) {
  let current = '';
  try {
    current = readFileSync(outPath, 'utf8');
  } catch {
    /* missing file → treated as drift */
  }
  if (current !== output) {
    console.error('✗ packages/core/src/types.generated.ts is out of date with data/schema.json. Run `pnpm gen:types`.');
    process.exit(1);
  }
  console.log('✓ types.generated.ts is in sync with data/schema.json');
} else {
  writeFileSync(outPath, output);
  console.log(`✓ wrote ${outPath}`);
}
