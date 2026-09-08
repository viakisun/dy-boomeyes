// query-audit.mjs — goto()가 하드코딩 템플릿 문자열로 쿼리를 통째로 대체해 ?state=·?capture=를 지우는 패턴을 센다 (화면 검수 F-16 · §4 backlog 3)
//   node tools/design/query-audit.mjs [--json]   → 파일별 건수 · 총계 · 1건 이상이면 exit 1
// 잡는 패턴: goto(resolve(`...?...${...}...`)) — 백틱 문자열 안에 물음표(쿼리 시작)와 보간(${)이 함께 있으면 새 쿼리로 통째 교체하는 것
// 올바른 패턴(잡지 않음): new URL(location.href)로 기존 쿼리를 보존한 뒤 searchParams.set/delete — 예: apps/web/src/routes/b4/parts/+page.svelte
// 화면 밖 이동(쿼리 없는 다른 라우트: `/b2/sites/${id}`)이나 로그아웃 리다이렉트(`/${surface}/login`)는 ?가 없어 대상이 아니다 — 오탐 없음(2026-09-08 조사, 전수 확인)
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SCOPES = ['apps/web/src', 'apps/pwa/src'];
const RE = /goto\(\s*resolve\(\s*`[^`]*\?[^`]*\$\{[^`]*`/g;
// 생존 프로브 — 규칙이 조용히 죽으면(정규식 편집 사고) 게이트가 녹색으로 지나간다
const PROBE = "goto(resolve(`/b1/dash?cam=${id}` as '/'))";
if (![...PROBE.matchAll(RE)].length) {
  console.error('✗ query-audit: 규칙 프로브 실패 — 정규식이 죽었다');
  process.exit(2);
}
const walk = (d) =>
  readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
const rows = [];
let total = 0;
for (const scope of SCOPES)
  for (const f of walk(join(ROOT, scope)).filter((x) => extname(x) === '.svelte')) {
    const src = readFileSync(f, 'utf8');
    const hits = [...src.matchAll(RE)].map((m) => m[0].slice(0, 60).replace(/\s+/g, ' '));
    if (hits.length) {
      rows.push({ file: relative(ROOT, f), n: hits.length, hits });
      total += hits.length;
    }
  }
rows.sort((a, b) => b.n - a.n);
if (process.argv.includes('--json')) console.log(JSON.stringify({ total, files: rows.length, rows }, null, 2));
else {
  for (const r of rows) console.log(String(r.n).padStart(3), r.file, '—', r.hits.join(' | '));
  console.log(
    `${total ? '✗' : '✓'} query-audit: 쿼리 대체 goto ${total}건 · 파일 ${rows.length} (목표 0 — new URL(location.href)로 보존, QA §3)`,
  );
}
if (total) process.exit(1);
