import { describe, expect, it } from 'vitest';
import { INSPECTION_ITEMS } from '@boomeyes/domain';
import { bootMock, clock, DAY, H, MIN } from './index';

describe('[FR-008] MockApi 업무 흐름', () => {
  it('C-105 접수 → 완료 (task 상태기계)', async () => {
    const api = bootMock({ capture: true });
    const c1 = await api.acceptCase('C-105', 'safety01');
    expect(c1.state).toBe('in-progress');
    const c2 = await api.completeCase('C-105', 'safety01', '전압 릴레이 교체');
    expect(c2.state).toBe('done');
    expect(c2.history.at(-1)?.note).toBe('전압 릴레이 교체');
  });
  it('[FR-001] 시드 계정 7 · 스코프별 장비', async () => {
    const api = bootMock({ capture: true });
    expect((await api.users()).map((u) => u.role).sort()).toEqual([
      'control',
      'driver',
      'hq-safety',
      'maintenance',
      'ops-admin',
      'owner',
      'site-safety',
    ]);
    expect((await api.devices({ role: 'control' })).length).toBe(5);
    expect((await api.devices({ role: 'site-safety', siteIds: ['SITE-001'] })).length).toBe(3);
  });
  it('[FR-002] KPI · capture 시각 고정', async () => {
    const api = bootMock({ capture: true });
    const k = await api.kpis({ role: 'control' });
    expect(k).toMatchObject({ total: 5, fault: 1, offline: 1, escalated: 1 });
    expect(clock.iso().startsWith('2026-07-03')).toBe(true);
    clock.jump(H);
    expect(clock.now().getUTCHours()).toBe(2);
  });
  it('[FR-034] CPB-002 AI 채널은 ai-unavailable, CPB-004 채널은 offline', async () => {
    const api = bootMock({ capture: true });
    const cams = await api.cameras();
    expect(cams.find((c) => c.id === 'CAM-2-2')?.state).toBe('ai-unavailable');
    expect(cams.filter((c) => c.deviceId === 'CPB-004').every((c) => c.state === 'offline')).toBe(true);
  });
});

describe('[FR-017] 수신함 신청·요청 (B1-03)', () => {
  it('승인/반려는 doc 상태기계로 전이하고 이력을 남긴다 · 스코프', async () => {
    const api = bootMock({ capture: true });
    expect((await api.requests({ role: 'control' })).map((r) => r.id)).toEqual([
      'RQ-003',
      'RQ-001',
      'RQ-005',
      'RQ-002',
      'RQ-004',
    ]);
    expect((await api.requests({ role: 'site-safety', siteIds: ['SITE-001'] })).length).toBe(4);
    const a = await api.approveRequest('RQ-001', 'control01', '2공구 개설 승인');
    expect(a.state).toBe('approved');
    expect(a.history.at(-1)).toMatchObject({ by: 'control01', action: '승인', note: '2공구 개설 승인' });
    const r = await api.rejectRequest('RQ-003', 'control01', '서류 원본 필요');
    expect(r.state).toBe('rejected');
    await expect(api.approveRequest('RQ-004', 'control01')).rejects.toThrow(); // approved에서 재승인 불가
  });
});

describe('[FR-010] 에스컬레이션 (B1-04)', () => {
  it('new 업무가 1h를 넘기면 escalated + 본사·관제 통보 · 경과 시간', async () => {
    const api = bootMock({ capture: true });
    expect((await api.escalations()).map((e) => e.case.id)).toEqual(['C-104']);
    clock.jump(61 * MIN);
    const es = await api.escalations();
    expect(es.map((e) => e.case.id).sort()).toEqual(['C-104', 'C-105']);
    const e = es.find((x) => x.case.id === 'C-105');
    expect(e?.case.state).toBe('escalated');
    expect(e?.notifyTo).toEqual(['hq-safety', 'control']);
    expect(e?.elapsedMs).toBeGreaterThanOrEqual(61 * MIN);
    expect(e?.case.history.at(-1)?.action).toMatch(/^에스컬레이션/);
    const again = await api.acceptCase('C-105', 'safety01'); // escalated → in-progress
    expect(again.state).toBe('in-progress');
  });
  it('B1-04 esc 픽스처는 C-105를 65분 전 발행으로 둔다', async () => {
    const api = bootMock({ capture: true, screen: 'B1-04', state: 'esc' });
    expect((await api.escalations()).map((e) => e.case.id).sort()).toEqual(['C-104', 'C-105']);
  });
});

