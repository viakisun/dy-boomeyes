import { describe, expect, it } from 'vitest';
import ssot from './generated/ssot.json';
import { CPB_V0_1, parseSample, validateProtocol } from './protocol';

const proto = (
  ssot as {
    interfaces: { protocol: { version: string; sample: string; fields: { group: string; fields: string[] }[] } };
  }
).interfaces.protocol;
const sample = () => JSON.parse(proto.sample) as Record<string, unknown>;

describe('[FR-020] 프로토콜 정의 cpb.v0.1 ↔ ssot 대조', () => {
  it('버전과 그룹 10이 ssot interfaces.protocol과 같다', () => {
    expect(CPB_V0_1.version).toBe(proto.version);
    expect(CPB_V0_1.groups.map((g) => g.group)).toEqual(proto.fields.map((g) => g.group));
  });
  it('ssot 필드명은 전부 정의에 있다 (name 또는 alias)', () => {
    for (const g of proto.fields) {
      const spec = CPB_V0_1.groups.find((x) => x.group === g.group);
      const names = new Set(spec?.fields.flatMap((f) => [f.name, f.alias]));
      for (const name of g.fields) expect(names.has(name), `${g.group}.${name}`).toBe(true);
    }
  });
  it('정의 자체가 검증을 통과한다 · 깨진 정의는 행 경로와 사유를 낸다', () => {
    expect(validateProtocol(CPB_V0_1)).toEqual({ ok: true, errors: [] });
    const broken = {
      version: 'v1',
      groups: [{ group: '', key: 'x', required: 'yes', fields: [{ name: 'a', type: 'int' }] }],
    };
    const r = validateProtocol(broken);
    expect(r.ok).toBe(false);
    expect(r.errors.map((e) => e.path)).toEqual(
      expect.arrayContaining(['version', 'groups[0].group', 'groups[0].required', 'groups[0].fields[0].type']),
    );
  });
});

describe('[FR-020] 샘플 파싱 (정상 · 필드 누락 · 타입 오류)', () => {
  it('ssot 샘플은 정상 — 알림 0', () => {
    const r = parseSample(CPB_V0_1, sample());
    expect(r.errors).toEqual([]);
    expect(r.ok).toBe(true);
    expect(r.alerts).toEqual([]);
  });
  it('필수 필드 누락 → 경로·사유', () => {
    const s = sample();
    delete (s.gps as Record<string, unknown>).latitude;
    delete s.power;
    const r = parseSample(CPB_V0_1, s);
    expect(r.ok).toBe(false);
    expect(r.errors).toEqual(
      expect.arrayContaining([
        { path: 'gps.latitude', reason: '필수 필드 누락' },
        { path: 'power', reason: '필수 그룹 누락 (전압)' },
      ]),
    );
  });
  it('타입·허용값 오류 → 경로·사유, 정의에 없는 필드는 경고', () => {
    const s = sample();
    (s.power as Record<string, unknown>).voltage_value = '380';
    (s.gps as Record<string, unknown>).fix_status = 'lost';
    (s.io as Record<string, unknown>[])[0]!.extra = 1;
    const r = parseSample(CPB_V0_1, s);
    expect(r.errors).toEqual(
      expect.arrayContaining([
        { path: 'power.voltage_value', reason: '타입 number 필요, string' },
        { path: 'gps.fix_status', reason: '허용값 fixed|no-fix, 받은 값 lost' },
      ]),
    );
    expect(r.warnings).toEqual([{ path: 'io[0].extra', reason: '정의에 없는 필드(무시)' }]);
  });
  it('버전 불일치는 오류', () => {
    const s = sample();
    s.protocol_version = 'cpb.v0.2';
    expect(parseSample(CPB_V0_1, s).errors).toContainEqual({
      path: 'protocol_version',
      reason: '정의 버전 cpb.v0.1과 다름',
    });
  });
  it('[FR-011] 이상 샘플 → 알림 미리보기 (고장코드 · 전압 · 단선 · 통신 · 수송관 임계)', () => {
    const s = sample();
    s.error = { error_code: 'E-021', severity: 'critical' };
    s.power = { voltage_status: 'abnormal', voltage_value: 342 };
    s.harness = { disconnected: true };
    s.network = { type: 'LTE', status: 'lost' };
    s.consumables = [{ part_type: 'pipe', usage_value: 96, threshold: 100 }];
    const r = parseSample(CPB_V0_1, s);
    expect(r.ok).toBe(true);
    expect(r.alerts.map((a) => `${a.kind}:${a.severity}`)).toEqual([
      'error:critical',
      'voltage:critical',
      'harness:critical',
      'comm:warning',
      'pipe:warning',
    ]);
  });
});
