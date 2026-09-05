# shell-auth — 기술 설계

## 컴포넌트 (카탈로그)
- `WebShell`(Sidebar · Topbar · Content · Inspector 슬롯) · `PwaShell`(AppBar · Content · BottomNav · Sheet host · Banner)
- `Button`(variant solid/outline · tone accent) · `Card`(역할 카드) · `EmptyState`(403) · `Banner`(오프라인)
- cmp 토큰: `cmp.nav.sidebar.*` `cmp.nav.topbar.*` `cmp.nav.appbar.*` `cmp.nav.bottomnav.*` `cmp.button.*`

## 데이터 · 상태
- `ENT-05` 사용자: `{user_id, role, org, sites[]}` — mock 시드 7계정(`roles.yaml`).
- 세션: `packages/domain` `session` 스토어(runes `$state`) — `{user, role, scope}`; localStorage에 역할만 보관(목업).
- 라우트 가드: `+layout.ts`에서 `SCREENS[code].roles`(`ids.ts`)와 세션 역할 비교 → 불일치 시 403 EmptyState.

## 라우트
- 웹: `/login` → 역할 카드 4 → `/b1/dash` `/b2/map` `/b3/console` `/b4/protocols`.
- PWA: `/a1/login` `/a2/login` `/a3/login` `/a4/login` → `/a1/inbox` `/a2/today` `/a3/sites` `/a4/fleet`.
- 쿼리: `?state=<id>`(픽스처) · `?capture=1`(시각 고정·애니메이션 off) · `?theme=dark|light`(캡처·e2e용 — 루트 `data-theme`에 적용만, 저장하지 않음 · `app.html` 선적용도 이 값을 우선).

## 셸 규약 (DY-design.md §9·§10)
- 웹 루트 `data-density="compact"` · PWA `comfortable`. 테마는 문서 루트 `data-theme`(없으면 prefers-color-scheme). **웹**: 기본 light, 탑바 토글(☾/☀)로 사용자가 전체 다크 선택 — `localStorage dy.theme`에 기기 단위로 유지(로그아웃·`resetMock`에도 남음). **PWA**: 시스템 다크를 따르고 토글 없음(DY-design §10). 월보드·쇼케이스는 컴포넌트 내부 강제(§9) — 토글과 무관.
- 사이드바 항목 = `screens.yaml`에서 역할·표면별 wave ≤ current 화면(생성 nav). 하단 내비 세트: driver(오늘·내 장비·서류·메뉴) · site-safety(업무함·관제·기록·메뉴) · hq-safety(현장·업무·기록) · owner(현황·요청·운전자·계약).

## 설치(PWA)
- `static/manifest.webmanifest` + `static/icons/`(ffmpeg 합성 단색 아이콘 — 브랜드 확정 DISC-021 전 자리) · `src/service-worker.ts`(SvelteKit `$service-worker`: `build`·`files`·셸 `/` 프리캐시, 내비게이션 network-first → 오프라인은 캐시된 셸, 외부(CARTO)는 통과). mock 데이터는 캐시하지 않는다(세션 메모리). 개발 서버에서는 등록되지 않고 preview·배포 빌드에서만 등록. PWA는 `paths.relative: false`(절대 `/_app/…`) — 상대 경로 셸을 깊은 경로(`/a2/login`)에서 오프라인으로 열면 자산이 `/a2/_app/…`으로 풀려 부팅 실패(프로브로 확인).

## 오프라인 · 오류 · 빈 상태
오프라인 Banner(neutral) · 403 EmptyState(action: 첫 화면) · 로딩 Skeleton(300ms).

## 접근성
포커스 링 `focus.ring` 2px · 랜드마크(`nav` `main` `aside`) · 하단 내비 `aria-current`.

## 열린 질문
DISC-020(인증·계정) · DISC-023(가입 방식) — 목업은 역할 카드로 대체.
