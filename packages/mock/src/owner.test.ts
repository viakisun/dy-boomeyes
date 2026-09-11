import { describe, expect, it } from 'vitest';
import { ownerMatches, ownerSummary, type Session } from '@boomeyes/domain';
import { createOwnerApi, seedOwner } from './owner';

const A = { role: 'owner', ownerId: 'OWN-001' } as const;
const B = { role: 'owner', ownerId: 'OWN-002' } as const;
const make = (
  session: Pick<Session, 'role' | 'ownerId'> | null = A,
  dataset: 'owner' | 'empty' | 'boundaries' | 'large' = 'owner',
) => createOwnerApi(session, { dataset, latencyMs: 0 });

describe('[FR-024] 소유주 자료 경계', () => {
  it.each([
    null,
    { role: 'control' as const },
    { role: 'owner' as const },
    { role: 'owner' as const, ownerId: '' },
    { role: 'owner' as const, ownerId: 'OWN-999' },
  ])('권한 결측을 전체 조회로 바꾸지 않는다: %j', async (session) => {
    const api = make(session);
    await expect(api.snapshot()).rejects.toThrow('소유주 계정');
    await expect(api.device('CPB-001')).rejects.toThrow();
    await expect(api.document('CPB-001-CERT')).rejects.toThrow();
    await expect(api.camera('CPB-001-pour')).rejects.toThrow();
    await expect(api.alert('CPB-002-FAULT')).rejects.toThrow();
    await expect(api.markRead('CPB-002-FAULT')).rejects.toThrow();
  });
  it('A/B 장비와 모든 연결 자료는 교차 조회되지 않는다', async () => {
    const a = make();
    const b = make(B);
    const sa = await a.snapshot();
    const sb = await b.snapshot();
    expect(sa.devices.map((d) => d.id)).toEqual(['CPB-001', 'CPB-002', 'CPB-003', 'CPB-004', 'CPB-005']);
    expect(sb.devices.map((d) => d.id)).toEqual(['CPB-101']);
    expect(sa.documents).toHaveLength(10);
    expect(sb.documents).toHaveLength(2);
    expect(sb.alerts.map((a) => a.id)).toEqual(['CPB-101-FAULT']);
    for (const [api, prefix] of [
      [a, 'CPB-101'],
      [b, 'CPB-002'],
    ] as const) {
      await expect(api.device(prefix)).rejects.toThrow();
      await expect(api.document(`${prefix}-CERT`)).rejects.toThrow();
      await expect(api.camera(`${prefix}-pour`)).rejects.toThrow();
      await expect(api.alert(`${prefix}-FAULT`)).rejects.toThrow();
      await expect(api.markRead(`${prefix}-FAULT`)).rejects.toThrow();
      await expect(
        api.attach(prefix, { name: 'a.pdf', type: 'application/pdf', size: 20, url: 'blob:test' }),
      ).rejects.toThrow();
    }
    expect(JSON.stringify(sa)).not.toContain('두번째건설');
    expect(JSON.stringify(sa)).not.toContain('타사 담당자');
    expect(sb.devices[0]!.contract?.company).toBe('두번째건설');
    expect(sb.devices[0]!.voltage).toBe(342);
  });
  it('응답·세션 참조의 후속 변경은 API 권한·원천을 바꾸지 않는다', async () => {
    const session = { ...A, ownerId: 'OWN-001' };
    const api = make(session);
    session.ownerId = 'OWN-002';
    const first = await api.snapshot();
    first.devices[0]!.site = '변조';
    first.documents.length = 0;
    const next = await api.snapshot();
    expect(next.devices[0]!.site).toBe('마포 주상복합 신축');
    expect(next.documents).toHaveLength(10);
  });
});

