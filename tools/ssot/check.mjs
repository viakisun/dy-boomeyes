// check.mjs — SSOT 검사: 스키마(부분집합) · ID 문법 · 유일성 · 참조 무결성 · 어휘 · 화면 규칙 · DISC 생애주기
//   node tools/ssot/check.mjs            기본 검사
//   node tools/ssot/check.mjs --specs    specs/*/spec.md frontmatter ID 실존 · AC ≥3
//   node tools/ssot/check.mjs --docs     md 상대 링크 실재 · 문서 안 ID 실존
//   node tools/ssot/check.mjs --commits <range>   커밋 Refs: 트레일러 ID 실존
// 출력 마지막 줄 = 게이트 요약(PR 인용용). 오류 시 exit 1.
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import YAML from 'yaml';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SSOT = join(ROOT, 'ssot');
export const FILES = [
  'meta',
  'roles',
  'contract',
  'requirements',
  'interfaces',
  'entities',
  'screens',
  'decisions',
  'options',
  'glossary',
  'scenarios',
];
export const ID = {
  SCR: /^[AB]\d-\d{2}M?$/,
  FR: /^FR-\d{3}$/,
  NFR: /^NFR-\d{3}$/,
  IF: /^IF-\d{3}$/,
  API: /^API-\d{3}$/,
  ENT: /^ENT-\d{2}$/,
  DISC: /^DISC-\d{3}$/,
  ACC: /^ACC-\d{3}$/,
  OUT: /^OUT-\d{3}$/,
  WP: /^WP-[ABC]\d$/,
  RFP: /^(RFP-\d{3}|EXT-\d)$/,
  SEC: /^[45]\.3\.\d{1,2}$/,
  ROLE: /^[a-z][a-z-]*$/,
  STATE: /^[a-z0-9][a-z0-9-]*$/,
  ROUTE: /^\/[a-z0-9/\[\]?=.-]*$/,
};
export const ANY_ID = /\b(FR|NFR|IF|API|DISC|ACC|OUT)-\d{3}\b|\bENT-\d{2}\b|\bWP-[ABC]\d\b|\b[AB]\d-\d{2}M?\b/g;

export function loadSSOT() {
  const data = {};
  for (const f of FILES) data[f] = YAML.parse(readFileSync(join(SSOT, `${f}.yaml`), 'utf8'));
  return data;
}
export function indexIds(d) {
  const ids = {
    SCR: new Set(d.screens.screens.map((s) => s.id)),
    FR: new Set(d.requirements.fr.map((x) => x.id)),
    NFR: new Set(d.requirements.nfr.map((x) => x.id)),
    IF: new Set(d.interfaces.if.map((x) => x.id)),
    API: new Set(d.interfaces.api.map((x) => x.id)),
    ENT: new Set(d.entities.ent.map((x) => x.id)),
    DISC: new Set(d.decisions.disc.map((x) => x.id)),
    ACC: new Set(d.contract.acceptance.map((x) => x.id)),
    OUT: new Set(d.contract.outputs.map((x) => x.id)),
    WP: new Set(d.contract.wp.map((x) => x.id)),
    RFP: new Set(d.contract.rfp.map((x) => x.id)),
    SEC: new Set(d.contract.sections.map((x) => x.id)),
    ROLE: new Set(d.roles.roles.map((x) => x.id)),
    SURFACE: new Set(d.screens.surfaces.map((x) => x.id)),
  };
  ids.LEGACY = new Set(d.screens.screens.flatMap((s) => s.legacy_codes ?? []));
  return ids;
}
const kindOf = (id) =>
  /^[AB]\d-\d{2}M?$/.test(id)
    ? 'SCR'
    : /^(RFP-|EXT-)/.test(id)
      ? 'RFP'
      : /^[45]\.3\./.test(id)
        ? 'SEC'
        : id.split('-')[0];

