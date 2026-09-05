// 프로토콜 정의 검증 · 샘플 파싱 · 알림 미리보기 (cpb.v0.1 = ssot interfaces.protocol · FR-020 · specs/admin-protocol-rules).
// 정의는 코드 스키마(그룹 → JSON 키 · 필드 타입). ssot의 필드명은 `name`/`alias`로 전부 덮는다(protocol.test.ts가 대조).
import type { Alert, Severity } from './types';

export type FieldType = 'string' | 'number' | 'boolean' | 'any';
export interface FieldSpec {
  /** ssot 필드명 */
  name: string;
  /** 샘플 JSON 키가 ssot 필드명과 다를 때 (별첨 JSON v1.0 vs 프로토콜 시트 불일치 — 설계서 2.6) */
  alias?: string;
  type: FieldType;
  /** 숫자 필드의 단위(V · m · dBm · m³ …) — number 타입은 필수 (AC-2 단위 검증) */
  unit?: string;
  required?: boolean;
  nullable?: boolean;
  enum?: readonly string[];
  min?: number;
  max?: number;
}
export interface GroupSpec {
  /** ssot 그룹명 */
  group: string;
  /** 샘플 JSON 키 — null이면 최상위 */
  key: string | null;
  list?: boolean;
  required: boolean;
  fields: FieldSpec[];
}
export interface ProtocolDef {
  version: string;
  groups: GroupSpec[];
}
export interface Issue {
  path: string;
  reason: string;
}
export interface ParseResult {
  ok: boolean;
  errors: Issue[];
  warnings: Issue[];
  /** 이 샘플이 발생시킬 알림 (B4-02 샘플 테스트 미리보기) */
  alerts: { kind: Alert['kind']; severity: Severity; message: string }[];
}

const s = (name: string, o: Partial<FieldSpec> = {}): FieldSpec => ({ name, type: 'string', ...o });
const n = (name: string, o: Partial<FieldSpec> = {}): FieldSpec => ({ name, type: 'number', ...o });
const b = (name: string, o: Partial<FieldSpec> = {}): FieldSpec => ({ name, type: 'boolean', ...o });

/** cpb.v0.1 — ssot interfaces.protocol.fields 10그룹. 영상 메타는 샘플에 없어 선택(현장 프로파일 별도, DISC-029). */
export const CPB_V0_1: ProtocolDef = {
  version: 'cpb.v0.1',
  groups: [
    {
      group: '공통 헤더',
      key: null,
      required: true,
      fields: [
        s('protocol_version', { required: true }),
        s('device_id', { required: true }),
        s('controller_id', { required: true }),
        s('site_id', { required: true }),
        s('timestamp', { required: true }),
        n('sequence', { unit: 'count' }),
      ],
    },
    {
      group: 'GPS',
      key: 'gps',
      required: true,
      fields: [
        n('latitude', { required: true, min: -90, max: 90, unit: 'deg' }),
        n('longitude', { required: true, min: -180, max: 180, unit: 'deg' }),
        n('accuracy', { unit: 'm' }),
        n('speed', { unit: 'km/h' }),
        n('heading', { unit: 'deg' }),
        s('fix_status', { enum: ['fixed', 'no-fix'] }),
      ],
    },
    {
      group: 'LTE/Wi-Fi',
      key: 'network',
      required: true,
      fields: [
        s('network_type', { alias: 'type', required: true }),
        n('signal_strength', { unit: 'dBm' }),
        s('carrier'),
        s('ip_address'),
        s('last_connected_at'),
        s('status', { enum: ['connected', 'degraded', 'lost'] }),
      ],
    },
    {
      group: 'CAN',
      key: 'can',
      list: true,
      required: true,
      fields: [
        s('can_channel', { alias: 'channel', required: true }),
        s('can_id', { required: true }),
        s('signal_name', { required: true }),
        { name: 'raw_value', type: 'any' },
        { name: 'parsed_value', type: 'any' },
        s('unit'),
        s('status'),
      ],
    },
    {
      group: 'IO',
      key: 'io',
      list: true,
      required: true,
      fields: [
        s('channel', { required: true }),
        s('direction', { enum: ['input', 'output'] }),
        n('value', { required: true, unit: 'level' }),
        s('status'),
      ],
    },
    {
      group: '전압',
      key: 'power',
      required: true,
      fields: [
        s('voltage_status', { required: true, enum: ['normal', 'abnormal'] }),
        n('voltage_value', { required: true, unit: 'V' }),
        s('phase_status'),
        s('alert_level'),
      ],
    },
    {
      group: '단선',
      key: 'harness',
      required: true,
      fields: [s('harness_id'), s('channel'), b('disconnected', { required: true }), s('detected_at')],
    },
    {
      group: '고장코드',
      key: 'error',
      required: true,
      fields: [
        s('error_code', { nullable: true }),
        s('error_name'),
        s('severity', { required: true, enum: ['none', 'info', 'warning', 'critical'] }),
        s('message'),
        s('source'),
      ],
    },
    {
      group: '수송관/필터',
      key: 'consumables',
      list: true,
      required: true,
      fields: [
        s('part_type', { required: true, enum: ['pipe', 'filter'] }),
        n('usage_value', { required: true, unit: 'm³' }),
        n('threshold', { required: true, unit: 'm³' }),
        n('remaining_ratio', { unit: 'ratio' }),
        b('alert_required'),
      ],
    },
    {
      group: '영상 메타데이터',
      key: 'video',
      required: false,
      fields: [
        s('camera_id', { required: true }),
        s('유형(general/ai)', { alias: 'kind', enum: ['general', 'ai'] }),
        s('ingest_type', { enum: ['E1', 'E2', 'E3', 'E4', 'E5'] }),
        s('stream_url'),
        s('retention(현장별)', { alias: 'retention' }),
      ],
    },
  ],
};

