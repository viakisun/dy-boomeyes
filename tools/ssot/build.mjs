// build.mjs — ssot/*.yaml → packages/domain/src/generated/{ssot.json, ids.ts} · docs/generated/{SCREENS,DOMAIN,TRACE,DECISIONS,SPECS}.md
// 결정적 출력(타임스탬프 없음 · 코드포인트 정렬). 원천 수정 후 항상 재실행하고 diff를 커밋한다.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';
import { ROOT, loadSSOT, runChecks } from './check.mjs';

const d = loadSSOT();
const GEN_CODE = join(ROOT, 'packages', 'domain', 'src', 'generated');
const GEN_DOC = join(ROOT, 'docs', 'generated');
mkdirSync(GEN_CODE, { recursive: true }); mkdirSync(GEN_DOC, { recursive: true });
const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const byId = (arr) => [...arr].sort((x, y) => cmp(x.id, y.id));
const tbl = (h, rows) => [`| ${h.join(' | ')} |`, `|${h.map(() => '---').join('|')}|`, ...rows.map((r) => `| ${r.map((c) => String(c ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ')).join(' | ')} |`)].join('\n');
const L = { // 한글 라벨 맵 (문서 표시용 — 원천은 영문 enum)
  status: { reflected: '반영', phase2: '2단계', structure: '구조 확보', option: '옵션', 'non-screen': '비화면', documented: '문서화', 'not-started': '미착수', development: '개발 단계', check: '확인 필요', void: '결번' },
  kind: { core: '기본', proposed: '제안', option: '옵션' }, disc: { open: '미결', decided: '확정', dropped: '철회' }, track: { A: 'A 시급', B: 'B 정책', C: 'C 범위·계약' },
};
const HEAD = (title, src) => `# ${title}\n\n생성물 — 원천 \`ssot/${src}\` · 재생성 \`pnpm ssot:build\` · 수기 수정 금지.\n\n`;

// ---- specs frontmatter
const specs = [];
const specDir = join(ROOT, 'specs');
if (existsSync(specDir)) for (const feat of readdirSync(specDir).sort(cmp)) {
  const p = join(specDir, feat, 'spec.md'); if (!existsSync(p)) continue;
  const m = /^---\n([\s\S]*?)\n---/.exec(readFileSync(p, 'utf8')); if (!m) continue;
  specs.push({ feature: feat, path: `specs/${feat}/spec.md`, ...YAML.parse(m[1]) });
}
const specOf = (scr) => specs.filter((s) => (s.screens ?? []).includes(scr)).map((s) => s.feature);

// ---- 역색인
const screens = byId(d.screens.screens);
const frByScreen = new Map(); for (const f of d.requirements.fr) for (const s of f.screens) (frByScreen.get(s) ?? frByScreen.set(s, []).get(s)).push(f.id);
const ifByScreen = new Map(); for (const i of d.interfaces.if) for (const s of i.screens) (ifByScreen.get(s) ?? ifByScreen.set(s, []).get(s)).push(i.id);
const discByScreen = new Map(); for (const x of d.decisions.disc) for (const s of x.scope) (discByScreen.get(s) ?? discByScreen.set(s, []).get(s)).push(x.id);
const check = runChecks(d);

// ---- ssot.json · ids.ts
const json = { ...d, derived: { screens: Object.fromEntries(screens.map((s) => [s.id, { fr: (frByScreen.get(s.id) ?? []).sort(cmp), if_all: [...new Set([...(s.trace.if ?? []), ...(ifByScreen.get(s.id) ?? [])])].sort(cmp), disc_all: [...new Set([...(s.trace.disc ?? []), ...(discByScreen.get(s.id) ?? [])])].sort(cmp), specs: specOf(s.id) }])), summary: check.summary } };
writeFileSync(join(GEN_CODE, 'ssot.json'), JSON.stringify(json, null, 2) + '\n');
const constBlock = (name, list, type) => `export const ${name} = {\n${list.map((id) => `  '${id}': '${id}',`).join('\n')}\n} as const;\nexport type ${type} = keyof typeof ${name};\n`;
const ts = [
  '// GENERATED — tools/ssot/build.mjs · 원천 ssot/*.yaml · 수기 수정 금지', '',
  constBlock('SCR', screens.map((s) => s.id), 'ScrId'), constBlock('FR', byId(d.requirements.fr).map((x) => x.id), 'FrId'), constBlock('ENT', byId(d.entities.ent).map((x) => x.id), 'EntId'),
  constBlock('DISC', byId(d.decisions.disc).map((x) => x.id), 'DiscId'), constBlock('IF', byId(d.interfaces.if).map((x) => x.id), 'IfId'), constBlock('API', byId(d.interfaces.api).map((x) => x.id), 'ApiId'),
  constBlock('ROLE', [...d.roles.roles].map((r) => r.id).sort(cmp), 'RoleId'),
  `export const SCREENS = {\n${screens.map((s) => `  '${s.id}': { name: ${JSON.stringify(s.name)}, surface: '${s.surface}', app: '${d.screens.surfaces.find((x) => x.id === s.surface).app}', route: ${JSON.stringify(s.route)}, roles: ${JSON.stringify(s.roles)}, phase: ${s.phase}, wave: ${s.wave}, default: '${s.default}', states: ${JSON.stringify(s.states.map((x) => x.id))} },`).join('\n')}\n} as const satisfies Record<ScrId, { name: string; surface: string; app: 'web' | 'pwa'; route: string; roles: readonly RoleId[]; phase: 1 | 2; wave: number; default: string; states: readonly string[] }>;`,
  '', `export const MACHINES = ${JSON.stringify(Object.fromEntries(Object.entries(d.entities.machines).map(([k, m]) => [k, { entity: m.entity, states: m.states, transitions: m.transitions.map((t) => [t.from, t.to]) }])), null, 2)} as const;`,
  '', `export const FIXED_CLOCK = '${d.meta.fixed_clock}';`, `export const CURRENT_WAVE = ${d.meta.current_wave};`, '',
].join('\n');
writeFileSync(join(GEN_CODE, 'ids.ts'), ts);