// ---- 스키마 부분집합 검증기 (type · required · properties · additionalProperties · enum · pattern · items · minItems · nullable)
function validate(schema, value, path, errs) {
  if (schema.nullable && value === null) return;
  const types = Array.isArray(schema.type) ? schema.type : schema.type ? [schema.type] : [];
  const t = value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;
  if (types.length && !types.includes(t) && !(t === 'number' && types.includes('integer') && Number.isInteger(value))) {
    errs.push(`${path}: type ${t} ≠ ${types.join('|')}`);
    return;
  }
  if (schema.enum && !schema.enum.includes(value)) errs.push(`${path}: '${value}' ∉ {${schema.enum.join(',')}}`);
  if (schema.pattern && typeof value === 'string' && !new RegExp(schema.pattern).test(value))
    errs.push(`${path}: '${value}' ≠ /${schema.pattern}/`);
  if (t === 'object') {
    for (const k of schema.required ?? []) if (!(k in value)) errs.push(`${path}: '${k}' 필수`);
    for (const [k, v] of Object.entries(value)) {
      const sub = schema.properties?.[k];
      if (sub) validate(sub, v, `${path}.${k}`, errs);
      else if (schema.additionalProperties === false) errs.push(`${path}: 허용되지 않는 키 '${k}'`);
    }
  }
  if (t === 'array') {
    if (schema.minItems && value.length < schema.minItems) errs.push(`${path}: 최소 ${schema.minItems}개`);
    if (schema.items) value.forEach((v, i) => validate(schema.items, v, `${path}[${i}]`, errs));
  }
}

