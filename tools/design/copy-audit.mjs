// copy-audit.mjs — 화면 템플릿 텍스트에 내부 식별자·프로젝트 상태가 노출된 곳을 센다 (DY-design §12 카피·식별자 정책, 디자인 개선 D0 지표)
//   node tools/design/copy-audit.mjs [--json]   → 파일별 건수 · 총계. D7에서 tokens:lint 규칙(error)으로 승격 예정
// 대상: apps/*/src/**/*.svelte 의 <script> 밖 마크업(주석 제외). 도메인 ID(CPB-/C-/DOC-/E-/RQ-/P-/LS-/SITE-)는 사용자 언어라 세지 않는다
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SCOPES = ['apps/web/src', 'apps/pwa/src'];
const PATTERNS = [
  {
    id: 'ssot-id',
    re: /\b(?:DISC|FR|NFR|IF|API|ENT|EXT|ADR|OUT|ACC|WP|SVC)-[0-9A-Z]{1,3}\b/g,
    why: 'SSOT 식별자는 UI 밖(data-ref · DemoBar)',
  },
  {
    id: 'wave',
    re: /\b(?:W[0-9]|wave \d|웨이브 \d|2단계|1단계)\b/g,
    why: '웨이브·단계는 사용자에게 뜻이 없다 → "준비 중"',
  },
  {
    id: 'internal',
    re: /상태기계|append-only|mock\b|structuredClone|canAccess|entities\.rules|objectURL/g,
    why: '구현 용어 → 사용자 언어',
  },
  { id: 'surface-code', re: />\s*[AB][0-9]\s*</g, why: '표면 코드(B1·A2)는 표면 이름으로' },
];
const walk = (d) =>
  readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
const rows = [];
let total = 0;
for (const scope of SCOPES)
  for (const f of walk(join(ROOT, scope)).filter((x) => extname(x) === '.svelte')) {
    const src = readFileSync(f, 'utf8')
      .replace(/<script[\s\S]*?<\/script>/g, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<style[\s\S]*?<\/style>/g, '');
    const hits = [];
    for (const p of PATTERNS) for (const m of src.matchAll(p.re)) hits.push(`${p.id}:${m[0].trim()}`);
    if (hits.length) {
      rows.push({ file: relative(ROOT, f), n: hits.length, hits: [...new Set(hits)].slice(0, 8) });
      total += hits.length;
    }
  }
rows.sort((a, b) => b.n - a.n);
if (process.argv.includes('--json')) console.log(JSON.stringify({ total, files: rows.length, rows }, null, 2));
else {
  for (const r of rows) console.log(String(r.n).padStart(3), r.file, '—', r.hits.join(' '));
  console.log(`${total ? '△' : '✓'} copy-audit: 노출 ${total}건 · 파일 ${rows.length} (목표 0 — DY-design §12)`);
}
