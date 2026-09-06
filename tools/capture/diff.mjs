// diff.mjs — 시각 회귀 비교 (ADR-008 A · QA §3): shots/current/*.png ↔ shots/baseline/*.png
//   node tools/capture/diff.mjs            기준선 전수 비교 · 픽셀 차 비율 0.2% 초과 = FAIL · 차이 이미지 shots/diff/<name>.png
// 마스크: 캡처가 남긴 <name>.json(지도 · 비디오 영역)은 양쪽 모두 검게 칠한 뒤 비교하고 분모에서 뺀다
// 렌더 환경(platform · playwright)이 MANIFEST.json과 다르면 비교하지 않는다(exit 2) — 기준선은 CI(ubuntu)에서만 만든다
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const BASE = join(ROOT, 'shots', 'baseline');
const CUR = join(ROOT, 'shots', 'current');
const OUT = join(ROOT, 'shots', 'diff');
export const THRESHOLD = 0.002; // 픽셀 차 비율 상한 (ADR-008 · QA §3)

const manifest = (dir) => {
  const p = join(dir, 'MANIFEST.json');
  return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null;
};
const masksOf = (dir, name) => {
  const p = join(dir, name.replace(/\.png$/, '.json'));
  return existsSync(p) ? (JSON.parse(readFileSync(p, 'utf8')).masks ?? []) : [];
};
/** 사각형을 검게 칠하고 칠한 픽셀 수를 돌려준다 (이미지 경계로 클립) */
function paint(png, m) {
  const x0 = Math.max(0, Math.floor(m.x)),
    y0 = Math.max(0, Math.floor(m.y));
  const x1 = Math.min(png.width, Math.ceil(m.x + m.w)),
    y1 = Math.min(png.height, Math.ceil(m.y + m.h));
  for (let y = y0; y < y1; y++)
    for (let x = x0; x < x1; x++) {
      const i = (y * png.width + x) * 4;
      png.data[i] = png.data[i + 1] = png.data[i + 2] = 0;
      png.data[i + 3] = 255;
    }
  return Math.max(0, x1 - x0) * Math.max(0, y1 - y0);
}

const b = manifest(BASE);
const c = manifest(CUR);
if (!b) {
  // 첫 등록 전(워크플로는 기본 브랜치에 있어야 dispatch된다) — 경고 통과. 기준선이 생긴 뒤에는 화면·상태 누락이 FAIL이다
  console.log(
    '△ diff: 기준선 없음(shots/baseline/MANIFEST.json) — CI baseline 워크플로(pnpm capture:accept)로 등록한다 · 비교 생략',
  );
  process.exit(0);
}
if (!c) {
  console.log('✗ diff: 현재 캡처 없음(shots/current) — pnpm capture:compare');
  process.exit(1);
}
if (b.platform !== c.platform || b.playwright !== c.playwright || b.dpr !== c.dpr) {
  console.log(
    `✗ diff: 렌더 환경 불일치 — 기준선 ${b.platform}·playwright ${b.playwright}·dpr ${b.dpr} vs 현재 ${c.platform}·${c.playwright}·${c.dpr} (기준선은 CI ubuntu에서만 만들고 비교한다)`,
  );
  process.exit(2);
}
mkdirSync(OUT, { recursive: true });
const names = readdirSync(BASE)
  .filter((f) => f.endsWith('.png'))
  .sort();
let n = 0,
  fail = 0;
for (const f of names) {
  const cp = join(CUR, f);
  if (!existsSync(cp)) {
    fail++;
    console.log('FAIL', f, '현재 캡처 없음');
    continue;
  }
  const a = PNG.sync.read(readFileSync(join(BASE, f)));
  const x = PNG.sync.read(readFileSync(cp));
  if (a.width !== x.width || a.height !== x.height) {
    fail++;
    console.log('FAIL', f, `크기 ${a.width}×${a.height} → ${x.width}×${x.height}`);
    continue;
  }
  let masked = 0;
  for (const m of [...masksOf(BASE, f), ...masksOf(CUR, f)]) {
    masked += paint(a, m);
    paint(x, m);
  }
  const d = new PNG({ width: a.width, height: a.height });
  const diff = pixelmatch(a.data, x.data, d.data, a.width, a.height, { threshold: 0.1 });
  const ratio = diff / Math.max(1, a.width * a.height - masked);
  n++;
  if (ratio > THRESHOLD) {
    fail++;
    writeFileSync(join(OUT, f), PNG.sync.write(d));
    console.log('FAIL', f, `${(ratio * 100).toFixed(2)}% (${diff}px) → shots/diff/${f}`);
  } else console.log('ok', f, `${(ratio * 100).toFixed(2)}%`);
}
for (const f of readdirSync(CUR).filter((f) => f.endsWith('.png') && !names.includes(f))) {
  fail++;
  console.log('FAIL', f, '기준선 없음 — 새 화면·상태는 CI baseline 워크플로로 등록한다');
}
console.log(`${fail ? '✗' : '✓'} diff: ${n} compared · fail ${fail} · threshold ${THRESHOLD * 100}% → shots/diff/`);
process.exit(fail ? 1 : 0);
