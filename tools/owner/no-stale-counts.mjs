// 소유주 파생 수치가 살아 있는 글에 박히는 것을 막는다.
//
// 여덟 차례 리뷰가 같은 계열을 잡았다 — 원천(owner_demo)에서 나오는 수를 문장·CI 스텝 이름에
// 적어 두면 화면이 늘 때 조용히 틀린다. pnpm verify는 이 계열을 보지 않는다.
// 처음엔 「지금의 파생값을 계산해 그 숫자를 찾는」 방식으로 만들었는데 실패했다 —
// 이미 낡은 수(112)도, 파생값에서 하나 뺀 표현(「업무 10종」)도 잡지 못하고, 11·18 같은
// 작은 수는 AC 번호·글자 크기·타임아웃과 부딪혀 오탐만 23건 나왔다.
//
// 그래서 값이 아니라 **형태**를 본다: 감시 파일에서 「두 자리 이상 수 + 개수 단위어」를 막는다.
// 한 자리 수는 그 파일이 정의하는 정책 상수(4폭 · 2테마 · 3단계)라 통과한다.
// 날짜가 박힌 기록물은 그 시점의 사실이므로 감시하지 않는다(CLAUDE.md 사고 SOP 2026-09-12).
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
// 감시 대상 — 「현재 이렇다」를 말하는 글과 실제로 실행되는 설정
// 소유주 파이프라인의 도구 전부 + 그 파이프라인을 서술하는 살아 있는 글 전부.
// 새 소유주 도구·명세를 만들면 여기에 더한다 — 목록에 없으면 감시되지 않는다.
const WATCH = [
  'docs/QA.md',
  '.github/workflows/ci.yml',
  'tools/owner/README.md',
  'tools/owner/views.mjs',
  'tools/owner/check.mjs',
  'tools/owner/check-review.py',
  'tools/owner/build-review.py',
  'tools/owner/assets.py',
  'tools/owner/performance.mjs',
  'tools/capture/owner.mjs',
  'tools/capture/owner-exceptions.mjs',
  'tests/e2e/owner-helpers.ts',
  'tests/e2e/owner-flows.ts',
  'tests/e2e/owner-content-flows.ts',
  'tests/e2e/owner-resources-flows.ts',
  'specs/owner-experience/spec.md',
  'specs/owner-experience/design.md',
  'specs/owner-experience/tasks.md',
  'specs/owner-contracts/spec.md',
  'specs/owner-contracts/design.md',
  'specs/owner-contracts/tasks.md',
  'specs/owner-drivers/spec.md',
  'specs/owner-drivers/design.md',
  'specs/owner-drivers/tasks.md',
  'specs/owner-showcase/spec.md',
  'specs/owner-showcase/design.md',
  'specs/owner-showcase/tasks.md',
];
// 소유주 캡처·증거가 파생하는 축의 단위어. 숫자가 앞이든 뒤든 잡는다.
// 「장」·「쪽」은 현장·장비·ENT-01 장비처럼 다른 낱말의 일부와 부딪혀 넣지 않는다(오탐 3건 확인).
const UNIT = '조합|과제|프레임|목적|종|건|combinations?|views?|cases?|frames?';
// 「장면」은 방향으로 뜻이 갈린다 — 「10장면」은 개수, 「장면 10」은 시연 장면 번호(식별자)다.
// 그래서 숫자가 앞에 오는 형태만 본다(오탐 4건 확인).
const UNIT_PRE = '장면';
const HIT = new RegExp(
  `(?<![\\d.])(\\d{2,3})\\s*(?:개|종|건|쌍)?\\s*(?:${UNIT}|${UNIT_PRE})` +
    `|(?:${UNIT})\\s*(?:수)?\\s*[:=]?\\s*(?<![\\d.])(\\d{2,3})(?![\\d.])`,
  'i',
);
// 줄 끝에 이 표시가 있으면 그 줄은 통과 — 정책 상수·식별자 범위처럼 파생값이 아닌 수
const ALLOW = /owner-counts-ok/;

const errors = [];
for (const rel of WATCH) {
  const file = join(ROOT, rel);
  if (!existsSync(file)) continue;
  readFileSync(file, 'utf8')
    .split('\n')
    .forEach((line, i) => {
      if (ALLOW.test(line)) return;
      const m = HIT.exec(line);
      if (!m) return;
      errors.push(
        `${rel}:${i + 1} 개수(${m[0].trim()})가 문장에 박혀 있다 — 원천에서 파생하거나 «--list가 알려 준다»로 미루라\n    ${line.trim().slice(0, 120)}`,
      );
    });
}
if (errors.length) {
  for (const e of errors) console.error(`  ✗ ${e}`);
  console.error(`✗ owner counts: 감시 ${WATCH.length}파일 · errors ${errors.length}`);
  process.exit(1);
}
console.log(`✓ owner counts: 감시 ${WATCH.length}파일 · 박힌 개수 0`);
