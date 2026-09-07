브랜드 마크는 코드가 원천이다 — 패스는 `packages/tokens/src/logo.json`, 컴포넌트는 `Logo`(packages/ui), 정적 자산은 `pnpm brand:build`가 만든다. 서비스명은 확정 전(DISC-021, "BoomEyes"는 가칭)이라 워드마크는 스크립트로 재생성한다.

### 13.1 구조 · 변형

- **마크** = 정육각 조리개(꼭짓점 위 · 6엽 · 20° 비틀림 · 중앙 육각 구멍) = Eyes, 그 위를 지나는 **붐**(링크 2 · 관절 2 · 수직 링크 · 호스 팁) = Boom. 64×64 박스 안에 들어가고, 붐은 상단 좌측 변에 평행하게 띄워 올라가 우측으로 내려온다. 모든 형태는 채움 패스(스트로크 없음) — 크기에 따라 선 굵기가 변하지 않는다.
- `mark`(≥ 32px · 6엽) · `glyph`(≤ 24px · 육각 링 + 중앙 원 + 붐, 엽 없음 — 사이드바 접힘·PWA 앱바·favicon) · `lockup`(마크 + 여백 16 + 워드마크, 317.67×64).
- **워드마크**: DS 서체 Pretendard Bold(OFL) 아웃라인 · 대문자 높이 34/64 · GPOS kern 적용 · "Boom"은 ink, "Eyes"는 accent. 라이브 텍스트로 쓰지 않는다(Pretendard는 웹폰트로 로드되지 않아 기기마다 다르게 그려진다).

### 13.2 색

- **단색(셸)**: 사이드바 · PWA 앱바 · 쇼케이스 머리글 · 인쇄 머리글 — `currentColor`(`text-fg`). 브랜드 마크는 색 예산(§0-4) 밖이지만, 상태색과 나란히 놓이는 셸에서는 색을 쓰지 않는다.
- **두 톤(브랜드 면)**: 로그인(B0-01 · A*-01) · 앱 아이콘 · favicon · README · 문서 표지 — ink `sys.color.fg.default` + 붐·"Eyes" `sys.color.accent.fg`(라이트 #0d32a1 · 다크 #9ebdff, 캔버스 대비 ≥ 10:1). `accent.solid`는 라이트에서 ink와 1.3:1이라 마크에는 쓰지 않는다.
- **아이콘**(PWA 192/512/maskable · apple-touch): 바탕 `sys.color.accent.solid`(= manifest `theme_color`) · 마크 `sys.color.accent.on-solid` · 붐 `ref.color.accent.7`(바탕 대비 6.8:1). maskable은 마크 박스가 변의 56% 이하(안전 원 반지름 40% 안).
- 새 토큰·램프는 없다 — "브랜드 전용 토큰은 없다"(§0)는 그대로 참이다. `pnpm design:audit:color`는 `fill-*`을 세지 않는다.

### 13.3 크기 · 여백

| 자리 | 변형 | 크기 유틸리티 |
|---|---|---|
| 웹 사이드바(펼침) | lockup 단색 | `h-size-avatar-md w-auto` (compact 32) |
| 웹 사이드바(접힘 56) | glyph 단색 — 토글과 세로 적층 | `size-size-icon-xl` (compact 24) |
| PWA 앱바 | glyph 단색(장식, 제목 h1 옆) | `size-size-icon-lg` (24) |
| 웹 로그인 | lockup 두 톤 | `h-size-avatar-lg w-auto` (compact 40) |
| PWA 로그인 | lockup 두 톤 | `h-size-avatar-md w-auto` (40) |
| 인쇄 머리글(B2-04) | lockup 단색 · `print:` 전용 | `h-size-icon-lg w-auto` |

최소 크기 mark 32 · glyph 16 · lockup 높이 24. 여백(clear space)은 마크 높이의 1/4 — lockup의 마크·워드마크 사이 간격과 같다.

### 13.4 접근성

`label`이 있으면 `role="img" aria-label`(로그인), 없으면 `aria-hidden`(인접 텍스트·링크가 이름을 갖는다). 사이드바 마크는 링크 `aria-label="BoomEyes 홈"` 안에 들어간다. e2e 훅은 `data-logo`(변형) · `data-color`(두 톤).

### 13.5 금지

색 변경(상태색·임의 색) · 회전 · 붐 분리 · 엽 수 변경 · 라이브 텍스트 워드마크 · 그림자·외곽선 추가 · 마크를 아이콘 버튼으로 쓰기.

### 13.6 재생성

`pnpm brand:generate`(`tools/brand/wordmark.py` Pretendard Bold → `tools/brand/mark.mjs`) → `pnpm tokens:build`(이 문서) → `pnpm brand:build`(`tools/brand/build.mjs`, 저장소의 Chromium): `apps/{web,pwa}/static/favicon.{svg,png}` · `apps/pwa/static/icons/{icon-192,icon-512,icon-512-maskable,apple-touch-icon}.png` · `docs/brand/lockup{,-dark,-on-navy}.svg`. 색은 `dist/DY.tokens.css`에서 읽으므로 accent 토큰이 바뀌면 다시 실행한다. PNG는 verify의 생성물 diff 게이트 밖(래스터 환경 차이). 서비스명이 확정되면 `--text`만 바꿔 재생성한다.
