import { describe, expect, it } from 'vitest';
import { OWNER_DOC_KINDS, ownerMatches, ownerStrip, ownerSummary, type Session } from '@boomeyes/domain';
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
    expect(sa.devices).toHaveLength(120);
    expect(sa.devices.slice(0, 5).map((d) => d.id)).toEqual(['CPB-001', 'CPB-002', 'CPB-003', 'CPB-004', 'CPB-005']);
    expect(sa.devices.some((d) => d.id === 'CPB-101')).toBe(false);
    expect(sa.devices.some((d) => d.id === 'CPB-121')).toBe(true);
    expect(sa.sites).toHaveLength(13);
    expect(sb.devices.map((d) => d.id)).toEqual(['CPB-101']);
    expect(sb.sites.map((s) => s.id)).toEqual(['SITE-OTHER']);
    // 서류 수는 종류가 늘면 바뀐다 — 지킬 값은 「내 장비의 것만 보인다」는 경계다
    const idsA = new Set(sa.devices.map((d) => d.id));
    expect(sa.documents.length).toBeGreaterThan(0);
    expect(sa.documents.every((doc) => idsA.has(doc.deviceId))).toBe(true);
    expect(new Set(sb.documents.map((doc) => doc.deviceId))).toEqual(new Set(['CPB-101']));
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
    expect(next.documents.every((doc) => doc.deviceId.startsWith('CPB-'))).toBe(true);
  });
});

