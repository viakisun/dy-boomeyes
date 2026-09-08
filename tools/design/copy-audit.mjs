// copy-audit.mjs — 화면 템플릿 텍스트에 내부 식별자·프로젝트 상태가 노출된 곳을 센다 (DY-design §12 카피·식별자 정책, 디자인 개선 D0 지표)
//   node tools/design/copy-audit.mjs [--json]   → 파일별 건수 · 총계 · 노출 1건 이상이면 exit 1(pnpm verify에 편입, 화면 검수 §4 backlog 2)
// 대상: apps/*/src/**/*.svelte 의 <script> 밖 마크업(주석 · data-ref/ref 속성 제외). 도메인 ID(CPB-/C-/DOC-/E-/RQ-/P-/LS-/SITE-)는 사용자 언어라 세지 않는다
// 경계: JS의 \b는 한글 뒤에서 매치되지 않으므로 (?<![\w가-힣]) … (?![\w가-힣])를 쓴다 · 규칙마다 PROBES로 생존을 확인한다(죽으면 exit 2)
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SCOPES = ['apps/web/src', 'apps/pwa/src'];
const B = '(?<![\\w가-힣])';
const E = '(?![\\w가-힣])';
const PATTERNS = [
  {
    id: 'ssot-id',
    re: new RegExp(`${B}(?:DISC|FR|NFR|IF|API|ENT|EXT|ADR|OUT|ACC|WP|SVC)-[0-9A-Z]{1,3}${E}`, 'g'),
    why: 'SSOT 식별자는 UI 밖(data-ref · DemoBar 근거 토글)',
  },
  {
    id: 'wave',
    re: new RegExp(`${B}(?:W[0-9]|wave \\d|웨이브 \\d|2단계|1단계|CURRENT_WAVE)${E}`, 'g'),
    why: '웨이브·단계는 사용자에게 뜻이 없다 → "준비 중"',
  },
  {
    id: 'internal',
    re: new RegExp(`상태기계|append-only|${B}mock${E}|structuredClone|canAccess|entities\\.rules|objectURL`, 'g'),
    why: '구현 용어 → 사용자 언어',
  },
  { id: 'surface-code', re: />\s*[AB][0-9]\s*</g, why: '표면 코드(B1·A2)는 표면 이름으로' },
];
// 생존 프로브 — 규칙이 조용히 죽으면(정규식 편집 사고) 게이트가 녹색으로 지나간다
const PROBES = {
  'ssot-id': '<p>기준은 DISC-015 확정 후</p>',
  wave: '<p>실연동 W4 · 발주는 2단계 · wave 2 · (현재 웨이브 {CURRENT_WAVE})</p>',
  internal: '<p>실시간(mock) · 상태기계</p>',
  'surface-code': '<span>B1</span>',
};
for (const p of PATTERNS) {
  const n = [...PROBES[p.id].matchAll(p.re)].length;
  if (!n) {
    console.error(`✗ copy-audit: 규칙 ${p.id} 프로브 실패 — 정규식이 죽었다`);
    process.exit(2);
  }
}
const walk = (d) =>
  readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
const rows = [];
let total = 0;
for (const scope of SCOPES)
  for (const f of walk(join(ROOT, scope)).filter((x) => extname(x) === '.svelte')) {
    const src = readFileSync(f, 'utf8')
      .replace(/<script[\s\S]*?<\/script>/g, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<style[\s\S]*?<\/style>/g, '')
      .replace(/\s(?:data-)?ref="[^"]*"/g, ''); // 근거 속성(data-ref · 컴포넌트 ref prop)은 정책상 허용
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
  console.log(`${total ? '✗' : '✓'} copy-audit: 노출 ${total}건 · 파일 ${rows.length} (목표 0 — DY-design §12)`);
}
if (total) process.exit(1);