// ---- SCREENS.md
const surfaces = d.screens.surfaces;
let md = HEAD('화면 레지스트리 (SCREENS)', 'screens.yaml');
md += tbl(['표면', '앱', '화면 수', '웨이브 0', '1', '2', '4'], surfaces.map((sf) => { const ss = screens.filter((s) => s.surface === sf.id); return [sf.id, `${sf.name} (${sf.app})`, ss.length, ...[0, 1, 2, 4].map((w) => ss.filter((s) => s.wave === w).length)]; })) + '\n\n';
md += tbl(['코드', '이름', '표면', '라우트', '역할', '단계', '웨이브', '상태 픽스처', 'FR', 'spec'], screens.map((s) => [`\`${s.id}\``, s.name, s.surface, `\`${s.route}\``, s.roles.join(' '), s.phase, s.wave, `${s.states.length} (${s.states.map((x) => x.id).join(' ')})`, (frByScreen.get(s.id) ?? []).join(' '), specOf(s.id).join(' ') || '—'])) + '\n';
writeFileSync(join(GEN_DOC, 'SCREENS.md'), md);

// ---- DOMAIN.md
md = HEAD('도메인 모델 (DOMAIN)', 'entities.yaml');
md += '## 엔티티\n\n' + tbl(['ID', '엔티티', '단계', '핵심 속성', '관계', '저장소'], byId(d.entities.ent).map((e) => [`\`${e.id}\``, e.name, e.phase, e.fields.join(' · '), e.relations.join(' · '), e.store])) + '\n\n';
md += '## 상태기계\n\n';
for (const [name, m] of Object.entries(d.entities.machines)) md += `### ${name} (${m.entity})\n\n상태: ${m.states.map((s) => `\`${s}\``).join(' ')}\n\n` + tbl(['from', 'to', '계기'], m.transitions.map((t) => [t.from, t.to, t.by])) + '\n\n';
md += '## 규칙\n\n' + d.entities.rules.map((g) => `**${g.group}**\n\n` + tbl(['항목', '규칙'], g.items.map((i) => [i.title, i.rule]))).join('\n\n') + '\n\n';
md += '## 저장소 · 축적\n\n' + tbl(['저장소', '노드', '대상', '용도', '단계'], d.entities.stores.map((s) => [s.store, s.node, s.entities, s.purpose, s.phase])) + '\n\n' + tbl(['축적 항목', '원천', 'ENT', '계층'], d.entities.accumulation.map((a) => [a.item, a.source, a.entities.join(' '), a.tier])) + '\n';
writeFileSync(join(GEN_DOC, 'DOMAIN.md'), md);

// ---- TRACE.md
const frs = byId(d.requirements.fr);
md = HEAD('추적 커버리지 (TRACE)', 'requirements.yaml · screens.yaml · interfaces.yaml · decisions.yaml');
const orphans = screens.filter((s) => !(frByScreen.get(s.id) ?? []).length);
const frNoScreen = frs.filter((f) => !f.screens.length);
const noSpec = screens.filter((s) => s.wave <= d.meta.current_wave && !specOf(s.id).length);
md += tbl(['지표', '값'], [['화면', screens.length], ['FR', frs.length], ['FR 0건 화면(고아)', orphans.length ? orphans.map((s) => s.id).join(' ') : '0'], ['화면 0건 FR', frNoScreen.length ? frNoScreen.map((f) => f.id).join(' ') : '0'], [`현재 웨이브(${d.meta.current_wave}) 이하 spec 없는 화면`, noSpec.length ? noSpec.map((s) => s.id).join(' ') : '0'], ['참조 수', check.nrefs], ['검사 오류', check.errors.length]]) + '\n\n';
md += '## FR → 화면 · IF · ACC · spec\n\n' + tbl(['FR', '요구', '단계', '종류', '상태', '화면', 'IF', 'ACC', 'spec'], frs.map((f) => [`\`${f.id}\``, f.title, f.phase, L.kind[f.kind], L.status[f.status], f.screens.join(' '), f.if.join(' '), f.acc.join(' ') || '—', [...new Set(f.screens.flatMap(specOf))].join(' ') || '—'])) + '\n\n';
md += '## 화면 → 과업 절 · OUT · RFP · DISC · IF\n\n' + tbl(['화면', '과업 절', 'OUT', 'RFP', 'DISC(직접+scope)', 'IF(직접+if.screens)'], screens.map((s) => [`\`${s.id}\``, s.trace.task.join(' '), s.trace.out ?? '—', s.trace.rfp.join(' ') || '—', json.derived.screens[s.id].disc_all.join(' ') || '—', json.derived.screens[s.id].if_all.join(' ') || '—'])) + '\n\n';
md += '## 과업 절 커버리지\n\n' + tbl(['절', '과업', '단계', '항목', '화면 있는 항목', '비화면·구조'], d.contract.sections.map((sec) => [sec.id, sec.name, sec.phase, sec.items.length, sec.items.filter((i) => i.screens.length).length, sec.items.filter((i) => !i.screens.length).length])) + '\n';
writeFileSync(join(GEN_DOC, 'TRACE.md'), md);

