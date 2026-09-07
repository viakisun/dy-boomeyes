// doc.mjs — <brand>-design.md 렌더: src/doc/*.md 산문 + 토큰·카탈로그에서 생성한 표
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SRC } from './prepare.mjs';
import { cssVar, cssValue, themeName } from './css.mjs';
import { TONES } from './check.mjs';
import { fmtLch } from './oklch.mjs';
const part = (name) => readFileSync(join(SRC, 'doc', name), 'utf8').trim();
const tbl = (h, rows) =>
  [
    `| ${h.join(' | ')} |`,
    `|${h.map(() => '---').join('|')}|`,
    ...rows.map((r) => `| ${r.map((c) => String(c ?? '').replace(/\|/g, '\\|')).join(' | ')} |`),
  ].join('\n');
const val = (r) =>
  r.$type === 'typography'
    ? `${r.value.fontSize}/${r.value.lineHeight} ${r.value.fontWeight} ${r.value.letterSpacing}`
    : cssValue(r.$type, r.value);
const rawAlias = (t) => {
  const v = t.$value;
  const s = (x) => (typeof x === 'string' ? x : JSON.stringify(x));
  return typeof v === 'object' && !Array.isArray(v) && Object.values(v).every((x) => typeof x === 'string')
    ? Object.entries(v)
        .map(([k, x]) => `${k}: ${x}`)
        .join(' · ')
    : s(v);
};
export function renderDoc(ctx, report, pkg) {
  const { brand, flat, modes, ramps, accentHue } = ctx;
  const L = modes['light.comfortable'],
    D = modes['dark.comfortable'],
    C = modes['light.compact'];
  const catalog = JSON.parse(readFileSync(join(SRC, 'components.json'), 'utf8'));
  const sysColor = (pred) => [...flat].filter(([p]) => p.startsWith('sys.color.') && pred(p));
  const roleRows = sysColor((p) => !/^sys\.color\.(status|domain)\./.test(p)).map(([p, t]) => [
    `\`${p}\``,
    L.get(p).value,
    D.get(p).value,
    rawAlias(t),
    t.$description ?? '',
  ]);
  const statusRows = sysColor((p) => /^sys\.color\.status\./.test(p)).map(([p, t]) => [
    `\`${p}\``,
    L.get(p).value,
    D.get(p).value,
    rawAlias(t),
  ]);
  const domainRows = sysColor((p) => /^sys\.color\.domain\./.test(p)).map(([p, t]) => [
    `\`${p}\``,
    rawAlias(t),
    L.get(p).value,
    D.get(p).value,
    t.$description ?? '',
  ]);
  const hues = Object.keys(ramps.light);
  const rampTable = (theme) =>
    tbl(
      ['색조', ...Array.from({ length: 12 }, (_, i) => String(i + 1)), 'on-solid'],
      hues.map((h) => [
        h + (h === accentHue ? ' (accent)' : ''),
        ...Array.from({ length: 12 }, (_, i) => ramps[theme][h][i + 1]),
        ramps.onSolid[theme][h],
      ]),
    );
  const metaRows = Object.entries(ramps.meta).map(([h, m]) => [
    h,
    m.role ?? '—',
    m.anchor,
    m.hue,
    m.chroma,
    fmtLch(ramps.light[h][9]),
    fmtLch(ramps.dark[h][9]),
  ]);
  const typeRows = (M) =>
    [...flat]
      .filter(([p]) => p.startsWith('sys.type.'))
      .map(([p, t]) => {
        const v = M.get(p).value;
        return [
          `\`${p.replace('sys.type.', '')}\``,
          v.fontSize,
          v.fontWeight,
          v.lineHeight,
          v.letterSpacing,
          `\`${themeName(p).replace('--text-', 'text-')}\``,
          t.$description ?? '',
        ];
      });
  const densRows = (prefix) =>
    [...flat]
      .filter(([p]) => p.startsWith(prefix))
      .map(([p, t]) => [`\`${p}\``, val(L.get(p)), val(C.get(p)), rawAlias(t), t.$description ?? '']);
  const simpleRows = (prefix, withDark = false) =>
    [...flat]
      .filter(([p]) => p.startsWith(prefix))
      .map(([p, t]) =>
        withDark
          ? [`\`${p}\``, val(L.get(p)), val(D.get(p)), t.$description ?? '']
          : [`\`${p}\``, val(L.get(p)), rawAlias(t), t.$description ?? ''],
      );
  const cmpRows = [...flat]
    .filter(([p]) => p.startsWith('cmp.'))
    .map(([p, t]) => [`\`${p}\``, val(L.get(p)), val(C.get(p)), rawAlias(t), t.$description ?? '']);
  const contrastRows = report.contrast.map((r) => [
    r.theme,
    `\`${r.fg.replace('sys.color.', '')}\``,
    `\`${r.bg.replace('sys.color.', '')}\``,
    `${r.ratio}:1`,
    `≥${r.min}`,
    r.ok ? '✓' : '**✗**',
  ]);
  const famOrder = [...new Set(catalog.map((c) => c.family))];
  const catalogMd = famOrder
    .map(
      (f) =>
        `### ${f}\n\n` +
        tbl(
          ['컴포넌트', '플랫폼', '참조', '변형(prop)', '상태', '비고'],
          catalog
            .filter((c) => c.family === f)
            .map((c) => [`**${c.name}**`, c.platform, c.ref, c.variants ?? '', c.states ?? '', c.note ?? '']),
        ),
    )
    .join('\n\n');
  const naming = [...flat]
    .filter(([p]) =>
      [
        'ref.color.accent.9',
        'ref.space.16',
        'sys.color.bg.canvas',
        'sys.color.fg.muted',
        'sys.color.status.danger.fg',
        'sys.color.domain.equipment.fault.solid',
        'sys.type.body-md',
        'sys.space.inset.md',
        'sys.size.control.md',
        'cmp.button.height.md',
      ].includes(p),
    )
    .map(([p]) => [`\`${p}\``, `\`${cssVar(p)}\``, themeName(p) ? `\`${themeName(p)}\`` : '—']);
  const counts = {
    tokens: flat.size,
    ref: [...flat.keys()].filter((p) => p.startsWith('ref.')).length,
    sys: [...flat.keys()].filter((p) => p.startsWith('sys.')).length,
    cmp: [...flat.keys()].filter((p) => p.startsWith('cmp.')).length,
    components: catalog.length,
  };
  return [
    `# ${brand.name} 디자인 시스템 — ${brand.id}-design.md`,
    '',
    `브랜드 팩 \`${brand.id}\` v${brand.version} · 토큰 패키지 \`@boomeyes/tokens\` ${pkg.version} · 발행 ${brand.issued} · 소유 ${brand.owner}`,
    '',
    `이 문서는 \`packages/tokens/src\`(토큰 원천·브랜드 팩·컴포넌트 카탈로그·산문)에서 \`node scripts/build.mjs\`가 생성한다. 수기 수정 금지 — 원천을 고치고 다시 생성한다.`,
    '',
    tbl(
      ['구성', '수'],
      [
        ['토큰 전체', counts.tokens],
        ['ref(원시)', counts.ref],
        ['sys(시맨틱)', counts.sys],
        ['cmp(컴포넌트)', counts.cmp],
        ['컴포넌트 카탈로그', counts.components],
        ['대비 검사', `${report.contrast.filter((r) => r.ok).length}/${report.contrast.length} 통과`],
      ],
    ),
    '',
    tbl(
      ['산출물', '용도'],
      [
        [
          `\`dist/${brand.id}.tokens.css\``,
          ':root CSS 변수 · [data-theme=dark] · prefers-color-scheme · [data-density=compact]',
        ],
        [`\`dist/${brand.id}.theme.css\``, 'Tailwind v4 @theme(inline) — 유틸리티 이름은 §1 표'],
        [`\`dist/${brand.id}.tokens.json\``, '모드별 해석값 + 메타(css 변수명·Tailwind 이름) — 도구·테스트용'],
        [`\`dist/${brand.id}-design.md\``, '이 문서'],
      ],
    ),
    '',
    '## 0. 원칙',
    '',
    part('00-principles.md'),
    '',
    '## 1. 명명 규칙',
    '',
    part('01-naming.md'),
    '',
    '### 1.9 예시 — 토큰 경로 · CSS 변수 · Tailwind 이름',
    '',
    tbl(['토큰', 'CSS', 'Tailwind theme'], naming),
    '',
    '## 2. 브랜드 팩',
    '',
    tbl(
      ['항목', '값'],
      [
        ['id', brand.id],
        ['이름', brand.name],
        [
          '액센트 색조',
          `${accentHue} · 앵커 ${brand.accent.anchor}` +
            (brand.accent.pins
              ? ` · 고정 단계 ${Object.entries(brand.accent.pins.light ?? {})
                  .map(([k, v]) => `${k}=${v}`)
                  .join(' ')}`
              : ''),
        ],
        ['서체', brand.font.sans],
        [
          '기본 모드',
          Object.entries(brand.defaults)
            .map(([k, v]) => `${k}: ${v.theme}/${v.density}`)
            .join(' · '),
        ],
        ['참조', `Figma ${brand.reference.figma} (${brand.reference.figmaLibrary}) · ${brand.reference.codebase}`],
      ],
    ),
    '',
    '브랜드 팩은 액센트 색조(앵커·고정 단계)·서체·기본 모드만 정의한다. 나머지 램프·역할·컴포넌트는 시스템 공통이며, 새 사업자는 `src/brands/<ID>.json` 하나로 `<ID>-design.md`·CSS를 얻는다.',
    '',
    '## 3. 색',
    '',
    '### 3.1 램프 (`ref.color.<hue>.<1-12>`) — OKLCH 12단',
    '',
    '단계 의미: 1 앱 바탕 · 2 미묘한 바탕 · 3 컨트롤 배경 · 4 hover · 5 active/selected · 6 미묘한 테두리 · 7 테두리 · 8 강조 테두리 · 9 solid · 10 solid hover · 11 저대비 텍스트(≥4.5:1) · 12 고대비 텍스트. 앵커 hex에서 색상각(H)·채도(C)를 취하고 명도 사다리로 12단을 생성한다(색역 밖은 C만 축소). 브랜드 앵커는 단계 고정(pin)으로 원색을 보존한다.',
    '',
    tbl(['색조', '역할', '앵커', 'H', 'C', 'light 9', 'dark 9'], metaRows),
    '',
    '**light**',
    '',
    rampTable('light'),
    '',
    '**dark**',
    '',
    rampTable('dark'),
    '',
    '알파: `ref.color.alpha.{black,white}-{4,8,12,16,24,40,60,80}` — 오버레이·반투명 테두리(다크 모드의 분리선은 white-8~16).',
    '',
    '### 3.2 역할 (`sys.color.bg|fg|border|accent|focus`)',
    '',
    tbl(['토큰', 'light', 'dark', '원천', '설명'], roleRows),
    '',
    `### 3.3 상태 (\`sys.color.status.<tone>.*\`) — tone = ${TONES.join(' · ')}`,
    '',
    '각 tone은 solid / solid-hover / fg / fg-strong / bg / bg-hover / bg-subtle / border / border-strong / on-solid 10속성으로 동일 구조. 새 tone 추가는 램프 추가와 함께만 허용한다.',
    '',
    tbl(['토큰', 'light', 'dark', '원천'], statusRows),
    '',
    '### 3.4 도메인 (`sys.color.domain.<entity>.<state>.*`) — 제품 의미를 tone에 매핑',
    '',
    '도메인 토큰은 새 색을 만들지 않는다. 장비·업무·서류·영상·지도·연결 상태를 status tone 또는 accent에 별칭으로 연결해, 제품 어휘로 색을 호출하게 한다.',
    '',
    tbl(['토큰', '매핑', 'light', 'dark', '설명'], domainRows),
    '',
    '### 3.5 대비 검사 (빌드 게이트)',
    '',
    tbl(['테마', '전경', '배경', '대비', '기준', '판정'], contrastRows),
    '',
    '## 4. 타이포그래피 (`sys.type.<role>-<size>`)',
    '',
    '서체 ' +
      cssValue('fontFamily', L.get('ref.font.family.sans').value) +
      ' · 모노 ' +
      cssValue('fontFamily', L.get('ref.font.family.mono').value) +
      '. 역할 display/heading/body/label/code × 크기 lg/md/sm(+xl/xs). 강조는 같은 역할에 굵기 600을 더한다(별도 토큰 없음). 행간은 비율, 자간은 em.',
    '',
    '**comfortable (PWA · 터치)**',
    '',
    tbl(['역할', '크기', '굵기', '행간', '자간', 'Tailwind', '설명'], typeRows(L)),
    '',
    '**compact (웹 백오피스)**',
    '',
    tbl(['역할', '크기', '굵기', '행간', '자간', 'Tailwind', '설명'], typeRows(C)),
    '',
    '## 5. 간격 · 크기 · 레이아웃',
    '',
    '### 5.1 원시 간격 (`ref.space.<px>`)',
    '',
    tbl(
      ['토큰', '값'],
      [...flat].filter(([p]) => p.startsWith('ref.space.')).map(([p]) => [`\`${p}\``, L.get(p).value]),
    ),
    '',
    '### 5.2 시맨틱 간격 (`sys.space.*`) — 밀도별',
    '',
    tbl(['토큰', 'comfortable', 'compact', '원천', '설명'], densRows('sys.space.')),
    '',
    '### 5.3 크기 (`sys.size.*`) — 밀도별',
    '',
    tbl(['토큰', 'comfortable', 'compact', '원천', '설명'], densRows('sys.size.')),
    '',
    '### 5.4 레이아웃 (`sys.layout.*`)',
    '',
    tbl(['토큰', '값', '원천', '설명'], simpleRows('sys.layout.')),
    '',
    '## 6. 형태 · 깊이 · 모션',
    '',
    '### 6.1 라운드 (`ref.radius.*` · `sys.radius.*`)',
    '',
    tbl(['토큰', 'comfortable', 'compact', '원천', '설명'], densRows('sys.radius.')),
    '',
    '원시: ' +
      [...flat]
        .filter(([p]) => p.startsWith('ref.radius.'))
        .map(([p]) => `${p.split('.').pop()}=${L.get(p).value}`)
        .join(' · '),
    '',
    '### 6.2 테두리 (`sys.border.*`)',
    '',
    tbl(['토큰', '값', '원천', '설명'], simpleRows('sys.border.')),
    '',
    '### 6.3 그림자 (`sys.shadow.*`) — 테마별',
    '',
    tbl(['토큰', 'light', 'dark', '설명'], simpleRows('sys.shadow.', true)),
    '',
    '### 6.4 모션 (`sys.motion.*`)',
    '',
    tbl(['토큰', '값', '원천', '설명'], simpleRows('sys.motion.')),
    '',
    '### 6.5 z-index (`sys.z.*`) · 불투명도 (`sys.opacity.*`)',
    '',
    tbl(['토큰', '값', '원천', '설명'], [...simpleRows('sys.z.'), ...simpleRows('sys.opacity.')]),
    '',
    '## 7. 컴포넌트 토큰 (`cmp.<component>.<property>[.<variant>]`)',
    '',
    'cmp 층은 sys만 참조한다(ref 직접 참조 금지 — 검사로 강제). 컴포넌트 구현은 cmp 토큰만 읽고, 밀도·테마는 토큰이 흡수한다.',
    '',
    tbl(['토큰', 'comfortable', 'compact', '원천', '설명'], cmpRows),
    '',
    `## 8. 컴포넌트 카탈로그 (${counts.components})`,
    '',
    '이름 PascalCase · prop 어휘 고정: `variant`(형태) · `tone`(색 의도: accent/neutral/' +
      TONES.slice(0, 5).join('/') +
      ') · `size`(sm/md/lg) · 상태 boolean(`disabled` `loading` `selected` `invalid`). 플랫폼 both = 같은 Svelte 컴포넌트가 밀도 토큰으로 두 플랫폼을 소화.',
    '',
    catalogMd,
    '',
    '## 9. 플랫폼 가이드 — 웹 백오피스 (Linear 참조)',
    '',
    part('06-web.md'),
    '',
    '## 10. 플랫폼 가이드 — 현장 PWA (Crane Eyes 참조)',
    '',
    part('07-pwa.md'),
    '',
    '## 11. 페이지 골격 — 헤더 · 표 · 폼 · 요약 지표 · 아이콘',
    '',
    part('04-page.md'),
    '',
    '## 12. 카피 · 식별자 정책',
    '',
    part('05-copy.md'),
    '',
    '## 13. 브랜드 마크',
    '',
    part('10-brand.md'),
    '',
    '## 14. 참조 시스템 대비 변경점',
    '',
    part('08-reference.md'),
    '',
    '## 15. 거버넌스',
    '',
    part('09-governance.md'),
    '',
  ].join('\n');
}