export function runChecks(d) {
  const errors = [],
    warnings = [];
  const ids = indexIds(d);
  // 1. 스키마
  for (const f of FILES) {
    const sp = join(SSOT, 'schema', `${f}.schema.json`);
    if (!existsSync(sp)) {
      warnings.push(`schema 없음: ${f}`);
      continue;
    }
    validate(JSON.parse(readFileSync(sp, 'utf8')), d[f], f, errors);
  }
  // 2. ID 문법 · 유일성(전 축 + legacy)
  const seen = new Map();
  const reg = (id, kind, where) => {
    if (!ID[kind].test(id)) errors.push(`${where}: ID 문법 ${id} (${kind})`);
    if (seen.has(id)) errors.push(`${where}: ID 중복 ${id} (↔ ${seen.get(id)})`);
    seen.set(id, where);
  };
  for (const [k, set] of Object.entries(ids)) if (ID[k]) for (const id of set) reg(id, k, k);
  for (const id of ids.LEGACY) {
    if (seen.has(id)) errors.push(`legacy_codes 중복/충돌: ${id}`);
    seen.set(id, 'LEGACY');
  }
  // 3. 참조 무결성
  const ref = (id, where) => {
    const k = kindOf(id);
    if (!ids[k]) {
      errors.push(`${where}: 알 수 없는 참조 종류 ${id}`);
      return;
    }
    if (!ids[k].has(id)) errors.push(`${where}: 미정의 참조 ${id}`);
  };
  const refs = (arr, where) => {
    for (const id of arr ?? []) ref(id, where);
    return (arr ?? []).length;
  };
  let nrefs = 0;
  for (const s of d.screens.screens) {
    const w = `screens.${s.id}`;
    if (!ids.SURFACE.has(s.surface)) errors.push(`${w}: surface ${s.surface}`);
    for (const r of s.roles) if (!ids.ROLE.has(r)) errors.push(`${w}: role ${r}`);
    nrefs +=
      refs(s.trace.task, w + '.trace.task') +
      refs(s.trace.rfp, w + '.trace.rfp') +
      refs(s.trace.disc, w + '.trace.disc') +
      refs(s.trace.if, w + '.trace.if');
    if (s.trace.out) {
      ref(s.trace.out, w + '.trace.out');
      nrefs++;
    }
    for (const n of s.nav ?? []) ref(n.to, w + '.nav');
    if ('fr' in s) errors.push(`${w}: 'fr'는 저작 금지(빌드가 역색인)`);
    const stateIds = (s.states ?? []).map((x) => x.id);
    if (new Set(stateIds).size !== stateIds.length) errors.push(`${w}: state id 중복`);
    if (!stateIds.includes(s.default)) errors.push(`${w}: default '${s.default}' ∉ states`);
    if (s.wave <= (d.meta.current_wave ?? 0) && !s.route) errors.push(`${w}: wave ${s.wave} 화면은 route 필수`);
  }
  const routes = new Map();
  for (const s of d.screens.screens) {
    const k = `${s.surface}:${s.route}`;
    if (routes.has(k)) errors.push(`screens.${s.id}: route 중복 ${s.route} (↔ ${routes.get(k)})`);
    routes.set(k, s.id);
  }
  for (const f of d.requirements.fr) {
    const w = `fr.${f.id}`;
    nrefs +=
      refs(f.screens, w + '.screens') +
      refs(f.if, w + '.if') +
      refs(f.acc, w + '.acc') +
      refs(f.source?.rfp, w + '.source.rfp') +
      refs(f.source?.disc, w + '.source.disc') +
      refs(f.source?.sections, w + '.source.sections');
  }
  for (const i of d.interfaces.if)
    nrefs +=
      refs(i.screens, `if.${i.id}.screens`) +
      refs(i.basis?.disc, `if.${i.id}.basis.disc`) +
      refs(i.basis?.sections, `if.${i.id}.basis.sections`);
  for (const a of d.interfaces.api) nrefs += refs(a.if, `api.${a.id}.if`);
  for (const x of d.decisions.disc) nrefs += refs(x.scope, `disc.${x.id}.scope`);
  for (const a of d.contract.acceptance) nrefs += refs(a.outputs, `acc.${a.id}.outputs`);
  for (const o of d.contract.outputs) {
    ref(o.lead_wp, `out.${o.id}.lead_wp`);
    nrefs += 1 + refs(o.contrib_wp, `out.${o.id}.contrib_wp`);
  }
  for (const w of d.contract.wp) nrefs += refs(w.outputs, `wp.${w.id}.outputs`);
  for (const r of d.contract.rfp) nrefs += refs(r.screens, `rfp.${r.id}.screens`) + refs(r.disc, `rfp.${r.id}.disc`);
  for (const sec of d.contract.sections)
    for (const it of sec.items ?? []) nrefs += refs(it.screens, `sections.${sec.id}.items`);
  for (const m of d.contract.milestones) nrefs += refs(m.outputs, `milestones.${m.id}.outputs`);
  for (const ax of d.options.axes) nrefs += refs(ax.disc, `options.${ax.id}.disc`);
  for (const c of d.options.candidates) nrefs += refs(c.if, `options.candidates.${c.item}.if`);
  for (const o of d.scenarios.ops)
    nrefs += refs(o.screens, `ops.${o.when}.screens`) + refs(o.refs, `ops.${o.when}.refs`);
  for (const dm of d.scenarios.demo ?? [])
    nrefs += refs(dm.screens, `demo.${dm.scene}.screens`) + refs(dm.acc, `demo.${dm.scene}.acc`);
  for (const [name, m] of Object.entries(d.entities.machines ?? {})) {
    ref(m.entity, `machines.${name}.entity`);
    for (const t of m.transitions) {
      if (t.from !== '*' && !m.states.includes(t.from)) errors.push(`machines.${name}: from ${t.from}`);
      if (!m.states.includes(t.to)) errors.push(`machines.${name}: to ${t.to}`);
    }
  }
  // 4. DISC 생애주기 · 5. 고아 화면(FR 0건)
  for (const x of d.decisions.disc)
    if (x.status === 'decided' && !x.resolved) errors.push(`disc.${x.id}: decided 이면 resolved{date,by,summary} 필수`);
  const covered = new Set(d.requirements.fr.flatMap((f) => f.screens));
  for (const s of d.screens.screens) if (!covered.has(s.id)) warnings.push(`고아 화면(FR 0건): ${s.id} ${s.name}`);
  const openByTrack = { A: 0, B: 0, C: 0 };
  for (const x of d.decisions.disc) if (x.status === 'open') openByTrack[x.track]++;
  return {
    errors,
    warnings,
    nrefs,
    summary: `screens ${ids.SCR.size} · fr ${ids.FR.size} · disc open ${Object.values(openByTrack).reduce((a, b) => a + b, 0)} (A${openByTrack.A}/B${openByTrack.B}/C${openByTrack.C}) · refs ${nrefs}`,
  };
}