// ---- DECISIONS.md
const discs = byId(d.decisions.disc);
const open = discs.filter((x) => x.status === 'open');
md = HEAD('결정 원장 (DECISIONS)', 'decisions.yaml');
md += tbl(['상태', '건수'], [['미결', open.length], ['확정', discs.filter((x) => x.status === 'decided').length], ['철회', discs.filter((x) => x.status === 'dropped').length], ...['A', 'B', 'C'].map((t) => [`미결 · ${L.track[t]}`, open.filter((x) => x.track === t).length])]) + '\n\n';
md += tbl(['ID', '항목', '트랙', '상태', '확정할 것', '관련 화면', '출처'], discs.map((x) => [`\`${x.id}\``, x.title, x.track, L.disc[x.status], x.ask, x.scope.join(' ') || (x.scope_note ?? '—'), x.source])) + '\n';
writeFileSync(join(GEN_DOC, 'DECISIONS.md'), md);

// ---- DEMO.md
md = HEAD('시연 장면 ↔ 화면·상태·픽스처 (DEMO)', 'scenarios.yaml demo[]');
md += tbl(['장면', '제목', '트랙', '표면', '화면', '조작·확인', '전달 메시지', 'ACC', '픽스처'], (d.scenarios.demo ?? []).map((s) => [s.scene, s.title, s.track, s.surface, s.screens.join(' '), s.steps.join(' → '), s.message, (s.acc ?? []).join(' '), Object.entries(s.fixture ?? {}).map(([k, v]) => `${k}=${v}`).join(' ')])) + '\n\n';
const trackScreens = {}; for (const s of d.scenarios.demo ?? []) for (const scr of s.screens) (trackScreens[s.track] ??= new Set()).add(scr);
md += tbl(['트랙', '장면', '화면'], Object.keys(trackScreens).sort(cmp).map((t) => [t, (d.scenarios.demo ?? []).filter((s) => s.track === t).map((s) => s.scene).join(' '), [...trackScreens[t]].sort(cmp).join(' ')])) + '\n';
writeFileSync(join(GEN_DOC, 'DEMO.md'), md);

// ---- SPECS.md
md = HEAD('기능 스펙 인덱스 (SPECS)', 'specs/*/spec.md frontmatter');
md += tbl(['기능', 'ID', '상태', '웨이브', '화면', 'FR', '파일'], specs.map((s) => [s.feature, s.id, s.status, s.wave, (s.screens ?? []).join(' '), (s.fr ?? []).join(' '), `[${s.path}](../../${s.path})`])) + '\n';
writeFileSync(join(GEN_DOC, 'SPECS.md'), md);

console.log(`✓ ssot:build → ssot.json · ids.ts · SCREENS.md(${screens.length}) · DOMAIN.md(${d.entities.ent.length}) · TRACE.md(fr ${frs.length}, 고아 ${orphans.length}) · DECISIONS.md(미결 ${open.length}) · DEMO.md(${(d.scenarios.demo ?? []).length}) · SPECS.md(${specs.length})`);
if (check.errors.length) { console.error(`✗ check errors ${check.errors.length} — build 출력은 생성됐으나 게이트 실패`); process.exitCode = 1; }
