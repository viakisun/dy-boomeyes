// lint.mjs — 화면·컴포넌트 코드의 토큰 규칙 검사(DY-design.md §1 · CLAUDE.md 금지). `node packages/tokens/scripts/lint.mjs`
//   hex 색 · Tailwind 기본 팔레트 · 임의 길이값([420px]) · 숫자 스케일 유틸리티(p-4 = 4px, gap-1 = 1px) · rounded-N · z-N · <style>/style= 안의 px
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const SCOPES = ['apps/web/src', 'apps/pwa/src', 'packages/ui/src', 'packages/map/src', 'packages/video/src'];
const EXT = new Set(['.svelte', '.ts', '.css']);
const PALETTE =
  'red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone';
const PREFIX = 'bg|text|border|ring|fill|stroke|from|to|via|outline|decoration|divide|accent|caret|shadow|placeholder';
const SPACING =
  'p|px|py|pt|pb|pl|pr|ps|pe|m|mx|my|mt|mb|ml|mr|ms|me|gap|gap-x|gap-y|space-x|space-y|w|h|size|min-w|min-h|max-w|max-h|inset|inset-x|inset-y|top|right|bottom|left|start|end|translate-x|translate-y|indent|basis';
const RULES = [
  { id: 'hex', re: /#[0-9a-f]{3,8}\b/gi, why: 'hex 색 → sys 색 토큰' },
  {
    id: 'palette',
    re: new RegExp(`\\b(?:${PREFIX})-(?:${PALETTE})-(?:50|[1-9]00|950)\\b|\\b(?:${PREFIX})-(?:white|black)\\b`, 'g'),
    why: 'Tailwind 기본 팔레트 → 토큰 유틸리티(bg-canvas · text-fg-muted · bg-danger)',
  },
  {
    id: 'arbitrary',
    re: /-\[-?[0-9.]+(?:px|rem|em|vh|vw|dvh|svh)\]/g,
    why: '임의 길이값 → sys.layout/space/size 토큰',
  },
  {
    id: 'scale',
    re: new RegExp(`(?<![\\w-])-?(?:${SPACING})-(\\d+(?:\\.\\d+)?)(?![\\w/-])`, 'g'),
    skip: (m) => m[1] === '0',
    why: '숫자 스케일(= px 명명 ref 값: gap-1 = 1px) → sys 유틸리티(p-inset-md · gap-stack-xs · w-layout-…)',
  },
  {
    id: 'radius',
    re: /(?<![\w-])rounded(?:-(?:[trbl]|[se]|t[lr]|b[lr]|[se][se]))?-\d+(?![\w-])/g,
    why: 'rounded-N → rounded-card/control/dialog/pill',
  },
  { id: 'z', re: /(?<![\w-])-?z-\d+(?![\w-])/g, why: 'z-N → z 토큰(z-dropdown 등)' },
  {
    id: 'reset',
    re: /(?<![\w-])(?:rounded(?:-[a-z]{1,2})?-(?:xs|sm|md|lg|xl|[2-4]xl)|text-(?:xs|sm|base|lg|xl|[2-9]xl)|shadow-(?:xs|sm|md|lg|xl|2xl))(?![\w-])/g,
    why: 'theme.css가 초기화한 Tailwind 기본 스케일 — 클래스가 조용히 무효 → rounded-card/control · text-body-md · shadow-raised',
  },
];
const PX = {
  id: 'px',
  re: /(?<![\w.])(-?\d*\.?\d+)px\b/g,
  skip: (m) => ['0', '1', '-1'].includes(m[1]),
  why: 'px 직접값 → var(--sys-…) 토큰(0·1px 허용)',
};

// 규칙 생존 프로브 — 정규식 오타(예: 템플릿 리터럴의 \b → 백스페이스)로 규칙이 조용히 죽는 사고 방지
const PROBES = {
  hex: '#0d2877',
  palette: 'bg-blue-500',
  arbitrary: 'min-h-[420px]',
  scale: 'gap-1',
  radius: 'rounded-4',
  z: 'z-10',
  reset: 'rounded-md',
  px: 'width: 4px',
};
for (const r of [...RULES, PX]) {
  const probe = PROBES[r.id];
  const m = [...probe.matchAll(r.re)];
  if (!m.length || r.skip?.(m[0])) {
    console.error(`✗ DY: lint 규칙 '${r.id}' 죽음 — 프로브 '${probe}' 미검출`);
    process.exit(2);
  }
}

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (name !== 'generated' && name !== 'node_modules') yield* walk(p);
    } else if (EXT.has(extname(name)) && !name.endsWith('.d.ts')) yield p;
  }
}
function isComment(line) {
  const t = line.trim();
  return (
    t.startsWith('//') ||
    t.startsWith('* ') ||
    t === '*' ||
    t.startsWith('*/') ||
    t.startsWith('/*') ||
    t.startsWith('<!--')
  );
}
const errors = [];
let files = 0;
for (const scope of SCOPES) {
  let dir;
  try {
    dir = join(REPO, scope);
    statSync(dir);
  } catch {
    continue;
  }
  for (const file of walk(dir)) {
    files++;
    const rel = relative(REPO, file);
    const ext = extname(file);
    let inStyle = ext === '.css';
    readFileSync(file, 'utf8')
      .split('\n')
      .forEach((line, i) => {
        if (isComment(line)) return;
        const report = (rule, m) => errors.push(`${rel}:${i + 1}: [${rule.id}] ${m[0].trim()} — ${rule.why}`);
        for (const rule of RULES) for (const m of line.matchAll(rule.re)) if (!rule.skip?.(m)) report(rule, m);
        if (ext === '.svelte' && /<style\b/.test(line)) inStyle = true;
        if (ext === '.css' || inStyle || /\bstyle[:=]|\.style\.|cssText/.test(line))
          for (const m of line.matchAll(PX.re)) if (!PX.skip(m)) report(PX, m);
        if (ext === '.svelte' && /<\/style>/.test(line)) inStyle = false;
      });
  }
}
for (const e of errors) console.log(e);
console.log(`${errors.length ? '✗' : '✓'} DY: lint files ${files} · errors ${errors.length}`);
process.exit(errors.length ? 1 : 0);