describe('[FR-025] 배치·이상·정보 시각의 독립성', () => {
  it('5=4+1+0, 확인은 3대/3건이며 보관은 이상으로 더하지 않는다', async () => {
    const s = await make().snapshot();
    expect(ownerSummary(s.devices, s.alerts)).toEqual({
      total: 5,
      deployed: 4,
      stored: 1,
      unknown: 0,
      attention: 3,
      alerts: 3,
    });
    expect(s.devices[4]!).toMatchObject({
      deployment: 'stored',
      connection: 'detached',
      receivedAt: null,
      voltage: null,
    });
    expect(s.devices[3]!).toMatchObject({ connection: 'stale', receivedAt: '2026-07-03T08:22:00+09:00' });
  });
  it('중복 알림과 한 호기의 여러 이상을 장비 대수에 중복 합산하지 않는다', async () => {
    const s = await make(A, 'boundaries').snapshot();
    expect(ownerSummary(s.devices, [...s.alerts, ...s.alerts])).toEqual({
      total: 5,
      deployed: 3,
      stored: 1,
      unknown: 1,
      attention: 3,
      alerts: 4,
    });
    expect(s.devices[0]!).toMatchObject({
      location: null,
      voltage: null,
      contract: null,
      contact: null,
      connection: 'unintegrated',
    });
    expect(s.devices[1]!.parts[0]).toMatchObject({ due: true, measured: '누적 타설량 9,800 m³' });
  });
  it('정상·보관 장비도 호기와 현장으로 검색한다', async () => {
    const s = await make().snapshot();
    expect(s.devices.filter((d) => ownerMatches(d, '마포', 'all')).map((d) => d.unit)).toEqual([1]);
    expect(s.devices.filter((d) => ownerMatches(d, '5호기', 'stored')).map((d) => d.unit)).toEqual([5]);
    expect(s.devices.filter((d) => ownerMatches(d, '없는 현장', 'all'))).toEqual([]);
  });
  it('읽음 처리는 이상·점검·집계를 해소하지 않는다', async () => {
    const api = make();
    await api.markRead('CPB-002-FAULT');
    const s = await api.snapshot();
    expect(s.alerts[0]!.read).toBe(true);
    expect(s.devices[1]!.fault).toBe('공급 전압 저하');
    expect(ownerSummary(s.devices, s.alerts).attention).toBe(3);
  });
  it('120대 성능 세트와 빈 세트는 기본 시드를 바꾸지 않는다', async () => {
    expect((await make(A, 'large').snapshot()).devices).toHaveLength(120);
    expect((await make(A, 'empty').snapshot()).devices).toHaveLength(0);
    expect((await make().snapshot()).devices).toHaveLength(5);
    expect(seedOwner().devices).toHaveLength(6);
  });
});

describe('[FR-016] 시연 첨부와 재시도', () => {
  it('첨부 확정은 해당 세션에만 추가되고 새 API는 초기화된다', async () => {
    const api = make();
    const doc = await api.attach('CPB-001', {
      name: '확인.pdf',
      type: 'application/pdf',
      size: 200,
      url: 'blob:demo',
      previewUrl: 'blob:preview',
    });
    expect(await api.document(doc.id)).toMatchObject({
      deviceId: 'CPB-001',
      previewUrl: 'blob:preview',
      sessionOnly: true,
    });
    expect((await api.snapshot()).documents).toHaveLength(11);
    expect((await make().snapshot()).documents).toHaveLength(10);
  });
  it('오프라인·크기 초과·원문 주소 부적합은 성공으로 기록하지 않는다', async () => {
    const offline = createOwnerApi(A, { latencyMs: 0, offline: () => true });
    const file = { name: 'a.png', type: 'image/png' as const, size: 100, url: 'blob:test' };
    await expect(offline.attach('CPB-001', file)).rejects.toThrow('오프라인');
    const api = make();
    await expect(api.attach('CPB-001', { ...file, size: 11 * 1024 * 1024 })).rejects.toThrow();
    await expect(api.attach('CPB-001', { ...file, url: 'https://example.invalid' })).rejects.toThrow();
    expect((await api.snapshot()).documents).toHaveLength(10);
  });
  it('조회 오류 뒤 재시도는 실제 자료를 반환한다', async () => {
    const api = createOwnerApi(A, { error: true, latencyMs: 0 });
    await expect(api.snapshot()).rejects.toThrow('불러오지');
    expect((await api.snapshot()).devices).toHaveLength(5);
  });
});