const VERSION_RE = /^cpb\.v\d+\.\d+$/;
const TYPES: FieldType[] = ['string', 'number', 'boolean', 'any'];
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** 정의 파일(YAML/JSON → 객체) 구조 검증 — B4-02 업로드 */
export function validateProtocol(def: unknown): { ok: boolean; errors: Issue[] } {
  const errors: Issue[] = [];
  if (!isObj(def)) return { ok: false, errors: [{ path: '', reason: '객체가 아닙니다' }] };
  if (typeof def.version !== 'string' || !VERSION_RE.test(def.version))
    errors.push({ path: 'version', reason: '형식 cpb.v<major>.<minor> 필요' });
  if (!Array.isArray(def.groups) || def.groups.length === 0) {
    errors.push({ path: 'groups', reason: '그룹 1개 이상 필요' });
    return { ok: false, errors };
  }
  const keys = new Set<string>();
  def.groups.forEach((g, i) => {
    const p = `groups[${i}]`;
    if (!isObj(g)) return void errors.push({ path: p, reason: '객체가 아닙니다' });
    if (typeof g.group !== 'string' || !g.group) errors.push({ path: `${p}.group`, reason: '그룹명 필요' });
    if (g.key !== null && typeof g.key !== 'string')
      errors.push({ path: `${p}.key`, reason: 'key는 문자열 또는 null' });
    const k = g.key === null ? '(root)' : String(g.key);
    if (keys.has(k)) errors.push({ path: `${p}.key`, reason: `key 중복: ${k}` });
    keys.add(k);
    if (typeof g.required !== 'boolean') errors.push({ path: `${p}.required`, reason: 'required는 boolean' });
    if (!Array.isArray(g.fields) || g.fields.length === 0)
      return void errors.push({ path: `${p}.fields`, reason: '필드 1개 이상 필요' });
    const names = new Set<string>();
    g.fields.forEach((f, j) => {
      const fp = `${p}.fields[${j}]`;
      if (!isObj(f)) return void errors.push({ path: fp, reason: '객체가 아닙니다' });
      if (typeof f.name !== 'string' || !f.name) errors.push({ path: `${fp}.name`, reason: '필드명 필요' });
      else if (names.has(f.name)) errors.push({ path: `${fp}.name`, reason: `필드명 중복: ${f.name}` });
      names.add(String(f.name));
      if (!TYPES.includes(f.type as FieldType))
        errors.push({ path: `${fp}.type`, reason: `타입은 ${TYPES.join('|')}` });
      if (f.type === 'number' && (typeof f.unit !== 'string' || !f.unit))
        errors.push({ path: `${fp}.unit`, reason: '숫자 필드는 단위(unit) 필요' });
      if (f.enum !== undefined && (!Array.isArray(f.enum) || f.enum.some((e) => typeof e !== 'string')))
        errors.push({ path: `${fp}.enum`, reason: 'enum은 문자열 배열' });
    });
  });
  return { ok: errors.length === 0, errors };
}

function checkField(f: FieldSpec, value: unknown, path: string, errors: Issue[]) {
  if (value === undefined) {
    if (f.required) errors.push({ path, reason: '필수 필드 누락' });
    return;
  }
  if (value === null) {
    if (!f.nullable) errors.push({ path, reason: 'null 불가' });
    return;
  }
  if (f.type !== 'any' && typeof value !== f.type)
    return void errors.push({ path, reason: `타입 ${f.type} 필요, ${typeof value}` });
  if (f.enum && !f.enum.includes(String(value)))
    errors.push({ path, reason: `허용값 ${f.enum.join('|')}, 받은 값 ${String(value)}` });
  if (typeof value === 'number') {
    if (f.min !== undefined && value < f.min) errors.push({ path, reason: `최소 ${f.min}` });
    if (f.max !== undefined && value > f.max) errors.push({ path, reason: `최대 ${f.max}` });
  }
}

