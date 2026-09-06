import { redirect } from '@sveltejs/kit';
import { SCREENS, canAccess, screenForPath, type RoleId, type ScrId } from '@boomeyes/domain';
import {
  bootMock,
  clock,
  createMockMedia,
  createMockRealtime,
  createSceneRealtime,
  demoSession,
  demoSessionFor,
  H,
  MIN,
  optionsFromUrl,
  resetMock,
  SCENES,
  activeScene,
  sceneOf,
} from '@boomeyes/mock';
import {
  createOutbox,
  hasIndexedDB,
  idbStore,
  memoryStore,
  withOutbox,
  type NetMode,
  type Outbox,
  type OutboxItem,
} from '@boomeyes/offline';
import { login, session } from '$lib/session.svelte';
import type { LayoutLoad } from './$types';

export const ssr = false;
export const prerender = false;
const LOGINS: ScrId[] = ['A1-01', 'A2-01', 'A3-01', 'A4-01'];

// 오프라인 제출 큐(ADR-010) — 조립 지점에서 한 번. live = IndexedDB 'boomeyes-outbox'(앱 재시작·오프라인 새로고침 후 보존)
// capture/e2e = 픽스처 키별 DB(캡처 간 누수 방지) + 자동 재전송 없음(결정성 — 배너 "지금 동기"만)
let outbox: Outbox | null = null;
let outboxKey = '';
async function bootOutbox(key: string, capture: boolean, net: NetMode): Promise<Outbox> {
  if (!outbox || outboxKey !== key) {
    const name = key === 'live' ? 'boomeyes-outbox' : `boomeyes-outbox-${key}`;
    outbox = createOutbox({ store: hasIndexedDB() ? idbStore(name) : memoryStore(), clock, auto: !capture, net });
    outboxKey = key;
    await outbox.load();
  }
  outbox.setNet(net);
  return outbox;
}
// `?state=queued` 픽스처 — 큐 항목은 db가 아니라 아웃박스에 시드한다(화면은 큐를 직접 만지지 않는다)
const QUEUED: Partial<Record<ScrId, (at: string) => OutboxItem[]>> = {
  'A2-02': (at) => [
    {
      id: 'fixture-checkin',
      userId: 'driver03',
      kind: 'checkin',
      args: ['driver03', { lat: 37.5665, lng: 126.978 }],
      at,
      tries: 0,
      state: 'queued',
    },
  ],
  'A2-05': (at) => [
    {
      id: 'fixture-doc',
      userId: 'driver03',
      kind: 'doc',
      args: ['DOC-001', { name: 'cert.jpg', type: 'image/jpeg', size: 245_000 }, 'driver03'],
      at,
      tries: 0,
      state: 'queued',
    },
  ],
};

export const load: LayoutLoad = async ({ url }) => {
  const screen = screenForPath(url.pathname, url.search, 'pwa');
  const opts = optionsFromUrl(url, screen);
  const mock = bootMock(opts);
  // 전송 조건 흉내 `?net=off|fail|slow` — 레이아웃이 해석한다(`?state=`는 mock 데이터, `?net=`은 전송 조건, ADR-010)
  const n = url.searchParams.get('net');
  let net: NetMode = n === 'off' || n === 'fail' || n === 'slow' ? n : 'on';
  const seed = opts.capture && opts.state === 'queued' && screen ? QUEUED[screen] : undefined;
  if (seed) net = 'off';
  const box = await bootOutbox(opts.capture ? `capture|${screen}|${opts.state ?? ''}` : 'live', !!opts.capture, net);
  if (seed) await box.seed(seed(clock.minus(10 * MIN)));
  const api = withOutbox(mock, box);
  // 시연 장면(?scene=N, 앱 내 이동에서는 활성 장면 유지): 장면 계정으로 로그인 — 그 계정이 이 화면 권한이 없으면 화면 첫 역할의 데모 계정.
  // ?capture=1과 같은 가드 우회, W3 실 인증 전 제거 (specs/demo-scripts AC-7)
  const scene = sceneOf(opts.scene ?? activeScene());
  if (scene) {
    const acct = demoSessionFor(scene.account);
    const u =
      acct && (!screen || canAccess(acct.role, screen))
        ? acct
        : screen
          ? demoSession(SCREENS[screen].roles[0] as RoleId)
          : acct;
    if (u && session.user?.userId !== u.userId) login(u);
  }
  if (opts.capture && !session.user && screen && !LOGINS.includes(screen))
    session.user = demoSession(SCREENS[screen].roles[0] as RoleId);
  const user = session.user;
  const surface = url.pathname.split('/')[1] ?? 'a1';
  if (screen && !LOGINS.includes(screen) && !user && !opts.capture) throw redirect(302, `/${surface}/login`);
  const forbidden = !!(user && screen && !canAccess(user.role, screen));
  const t = url.searchParams.get('theme');
  const theme: 'dark' | 'light' | null = t === 'dark' || t === 'light' ? t : null; // 캡처·e2e용 루트 테마(저장 안 함)
  const realtime = scene ? createSceneRealtime(scene.scene, mock) : createMockRealtime({ enabled: !opts.capture });
  const media = createMockMedia(mock.db);
  return {
    api,
    clock,
    realtime,
    media,
    resetMock,
    screen,
    capture: !!opts.capture,
    forbidden,
    surface,
    theme,
    scene,
    scenes: SCENES,
    jumpHour: () => clock.jump(H),
    outbox: box,
    net,
    // 알림 권한 시트(?state=push, A1-02 픽스처 — 레이아웃이 연다). capture 픽스처는 '권한 default' 문구를 보인다(headless는 항상 denied)
    pushSheet: url.searchParams.get('state') === 'push',
    pushDemo: !!opts.capture && url.searchParams.get('state') === 'push',
  };
};