// ---- --specs
function frontmatter(md) {
  const m = /^---\n([\s\S]*?)\n---/.exec(md);
  return m ? YAML.parse(m[1]) : null;
}
export function checkSpecs(d) {
  const errors = [],
    ids = indexIds(d);
  const dir = join(ROOT, 'specs');
  let n = 0;
  if (!existsSync(dir)) return { errors, n };
  for (const feat of readdirSync(dir)) {
    const p = join(dir, feat, 'spec.md');
    if (!existsSync(p)) continue;
    n++;
    const md = readFileSync(p, 'utf8');
    const fm = frontmatter(md);
    if (!fm) {
      errors.push(`specs/${feat}: frontmatter 없음`);
      continue;
    }
    for (const k of ['id', 'status', 'wave', 'screens', 'fr'])
      if (!(k in fm)) errors.push(`specs/${feat}: frontmatter '${k}' 필수`);
    if (!['draft', 'approved', 'done'].includes(fm.status)) errors.push(`specs/${feat}: status ${fm.status}`);
    for (const s of fm.screens ?? []) if (!ids.SCR.has(s)) errors.push(`specs/${feat}: 미정의 화면 ${s}`);
    for (const f of fm.fr ?? []) if (!ids.FR.has(f)) errors.push(`specs/${feat}: 미정의 FR ${f}`);
    const ac = (md.match(/^\s*(?:-|\d+\.)\s*\*\*AC-\d+\*\*/gm) ?? []).length;
    if (ac < 3) errors.push(`specs/${feat}: 수용 기준(AC-n) ${ac}개 < 3`);
    for (const id of md.matchAll(ANY_ID)) {
      const k = kindOf(id[0]);
      if (ids[k] && !ids[k].has(id[0])) errors.push(`specs/${feat}: 미정의 ID ${id[0]}`);
    }
  }
  return { errors, n };
}
// ---- --docs
export function checkDocs(d) {
  const errors = [],
    ids = indexIds(d);
  const files = [];
  const walk = (dir) => {
    for (const e of readdirSync(dir)) {
      if (['node_modules', '.git', 'dist', '.svelte-kit', 'archive'].includes(e)) continue;
      const p = join(dir, e);
      if (statSync(p).isDirectory()) walk(p);
      else if (p.endsWith('.md')) files.push(p);
    }
  };
  walk(ROOT);
  const skip = /(^|\/)(docs\/generated|packages\/tokens\/dist|packages\/tokens\/src\/doc)\//;
  for (const f of files) {
    const rel = f.slice(ROOT.length + 1);
    if (skip.test(rel)) continue;
    const md = readFileSync(f, 'utf8').replace(/```[\s\S]*?```/g, '');
    for (const m of md.matchAll(/\]\(([^)#\s]+)(?:#[^)]*)?\)/g)) {
      const t = m[1];
      if (/^(https?:|mailto:)/.test(t)) continue;
      if (!existsSync(resolve(dirname(f), t))) errors.push(`${rel}: 깨진 링크 ${t}`);
    }
    for (const m of md.matchAll(ANY_ID)) {
      const k = kindOf(m[0]);
      if (ids[k] && !ids[k].has(m[0]) && !ids.LEGACY.has(m[0])) errors.push(`${rel}: 미정의 ID ${m[0]}`);
    }
  }
  return { errors, n: files.length };
}
// ---- --commits
export function checkCommits(d, range) {
  const errors = [],
    ids = indexIds(d);
  const log = execFileSync('git', ['log', '--format=%H%n%B%n==END==', range], { cwd: ROOT, encoding: 'utf8' });
  const commits = log
    .split('==END==')
    .map((s) => s.trim())
    .filter(Boolean);
  let n = 0;
  for (const c of commits) {
    n++;
    const refs = [...c.matchAll(/^Refs:\s*(.+)$/gm)].flatMap((m) => m[1].split(/[\s,·]+/));
    for (const r of refs) {
      const id = r.replace(/^SCR-/, '');
      const k = kindOf(id);
      if (ids[k] && !ids[k].has(id) && !ids.LEGACY.has(id)) errors.push(`${c.slice(0, 7)}: Refs 미정의 ${r}`);
    }
  }
  return { errors, n };
}

if (process.argv[1] && process.argv[1].endsWith('check.mjs')) {
  const d = loadSSOT();
  const args = process.argv.slice(2);
  let errors = [],
    line;
  if (args.includes('--specs')) {
    const r = checkSpecs(d);
    errors = r.errors;
    line = `specs ${r.n}`;
  } else if (args.includes('--docs')) {
    const r = checkDocs(d);
    errors = r.errors;
    line = `docs ${r.n}`;
  } else if (args.includes('--commits')) {
    const r = checkCommits(d, args[args.indexOf('--commits') + 1] ?? 'HEAD');
    errors = r.errors;
    line = `commits ${r.n}`;
  } else {
    const r = runChecks(d);
    errors = r.errors;
    line = r.summary;
    for (const w of r.warnings) console.log('  ⚠ ' + w);
  }
  for (const e of errors) console.log('  ✗ ' + e);
  console.log(`${errors.length ? '✗' : '✓'} ssot: ${line} · errors ${errors.length}`);
  process.exitCode = errors.length ? 1 : 0;
}
