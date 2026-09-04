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
| B0-01 | 웹 공통 로그인 | `/login` | `login-b1` `login-b2` `login-b3` `login-b4` |
| A1-01 · A2-01 · A3-01 · A4-01 | 앱 로그인 | `/a1/login` … | `login` |
| (셸) WebShell | 사이드바 240/56 · 탑바 48 · 콘텐츠 1400 · 인스펙터 360 | — | — |
| (셸) PwaShell | 앱바 56 · 하단 내비 56+safe-area · 시트 호스트 · 오프라인 배너 | — | — |

## 수용 기준
- **AC-1** Given 데모 계정 7(`roles.yaml demo_account`) When 각 계정으로 로그인 Then 역할별 첫 화면으로 이동한다 — control→`/b1/dash`, hq-safety→`/b2/map`, site-safety(웹)→`/b3/console`, ops-admin→`/b4/protocols`, driver→`/a2/today`, site-safety(앱)→`/a1/inbox`, hq-safety(앱)→`/a3/sites`, owner→`/a4/fleet` [FR-001]
- **AC-2** Given 로그인한 역할 When 권한 밖 라우트에 접근 Then 403 안내(EmptyState)와 첫 화면 이동 링크가 보인다 [FR-001, FR-024]
- **AC-3** Given 웹 화면 When 렌더 Then WebShell의 사이드바(역할별 항목·접힘 56)·탑바(48)·콘텐츠(최대 1400)가 토큰 값으로 배치되고 `data-density="compact"`다 [FR-024]
- **AC-4** Given PWA 화면 When 렌더 Then PwaShell의 앱바(56)·하단 내비(역할별 3~5 항목, safe-area)·오프라인 배너 슬롯이 있고 `data-density="comfortable"`다 [FR-001]
- **AC-5** Given `?state=<id>` 또는 `?capture=1` When 로드 Then `screens.yaml` states의 픽스처가 적용되고 시각은 `meta.fixed_clock`으로 고정되며 라우트 루트에 `data-scr`가 있다 [FR-001]
- **AC-6** Given `data-theme="dark"` When 렌더 Then 두 셸이 다크 토큰으로 렌더된다(대비 게이트 통과) [FR-024]

## 상태 픽스처
B0-01: `login-b1..b4`(역할 카드 4) · 앱 로그인: `login`. 로그인 오류 상태는 목업 범위 밖(실인증 없음, DISC-020·023).

## 비범위
실인증(IdP) · 회원가입(DISC-023) · 자동 로그인 2단계(DISC-020) · 비밀번호 재설정.
