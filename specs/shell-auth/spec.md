---
id: SPEC-shell-auth
status: draft
wave: 0
screens: [B0-01, A1-01, A2-01, A3-01, A4-01]
fr: [FR-001, FR-024]
---
# shell-auth — 로그인·역할 분기·앱 셸

## 목적 · 역할
7역할(`roles.yaml`)이 로그인하면 역할별 첫 화면으로 가고, 이후 모든 화면은 WebShell(웹) 또는 PwaShell(PWA) 안에서 렌더된다. 목업 단계의 인증은 **역할 카드 로그인 + 데모 계정**(실인증 없음, ADR-002).

## 화면
| 코드 | 이름 | 라우트 | 상태 픽스처 |
|---|---|---|---|
| B0-01 | 웹 공통 로그인 | `/login` | `login-b1` `login-b2` `login-b3` `login-b4` `login-maint` |
| A1-01 · A2-01 · A3-01 · A4-01 | 앱 로그인 | `/a1/login` … | `login` |
| (셸) WebShell | 사이드바 240/56 · 탑바 48 · 콘텐츠 1400 · 인스펙터 360 | — | — |
| (셸) PwaShell | 앱바 56 · 하단 내비 56+safe-area · 시트 호스트 · 오프라인 배너 | — | — |

## 수용 기준
- **AC-1** Given 데모 계정 7(`roles.yaml demo_account`) When 각 계정으로 로그인 Then 역할별 첫 화면으로 이동한다 — control→`/b1/dash`, hq-safety→`/b2/map`, site-safety(웹)→`/b3/console`, ops-admin→`/b4/protocols`, maintenance→`/b1/escalation`(B1 연계 카드), driver→`/a2/today`, site-safety(앱)→`/a1/inbox`, hq-safety(앱)→`/a3/sites`, owner(웹)→`/b1/dash`(소유주 = B1 주인, ADR-012), owner(앱)→`/a4/fleet` [FR-001]
- **AC-2** Given 로그인한 역할 When 권한 밖 라우트에 접근 Then 403 안내(EmptyState)와 첫 화면 이동 링크가 보인다 [FR-001, FR-024]
- **AC-3** Given 웹 화면 When 렌더 Then WebShell의 사이드바(역할별 항목·접힘 56)·탑바(48)·콘텐츠(최대 1400)가 토큰 값으로 배치되고 `data-density="compact"`다 [FR-024]
- **AC-4** Given PWA 화면 When 렌더 Then PwaShell의 앱바(56)·하단 내비(역할별 3~5 항목, safe-area)·오프라인 배너 슬롯이 있고 `data-density="comfortable"`다 [FR-001]
- **AC-5** Given `?state=<id>` 또는 `?capture=1` When 로드 Then `screens.yaml` states의 픽스처가 적용되고 시각은 `meta.fixed_clock`으로 고정되며 라우트 루트에 `data-scr`가 있다 [FR-001]
- **AC-6** Given `data-theme="dark"` When 렌더 Then 두 셸이 다크 토큰으로 렌더된다(대비 게이트 통과) [FR-024]
- **AC-7** Given PWA 빌드 When 브라우저가 로드하면 Then `manifest.webmanifest`(name · icons 192/512/maskable · display standalone · theme_color = 액센트 토큰 값)가 링크되고 서비스 워커가 등록되어, 오프라인 새로고침에도 앱 셸(로그인 화면)이 렌더된다 [FR-001, FR-024]
- **AC-8** Given 두 셸과 로그인 화면 When 렌더 Then 셸의 브랜드는 단색 `Logo`(웹 사이드바 펼침 = lockup, 접힘 = glyph, 링크 이름 "BoomEyes 홈" · PWA 앱바 = glyph 장식)이고, 로그인은 두 톤 lockup(접근 가능한 이름 "BoomEyes")이며, `favicon.svg`·PWA 아이콘 3·apple-touch-icon이 200으로 응답한다 [FR-001, FR-024]
- **AC-9** Given 웹 로그인 카드 When 소유주 카드(`owner01`, 첫 카드)를 누르면 Then B1-02로 들어가고 세션에 `ownerId`(OWN-001)가 실리며 탑바 org는 '사업주'(roles.yaml owner org), 제조사 3역할(control·ops-admin·maintenance)의 org는 '제조사 (DY)'다 — 픽스처 `login-owner`(ADR-012) [FR-001, FR-024]
## 상태 픽스처
B0-01: `login-b1..b4` · `login-maint`(역할 카드 5) · 앱 로그인: `login`. 로그인 오류 상태는 목업 범위 밖(실인증 없음, DISC-020·023).

## 비범위
실인증(IdP) · 회원가입(DISC-023) · 자동 로그인 2단계(DISC-020) · 비밀번호 재설정.
