// 정적 SPA — 서버 렌더 없음 (ADR-001 · ADR-007). 화면 진입마다 mock 부트(?state= · ?capture=1) + 역할 가드
import { redirect } from '@sveltejs/kit';
import { SCREENS, ownerViewOf, canAccess, screenForPath, type RoleId, type ScrId } from '@boomeyes/domain';
import {
  bootMock,
  bootOwner,
  resetOwner,
  clock,
  createMockMedia,
  createMockRealtime,
  createSceneRealtime,
  demoSession,
  demoSessionFor,
  H,
  optionsFromUrl,
  resetMock,
  SCENES,
  activeScene,
  sceneOf,
} from '@boomeyes/mock';
import { login, session } from '$lib/session.svelte';
import type { LayoutLoad } from './$types';

export const ssr = false;
export const prerender = false;

export const load: LayoutLoad = ({ url }) => {
  const screen = screenForPath(url.pathname, url.search, 'web');
  const opts = optionsFromUrl(url, screen);
  const api = bootMock(opts);
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
  // capture 모드: 로그인 없이도 셸까지 그리도록 화면 첫 역할의 데모 세션을 합성 (QA §3)
  if (opts.capture && !session.user && screen && screen !== 'B0-01')
    session.user = demoSession(SCREENS[screen].roles[0] as RoleId);
  const requestedOwnerView = ownerViewOf(screen, 'web');
  const ownerEntry = requestedOwnerView === 'entry' && url.searchParams.get('demo') === 'owner';
  const ownerActive =
    !scene &&
    (ownerEntry || (session.user?.role === 'owner' && !!requestedOwnerView && requestedOwnerView !== 'entry'));
  const ownerView = ownerActive ? requestedOwnerView : undefined;
  const ownerState = opts.capture ? opts.state : null;
  const dataset =
    ownerState === 'empty' || ownerState === 'boundaries' || ownerState === 'large' ? ownerState : 'owner';
  const ownerApi =
    ownerActive && !ownerEntry
      ? bootOwner(session.user, {
          dataset,
          error: ownerState === 'error',
          latencyMs: opts.capture ? 0 : 120,
          offline: () => typeof navigator !== 'undefined' && !navigator.onLine,
        })
      : undefined;
  const user = session.user;
  if (screen !== 'B0-01' && !user && !opts.capture)
    throw redirect(
      302,
      `${requestedOwnerView ? '/login?demo=owner&' : '/login?'}next=${encodeURIComponent(url.pathname + url.search)}`,
    );
  const forbidden = !!(user && screen && !canAccess(user.role, screen));
  const t = url.searchParams.get('theme');
  const theme: 'dark' | 'light' | null = t === 'dark' || t === 'light' ? t : null; // 캡처·e2e용 루트 테마(저장 안 함)
  const realtime = scene
    ? createSceneRealtime(scene.scene, api)
    : createMockRealtime({ enabled: !opts.capture && !ownerActive });
  const media = createMockMedia(api.db);
  return {
    api,
    ownerView,
    ownerApi,
    resetOwner,
    clock,
    realtime,
    media,
    resetMock,
    screen: screen as ScrId | undefined,
    capture: !!opts.capture,
    forbidden,
    theme,
    scene,
    scenes: SCENES,
    jumpHour: () => clock.jump(H), // 장면 6 "1시간 경과" — 화면은 invalidateAll()로 다시 읽는다
  };
};
