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
- 쿼리: `?state=<id>`(픽스처) · `?capture=1`(시각 고정·애니메이션 off) · `?theme=dark`(캡처용).

## 셸 규약 (DY-design.md §9·§10)
- 웹 루트 `data-density="compact"` · PWA `comfortable`. 테마는 `data-theme` 또는 prefers-color-scheme.
- 사이드바 항목 = `screens.yaml`에서 역할·표면별 wave ≤ current 화면(생성 nav). 하단 내비 세트: driver(오늘·내 장비·서류·메뉴) · site-safety(업무함·관제·기록·메뉴) · hq-safety(현장·업무·기록) · owner(현황·요청·운전자·계약).

## 오프라인 · 오류 · 빈 상태
오프라인 Banner(neutral) · 403 EmptyState(action: 첫 화면) · 로딩 Skeleton(300ms).

## 접근성
포커스 링 `focus.ring` 2px · 랜드마크(`nav` `main` `aside`) · 하단 내비 `aria-current`.

## 열린 질문
DISC-020(인증·계정) · DISC-023(가입 방식) — 목업은 역할 카드로 대체.