describe('[FR-013] 출근 체크인 · [FR-014] 일일점검 (driver-daily)', () => {
  it('오늘: 배정 CPB-003 · 미체크인 · 동의 3항목 · 촬영 중', async () => {
    const api = bootMock({ capture: true });
    const t = await api.today('driver03');
    expect(t.device?.id).toBe('CPB-003');
    expect(t.site?.id).toBe('SITE-001');
    expect(t.attendance.checkinAt).toBeNull();
    expect(t.inspection.items.map((i) => i.id)).toEqual(INSPECTION_ITEMS.map((i) => i.id));
    expect(t.consent.items.map((c) => `${c.kind}:${c.agreed}`)).toEqual(['video:true', 'audio:false', 'location:true']);
    expect(t.filming).toBe(true);
  });
  it('반경 밖 체크인은 거리와 함께 거부 · 반경 안은 기록 · 체크아웃', async () => {
    const api = bootMock({ capture: true });
    await expect(api.checkin('driver03', { lat: 36.0, lng: 127.0 })).rejects.toThrow(/반경 밖 — \d+m/);
    const t = await api.today('driver03');
    const a = await api.checkin('driver03', { lat: t.site!.lat + 0.0005, lng: t.site!.lng });
    expect(a.checkinAt).toBeTruthy();
    expect((await api.today('driver03')).attendance.checkinAt).toBe(a.checkinAt);
    expect((await api.checkout('driver03')).checkoutAt).toBeTruthy();
  });
  it('점검 5항목 제출 → submittedAt · 픽스처 inspected/checked/mydev', async () => {
    const api = bootMock({ capture: true });
    const r = await api.submitInspection(
      'driver03',
      INSPECTION_ITEMS.map((x) => ({ ...x, ok: true })),
    );
    expect(r.submittedAt).toBeTruthy();
    expect(r.items.every((i) => i.ok)).toBe(true);
    expect(
      (await bootMock({ capture: true, screen: 'A2-03', state: 'inspected' }).today('driver03')).inspection.submittedAt,
    ).toBeTruthy();
    expect(
      (await bootMock({ capture: true, screen: 'A2-02', state: 'checked' }).today('driver03')).attendance.checkinAt,
    ).toBeTruthy();
    expect(
      (await bootMock({ capture: true, screen: 'A2-04', state: 'mydev' }).device('CPB-003'))?.telemetry.filterRatio,
    ).toBe(0.92);
  });
});

describe('[FR-020] 프로토콜 관리 (B4-02)', () => {
  it('운영 1 · 테스트 1 · 샘플 3(정상/누락/타입) 파싱 결과', async () => {
    const api = bootMock({ capture: true });
    const ps = await api.protocols();
    expect(ps.map((p) => `${p.version}:${p.kind}`)).toEqual(['cpb.v0.1:production', 'cpb.v0.2:test']);
    const samples = await api.samples();
    expect(samples.map((s) => s.id)).toEqual(['S-OK', 'S-ALERT', 'S-MISSING', 'S-TYPE']);
    const ok = await api.testSample('PV-001', JSON.parse(samples[0]!.json));
    expect(ok.ok).toBe(true);
    const alert = await api.testSample('PV-001', JSON.parse(samples[1]!.json));
    expect(alert.ok).toBe(true);
    expect(alert.alerts.map((a) => a.kind)).toEqual(['error', 'voltage', 'pipe']);
    const missing = await api.testSample('PV-001', JSON.parse(samples[2]!.json));
    expect(missing.errors.map((e) => e.path)).toEqual(expect.arrayContaining(['gps.latitude', 'power']));
    expect(missing.alerts.map((a) => a.kind)).toEqual(['harness']); // 오류 샘플도 알림 미리보기
    const wrong = await api.testSample('PV-001', JSON.parse(samples[3]!.json));
    expect(wrong.errors.map((e) => e.path)).toEqual(
      expect.arrayContaining(['power.voltage_value', 'gps.fix_status', 'harness.disconnected']),
    );
    expect(wrong.alerts.map((a) => a.kind)).toEqual(['error', 'comm']); // 타입이 틀린 harness/gps 값은 알림으로 오인하지 않는다
  });
  it('업로드: 깨진 정의는 행 경로·사유 · 정상 정의는 테스트 버전 추가', async () => {
    const api = bootMock({ capture: true });
    const bad = await api.uploadProtocol({ version: 'v9', groups: [] }, { filename: 'bad.yaml', by: 'ops01' });
    expect(bad.ok).toBe(false);
    expect(bad.errors.map((e) => e.path)).toEqual(expect.arrayContaining(['version', 'groups']));
    const def = { ...(await api.protocols())[0]!.def, version: 'cpb.v0.3' };
    const good = await api.uploadProtocol(def, { filename: 'cpb-v0.3.yaml', by: 'ops01' });
    expect(good.ok).toBe(true);
    expect(good.version?.kind).toBe('test');
    expect((await api.protocols()).length).toBe(3);
  });
});

