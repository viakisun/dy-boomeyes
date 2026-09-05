// catalog.mjs — 컴포넌트 파일(ui·video·map의 *.svelte) ⊆ components.json 카탈로그 (DY-design §1.3 · CLAUDE.md 명명). 카탈로그에만 있는 이름은 "계획"으로 허용
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const SCOPES = ['packages/ui/src', 'packages/video/src', 'packages/map/src'];
const catalog = JSON.parse(readFileSync(join(ROOT, 'packages/tokens/src/components.json'), 'utf8')).map((c) => c.name);
function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (name !== 'node_modules') yield* walk(p);
    } else if (extname(name) === '.svelte') yield name.slice(0, -'.svelte'.length);
  }
}
const files = SCOPES.flatMap((s) => [...walk(join(ROOT, s))]);
const missing = files.filter((n) => !catalog.includes(n));
const bad = files.filter((n) => !/^[A-Z][A-Za-z0-9]*$/.test(n));
const errors = [
  ...missing.map((n) => `카탈로그에 없는 컴포넌트: ${n} → packages/tokens/src/components.json에 등록`),
  ...bad.map((n) => `PascalCase 아님: ${n}`),
];
console.log(
  `${errors.length ? '✗' : '✓'} DY: catalog ${files.length - missing.length}/${files.length} 컴포넌트 등록 · 계획만 ${catalog.length - (files.length - missing.length)} · errors ${errors.length}`,
);
for (const e of errors) console.log('  - ' + e);
process.exit(errors.length ? 1 : 0);