function checkObject(g: GroupSpec, obj: Record<string, unknown>, path: string, r: ParseResult) {
  const known = new Set<string>();
  for (const f of g.fields) {
    const key = f.alias ?? f.name;
    known.add(key);
    checkField(f, obj[key], path ? `${path}.${key}` : key, r.errors);
  }
  if (g.key !== null)
    for (const k of Object.keys(obj))
      if (!known.has(k)) r.warnings.push({ path: `${path}.${k}`, reason: '정의에 없는 필드(무시)' });
}

/** 샘플 JSON 파싱 — 필수·타입·허용값 검사 + 알림 미리보기 (B4-02 샘플 테스트) */
export function parseSample(def: ProtocolDef, sample: unknown): ParseResult {
  const r: ParseResult = { ok: true, errors: [], warnings: [], alerts: [] };
  if (!isObj(sample)) return { ...r, ok: false, errors: [{ path: '', reason: 'JSON 객체가 아닙니다' }] };
  const groupKeys = new Set(def.groups.map((g) => g.key).filter((k): k is string => k !== null));
  for (const g of def.groups) {
    if (g.key === null) {
      checkObject(g, sample, '', r);
      continue;
    }
    const v = sample[g.key];
    if (v === undefined) {
      if (g.required) r.errors.push({ path: g.key, reason: `필수 그룹 누락 (${g.group})` });
      continue;
    }
    if (g.list) {
      if (!Array.isArray(v)) {
        r.errors.push({ path: g.key, reason: '배열 필요' });
        continue;
      }
      v.forEach((item, i) =>
        isObj(item)
          ? checkObject(g, item, `${g.key}[${i}]`, r)
          : r.errors.push({ path: `${g.key}[${i}]`, reason: '객체 필요' }),
      );
    } else if (isObj(v)) checkObject(g, v, g.key, r);
    else r.errors.push({ path: g.key, reason: '객체 필요' });
  }
  const root = def.groups.find((g) => g.key === null);
  for (const k of Object.keys(sample))
    if (!groupKeys.has(k) && !root?.fields.some((f) => (f.alias ?? f.name) === k))
      r.warnings.push({ path: k, reason: '정의에 없는 그룹(무시)' });
  if (typeof sample.protocol_version === 'string' && sample.protocol_version !== def.version)
    r.errors.push({ path: 'protocol_version', reason: `정의 버전 ${def.version}과 다름` });
  r.ok = r.errors.length === 0;
  // 오류가 있어도 파싱 가능한 값에서 발생할 알림을 미리 본다(D4 장면 8: 오류 샘플 → 알림 확인). 타입이 틀린 값은 previewAlerts가 무시
  r.alerts = previewAlerts(sample);
  return r;
}

const SEV: Record<string, Severity> = { critical: 'critical', warning: 'warning', info: 'info' };
/** 샘플에서 발생할 알림 — 알림 8종 중 텔레메트리 유래 6종(FR-011). 타입이 맞는 값만 본다(오류 샘플에서도 best-effort) */
export function previewAlerts(sample: Record<string, unknown>): ParseResult['alerts'] {
  const out: ParseResult['alerts'] = [];
  const obj = (v: unknown) => (isObj(v) ? v : undefined);
  const err = obj(sample.error);
  if (typeof err?.error_code === 'string' && err.error_code)
    out.push({
      kind: 'error',
      severity: SEV[String(err.severity ?? '')] ?? 'critical',
      message: `고장코드 ${err.error_code}`,
    });
  const power = obj(sample.power);
  if (power?.voltage_status === 'abnormal')
    out.push({
      kind: 'voltage',
      severity: 'critical',
      message: `380V 전압 이상 (${typeof power.voltage_value === 'number' ? power.voltage_value : '-'}V)`,
    });
  const harness = obj(sample.harness);
  if (harness?.disconnected === true) out.push({ kind: 'harness', severity: 'critical', message: '하네스 단선' });
  const net = obj(sample.network);
  if (net?.status === 'lost' || net?.status === 'degraded')
    out.push({ kind: 'comm', severity: 'warning', message: `통신 ${net.status}` });
  const gps = obj(sample.gps);
  if (gps?.fix_status === 'no-fix') out.push({ kind: 'gps', severity: 'info', message: 'GPS 미수신' });
  const parts = Array.isArray(sample.consumables) ? sample.consumables.filter(isObj) : [];
  for (const p of parts) {
    const usage = typeof p.usage_value === 'number' ? p.usage_value : 0;
    const threshold = typeof p.threshold === 'number' ? p.threshold : 0;
    const ratio = threshold ? usage / threshold : 0;
    if (p.alert_required === true || ratio >= 0.9)
      out.push({
        kind: p.part_type === 'filter' ? 'filter' : 'pipe',
        severity: ratio >= 1 ? 'critical' : 'warning',
        message: `${p.part_type === 'filter' ? '필터' : '수송관'} 도달률 ${Math.round(ratio * 100)}%`,
      });
  }
  return out;
}
