// MockApi — 인메모리 ApiClient (ADR-002). 상태기계로만 전이한다.
import {
  CHECKIN_RADIUS_M,
  ESCALATE_AFTER_MS,
  INSPECTION_ITEMS,
  canTransition,
  distanceM,
  parseSample,
  transition,
  validateProtocol,
  type ProtocolDef,
  type ProtocolVersion,
  type Attendance,
  type Inspection,
  type Today,
  type Alert,
  type ApiClient,
  type Case,
  type Device,
  type Doc,
  type DocState,
  type DocSummary,
  type WriteMeta,
  type Escalation,
  type Kpis,
  type Part,
  type RecordItem,
  type ReplayEvent,
  type Showcase,
  maskName,
  maskPhone,
  type SiteReport,
  type Request,
  type Scope,
  type Site,
  type User,
  PROFILE_IDS,
} from '@boomeyes/domain';
import { clock, DAY } from './clock';
import type { Db } from './seed';

const inScope = (scope: Scope, siteId: string) => !scope.siteIds?.length || scope.siteIds.includes(siteId);
const delay = (ms = 0) => new Promise<void>((r) => setTimeout(r, ms));

export function createMockApi(db: Db, opts: { latencyMs?: number } = {}): ApiClient & { db: Db } {
  const wait = () => delay(opts.latencyMs ?? 0);
  // 멱등(IF-009 Idempotency-Key · NFR-016) — 같은 clientId 재전송은 같은 결과, 기록 시각은 단말 발생 시각(DISC-045)
  const seen = new Map<string, unknown>();
  const once = async <T>(meta: WriteMeta | undefined, fn: (at: string) => T): Promise<T> => {
    if (meta && seen.has(meta.clientId)) return seen.get(meta.clientId) as T;
    const r = fn(meta?.at ?? clock.iso());
    if (meta) seen.set(meta.clientId, r);
    return r;
  };
  const devScope = (scope: Scope) =>
    db.devices.filter((d) => inScope(scope, d.siteId) && (!scope.ownerId || d.ownerId === scope.ownerId));
  const impl: ApiClient & { db: Db } = {
    db,
    async users() {
      await wait();
      return db.users;
    },
    async sites(scope) {
      await wait();
      return db.sites.filter((s) => inScope(scope, s.id));
    },
    async devices(scope) {
      await wait();
      return devScope(scope);
    },
    async device(id) {
      await wait();
      return db.devices.find((d) => d.id === id);
    },
    async cameras(deviceId) {
      await wait();
      return db.cameras.filter((c) => !deviceId || c.deviceId === deviceId);
    },
    async alerts(scope) {
      await wait();
      const ids = new Set(devScope(scope).map((d) => d.id));
      return db.alerts.filter((a) => ids.has(a.deviceId)).sort((a, b) => (a.at < b.at ? 1 : -1));
    },
    async ackAlert(id) {
      await wait();
      const a = db.alerts.find((x) => x.id === id);
      if (!a) throw new Error(`alert ${id}`);
      a.acked = true;
      return a;
    },
    async cases(scope) {
      await wait();
      return db.cases.filter((c) => inScope(scope, c.siteId)).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    },
    async case(id) {
      await wait();
      return db.cases.find((c) => c.id === id);
    },
    async acceptCase(id, by) {
      await wait();
      const c = must(db, id);
      c.state = transition('task', c.state === 'escalated' ? 'escalated' : 'new', 'in-progress');
      c.assigneeId = by;
      c.history.push({ at: clock.iso(), by, action: '접수' });
      return c;
    },
    async completeCase(id, by, note) {
      await wait();
      if (!note?.trim()) throw new Error('조치 내용은 필수입니다'); // A1-08 완료 시트(task-escalation AC-9)
      const c = must(db, id);
      c.state = transition('task', 'in-progress', 'done');
      c.history.push({ at: clock.iso(), by, action: '완료 확인', note });
      return c;
    },
    async callMaintenance(id, by) {
      await wait();
      const c = must(db, id);
      c.history.push({ at: clock.iso(), by, action: '정비 담당 호출', note: 'maint01 통보' });
      return c;
    },
    async requestConfirm(id, by, note) {
      await wait();
      const c = must(db, id);
      c.history.push({ at: clock.iso(), by, action: '확인 요청(본사)', note });
      db.alerts.unshift({
        id: `AL-R${String(db.alerts.length + 1).padStart(2, '0')}`,
        deviceId: c.deviceId ?? '',
        kind: 'doc',
        severity: 'info',
        message: `${c.id} 본사 확인 요청 — ${by}`,
        at: clock.iso(),
        acked: false,
        caseId: c.id,
      });
      return c;
    },
    async requests(scope) {
      await wait();
      return db.requests
        .filter((r) => inScope(scope, r.siteId))
        .sort((a, b) => (a.requestedAt < b.requestedAt ? 1 : -1));
    },
    async request(id) {
      await wait();
      return db.requests.find((r) => r.id === id);
    },
    async approveRequest(id, by, note) {
      await wait();
      return decide(db, id, 'approved', by, '승인', note);
    },
    async rejectRequest(id, by, note) {
      await wait();
      return decide(db, id, 'rejected', by, '반려', note);
    },
    async createRequest(input) {
      await wait();
      if (!input.title.trim()) throw new Error('신청 제목은 필수입니다');
      if (!db.sites.some((s) => s.id === input.siteId)) throw new Error(`site ${input.siteId}`);
      const r: Request = {
        id: `RQ-${String(db.requests.length + 1).padStart(3, '0')}`,
        kind: input.kind,
        title: input.title.trim(),
        requesterId: input.requesterId,
        siteId: input.siteId,
        state: 'submitted',
        requestedAt: clock.iso(),
        ...(input.note ? { note: input.note } : {}),
        history: [
          { at: clock.iso(), by: input.requesterId, action: '신청', ...(input.note ? { note: input.note } : {}) },
        ],
      };
      // 자동(수신함 등록): submitted → review — B1-03 수신함에 검토 중으로 나타난다 (ENT-20)
      r.state = transition('request', r.state, 'review');
      r.history.push({ at: clock.iso(), by: 'system', action: '수신함 등록 — 검토 중' });
      db.requests.push(r);
      return r;
    },
    /** FR-038(제안) — 현장 신고 → 업무(kind report) + 알림(kind report). meta로 멱등(아웃박스 재전송) */
    async createReport(input, meta) {
      await wait();
      if (!input.note.trim()) throw new Error('신고 내용은 필수입니다');
      const device = db.devices.find((d) => d.id === input.deviceId);
      if (!device) throw new Error(`device ${input.deviceId}`);
      const TYPE = { worker: '작업자 상태 이상', hose: '호스·배관 이상', other: '기타' } as const;
      return once(meta, (at) => {
        const n = db.cases.reduce((m, c) => Math.max(m, Number(c.id.slice(2)) || 0), 0) + 1;
        const c: Case = {
          id: `C-${n}`,
          kind: 'report',
          title: `현장 신고 — ${TYPE[input.type]} · ${device.id}`,
          deviceId: device.id,
          siteId: device.siteId,
          state: 'new',
          severity: input.type === 'other' ? 'warning' : 'critical',
          assigneeId: null,
          dueAt: new Date(Date.parse(at) + 2 * 60 * 60 * 1000).toISOString(),
          createdAt: at,
          history: [{ at, by: input.by, action: '신고', note: input.note.trim() }],
          report: {
            type: input.type,
            ...(input.cameraId ? { cameraId: input.cameraId } : {}),
            ...(input.videoAt ? { videoAt: input.videoAt } : {}),
          },
        };
        db.cases.push(c);
        const k = db.alerts.filter((a) => a.id.startsWith('AL-F')).length + 1;
        db.alerts.unshift({
          id: `AL-F${String(k).padStart(2, '0')}`,
          deviceId: device.id,
          kind: 'report',
          severity: c.severity,
          message: `${device.id} 현장 신고 — ${TYPE[input.type]} (${input.by})`,
          at,
          acked: false,
          caseId: c.id,
          ...(input.cameraId ? { cameraId: input.cameraId } : {}),
        });
        return c;
      });
    },
    async escalations() {
      await wait();
      const now = clock.now().getTime();
      const out: Escalation[] = [];
      for (const c of db.cases) {
        if (c.state === 'new' && now - Date.parse(c.createdAt) >= ESCALATE_AFTER_MS) {
          c.state = transition('task', 'new', 'escalated');
          c.history.push({ at: clock.iso(), by: 'system', action: '에스컬레이션 — 1h 미접수, 본사·관제 통보' });
        }
        if (c.state !== 'escalated') continue;
        const notified = [...c.history].reverse().find((h) => h.action.startsWith('에스컬레이션'));
        out.push({
          case: c,
          elapsedMs: now - Date.parse(c.createdAt),
          notifyTo: ['hq-safety', 'control'],
          notifiedAt: notified?.at ?? c.createdAt,
        });
      }
      return out.sort((a, b) => b.elapsedMs - a.elapsedMs);
    },
    async today(userId): Promise<Today> {
      await wait();
      const user = db.users.find((u) => u.id === userId);
      if (!user) throw new Error(`user ${userId}`);
      const device = db.devices.find((d) => d.id === user.deviceId);
      const site = db.sites.find((s) => s.id === device?.siteId);
      const attendance = attendanceOf(db, user, device, site);
      const inspection = inspectionOf(db, user, device);
      const alerts = device
        ? db.alerts.filter((a) => a.deviceId === device.id).sort((a, b) => (a.at < b.at ? 1 : -1))
        : [];
      const consent = db.consents.find((c) => c.userId === userId) ?? { userId, items: [] };
      const filming = !!device && db.cameras.some((c) => c.deviceId === device.id && c.state !== 'offline');
      const maintenance = db.users.find((u) => u.role === 'maintenance');
      return { user, device, site, attendance, inspection, alerts, consent, filming, maintenance };
    },
    async checkin(userId, pos, meta) {
      await wait();
      return once(meta, (at) => {
        const user = db.users.find((u) => u.id === userId);
        if (!user) throw new Error(`user ${userId}`);
        const device = db.devices.find((d) => d.id === user.deviceId);
        const site = db.sites.find((s) => s.id === device?.siteId);
        if (!site) throw new Error('배정 현장 없음');
        const dist = distanceM(pos, site);
        if (dist > CHECKIN_RADIUS_M) throw new Error(`현장 반경 밖 — ${Math.round(dist)}m (기준 ${CHECKIN_RADIUS_M}m)`);
        const a = attendanceOf(db, user, device, site);
        a.checkinAt = at;
        a.checkoutAt = null;
        a.lat = pos.lat;
        a.lng = pos.lng;
        return a;
      });
    },
    async checkout(userId, meta) {
      await wait();
      return once(meta, (at) => {
        const a = db.attendance.find((x) => x.userId === userId);
        if (!a?.checkinAt) throw new Error('체크인 전');
        a.checkoutAt = at;
        return a;
      });
    },
    async submitInspection(userId, items, meta) {
      await wait();
      return once(meta, (at) => {
        const user = db.users.find((u) => u.id === userId);
        if (!user) throw new Error(`user ${userId}`);
        const device = db.devices.find((d) => d.id === user.deviceId);
        const i = inspectionOf(db, user, device);
        i.items = items;
        i.submittedAt = at;
        return i;
      });
    },
    async protocols() {
      await wait();
      return db.protocols;
    },
    async uploadProtocol(def, meta) {
      await wait();
      const r = validateProtocol(def);
      if (!r.ok) return { ok: false, errors: r.errors };
      const d = def as ProtocolDef;
      const version: ProtocolVersion = {
        id: `PV-${String(db.protocols.length + 1).padStart(3, '0')}`,
        version: d.version,
        kind: 'test',
        def: d,
        uploadedAt: clock.iso(),
        uploadedBy: meta.by,
        lastReceivedAt: null,
        note: `업로드 — ${meta.filename}`,
      };
      db.protocols.push(version);
      return { ok: true, errors: [], version };
    },
    async samples() {
      await wait();
      return db.samples;
    },
    async testSample(versionId, sample) {
      await wait();
      const v = db.protocols.find((p) => p.id === versionId);
      if (!v) throw new Error(`protocol ${versionId}`);
      return parseSample(v.def, sample);
    },
    async rules() {
      await wait();
      return db.rules;
    },
    async saveRules(patch, by) {
      await wait();
      const changed: string[] = [];
      if (patch.alerts) {
        db.rules.alerts = patch.alerts;
        changed.push('알림 기준');
      }
      if (patch.errorCodes) {
        db.rules.errorCodes = patch.errorCodes;
        changed.push('고장코드');
      }
      db.rules.updatedAt = clock.iso();
      db.rules.updatedBy = by;
      db.rules.history.push({ at: clock.iso(), by, action: `${changed.join(' · ') || '규칙'} 저장` });
      return db.rules;
    },
    async docs(scope) {
      await wait();
      if (!scope.siteIds?.length) return db.docs;
      const subjects = new Set([
        ...devScope(scope).map((d) => d.id),
        ...db.users.filter((u) => u.siteIds.some((s) => scope.siteIds?.includes(s))).map((u) => u.id),
      ]);
      return db.docs.filter((d) => subjects.has(d.subjectId));
    },
    async doc(id) {
      await wait();
      return db.docs.find((d) => d.id === id);
    },
    async submitDoc(id, file, by, meta) {
      await wait();
      return once(meta, (at) => {
        const d = db.docs.find((x) => x.id === id);
        if (!d) throw new Error(`doc ${id}`);
        d.state = transition('doc', d.state, 'submitted') as DocState; // expiring|rejected → submitted
        d.state = transition('doc', d.state, 'review') as DocState; // 자동
        d.submittedAt = at;
        d.file = file;
        d.history.push({ at, by, action: '제출', note: file.name });
        // 서류 검토 업무 생성(FR-008) — 현장 안전관리자 업무함
        const owner = db.users.find((u) => u.id === d.subjectId);
        const device = db.devices.find((x) => x.id === d.subjectId);
        const siteId = device?.siteId ?? owner?.siteIds?.[0] ?? 'SITE-001';
        const cid = `C-${String(100 + db.cases.length + 1).padStart(3, '0')}`;
        db.cases.unshift({
          id: cid,
          kind: 'doc',
          title: `${d.subject} 검토`,
          deviceId: device?.id ?? null,
          siteId,
          state: 'new',
          severity: 'info',
          assigneeId: null,
          dueAt: new Date(clock.now().getTime() + 2 * DAY).toISOString(),
          createdAt: at,
          history: [{ at, by, action: '제출' }],
          docId: d.id,
        });
        return d;
      });
    },
    async reviewDoc(id, decision, by, note) {
      await wait();
      if (decision === 'rejected' && !note?.trim()) throw new Error('반려 사유는 필수입니다');
      const d = db.docs.find((x) => x.id === id);
      if (!d) throw new Error(`doc ${id}`);
      if (d.state === 'submitted') d.state = transition('doc', d.state, 'review') as DocState;
      d.state = transition('doc', d.state, decision) as DocState;
      d.history.push({ at: clock.iso(), by, action: decision === 'approved' ? '승인' : '반려', note });
      const c = db.cases.find((x) => x.docId === id && x.state !== 'done');
      if (c) {
        // 접수 전(new/assigned/escalated) 업무도 승인/반려가 곧 처리다 — 상태기계로 in-progress를 거쳐 done
        if (c.state !== 'in-progress') c.state = transition('task', c.state, 'in-progress');
        c.state = transition('task', c.state, 'done');
        c.history.push({ at: clock.iso(), by, action: decision === 'approved' ? '승인 — 완료' : '반려 — 완료', note });
      }
      return d;
    },
    async registerDoc(input, by) {
      await wait();
      const expiring = !!input.expiresAt && Date.parse(input.expiresAt) - clock.now().getTime() <= 30 * DAY;
      const d: Doc = {
        id: `DOC-${String(db.docs.length + 1).padStart(3, '0')}`,
        ...input,
        siteId: siteOfSubject(db, input.subjectId),
        state: expiring ? 'expiring' : 'valid',
        submittedAt: clock.iso(),
        history: [{ at: clock.iso(), by, action: '등록' }],
      };
      db.docs.push(d);
      return d;
    },
    async docCompleteness(scope) {
      await wait();
      const list = await impl.docs(scope);
      const done = (d: Doc) => d.state === 'valid' || d.state === 'approved';
      const row = (
        subjectId: string,
        subject: string,
        kind: DocSummary['kind'],
        siteId: string,
        ds: Doc[],
      ): DocSummary => ({
        subjectId,
        subject,
        kind,
        siteId,
        total: ds.length,
        complete: ds.filter(done).length,
        rate: Math.round((ds.filter(done).length / ds.length) * 100),
        expiring: ds.filter((d) => d.state === 'expiring').length,
      });
      // 현장 차원(AC-4): 현장에 속한 서류 전체 → 그 다음 장비·운전자별
      const sites = db.sites
        .filter((st) => inScope(scope, st.id) && list.some((d) => d.siteId === st.id))
        .map((st) =>
          row(
            st.id,
            st.name,
            'site',
            st.id,
            list.filter((d) => d.siteId === st.id),
          ),
        );
      const groups = new Map<string, Doc[]>();
      for (const d of list) groups.set(d.subjectId, [...(groups.get(d.subjectId) ?? []), d]);
      const subjects = [...groups.entries()]
        .filter(([subjectId]) => !db.sites.some((st) => st.id === subjectId))
        .map(([subjectId, ds]) => {
          const dev = db.devices.find((x) => x.id === subjectId);
          const user = db.users.find((x) => x.id === subjectId);
          return row(
            subjectId,
            dev ? `${dev.id} · ${dev.unitNo}호기` : (user?.display ?? subjectId),
            dev ? 'device' : user?.role === 'driver' ? 'driver' : 'person',
            ds[0]?.siteId ?? '',
            ds,
          );
        });
      return [...sites, ...subjects];
    },
    async leases(scope) {
      await wait();
      return db.leases.filter((l) => inScope(scope, l.siteId));
    },
    async lease(id) {
      await wait();
      return db.leases.find((l) => l.id === id);
    },
    async planRelocation(leaseId, toSiteId, note, by) {
      await wait();
      const l = db.leases.find((x) => x.id === leaseId);
      if (!l) throw new Error(`lease ${leaseId}`);
      const to = db.sites.find((x) => x.id === toSiteId);
      if (!to) throw new Error(`site ${toSiteId}`);
      if (to.id === l.siteId) throw new Error('현재 현장과 다른 현장을 고르세요');
      l.state = transition('lease', l.state, 'relocated'); // expiring에서만 (ENT-10)
      l.toSiteId = to.id;
      l.note = note;
      l.history.push({ at: clock.iso(), by, action: `재배치 계획 — ${to.name}`, note });
      return l;
    },
    // sites-assets-leases(W2 B5) 마스터 — db를 직접 변이한다(경계는 복사본을 돌려주므로)
    async createSite(input) {
      await wait();
      if (!input.name.trim()) throw new Error('현장명은 필수입니다');
      const site: Site = {
        id: `SITE-${String(db.sites.length + 1).padStart(3, '0')}`,
        name: input.name.trim(),
        address: input.address,
        company: input.company,
        lat: input.lat ?? 36.35,
        lng: input.lng ?? 127.38,
        videoProfile: input.videoProfile ?? 'P-SD',
        safetyUserId: input.safetyUserId,
        ...(input.period ? { period: input.period } : {}),
      };
      db.sites.push(site);
      return site;
    },
    async updateSite(id, patch) {
      await wait();
      const site = db.sites.find((x) => x.id === id);
      if (!site) throw new Error(`site ${id}`);
      if (patch.name !== undefined && !patch.name.trim()) throw new Error('현장명은 필수입니다');
      Object.assign(site, patch);
      return site;
    },
    async registerDevice(input) {
      await wait();
      if (!Number.isInteger(input.unitNo) || input.unitNo < 1 || input.unitNo > 120)
        throw new Error('호기는 1~120 사이의 정수여야 합니다');
      if (db.devices.some((d) => d.unitNo === input.unitNo))
        throw new Error(`호기 ${input.unitNo} 중복 — 이미 배정된 호기입니다`);
      const site = db.sites.find((x) => x.id === input.siteId);
      if (!site) throw new Error(`site ${input.siteId}`);
      const d: Device = {
        id: `CPB-${String(input.unitNo).padStart(3, '0')}`,
        unitNo: input.unitNo,
        siteId: site.id,
        ownerId: input.ownerId ?? 'OWN-001',
        state: 'offline', // 설치 전 — 첫 텔레메트리까지 두절 (카메라 등록은 W3)
        lat: site.lat,
        lng: site.lng,
        telemetry: {
          at: clock.iso(),
          voltage: 0,
          voltageStatus: 'normal',
          harness: 'ok',
          lte: 'lost',
          gpsFix: false,
          errorCode: null,
          pipeRatio: 0,
          filterRatio: 0,
          boomAngle: 0,
        },
      };
      db.devices.push(d);
      return d;
    },
    async assignDevice(deviceId, siteId) {
      await wait();
      const d = db.devices.find((x) => x.id === deviceId);
      if (!d) throw new Error(`device ${deviceId}`);
      const site = db.sites.find((x) => x.id === siteId);
      if (!site) throw new Error(`site ${siteId}`);
      d.siteId = site.id;
      d.lat = site.lat;
      d.lng = site.lng;
      return d;
    },
    async setSiteProfile(siteId, preset) {
      await wait();
      if (!PROFILE_IDS.includes(preset)) throw new Error(`알 수 없는 현장 프로파일: ${preset}`);
      const site = db.sites.find((x) => x.id === siteId);
      if (!site) throw new Error(`site ${siteId}`);
      site.videoProfile = preset;
      return site;
    },
    async setUserRole(userId, role) {
      await wait();
      // entities.rules 권한 경계: 운영사는 안전관리자 권한 부여 불가 — 법적 안전관리 책임은 건설사
      if (role === 'site-safety') throw new Error('운영사는 안전관리자 권한을 부여할 수 없습니다 (entities.rules)');
      const u = db.users.find((x) => x.id === userId);
      if (!u) throw new Error(`user ${userId}`);
      u.role = role;
      return u;
    },
    async setUserSites(userId, siteIds) {
      await wait();
      const u = db.users.find((x) => x.id === userId);
      if (!u) throw new Error(`user ${userId}`);
      u.siteIds = siteIds.filter((id) => db.sites.some((s) => s.id === id));
      return u;
    },
    async setUserStatus(userId, status) {
      await wait();
      const u = db.users.find((x) => x.id === userId);
      if (!u) throw new Error(`user ${userId}`);
      u.status = status;
      return u;
    },
    async records(scope, opts = {}) {
      await wait();
      const since = clock.now().getTime() - (opts.days ?? 30) * DAY;
      const out: RecordItem[] = [];
      const siteOfDevice = (id: string) => db.devices.find((d) => d.id === id)?.siteId ?? '';
      const noteOf = (n?: string) => (n ? { note: n } : {});
      for (const c of db.cases)
        if (inScope(scope, c.siteId))
          for (const h of c.history)
            out.push({
              at: h.at,
              kind: 'task',
              actor: h.by,
              subjectId: c.id,
              siteId: c.siteId,
              text: `${h.action} — ${c.title}`,
              ...noteOf(h.note),
            });
      for (const i of db.inspections) {
        const siteId = siteOfDevice(i.deviceId);
        if (i.submittedAt && inScope(scope, siteId))
          out.push({
            at: i.submittedAt,
            kind: 'inspection',
            actor: i.userId,
            subjectId: i.deviceId,
            siteId,
            text: `일일점검 제출 — ${i.deviceId} (${i.items.filter((x) => x.ok).length}/${i.items.length} 정상)`,
          });
      }
      for (const a of db.attendance) {
        if (!inScope(scope, a.siteId)) continue;
        if (a.checkinAt)
          out.push({
            at: a.checkinAt,
            kind: 'attendance',
            actor: a.userId,
            subjectId: a.deviceId,
            siteId: a.siteId,
            text: `출근 체크인 — ${a.deviceId}`,
          });
        if (a.checkoutAt)
          out.push({
            at: a.checkoutAt,
            kind: 'attendance',
            actor: a.userId,
            subjectId: a.deviceId,
            siteId: a.siteId,
            text: `퇴근 체크아웃 — ${a.deviceId}`,
          });
      }
      for (const d of db.docs)
        if (inScope(scope, d.siteId))
          for (const h of d.history)
            out.push({
              at: h.at,
              kind: 'doc',
              actor: h.by,
              subjectId: d.id,
              siteId: d.siteId,
              text: `${h.action} — ${d.subject}`,
              ...noteOf(h.note),
            });
      if (!scope.siteIds?.length) {
        // 전국 스코프(관제·운영사)만: 규칙 변경 · 임대 계약 이력
        for (const h of db.rules.history)
          out.push({
            at: h.at,
            kind: 'rule',
            actor: h.by,
            subjectId: 'rules',
            siteId: '',
            text: h.action,
            ...noteOf(h.note),
          });
        for (const l of db.leases)
          for (const h of l.history)
            out.push({
              at: h.at,
              kind: 'lease',
              actor: h.by,
              subjectId: l.id,
              siteId: l.siteId,
              text: `${h.action} — ${l.id}`,
              ...noteOf(h.note),
            });
      }
      return out
        .filter((r) => Date.parse(r.at) >= since && (!opts.kind || r.kind === opts.kind))
        .sort((a, b) => (a.at < b.at ? 1 : -1));
    },
    async report(scope, days) {
      await wait();
      const since = clock.now().getTime() - days * DAY;
      const inWin = (at: string) => Date.parse(at) >= since;
      const docRows = await impl.docCompleteness(scope);
      return db.sites
        .filter((s) => inScope(scope, s.id))
        .map((s): SiteReport => {
          const devices = db.devices.filter((d) => d.siteId === s.id);
          const ids = new Set(devices.map((d) => d.id));
          const cases = db.cases.filter((c) => c.siteId === s.id && inWin(c.createdAt));
          const done = cases.filter((c) => c.state === 'done').length;
          const inspections = db.inspections.filter(
            (i) => ids.has(i.deviceId) && !!i.submittedAt && inWin(i.submittedAt),
          );
          const inspected = new Set(inspections.map((i) => i.deviceId)).size;
          const docs = docRows.find((r) => r.kind === 'site' && r.siteId === s.id);
          return {
            siteId: s.id,
            site: s.name,
            days,
            devices: devices.length,
            abnormal: devices.filter((d) => d.state !== 'normal').length,
            casesTotal: cases.length,
            casesDone: done,
            caseRate: cases.length ? Math.round((done / cases.length) * 100) : 100,
            inspections: inspections.length,
            inspectionRate: devices.length ? Math.round((inspected / devices.length) * 100) : 0,
            docRate: docs?.rate ?? 0,
            docTotal: docs?.total ?? 0,
            // 에스컬레이션은 이력으로 센다 — escalations()와 달리 전이 부작용이 없다
            escalated: db.cases.filter(
              (c) => c.siteId === s.id && c.history.some((h) => h.action.startsWith('에스컬레이션') && inWin(h.at)),
            ).length,
            alerts: db.alerts.filter((a) => ids.has(a.deviceId) && inWin(a.at)).length,
          };
        });
    },
    // equipment-parts(W2 B9, 구조): part 상태기계 실소비 — 스캔·발주는 2단계
    async parts(scope) {
      await wait();
      const ids = new Set(devScope(scope).map((d) => d.id));
      return db.parts.filter((p) => ids.has(p.deviceId));
    },
    async part(id) {
      await wait();
      return db.parts.find((p) => p.id === id);
    },
    async partEvents(partId) {
      await wait();
      return db.partEvents.filter((e) => !partId || e.partId === partId).sort((a, b) => (a.at < b.at ? 1 : -1));
    },
    async inspectPart(id, input, by) {
      await wait();
      const p = partOf(db, id);
      if (!(input.thicknessMm > 0)) throw new Error('실측 두께(mm)는 0보다 커야 합니다');
      if (p.state === 'installed') p.state = transition('part', p.state, 'inspected');
      else if (p.state !== 'inspected') throw new Error(`${p.id}는 ${p.state} 상태 — 점검 대상이 아닙니다`);
      if (!input.pass) p.state = transition('part', p.state, 'due'); // 불합 → 교체 대상 (inspected → due, ENT-16)
      p.lastThicknessMm = input.thicknessMm;
      db.partEvents.push({
        id: nextPartEvent(db),
        partId: p.id,
        kind: 'inspect',
        at: clock.iso(),
        by,
        thicknessMm: input.thicknessMm,
        visual: input.visual,
        fastening: input.fastening,
        pass: input.pass,
        ...(input.photo ? { photo: input.photo } : {}),
        ...(input.note ? { note: input.note } : {}),
      });
      return p;
    },
    async replacePart(id, input, by) {
      await wait();
      const p = partOf(db, id);
      if (!input.reason.trim()) throw new Error('사유는 필수입니다');
      const st = db.stock.find((s) => s.partNo === p.partNo);
      if (!st || st.onHand < 1) throw new Error(`재고 없음 — ${p.partNo} (발주는 준비 중)`);
      p.state = transition('part', p.state, 'replaced'); // due에서만
      st.onHand -= 1;
      db.partEvents.push({
        id: nextPartEvent(db),
        partId: p.id,
        kind: 'replace',
        at: clock.iso(),
        by,
        reason: input.reason.trim(),
        worker: input.worker,
        ...(input.photo ? { photo: input.photo } : {}),
        note: `재고 ${st.onHand + 1} → ${st.onHand}`,
      });
      return p;
    },
    async discardPart(id, input, by) {
      await wait();
      const p = partOf(db, id);
      if (!input.reason.trim()) throw new Error('사유는 필수입니다');
      p.state = transition('part', p.state, 'discarded'); // replaced에서만
      db.partEvents.push({
        id: nextPartEvent(db),
        partId: p.id,
        kind: 'discard',
        at: clock.iso(),
        by,
        reason: input.reason.trim(),
        ...(input.photo ? { photo: input.photo } : {}),
      });
      return p;
    },
    async stock() {
      await wait();
      return db.stock;
    },
    // event-replay(W2 B10, 구조): 4레인 메타 + 창 안의 부품 이력을 CPB 레인 마커로 합친다(실 세그먼트 조회는 API-018 2단계)
    async event(id): Promise<ReplayEvent | undefined> {
      await wait();
      const ev = db.events.find((e) => e.id === id);
      if (!ev) return undefined;
      const t0 = Date.parse(ev.at);
      const inWindow = (at: string) => Math.abs(Date.parse(at) - t0) <= ev.windowSec * 1000;
      const partIds = new Set(db.parts.filter((p) => p.deviceId === ev.deviceId).map((p) => p.id));
      const partMarkers = db.partEvents
        .filter((e) => partIds.has(e.partId) && inWindow(e.at))
        .map((e) => ({ at: e.at, label: `부품 ${e.partId} ${e.kind}` }));
      const cpb = ev.lanes.cpb;
      return {
        ...ev,
        lanes: {
          ...ev.lanes,
          cpb: {
            ...cpb,
            markers: [...cpb.markers, ...partMarkers].sort((a, b) => (a.at < b.at ? -1 : 1)),
            note: partMarkers.length
              ? `부품 이력 ${partMarkers.length}건`
              : `부품 이력 없음 — 창 ±${ev.windowSec}초 안에 점검·교체 없음`,
          },
        },
      };
    },
    // owner-showcase(W2 B11): 읽기 전용 집계 — 무사고 D+는 현장 개설일 기준(사고 기록 없음) · 24시간 점검·알림 · 서류 완비율 · 마스킹(정책 DISC-031 미확정)
    async showcase(scope): Promise<Showcase> {
      await wait();
      const now = clock.now().getTime();
      const sites = db.sites.filter((s) => inScope(scope, s.id));
      const ds = devScope(scope);
      const ids = new Set(ds.map((d) => d.id));
      const daysSince = (from?: string) => (from ? Math.max(0, Math.floor((now - Date.parse(from)) / DAY)) : 0);
      const inspected = new Set(
        db.inspections
          .filter((i) => ids.has(i.deviceId) && !!i.submittedAt && now - Date.parse(i.submittedAt) < DAY)
          .map((i) => i.deviceId),
      ).size;
      const docs = await impl.docs(scope);
      const done = docs.filter((d) => d.state === 'valid' || d.state === 'approved').length;
      const owner = db.owners[0];
      return {
        daysWithoutAccident: sites.length ? Math.min(...sites.map((s) => daysSince(s.period?.from))) : 0,
        inspectionRate: ds.length ? Math.round((inspected / ds.length) * 100) : 0,
        docRate: docs.length ? Math.round((done / docs.length) * 100) : 0,
        alerts24h: db.alerts.filter((a) => ids.has(a.deviceId) && now - Date.parse(a.at) < DAY).length,
        devices: ds.length,
        normal: ds.filter((d) => d.state === 'normal').length,
        sites: sites.map((s) => {
          const safety = db.users.find((u) => u.id === s.safetyUserId);
          const mine = ds.filter((d) => d.siteId === s.id);
          return {
            id: s.id,
            name: s.name,
            company: s.company,
            daysWithoutAccident: daysSince(s.period?.from),
            devices: mine.length,
            abnormal: mine.filter((d) => d.state !== 'normal').length,
            safety: safety ? `${maskName(safety.display)}${safety.phone ? ` · ${maskPhone(safety.phone)}` : ''}` : '—',
            contact: owner ? `${maskName(owner.name)} · ${maskPhone(owner.contact)}` : '—',
          };
        }),
      };
    },
    async kpis(scope): Promise<Kpis> {
      await wait();
      const ds = devScope(scope);
      const count = (s: Device['state']) => ds.filter((d) => d.state === s).length;
      const cs = db.cases.filter((c) => inScope(scope, c.siteId));
      return {
        total: ds.length,
        normal: count('normal'),
        caution: count('caution'),
        fault: count('fault'),
        offline: count('offline'),
        maintenance: count('maintenance'),
        openCases: cs.filter((c) => c.state !== 'done').length,
        escalated: cs.filter((c) => c.state === 'escalated').length,
      };
    },
  };
  // API 경계에서는 복사본을 돌려준다 — 실 HTTP처럼. 같은 객체 참조를 돌려주면 in-place 전이가 Svelte 키드 each에 보이지 않는다(승인 후 표가 안 바뀌던 사고)
  for (const key of Object.keys(impl) as (keyof typeof impl)[]) {
    if (key === 'db') continue;
    const fn = impl[key] as (...args: unknown[]) => Promise<unknown>;
    (impl as unknown as Record<string, unknown>)[key] = async (...args: unknown[]) =>
      structuredClone(await fn(...args));
  }
  return impl;
}
/** 서류 대상의 현장 — 장비면 그 현장, 사용자면 첫 현장, 현장 자신이면 그대로 */
function siteOfSubject(db: Db, subjectId: string): string {
  if (db.sites.some((s) => s.id === subjectId)) return subjectId;
  const dev = db.devices.find((d) => d.id === subjectId);
  if (dev) return dev.siteId;
  return db.users.find((u) => u.id === subjectId)?.siteIds[0] ?? 'SITE-001';
}
function partOf(db: Db, id: string): Part {
  const p = db.parts.find((x) => x.id === id);
  if (!p) throw new Error(`part ${id}`);
  return p;
}
const nextPartEvent = (db: Db) => `PE-${String(db.partEvents.length + 1).padStart(3, '0')}`;
function must(db: Db, id: string): Case {
  const c = db.cases.find((x) => x.id === id);
  if (!c) throw new Error(`case ${id}`);
  return c;
}
/** 출근 기록 — 없으면 빈 기록을 만들어 db에 넣는다 */
function attendanceOf(db: Db, user: User, device: Device | undefined, site: Site | undefined): Attendance {
  let a = db.attendance.find((x) => x.userId === user.id);
  if (!a) {
    a = { userId: user.id, deviceId: device?.id ?? '', siteId: site?.id ?? '', checkinAt: null, checkoutAt: null };
    db.attendance.push(a);
  }
  return a;
}
/** 오늘 점검 — 없으면 미제출 5항목 */
function inspectionOf(db: Db, user: User, device: Device | undefined): Inspection {
  let i = db.inspections.find((x) => x.userId === user.id);
  if (!i) {
    i = {
      id: `INS-${user.id}`,
      userId: user.id,
      deviceId: device?.id ?? '',
      date: clock.iso().slice(0, 10),
      items: INSPECTION_ITEMS.map((x) => ({ ...x, ok: false })),
      submittedAt: null,
    };
    db.inspections.push(i);
  }
  return i;
}
/** 승인/반려 — request 상태기계(ENT-20: submitted → review → approved|rejected). submitted에서 바로 못 가면 review를 거친다 */
function decide(db: Db, id: string, to: 'approved' | 'rejected', by: string, action: string, note?: string): Request {
  const r = db.requests.find((x) => x.id === id);
  if (!r) throw new Error(`request ${id}`);
  if (!canTransition('request', r.state, to)) r.state = transition('request', r.state, 'review');
  r.state = transition('request', r.state, to);
  r.history.push({ at: clock.iso(), by, action, note });
  return r;
}
export const severityOf = (a: Alert) => a.severity;