describe('[FR-025] 배치·이상·정보 시각의 독립성', () => {
  it('120=103+17+0, 확인은 6대/6건이며 보관은 이상으로 더하지 않는다', async () => {
    const s = await make().snapshot();
    expect(ownerSummary(s.devices, s.alerts)).toEqual({
      total: 120,
      deployed: 103,
      stored: 17,
      unknown: 0,
      attention: 6,
      alerts: 6,
    });
    expect(ownerStrip(s.devices)).toEqual({
      total: 120,
      running: 97,
      inspection: 2,
      fault: 2,
      stale: 2,
      stored: 17,
      unknown: 0,
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
      total: 120,
      deployed: 102,
      stored: 17,
      unknown: 1,
      attention: 6,
      alerts: 7,
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
  it('소모품 6종은 마모율과 잔여일 두 축을 갖고 점검 호기의 수송관만 한계에 붙는다', async () => {
    const s = await make().snapshot();
    for (const d of s.devices) {
      expect(d.parts.map((p) => p.name)).toEqual([
        '수송관',
        '엘보',
        '고무 호스',
        'S밸브 웨어링',
        '유압유',
        '유압 필터',
      ]);
      for (const part of d.parts) {
        if (part.kind === 'wear') {
          expect(part.limit).toBe(80);
          expect(part.value).toBeGreaterThan(0);
          expect(part.value).toBeLessThanOrEqual(80);
        } else {
          expect(part.limit).toBeNull();
          expect(part.value).toBeGreaterThan(0);
        }
      }
    }
    // 점검 대상(CPB-003)의 수송관은 한계 근처, 그 밖은 여유가 있다
    const inspected = s.devices.find((d) => d.inspection)!;
    expect(inspected.parts[0]!.value).toBeGreaterThanOrEqual(76);
    const normal = s.devices.find((d) => !d.inspection && d.deployment === 'deployed')!;
    expect(normal.parts[0]!.value).toBeLessThan(76);
  });
  it('호기 지표 6은 수신 중일 때만 값을 갖고 보관·지연은 미연동이다', async () => {
    const s = await make().snapshot();
    const keys = ['voltageV', 'hydraulicBar', 'oilTempC', 'boomAngleDeg', 'pouredTodayM3', 'runHours'] as const;
    const live = s.devices.find((d) => d.deployment === 'deployed' && d.connection === 'current' && !d.fault)!;
    for (const k of keys) expect(live.telemetry[k]).not.toBeNull();
    // 전압 지표는 장비 전압과 같은 값을 읽는다 — 두 곳이 갈리면 화면이 서로 다른 수를 보인다
    expect(live.telemetry.voltageV).toBe(live.voltage);
    for (const d of s.devices.filter((x) => x.deployment === 'stored' || x.connection === 'stale'))
      for (const k of keys) expect(d.telemetry[k]).toBeNull();
    // 전압 저하 고장(CPB-003 계열)은 지표에도 같은 값으로 나타난다
    const low = s.devices.find((d) => d.errorCode === 'E-021');
    if (low) expect(low.telemetry.voltageV).toBe(low.voltage);
  });
  it('호기 카메라는 6대(바디캠 3 · CCTV 2 · AI 1)이고 전부 시연 클립임을 밝힌다', async () => {
    const s = await make().snapshot();
    const d = s.devices.find((x) => x.connection === 'current')!;
    const cams = s.cameras.filter((c) => c.deviceId === d.id);
    expect(cams.map((c) => c.label)).toEqual(['바디캠 A', '바디캠 B', '바디캠 C', 'CCTV 1', 'CCTV 2', 'AI CCTV']);
    expect(cams.filter((c) => c.kind === 'body')).toHaveLength(3);
    expect(cams.filter((c) => c.kind === 'cctv')).toHaveLength(2);
    expect(cams.filter((c) => c.kind === 'ai')).toHaveLength(1);
    // 실 스트림인 척하지 않는다 — 소스가 둘뿐이라 여섯 타일이 같은 클립을 돈다
    expect(cams.every((c) => c.sample)).toBe(true);
    expect(new Set(cams.map((c) => c.url)).size).toBe(2);
    // 보관·두절 장비의 카메라는 가용하지 않다
    const stored = s.devices.find((x) => x.deployment === 'stored')!;
    expect(s.cameras.filter((c) => c.deviceId === stored.id).every((c) => !c.available)).toBe(true);
  });
  it('차량 서류는 7종이고 원문 없는 것은 목록·만료만 갖는다', async () => {
    const s = await make().snapshot();
    const docs = s.documents.filter((d) => d.deviceId === 'CPB-001' && !d.sessionOnly);
    expect(docs.map((d) => d.kind)).toEqual([...OWNER_DOC_KINDS]);
    // 실 파일이 있는 둘만 원문을 갖고 나머지는 null — 없는 파일을 지어내지 않는다
    expect(docs.filter((d) => d.url !== null).map((d) => d.kind)).toEqual(['제작증', '비파괴 검사 성적서']);
    for (const doc of docs.filter((d) => d.url === null)) expect(doc.issuedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    // 운전자 자격증은 호기 서류가 아니다 — 사람 축으로 옮겼다(시안 «확정 2026-09-12»)
    expect(docs.some((d) => String(d.kind).includes('자격'))).toBe(false);
  });
  it('AI 경고는 그 시각 배정 운전자를 함께 기록한다', async () => {
    const s = await make().snapshot();
    expect(s.aiEvents.length).toBeGreaterThan(0);
    for (const ev of s.aiEvents) {
      const device = s.devices.find((d) => d.id === ev.deviceId)!;
      expect(device.connection).toBe('current');
      // 사람 문제이므로 운전자를 남긴다(FR-027 · 시안 «확정 2026-09-12»)
      expect(ev.driver).toEqual(device.driver ? { id: device.driver.id, name: device.driver.name } : null);
      expect(ev.driver).not.toBeNull();
      expect(s.cameras.some((c) => c.id === ev.cameraId && c.kind === 'ai')).toBe(true);
      expect(ev.bbox).not.toBeNull();
    }
  });
  it('오늘 운전자는 투입 장비에만 배정된다', async () => {
    const s = await make().snapshot();
    for (const d of s.devices)
      if (d.deployment === 'stored') expect(d.driver).toBeNull();
      else expect(d.driver).toMatchObject({ id: expect.stringMatching(/^DRV-\d{3}$/), name: expect.any(String) });
  });
  it('정상·보관 장비도 호기와 현장으로 검색한다', async () => {
    const s = await make().snapshot();
    expect(s.devices.filter((d) => ownerMatches(d, '마포', 'all')).map((d) => d.unit)).toEqual([1, 6, 7, 8, 9]);
    expect(s.devices.filter((d) => ownerMatches(d, '5호기', 'stored')).map((d) => d.unit)).toEqual([5]);
    expect(s.devices.filter((d) => ownerMatches(d, '없는 현장', 'all'))).toEqual([]);
  });
  it('상태 띠의 «가동 중» 수와 목록의 running 필터 결과가 같다', async () => {
    // 띠의 숫자를 눌러 목록으로 가면 그만큼 나와야 한다 — 예전에는 띠가 분류 잔여값을 세고
    // 링크는 투입 전체로 가서 어긋났다(97 vs 101).
    const s = await make().snapshot();
    const strip = ownerStrip(s.devices);
    const listed = s.devices.filter((d) => ownerMatches(d, '', 'running'));
    expect(listed).toHaveLength(strip.running);
    expect(listed.every((d) => d.deployment === 'deployed' && !d.fault && !d.inspection)).toBe(true);
    // 투입 전체는 가동 중보다 많다 — 두 필터가 다른 것을 뜻한다
    expect(s.devices.filter((d) => ownerMatches(d, '', 'deployed')).length).toBeGreaterThan(strip.running);
  });
  it('읽음 처리는 이상·점검·집계를 해소하지 않는다', async () => {
    const api = make();
    await api.markRead('CPB-002-FAULT');
    const s = await api.snapshot();
    expect(s.alerts[0]!.read).toBe(true);
    expect(s.devices[1]!.fault).toBe('공급 전압 저하');
    expect(ownerSummary(s.devices, s.alerts).attention).toBe(6);
  });
  it('large는 기본 세트의 별칭이고 빈 세트는 장비·현장이 없다', async () => {
    const owner = await make().snapshot();
    const large = await make(A, 'large').snapshot();
    expect(large.devices).toHaveLength(120);
    expect({ ...large, dataset: 'owner' }).toEqual(owner);
    expect((await make(A, 'empty').snapshot()).devices).toHaveLength(0);
    expect((await make(A, 'empty').snapshot()).sites).toHaveLength(0);
    expect(seedOwner().devices).toHaveLength(121);
  });
  it('모든 호기는 실존 현장에 속하고 현장 좌표 근처에 있으며 보관은 보관소에만 있다', () => {
    const s = seedOwner();
    const sites = new Map(s.sites.map((site) => [site.id, site]));
    for (const d of s.devices) {
      const site = sites.get(d.siteId)!;
      expect(site, d.id).toBeDefined();
      expect(d.site).toBe(site.name);
      expect(Math.abs(d.location!.lat - site.location.lat)).toBeLessThan(0.01);
      expect(Math.abs(d.location!.lng - site.location.lng)).toBeLessThan(0.01);
      expect(d.deployment === 'stored').toBe(site.kind === 'depot');
      expect(d.errorCode !== null).toBe(d.fault !== null);
    }
    expect(s.devices.filter((d) => d.location!.lat === 37.55 && d.location!.lng === 126.94).map((d) => d.id)).toEqual([
      'CPB-001',
    ]);
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
    // 첨부는 그 세션에만 한 건 늘어난다 — 총수가 아니라 증가분과 격리를 본다
    const base = (await make().snapshot()).documents.length;
    expect((await api.snapshot()).documents).toHaveLength(base + 1);
  });
  it('오프라인·크기 초과·원문 주소 부적합은 성공으로 기록하지 않는다', async () => {
    const offline = createOwnerApi(A, { latencyMs: 0, offline: () => true });
    const file = { name: 'a.png', type: 'image/png' as const, size: 100, url: 'blob:test' };
    await expect(offline.attach('CPB-001', file)).rejects.toThrow('오프라인');
    const api = make();
    await expect(api.attach('CPB-001', { ...file, size: 11 * 1024 * 1024 })).rejects.toThrow();
    await expect(api.attach('CPB-001', { ...file, url: 'https://example.invalid' })).rejects.toThrow();
    // 실패한 첨부는 한 건도 남기지 않는다
    expect((await api.snapshot()).documents.filter((doc) => doc.sessionOnly)).toEqual([]);
  });
  it('조회 오류 뒤 재시도는 실제 자료를 반환한다', async () => {
    const api = createOwnerApi(A, { error: true, latencyMs: 0 });
    await expect(api.snapshot()).rejects.toThrow('불러오지');
    expect((await api.snapshot()).devices).toHaveLength(120);
  });
});