describe('[FR-011] 알림 기준 · 고장코드 (B4-05)', () => {
  it('알림 8종 · 고장코드 4 · 시나리오 잠금 2 · 저장 시 이력', async () => {
    const api = bootMock({ capture: true });
    const r = await api.rules();
    expect(r.alerts.map((a) => a.kind)).toEqual([
      'comm',
      'gps',
      'voltage',
      'harness',
      'error',
      'doc',
      'pipe',
      'filter',
    ]);
    expect(r.errorCodes.find((c) => c.code === 'E-021')?.severity).toBe('critical');
    expect(r.scenarios.filter((s) => s.locked).map((s) => s.title)).toEqual(['전도', '무동작']);
    const alerts = r.alerts.map((a) =>
      a.kind === 'pipe' ? { ...a, threshold: { caution: 0.85, danger: 1, unit: '비율' } } : a,
    );
    const saved = await api.saveRules({ alerts }, 'ops01');
    expect(saved.alerts.find((a) => a.kind === 'pipe')?.threshold?.caution).toBe(0.85);
    expect(saved.history.at(-1)).toMatchObject({ by: 'ops01', action: '알림 기준 저장' });
  });
});

describe('[FR-015] 서류 제출·검토', () => {
  it('DOC-001 expiring → submitDoc → review(자동) + 검토 업무 생성 → reviewDoc approved → 업무 done', async () => {
    const api = bootMock({ capture: true });
    const d = await api.submitDoc('DOC-001', { name: 'cert.png', type: 'image/png', size: 10 }, 'driver03');
    expect(d.state).toBe('review');
    const cases = await api.cases({ role: 'site-safety', siteIds: ['SITE-001'] });
    const task = cases.find((c) => c.docId === 'DOC-001');
    expect(task?.state).toBe('new');
    const r = await api.reviewDoc('DOC-001', 'approved', 'safety01');
    expect(r.state).toBe('approved');
    expect((await api.case(task!.id))?.state).toBe('done');
  });
  it('반려는 사유 필수 · rejected → 재제출 submitted', async () => {
    const api = bootMock({ capture: true });
    await api.submitDoc('DOC-001', { name: 'a.png', type: 'image/png', size: 1 }, 'driver03');
    await expect(api.reviewDoc('DOC-001', 'rejected', 'safety01')).rejects.toThrow('반려 사유');
    const r = await api.reviewDoc('DOC-001', 'rejected', 'safety01', '흐림');
    expect(r.state).toBe('rejected');
    expect((await api.submitDoc('DOC-001', { name: 'b.png', type: 'image/png', size: 1 }, 'driver03')).state).toBe(
      'review',
    );
  });
  it('[FR-016] registerDoc: D-30 이내 expiring · 완비율 집계', async () => {
    const api = bootMock({ capture: true });
    const d = await api.registerDoc(
      {
        kind: 'ndt',
        subject: 'CPB-001 성적서',
        subjectId: 'CPB-001',
        expiresAt: new Date(clock.now().getTime() + 10 * DAY).toISOString(),
      },
      'ops01',
    );
    expect(d.state).toBe('expiring');
    const sum = await api.docCompleteness({ role: 'control' });
    const cpb3 = sum.find((s) => s.subjectId === 'CPB-003');
    expect(cpb3?.rate).toBe(100);
    expect(sum.find((s) => s.subjectId === 'CPB-001')?.expiring).toBe(1);
  });
});

describe('[FR-008] 완료 확인·확인 요청 (W2)', () => {
  it('completeCase는 조치 내용이 없으면 거부한다', async () => {
    const api = bootMock({ capture: true });
    await api.acceptCase('C-105', 'safety01');
    await expect(api.completeCase('C-105', 'safety01', ' ')).rejects.toThrow('조치 내용');
    expect((await api.completeCase('C-105', 'safety01', '릴레이 교체')).state).toBe('done');
  });
  it('[FR-022] requestConfirm은 상태를 바꾸지 않고 이력·현장 알림만 남긴다', async () => {
    const api = bootMock({ capture: true });
    const before = (await api.alerts({ role: 'control' })).length;
    const c = await api.requestConfirm('C-105', 'hq01', '확인 바랍니다');
    expect(c.state).toBe('new');
    expect(c.history.at(-1)?.action).toContain('확인 요청');
    expect((await api.alerts({ role: 'control' })).length).toBe(before + 1);
  });
});
