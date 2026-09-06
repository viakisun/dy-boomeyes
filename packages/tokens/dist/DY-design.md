# DY BoomEyes 디자인 시스템 — DY-design.md

브랜드 팩 `DY` v0.1.0 · 토큰 패키지 `@boomeyes/tokens` 0.1.0 · 발행 2026-09-05 · 소유 DY(운영사) · 제작 VIA

이 문서는 `packages/tokens/src`(토큰 원천·브랜드 팩·컴포넌트 카탈로그·산문)에서 `node scripts/build.mjs`가 생성한다. 수기 수정 금지 — 원천을 고치고 다시 생성한다.

| 구성 | 수 |
|---|---|
| 토큰 전체 | 620 |
| ref(원시) | 206 |
| sys(시맨틱) | 322 |
| cmp(컴포넌트) | 92 |
| 컴포넌트 카탈로그 | 79 |
| 대비 검사 | 82/82 통과 |

| 산출물 | 용도 |
|---|---|
| `dist/DY.tokens.css` | :root CSS 변수 · [data-theme=dark] · prefers-color-scheme · [data-density=compact] |
| `dist/DY.theme.css` | Tailwind v4 @theme(inline) — 유틸리티 이름은 §1 표 |
| `dist/DY.tokens.json` | 모드별 해석값 + 메타(css 변수명·Tailwind 이름) — 도구·테스트용 |
| `dist/DY-design.md` | 이 문서 |

## 0. 원칙

1. **하나의 시스템, 두 밀도.** 웹 백오피스(compact)와 현장 PWA(comfortable)는 같은 토큰·같은 컴포넌트를 쓰고 밀도 토큰만 다르다. 화면별 예외값을 만들지 않는다.
2. **시맨틱 우선.** 화면 코드는 `sys`·`cmp` 토큰만 호출한다. `ref` 램프 직접 참조는 램프를 정의하는 곳(sys)과 차트·지도 계열에서만 허용한다.
3. **모드는 값의 차이, 구조는 하나.** light/dark, compact/comfortable, 브랜드는 같은 토큰 경로에 다른 값을 넣는다. 다크 전용 토큰·브랜드 전용 토큰은 없다.
4. **상태는 색으로만 말하지 않는다.** 장비·업무·서류 상태는 색 + 아이콘/점 + 텍스트를 함께 쓴다. 도메인 토큰이 색을 정하고, StatusPill·StatusDot이 형태를 정한다.
5. **접근성은 게이트.** 본문 7:1, 보조 텍스트 4.5:1, 비텍스트 UI 3:1을 빌드가 검사한다. 통과하지 못한 토큰은 배포되지 않는다.
6. **밀도는 역할에서 온다.** 관제·백오피스는 한 화면에 많은 행을 담고(Linear 밀도: 행 36 · 본문 13px), 현장 앱은 장갑 낀 손과 햇빛을 전제로 한다(터치 48 · 본문 16px).
7. **코드가 원천.** Figma 파일은 참조였고 동기 대상이 아니다. 토큰·문서·CSS는 `packages/tokens/src`에서 생성되며, 디자인 변경은 소스 변경으로 기록된다.
8. **작게 유지.** 색조 7, 램프 12단, 타입 역할 14, 간격 16단. 새 값은 기존 값으로 표현할 수 없음을 보이고 나서 추가한다.
9. **사용자의 말로 쓴다.** 화면의 글은 현장·본사·운영사 사람이 읽는다. 식별자(DISC·FR·ENT…)·웨이브·구현 용어는 UI 밖(`data-ref` · 데모 바)에 둔다. 부제는 한 줄, 버튼은 동사. (§12)
10. **한 페이지 한 골격.** 웹은 PageHeader → 요약 → 목록/표 → 인스펙터, PWA는 AppBar → 배너 → 카드 → 고정 CTA. 화면마다 헤더·표·폼을 새로 그리지 않는다. (§11)

## 1. 명명 규칙

### 1.1 문법

```
<layer>.<category>.<concept>[.<variant>][-<state>]
```

| 자리 | 허용값 | 예 |
|---|---|---|
| layer | `ref`(원시) · `sys`(시맨틱) · `cmp`(컴포넌트) | `sys` |
| category | ref: color space size radius border shadow font motion · sys: color type space size layout radius border shadow motion z opacity · cmp: 컴포넌트명 | `color` |
| concept | 역할 명사 — bg fg border accent status domain focus / inset stack inline page / control icon row … | `bg` |
| variant | 구체화 — canvas surface ui / info danger / md lg / 1~12 | `surface` |
| state | 접미사 `-hover -active -selected -disabled -focus -strong -subtle -raised -sunken` | `ui-hover` |

### 1.2 규칙

1. 소문자·숫자·하이픈만. 공백·괄호·대문자·주석 금지 (`gray/300 (Disabled)` 같은 주석형 이름은 sys 역할 토큰으로 옮긴다).
2. 상태는 마지막 세그먼트의 접미사다. `bg.ui-hover`이지 `bg.ui.hover`가 아니다.
3. 숫자는 두 가지 뜻만 갖는다 — 램프 단계(1~12)와 픽셀 값(`space.16` = 16px). t-shirt 크기(sm/md/lg)는 시맨틱에서만 쓴다.
4. `ref`는 값만 갖고 별칭을 갖지 않는다(액센트 램프 예외). `sys`는 `ref`·`sys`를, `cmp`는 `sys`만 참조한다. 빌드가 강제한다.
5. 색 역할 어휘는 고정: `bg fg border accent focus status.<tone> domain.<entity>.<state>`. tone은 info success warning danger progress neutral 여섯.
6. 타입은 `<role>-<size>`: display heading body label code × xl lg md sm xs. 굵기 변형 토큰은 만들지 않는다.
7. 컴포넌트 토큰은 `cmp.<component>.<property>[.<variant>]`. 컴포넌트명은 카탈로그의 PascalCase를 kebab-case로.
8. 새 사업자 브랜드는 `src/brands/<ID>.json`. 토큰 경로에는 브랜드명이 들어가지 않는다(`accent`가 브랜드다).

### 1.3 CSS · Tailwind · Svelte 대응

| 층 | 이름 | 예 |
|---|---|---|
| CSS 변수 | `--<layer>-<path-kebab>` | `--sys-color-bg-canvas` · `--sys-type-body-md`(font 축약) · `--sys-type-body-md-font-size` |
| Tailwind(색) | `bg.<x>`→`bg-<x>` · `fg.<x>`→`text-fg-<x>`(default는 `text-fg`) · `border.<x>`→`border-border-<x>` · `accent.solid`→`bg-accent` · `status.<tone>.solid`→`bg-<tone>` · `domain.<e>.<s>.solid`→`bg-<e>-<s>` | `bg-canvas` `text-fg-muted` `bg-danger` `text-danger-fg` `bg-equipment-fault` |
| Tailwind(치수) | `ref.space.16`→`p-16` · `sys.space.inset.md`→`p-inset-md` · `sys.size.control.md`→`h-size-control-md` · `sys.radius.card`→`rounded-card` · `sys.shadow.modal`→`shadow-modal` · `sys.type.body-md`→`text-body-md`(행간·굵기·자간 포함) · `sys.motion.duration.fast`→`duration-fast` · `sys.border.width.strong`→`border-strong`/`border-b-strong` · `sys.layout.toast.width`→`max-w-layout-toast-width` · `sys.layout.prose.width`→`max-w-layout-prose-width` | |
| Svelte | 컴포넌트 PascalCase · prop `variant tone size` · boolean 상태 `disabled loading selected invalid` · 이벤트 `onselect onchange` | `<Button variant="outline" tone="danger" size="sm">` |
| data 속성 | 모드 = `data-theme="light|dark"` · `data-density="compact|comfortable"` — 문서 루트에만 · 국소 강제는 `CameraWall` 등 컴포넌트 내부에서만 | |

### 1.4 금지

- 화면 코드의 hex·px 직접 사용(`tokens:lint` 0건). 예외: 차트 시리즈, 지도 타일 스타일.
- Tailwind 기본 팔레트·간격(`bg-blue-500` `p-4`가 기본 스케일 의미로 쓰이는 것). theme.css가 기본 스케일을 초기화한다.
- 다크 전용 컴포넌트, 브랜드 전용 컴포넌트, 화면 전용 토큰.

### 1.9 예시 — 토큰 경로 · CSS 변수 · Tailwind 이름

| 토큰 | CSS | Tailwind theme |
|---|---|---|
| `ref.space.16` | `--ref-space-16` | `--spacing-16` |
| `ref.color.accent.9` | `--ref-color-accent-9` | `--color-accent-9` |
| `sys.color.bg.canvas` | `--sys-color-bg-canvas` | `--color-canvas` |
| `sys.color.fg.muted` | `--sys-color-fg-muted` | `--color-fg-muted` |
| `sys.color.status.danger.fg` | `--sys-color-status-danger-fg` | `--color-danger-fg` |
| `sys.color.domain.equipment.fault.solid` | `--sys-color-domain-equipment-fault-solid` | `--color-equipment-fault` |
| `sys.size.control.md` | `--sys-size-control-md` | `--spacing-size-control-md` |
| `sys.space.inset.md` | `--sys-space-inset-md` | `--spacing-inset-md` |
| `sys.type.body-md` | `--sys-type-body-md` | `--text-body-md` |
| `cmp.button.height.md` | `--cmp-button-height-md` | — |

## 2. 브랜드 팩

| 항목 | 값 |
|---|---|
| id | DY |
| 이름 | DY BoomEyes |
| 액센트 색조 | navy · 앵커 #0d2877 · 고정 단계 9=#0d2877 10=#081849 11=#0d32a1 12=#050f2e |
| 서체 | Pretendard Variable |
| 기본 모드 | web: light/compact · pwa: light/comfortable · wall: dark/comfortable |
| 참조 | Figma kBZarC75huG1mzuUnIv0p7 ([DY] Crane Eyes) · DY-crane-eyes-back-office(SvelteKit) — 구조 참조 |

브랜드 팩은 액센트 색조(앵커·고정 단계)·서체·기본 모드만 정의한다. 나머지 램프·역할·컴포넌트는 시스템 공통이며, 새 사업자는 `src/brands/<ID>.json` 하나로 `<ID>-design.md`·CSS를 얻는다.

## 3. 색

### 3.1 램프 (`ref.color.<hue>.<1-12>`) — OKLCH 12단

단계 의미: 1 앱 바탕 · 2 미묘한 바탕 · 3 컨트롤 배경 · 4 hover · 5 active/selected · 6 미묘한 테두리 · 7 테두리 · 8 강조 테두리 · 9 solid · 10 solid hover · 11 저대비 텍스트(≥4.5:1) · 12 고대비 텍스트. 앵커 hex에서 색상각(H)·채도(C)를 취하고 명도 사다리로 12단을 생성한다(색역 밖은 C만 축소). 브랜드 앵커는 단계 고정(pin)으로 원색을 보존한다.

| 색조 | 역할 | 앵커 | H | C | light 9 | dark 9 |
|---|---|---|---|---|---|---|
| neutral | neutral | #0d2877 | 264.7 | 0.008 | L62 C0.008 H269 | L58 C0.008 H268 |
| navy | accent | #0d2877 | 264.7 | 0.139 | L32 C0.139 H265 | L52 C0.139 H265 |
| blue | info | #155dfc | 262.9 | 0.246 | L50 C0.245 H263 | L52 C0.246 H263 |
| green | success | #1c6831 | 148.7 | 0.14 | L50 C0.140 H149 | L52 C0.140 H149 |
| yellow | warning | #ffb013 | 75.8 | 0.168 | L82 C0.160 H76 | L82 C0.160 H76 |
| red | danger | #e71825 | 26.4 | 0.231 | L50 C0.204 H26 | L52 C0.212 H26 |
| teal | progress | #009487 | 184 | 0.106 | L50 C0.088 H184 | L52 C0.092 H184 |

**light**

| 색조 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | on-solid |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| neutral | #fdfdff | #f8faff | #f1f3f9 | #e8ebf1 | #e0e3e8 | #d6d9df | #bbbec3 | #9c9ea4 | #84868b | #727479 | #616368 | #191b1e | #ffffff |
| navy (accent) | #fdfdff | #f6f9ff | #ebf1ff | #dde8ff | #cdddff | #bcd0fb | #a1baef | #6d8bcc | #0d2877 | #081849 | #0d32a1 | #050f2e | #ffffff |
| blue | #fdfdff | #f6f9ff | #eaf1ff | #dce8ff | #ccdeff | #b8d1ff | #96baff | #4d86fa | #024deb | #0040ce | #003abc | #031e61 | #ffffff |
| green | #fbfffb | #f4fcf4 | #e6f6e8 | #d7efda | #c7e7cb | #b4dcb9 | #97ca9e | #5c9e68 | #067831 | #006828 | #015e24 | #052f11 | #ffffff |
| yellow | #fffdfa | #fff8ef | #fdefdb | #fae4c7 | #f5d8b1 | #eeca97 | #dfb271 | #ab7401 | #ffb32e | #eea300 | #684500 | #362200 | #191b1e |
| red | #fffdfc | #fff7f6 | #ffecea | #ffdfdb | #ffd0ca | #ffbdb5 | #ff9b91 | #e25851 | #bc0016 | #a30012 | #94000f | #500004 | #ffffff |
| teal | #fafefe | #f2fbfa | #e4f6f2 | #d4efea | #c2e6e0 | #addbd3 | #8ec8bf | #4d9c92 | #007369 | #00635a | #005a52 | #002e29 | #ffffff |

**dark**

| 색조 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | on-solid |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| neutral | #0c0d11 | #121417 | #1a1c20 | #222428 | #2c2e32 | #37393e | #4b4d52 | #616368 | #787a7f | #8a8c91 | #bbbec3 | #eff2f7 | #191b1e |
| navy (accent) | #0b0f19 | #101623 | #151f33 | #1b2844 | #213156 | #293b65 | #364b7a | #425c94 | #4064b8 | #5176cc | #9ebdff | #e7efff | #ffffff |
| blue | #070f1f | #0a152c | #0b1d42 | #0d2558 | #0d2c70 | #133682 | #1e469c | #2555bd | #0a54f3 | #286cff | #9bbeff | #e6efff | #ffffff |
| green | #09120a | #0d1a0f | #102514 | #123019 | #143c1e | #1b4825 | #285932 | #306d3d | #147e37 | #2f9048 | #8dd198 | #dcf7df | #ffffff |
| yellow | #160e04 | #1f1404 | #2d1b00 | #392400 | #462d00 | #543600 | #684500 | #a8751a | #ffb32e | #ffc671 | #ecb259 | #ffebd1 | #191b1e |
| red | #1c0907 | #280c0a | #3a0e0c | #4d0f0e | #610e0f | #711414 | #892220 | #a62927 | #c60018 | #e30f21 | #ffa096 | #ffe9e6 | #ffffff |
| teal | #071210 | #0a1917 | #0b2421 | #0a302b | #073b36 | #0c4741 | #1a5851 | #1e6b62 | #007a6f | #008e81 | #80cfc3 | #d8f6f1 | #ffffff |

알파: `ref.color.alpha.{black,white}-{4,8,12,16,24,40,60,80}` — 오버레이·반투명 테두리(다크 모드의 분리선은 white-8~16).

### 3.2 역할 (`sys.color.bg|fg|border|accent|focus`)

| 토큰 | light | dark | 원천 | 설명 |
|---|---|---|---|---|
| `sys.color.bg.canvas` | #f8faff | #0c0d11 | light: {ref.color.neutral.2} · dark: {ref.color.neutral.1} | 앱 바탕(페이지 배경) |
| `sys.color.bg.surface` | #fdfdff | #121417 | light: {ref.color.neutral.1} · dark: {ref.color.neutral.2} | 카드·패널·시트 기본면 |
| `sys.color.bg.surface-raised` | #fdfdff | #1a1c20 | light: {ref.color.neutral.1} · dark: {ref.color.neutral.3} | 떠 있는 면(메뉴·팝오버) — shadow와 함께 |
| `sys.color.bg.surface-sunken` | #f1f3f9 | #0c0d11 | light: {ref.color.neutral.3} · dark: {ref.color.neutral.1} | 가라앉은 면(코드·읽기 전용 영역) |
| `sys.color.bg.overlay` | #00000099 | #000000cc | light: {ref.color.alpha.black-60} · dark: {ref.color.alpha.black-80} | 모달 뒤 스크림 |
| `sys.color.bg.ui` | #f1f3f9 | #1a1c20 | {ref.color.neutral.3} | 컨트롤 기본 배경(입력·보조 버튼·칩) |
| `sys.color.bg.ui-hover` | #e8ebf1 | #222428 | {ref.color.neutral.4} | 컨트롤 hover |
| `sys.color.bg.ui-active` | #e0e3e8 | #2c2e32 | {ref.color.neutral.5} | 컨트롤 active·pressed |
| `sys.color.bg.selected` | #ebf1ff | #151f33 | {ref.color.accent.3} | 선택 행·항목 |
| `sys.color.bg.selected-hover` | #dde8ff | #1b2844 | {ref.color.accent.4} | 선택 행 hover |
| `sys.color.bg.disabled` | #f1f3f9 | #1a1c20 | {ref.color.neutral.3} | 비활성 컨트롤 배경 |
| `sys.color.bg.inverse` | #191b1e | #eff2f7 | {ref.color.neutral.12} | 반전 면(툴팁·토스트 다크) |
| `sys.color.fg.default` | #191b1e | #eff2f7 | {ref.color.neutral.12} | 본문·제목(고대비) |
| `sys.color.fg.muted` | #616368 | #bbbec3 | {ref.color.neutral.11} | 보조 텍스트·라벨(≥4.5:1) |
| `sys.color.fg.subtle` | #727479 | #8a8c91 | {ref.color.neutral.10} | 장식·아이콘·placeholder 전용(≥3:1) — 정보 텍스트 금지(axe serious). 텍스트는 fg.muted 이상 |
| `sys.color.fg.placeholder` | #84868b | #787a7f | {ref.color.neutral.9} | 입력 플레이스홀더 |
| `sys.color.fg.disabled` | #9c9ea4 | #616368 | {ref.color.neutral.8} | 비활성 텍스트·아이콘 |
| `sys.color.fg.on-inverse` | #fdfdff | #0c0d11 | {ref.color.neutral.1} | 반전 면 위 텍스트 |
| `sys.color.fg.on-accent` | #ffffff | #ffffff | {ref.color.on.accent} | 액센트 solid 위 텍스트 |
| `sys.color.fg.link` | #0d32a1 | #9ebdff | {ref.color.accent.11} | 링크·포인트 텍스트 |
| `sys.color.fg.link-hover` | #050f2e | #e7efff | {ref.color.accent.12} | 링크 hover |
| `sys.color.border.subtle` | #e0e3e8 | #2c2e32 | {ref.color.neutral.5} | 미묘한 분리선(표 행·리스트) |
| `sys.color.border.default` | #d6d9df | #37393e | {ref.color.neutral.6} | 기본 테두리(카드·입력) |
| `sys.color.border.strong` | #9c9ea4 | #616368 | {ref.color.neutral.8} | hover·강조 테두리 |
| `sys.color.border.emphasis` | #84868b | #787a7f | {ref.color.neutral.9} | 컨트롤 윤곽(≥3:1 — 고대비 입력·체크박스) |
| `sys.color.border.inverse` | #ffffff3d | #ffffff3d | {ref.color.alpha.white-24} | 반전 면 위 분리선 |
| `sys.color.accent.solid` | #0d2877 | #4064b8 | {ref.color.accent.9} | 주 버튼·FAB·선택 표시 |
| `sys.color.accent.solid-hover` | #081849 | #5176cc | {ref.color.accent.10} |  |
| `sys.color.accent.solid-active` | #050f2e | #425c94 | light: {ref.color.accent.12} · dark: {ref.color.accent.8} |  |
| `sys.color.accent.fg` | #0d32a1 | #9ebdff | {ref.color.accent.11} | 액센트 텍스트·아이콘(≥4.5:1) |
| `sys.color.accent.fg-strong` | #050f2e | #e7efff | {ref.color.accent.12} |  |
| `sys.color.accent.bg` | #ebf1ff | #151f33 | {ref.color.accent.3} | 액센트 tinted 배경(선택·강조 카드) |
| `sys.color.accent.bg-hover` | #dde8ff | #1b2844 | {ref.color.accent.4} |  |
| `sys.color.accent.bg-active` | #cdddff | #213156 | {ref.color.accent.5} |  |
| `sys.color.accent.bg-subtle` | #f6f9ff | #101623 | {ref.color.accent.2} | 아주 옅은 브랜드 면 |
| `sys.color.accent.border` | #a1baef | #364b7a | {ref.color.accent.7} |  |
| `sys.color.accent.border-strong` | #6d8bcc | #425c94 | {ref.color.accent.8} |  |
| `sys.color.accent.on-solid` | #ffffff | #ffffff | {ref.color.on.accent} | solid 위 텍스트 |
| `sys.color.focus.ring` | #0d2877 | #4064b8 | {ref.color.accent.9} | 포커스 링(2px, offset 2px) |
| `sys.color.focus.ring-offset` | #fdfdff | #0c0d11 | light: {ref.color.neutral.1} · dark: {ref.color.neutral.1} | 포커스 링 오프셋 색 = 바탕 |
| `sys.color.media.bg` | #191b1e | #0c0d11 | light: {ref.color.neutral.12} · dark: {ref.color.neutral.1} | 영상·월보드 바탕 — 테마와 무관하게 항상 어둡다 |
| `sys.color.media.surface` | #616368 | #1a1c20 | light: {ref.color.neutral.11} · dark: {ref.color.neutral.3} | 미디어 위 컨트롤 면 |
| `sys.color.media.fg` | #fdfdff | #eff2f7 | light: {ref.color.neutral.1} · dark: {ref.color.neutral.12} | 미디어 위 텍스트 — 항상 밝다 |
| `sys.color.media.muted` | #ffffff99 | #ffffff99 | {ref.color.alpha.white-60} | 미디어 위 보조 텍스트 |
| `sys.color.media.scrim` | #00000099 | #00000099 | {ref.color.alpha.black-60} | 미디어 위 칩·자막 배경 |
| `sys.color.media.border` | #ffffff29 | #ffffff29 | {ref.color.alpha.white-16} | 미디어 타일 경계 |

### 3.3 상태 (`sys.color.status.<tone>.*`) — tone = info · success · warning · danger · progress · neutral

각 tone은 solid / solid-hover / fg / fg-strong / bg / bg-hover / bg-subtle / border / border-strong / on-solid 10속성으로 동일 구조. 새 tone 추가는 램프 추가와 함께만 허용한다.

| 토큰 | light | dark | 원천 |
|---|---|---|---|
| `sys.color.status.info.solid` | #024deb | #0a54f3 | {ref.color.blue.9} |
| `sys.color.status.info.solid-hover` | #0040ce | #286cff | {ref.color.blue.10} |
| `sys.color.status.info.fg` | #003abc | #9bbeff | {ref.color.blue.11} |
| `sys.color.status.info.fg-strong` | #031e61 | #e6efff | {ref.color.blue.12} |
| `sys.color.status.info.bg` | #eaf1ff | #0b1d42 | {ref.color.blue.3} |
| `sys.color.status.info.bg-hover` | #dce8ff | #0d2558 | {ref.color.blue.4} |
| `sys.color.status.info.bg-subtle` | #f6f9ff | #0a152c | {ref.color.blue.2} |
| `sys.color.status.info.border` | #96baff | #1e469c | {ref.color.blue.7} |
| `sys.color.status.info.border-strong` | #4d86fa | #2555bd | {ref.color.blue.8} |
| `sys.color.status.info.on-solid` | #ffffff | #ffffff | {ref.color.on.blue} |
| `sys.color.status.success.solid` | #067831 | #147e37 | {ref.color.green.9} |
| `sys.color.status.success.solid-hover` | #006828 | #2f9048 | {ref.color.green.10} |
| `sys.color.status.success.fg` | #015e24 | #8dd198 | {ref.color.green.11} |
| `sys.color.status.success.fg-strong` | #052f11 | #dcf7df | {ref.color.green.12} |
| `sys.color.status.success.bg` | #e6f6e8 | #102514 | {ref.color.green.3} |
| `sys.color.status.success.bg-hover` | #d7efda | #123019 | {ref.color.green.4} |
| `sys.color.status.success.bg-subtle` | #f4fcf4 | #0d1a0f | {ref.color.green.2} |
| `sys.color.status.success.border` | #97ca9e | #285932 | {ref.color.green.7} |
| `sys.color.status.success.border-strong` | #5c9e68 | #306d3d | {ref.color.green.8} |
| `sys.color.status.success.on-solid` | #ffffff | #ffffff | {ref.color.on.green} |
| `sys.color.status.warning.solid` | #ffb32e | #ffb32e | {ref.color.yellow.9} |
| `sys.color.status.warning.solid-hover` | #eea300 | #ffc671 | {ref.color.yellow.10} |
| `sys.color.status.warning.fg` | #684500 | #ecb259 | {ref.color.yellow.11} |
| `sys.color.status.warning.fg-strong` | #362200 | #ffebd1 | {ref.color.yellow.12} |
| `sys.color.status.warning.bg` | #fdefdb | #2d1b00 | {ref.color.yellow.3} |
| `sys.color.status.warning.bg-hover` | #fae4c7 | #392400 | {ref.color.yellow.4} |
| `sys.color.status.warning.bg-subtle` | #fff8ef | #1f1404 | {ref.color.yellow.2} |
| `sys.color.status.warning.border` | #dfb271 | #684500 | {ref.color.yellow.7} |
| `sys.color.status.warning.border-strong` | #ab7401 | #a8751a | {ref.color.yellow.8} |
| `sys.color.status.warning.on-solid` | #191b1e | #191b1e | {ref.color.on.yellow} |
| `sys.color.status.danger.solid` | #bc0016 | #c60018 | {ref.color.red.9} |
| `sys.color.status.danger.solid-hover` | #a30012 | #e30f21 | {ref.color.red.10} |
| `sys.color.status.danger.fg` | #94000f | #ffa096 | {ref.color.red.11} |
| `sys.color.status.danger.fg-strong` | #500004 | #ffe9e6 | {ref.color.red.12} |
| `sys.color.status.danger.bg` | #ffecea | #3a0e0c | {ref.color.red.3} |
| `sys.color.status.danger.bg-hover` | #ffdfdb | #4d0f0e | {ref.color.red.4} |
| `sys.color.status.danger.bg-subtle` | #fff7f6 | #280c0a | {ref.color.red.2} |
| `sys.color.status.danger.border` | #ff9b91 | #892220 | {ref.color.red.7} |
| `sys.color.status.danger.border-strong` | #e25851 | #a62927 | {ref.color.red.8} |
| `sys.color.status.danger.on-solid` | #ffffff | #ffffff | {ref.color.on.red} |
| `sys.color.status.progress.solid` | #007369 | #007a6f | {ref.color.teal.9} |
| `sys.color.status.progress.solid-hover` | #00635a | #008e81 | {ref.color.teal.10} |
| `sys.color.status.progress.fg` | #005a52 | #80cfc3 | {ref.color.teal.11} |
| `sys.color.status.progress.fg-strong` | #002e29 | #d8f6f1 | {ref.color.teal.12} |
| `sys.color.status.progress.bg` | #e4f6f2 | #0b2421 | {ref.color.teal.3} |
| `sys.color.status.progress.bg-hover` | #d4efea | #0a302b | {ref.color.teal.4} |
| `sys.color.status.progress.bg-subtle` | #f2fbfa | #0a1917 | {ref.color.teal.2} |
| `sys.color.status.progress.border` | #8ec8bf | #1a5851 | {ref.color.teal.7} |
| `sys.color.status.progress.border-strong` | #4d9c92 | #1e6b62 | {ref.color.teal.8} |
| `sys.color.status.progress.on-solid` | #ffffff | #ffffff | {ref.color.on.teal} |
| `sys.color.status.neutral.solid` | #616368 | #bbbec3 | {ref.color.neutral.11} |
| `sys.color.status.neutral.solid-hover` | #191b1e | #eff2f7 | {ref.color.neutral.12} |
| `sys.color.status.neutral.fg` | #616368 | #bbbec3 | {ref.color.neutral.11} |
| `sys.color.status.neutral.fg-strong` | #191b1e | #eff2f7 | {ref.color.neutral.12} |
| `sys.color.status.neutral.bg` | #f1f3f9 | #1a1c20 | {ref.color.neutral.3} |
| `sys.color.status.neutral.bg-hover` | #e8ebf1 | #222428 | {ref.color.neutral.4} |
| `sys.color.status.neutral.bg-subtle` | #f8faff | #121417 | {ref.color.neutral.2} |
| `sys.color.status.neutral.border` | #bbbec3 | #4b4d52 | {ref.color.neutral.7} |
| `sys.color.status.neutral.border-strong` | #9c9ea4 | #616368 | {ref.color.neutral.8} |
| `sys.color.status.neutral.on-solid` | #ffffff | #191b1e | {ref.color.on.neutral} |

### 3.4 도메인 (`sys.color.domain.<entity>.<state>.*`) — 제품 의미를 tone에 매핑

도메인 토큰은 새 색을 만들지 않는다. 장비·업무·서류·영상·지도·연결 상태를 status tone 또는 accent에 별칭으로 연결해, 제품 어휘로 색을 호출하게 한다.

| 토큰 | 매핑 | light | dark | 설명 |
|---|---|---|---|---|
| `sys.color.domain.equipment.normal.solid` | {sys.color.status.success.solid} | #067831 | #147e37 | 정상 가동 |
| `sys.color.domain.equipment.normal.fg` | {sys.color.status.success.fg} | #015e24 | #8dd198 |  |
| `sys.color.domain.equipment.normal.bg` | {sys.color.status.success.bg} | #e6f6e8 | #102514 |  |
| `sys.color.domain.equipment.normal.border` | {sys.color.status.success.border} | #97ca9e | #285932 |  |
| `sys.color.domain.equipment.caution.solid` | {sys.color.status.warning.solid} | #ffb32e | #ffb32e | 주의(임계 접근) |
| `sys.color.domain.equipment.caution.fg` | {sys.color.status.warning.fg} | #684500 | #ecb259 |  |
| `sys.color.domain.equipment.caution.bg` | {sys.color.status.warning.bg} | #fdefdb | #2d1b00 |  |
| `sys.color.domain.equipment.caution.border` | {sys.color.status.warning.border} | #dfb271 | #684500 |  |
| `sys.color.domain.equipment.fault.solid` | {sys.color.status.danger.solid} | #bc0016 | #c60018 | 고장·E-코드 |
| `sys.color.domain.equipment.fault.fg` | {sys.color.status.danger.fg} | #94000f | #ffa096 |  |
| `sys.color.domain.equipment.fault.bg` | {sys.color.status.danger.bg} | #ffecea | #3a0e0c |  |
| `sys.color.domain.equipment.fault.border` | {sys.color.status.danger.border} | #ff9b91 | #892220 |  |
| `sys.color.domain.equipment.offline.solid` | {sys.color.status.neutral.solid} | #616368 | #bbbec3 | 통신 두절 |
| `sys.color.domain.equipment.offline.fg` | {sys.color.status.neutral.fg} | #616368 | #bbbec3 |  |
| `sys.color.domain.equipment.offline.bg` | {sys.color.status.neutral.bg} | #f1f3f9 | #1a1c20 |  |
| `sys.color.domain.equipment.offline.border` | {sys.color.status.neutral.border} | #bbbec3 | #4b4d52 |  |
| `sys.color.domain.equipment.maintenance.solid` | {sys.color.status.progress.solid} | #007369 | #007a6f | 정비 중·정비소 |
| `sys.color.domain.equipment.maintenance.fg` | {sys.color.status.progress.fg} | #005a52 | #80cfc3 |  |
| `sys.color.domain.equipment.maintenance.bg` | {sys.color.status.progress.bg} | #e4f6f2 | #0b2421 |  |
| `sys.color.domain.equipment.maintenance.border` | {sys.color.status.progress.border} | #8ec8bf | #1a5851 |  |
| `sys.color.domain.connect.online.solid` | {sys.color.status.success.solid} | #067831 | #147e37 | 연결됨 |
| `sys.color.domain.connect.online.fg` | {sys.color.status.success.fg} | #015e24 | #8dd198 |  |
| `sys.color.domain.connect.online.bg` | {sys.color.status.success.bg} | #e6f6e8 | #102514 |  |
| `sys.color.domain.connect.online.border` | {sys.color.status.success.border} | #97ca9e | #285932 |  |
| `sys.color.domain.connect.offline.solid` | {sys.color.status.neutral.solid} | #616368 | #bbbec3 | 연결 끊김 |
| `sys.color.domain.connect.offline.fg` | {sys.color.status.neutral.fg} | #616368 | #bbbec3 |  |
| `sys.color.domain.connect.offline.bg` | {sys.color.status.neutral.bg} | #f1f3f9 | #1a1c20 |  |
| `sys.color.domain.connect.offline.border` | {sys.color.status.neutral.border} | #bbbec3 | #4b4d52 |  |
| `sys.color.domain.severity.critical.solid` | {sys.color.status.danger.solid} | #bc0016 | #c60018 | 긴급 알림 |
| `sys.color.domain.severity.critical.fg` | {sys.color.status.danger.fg} | #94000f | #ffa096 |  |
| `sys.color.domain.severity.critical.bg` | {sys.color.status.danger.bg} | #ffecea | #3a0e0c |  |
| `sys.color.domain.severity.critical.border` | {sys.color.status.danger.border} | #ff9b91 | #892220 |  |
| `sys.color.domain.severity.warning.solid` | {sys.color.status.warning.solid} | #ffb32e | #ffb32e | 경고 알림 |
| `sys.color.domain.severity.warning.fg` | {sys.color.status.warning.fg} | #684500 | #ecb259 |  |
| `sys.color.domain.severity.warning.bg` | {sys.color.status.warning.bg} | #fdefdb | #2d1b00 |  |
| `sys.color.domain.severity.warning.border` | {sys.color.status.warning.border} | #dfb271 | #684500 |  |
| `sys.color.domain.severity.info.solid` | {sys.color.status.info.solid} | #024deb | #0a54f3 | 정보 알림 |
| `sys.color.domain.severity.info.fg` | {sys.color.status.info.fg} | #003abc | #9bbeff |  |
| `sys.color.domain.severity.info.bg` | {sys.color.status.info.bg} | #eaf1ff | #0b1d42 |  |
| `sys.color.domain.severity.info.border` | {sys.color.status.info.border} | #96baff | #1e469c |  |
| `sys.color.domain.task.new.solid` | {sys.color.status.info.solid} | #024deb | #0a54f3 | 신규 접수 |
| `sys.color.domain.task.new.fg` | {sys.color.status.info.fg} | #003abc | #9bbeff |  |
| `sys.color.domain.task.new.bg` | {sys.color.status.info.bg} | #eaf1ff | #0b1d42 |  |
| `sys.color.domain.task.new.border` | {sys.color.status.info.border} | #96baff | #1e469c |  |
| `sys.color.domain.task.assigned.solid` | {sys.color.accent.solid} | #0d2877 | #4064b8 | 배정됨 |
| `sys.color.domain.task.assigned.fg` | {sys.color.accent.fg} | #0d32a1 | #9ebdff |  |
| `sys.color.domain.task.assigned.bg` | {sys.color.accent.bg} | #ebf1ff | #151f33 |  |
| `sys.color.domain.task.assigned.border` | {sys.color.accent.border} | #a1baef | #364b7a |  |
| `sys.color.domain.task.in-progress.solid` | {sys.color.status.progress.solid} | #007369 | #007a6f | 진행 중 |
| `sys.color.domain.task.in-progress.fg` | {sys.color.status.progress.fg} | #005a52 | #80cfc3 |  |
| `sys.color.domain.task.in-progress.bg` | {sys.color.status.progress.bg} | #e4f6f2 | #0b2421 |  |
| `sys.color.domain.task.in-progress.border` | {sys.color.status.progress.border} | #8ec8bf | #1a5851 |  |
| `sys.color.domain.task.done.solid` | {sys.color.status.success.solid} | #067831 | #147e37 | 완료 |
| `sys.color.domain.task.done.fg` | {sys.color.status.success.fg} | #015e24 | #8dd198 |  |
| `sys.color.domain.task.done.bg` | {sys.color.status.success.bg} | #e6f6e8 | #102514 |  |
| `sys.color.domain.task.done.border` | {sys.color.status.success.border} | #97ca9e | #285932 |  |
| `sys.color.domain.task.escalated.solid` | {sys.color.status.danger.solid} | #bc0016 | #c60018 | 에스컬레이션(1h 미접수) |
| `sys.color.domain.task.escalated.fg` | {sys.color.status.danger.fg} | #94000f | #ffa096 |  |
| `sys.color.domain.task.escalated.bg` | {sys.color.status.danger.bg} | #ffecea | #3a0e0c |  |
| `sys.color.domain.task.escalated.border` | {sys.color.status.danger.border} | #ff9b91 | #892220 |  |
| `sys.color.domain.doc.pending.solid` | {sys.color.status.warning.solid} | #ffb32e | #ffb32e | 제출 대기·검토 중 |
| `sys.color.domain.doc.pending.fg` | {sys.color.status.warning.fg} | #684500 | #ecb259 |  |
| `sys.color.domain.doc.pending.bg` | {sys.color.status.warning.bg} | #fdefdb | #2d1b00 |  |
| `sys.color.domain.doc.pending.border` | {sys.color.status.warning.border} | #dfb271 | #684500 |  |
| `sys.color.domain.doc.in-progress.solid` | {sys.color.status.progress.solid} | #007369 | #007a6f | 작성 중 |
| `sys.color.domain.doc.in-progress.fg` | {sys.color.status.progress.fg} | #005a52 | #80cfc3 |  |
| `sys.color.domain.doc.in-progress.bg` | {sys.color.status.progress.bg} | #e4f6f2 | #0b2421 |  |
| `sys.color.domain.doc.in-progress.border` | {sys.color.status.progress.border} | #8ec8bf | #1a5851 |  |
| `sys.color.domain.doc.approved.solid` | {sys.color.status.info.solid} | #024deb | #0a54f3 | 승인 |
| `sys.color.domain.doc.approved.fg` | {sys.color.status.info.fg} | #003abc | #9bbeff |  |
| `sys.color.domain.doc.approved.bg` | {sys.color.status.info.bg} | #eaf1ff | #0b1d42 |  |
| `sys.color.domain.doc.approved.border` | {sys.color.status.info.border} | #96baff | #1e469c |  |
| `sys.color.domain.doc.rejected.solid` | {sys.color.status.danger.solid} | #bc0016 | #c60018 | 반려 |
| `sys.color.domain.doc.rejected.fg` | {sys.color.status.danger.fg} | #94000f | #ffa096 |  |
| `sys.color.domain.doc.rejected.bg` | {sys.color.status.danger.bg} | #ffecea | #3a0e0c |  |
| `sys.color.domain.doc.rejected.border` | {sys.color.status.danger.border} | #ff9b91 | #892220 |  |
| `sys.color.domain.doc.incomplete.solid` | {sys.color.status.neutral.solid} | #616368 | #bbbec3 | 미완료 |
| `sys.color.domain.doc.incomplete.fg` | {sys.color.status.neutral.fg} | #616368 | #bbbec3 |  |
| `sys.color.domain.doc.incomplete.bg` | {sys.color.status.neutral.bg} | #f1f3f9 | #1a1c20 |  |
| `sys.color.domain.doc.incomplete.border` | {sys.color.status.neutral.border} | #bbbec3 | #4b4d52 |  |
| `sys.color.domain.video.live.solid` | {sys.color.status.danger.solid} | #bc0016 | #c60018 | 라이브 표시(REC 점) |
| `sys.color.domain.video.live.fg` | {sys.color.status.danger.fg} | #94000f | #ffa096 |  |
| `sys.color.domain.video.live.bg` | {sys.color.status.danger.bg} | #ffecea | #3a0e0c |  |
| `sys.color.domain.video.live.border` | {sys.color.status.danger.border} | #ff9b91 | #892220 |  |
| `sys.color.domain.video.recording.solid` | {sys.color.status.danger.solid} | #bc0016 | #c60018 | 녹화 중 |
| `sys.color.domain.video.recording.fg` | {sys.color.status.danger.fg} | #94000f | #ffa096 |  |
| `sys.color.domain.video.recording.bg` | {sys.color.status.danger.bg} | #ffecea | #3a0e0c |  |
| `sys.color.domain.video.recording.border` | {sys.color.status.danger.border} | #ff9b91 | #892220 |  |
| `sys.color.domain.video.ai.solid` | {sys.color.status.warning.solid} | #ffb32e | #ffb32e | AI 이벤트(사람 인식) |
| `sys.color.domain.video.ai.fg` | {sys.color.status.warning.fg} | #684500 | #ecb259 |  |
| `sys.color.domain.video.ai.bg` | {sys.color.status.warning.bg} | #fdefdb | #2d1b00 |  |
| `sys.color.domain.video.ai.border` | {sys.color.status.warning.border} | #dfb271 | #684500 |  |
| `sys.color.domain.video.offline.solid` | {sys.color.status.neutral.solid} | #616368 | #bbbec3 | 카메라 오프라인 |
| `sys.color.domain.video.offline.fg` | {sys.color.status.neutral.fg} | #616368 | #bbbec3 |  |
| `sys.color.domain.video.offline.bg` | {sys.color.status.neutral.bg} | #f1f3f9 | #1a1c20 |  |
| `sys.color.domain.video.offline.border` | {sys.color.status.neutral.border} | #bbbec3 | #4b4d52 |  |
| `sys.color.domain.map.safe.solid` | {sys.color.accent.solid} | #0d2877 | #4064b8 | 안전(현장 정상) |
| `sys.color.domain.map.safe.fg` | {sys.color.accent.fg} | #0d32a1 | #9ebdff |  |
| `sys.color.domain.map.safe.bg` | {sys.color.accent.bg} | #ebf1ff | #151f33 |  |
| `sys.color.domain.map.safe.border` | {sys.color.accent.border} | #a1baef | #364b7a |  |
| `sys.color.domain.map.warning.solid` | {sys.color.status.warning.solid} | #ffb32e | #ffb32e | 주의 현장 |
| `sys.color.domain.map.warning.fg` | {sys.color.status.warning.fg} | #684500 | #ecb259 |  |
| `sys.color.domain.map.warning.bg` | {sys.color.status.warning.bg} | #fdefdb | #2d1b00 |  |
| `sys.color.domain.map.warning.border` | {sys.color.status.warning.border} | #dfb271 | #684500 |  |
| `sys.color.domain.map.danger.solid` | {sys.color.status.danger.solid} | #bc0016 | #c60018 | 위험 현장 |
| `sys.color.domain.map.danger.fg` | {sys.color.status.danger.fg} | #94000f | #ffa096 |  |
| `sys.color.domain.map.danger.bg` | {sys.color.status.danger.bg} | #ffecea | #3a0e0c |  |
| `sys.color.domain.map.danger.border` | {sys.color.status.danger.border} | #ff9b91 | #892220 |  |
| `sys.color.domain.map.service.solid` | {sys.color.status.progress.solid} | #007369 | #007a6f | 정비소 |
| `sys.color.domain.map.service.fg` | {sys.color.status.progress.fg} | #005a52 | #80cfc3 |  |
| `sys.color.domain.map.service.bg` | {sys.color.status.progress.bg} | #e4f6f2 | #0b2421 |  |
| `sys.color.domain.map.service.border` | {sys.color.status.progress.border} | #8ec8bf | #1a5851 |  |

### 3.5 대비 검사 (빌드 게이트)

| 테마 | 전경 | 배경 | 대비 | 기준 | 판정 |
|---|---|---|---|---|---|
| light | `fg.default` | `bg.canvas` | 16.53:1 | ≥7 | ✓ |
| light | `fg.default` | `bg.surface` | 16.99:1 | ≥7 | ✓ |
| light | `fg.default` | `bg.ui` | 15.56:1 | ≥4.5 | ✓ |
| light | `fg.default` | `bg.selected` | 15.25:1 | ≥4.5 | ✓ |
| light | `fg.muted` | `bg.canvas` | 5.76:1 | ≥4.5 | ✓ |
| light | `fg.muted` | `bg.surface` | 5.92:1 | ≥4.5 | ✓ |
| light | `fg.subtle` | `bg.canvas` | 4.48:1 | ≥3 | ✓ |
| light | `fg.muted` | `bg.surface-sunken` | 5.42:1 | ≥4.5 | ✓ |
| light | `fg.muted` | `bg.selected` | 5.31:1 | ≥4.5 | ✓ |
| light | `fg.default` | `bg.selected` | 15.25:1 | ≥7 | ✓ |
| light | `fg.link` | `bg.canvas` | 10.12:1 | ≥4.5 | ✓ |
| light | `fg.on-inverse` | `bg.inverse` | 16.99:1 | ≥4.5 | ✓ |
| light | `accent.fg` | `bg.canvas` | 10.12:1 | ≥4.5 | ✓ |
| light | `accent.fg` | `accent.bg` | 9.34:1 | ≥4.5 | ✓ |
| light | `accent.on-solid` | `accent.solid` | 13.23:1 | ≥4.5 | ✓ |
| light | `border.emphasis` | `bg.canvas` | 3.49:1 | ≥3 | ✓ |
| light | `focus.ring` | `bg.canvas` | 12.67:1 | ≥3 | ✓ |
| light | `status.info.fg` | `bg.canvas` | 8.63:1 | ≥4.5 | ✓ |
| light | `status.info.fg` | `status.info.bg` | 7.95:1 | ≥4.5 | ✓ |
| light | `status.info.on-solid` | `status.info.solid` | 6.43:1 | ≥4.5 | ✓ |
| light | `status.info.solid` | `bg.canvas` | 6.16:1 | ≥3 | ✓ |
| light | `status.success.fg` | `bg.canvas` | 7.65:1 | ≥4.5 | ✓ |
| light | `status.success.fg` | `status.success.bg` | 7.12:1 | ≥4.5 | ✓ |
| light | `status.success.on-solid` | `status.success.solid` | 5.62:1 | ≥4.5 | ✓ |
| light | `status.success.solid` | `bg.canvas` | 5.38:1 | ≥3 | ✓ |
| light | `status.warning.fg` | `bg.canvas` | 8.24:1 | ≥4.5 | ✓ |
| light | `status.warning.fg` | `status.warning.bg` | 7.6:1 | ≥4.5 | ✓ |
| light | `status.warning.on-solid` | `status.warning.solid` | 9.65:1 | ≥4.5 | ✓ |
| light | `status.warning.border-strong` | `bg.canvas` | 3.84:1 | ≥3 | ✓ |
| light | `status.danger.fg` | `bg.canvas` | 8.87:1 | ≥4.5 | ✓ |
| light | `status.danger.fg` | `status.danger.bg` | 8.14:1 | ≥4.5 | ✓ |
| light | `status.danger.on-solid` | `status.danger.solid` | 6.67:1 | ≥4.5 | ✓ |
| light | `status.danger.solid` | `bg.canvas` | 6.38:1 | ≥3 | ✓ |
| light | `status.progress.fg` | `bg.canvas` | 7.78:1 | ≥4.5 | ✓ |
| light | `status.progress.fg` | `status.progress.bg` | 7.26:1 | ≥4.5 | ✓ |
| light | `status.progress.on-solid` | `status.progress.solid` | 5.74:1 | ≥4.5 | ✓ |
| light | `status.progress.solid` | `bg.canvas` | 5.5:1 | ≥3 | ✓ |
| light | `status.neutral.fg` | `bg.canvas` | 5.76:1 | ≥4.5 | ✓ |
| light | `status.neutral.fg` | `status.neutral.bg` | 5.42:1 | ≥4.5 | ✓ |
| light | `status.neutral.on-solid` | `status.neutral.solid` | 6.01:1 | ≥4.5 | ✓ |
| light | `status.neutral.solid` | `bg.canvas` | 5.76:1 | ≥3 | ✓ |
| dark | `fg.default` | `bg.canvas` | 17.31:1 | ≥7 | ✓ |
| dark | `fg.default` | `bg.surface` | 16.44:1 | ≥7 | ✓ |
| dark | `fg.default` | `bg.ui` | 15.2:1 | ≥4.5 | ✓ |
| dark | `fg.default` | `bg.selected` | 14.67:1 | ≥4.5 | ✓ |
| dark | `fg.muted` | `bg.canvas` | 10.42:1 | ≥4.5 | ✓ |
| dark | `fg.muted` | `bg.surface` | 9.9:1 | ≥4.5 | ✓ |
| dark | `fg.subtle` | `bg.canvas` | 5.77:1 | ≥3 | ✓ |
| dark | `fg.muted` | `bg.surface-sunken` | 10.42:1 | ≥4.5 | ✓ |
| dark | `fg.muted` | `bg.selected` | 8.83:1 | ≥4.5 | ✓ |
| dark | `fg.default` | `bg.selected` | 14.67:1 | ≥7 | ✓ |
| dark | `fg.link` | `bg.canvas` | 10.34:1 | ≥4.5 | ✓ |
| dark | `fg.on-inverse` | `bg.inverse` | 17.31:1 | ≥4.5 | ✓ |
| dark | `accent.fg` | `bg.canvas` | 10.34:1 | ≥4.5 | ✓ |
| dark | `accent.fg` | `accent.bg` | 8.76:1 | ≥4.5 | ✓ |
| dark | `accent.on-solid` | `accent.solid` | 5.63:1 | ≥4.5 | ✓ |
| dark | `border.emphasis` | `bg.canvas` | 4.52:1 | ≥3 | ✓ |
| dark | `focus.ring` | `bg.canvas` | 3.45:1 | ≥3 | ✓ |
| dark | `status.info.fg` | `bg.canvas` | 10.36:1 | ≥4.5 | ✓ |
| dark | `status.info.fg` | `status.info.bg` | 8.83:1 | ≥4.5 | ✓ |
| dark | `status.info.on-solid` | `status.info.solid` | 5.87:1 | ≥4.5 | ✓ |
| dark | `status.info.solid` | `bg.canvas` | 3.31:1 | ≥3 | ✓ |
| dark | `status.success.fg` | `bg.canvas` | 10.83:1 | ≥4.5 | ✓ |
| dark | `status.success.fg` | `status.success.bg` | 9.03:1 | ≥4.5 | ✓ |
| dark | `status.success.on-solid` | `status.success.solid` | 5.16:1 | ≥4.5 | ✓ |
| dark | `status.success.solid` | `bg.canvas` | 3.76:1 | ≥3 | ✓ |
| dark | `status.warning.fg` | `bg.canvas` | 10.25:1 | ≥4.5 | ✓ |
| dark | `status.warning.fg` | `status.warning.bg` | 8.73:1 | ≥4.5 | ✓ |
| dark | `status.warning.on-solid` | `status.warning.solid` | 9.65:1 | ≥4.5 | ✓ |
| dark | `status.warning.border-strong` | `bg.canvas` | 4.83:1 | ≥3 | ✓ |
| dark | `status.danger.fg` | `bg.canvas` | 9.91:1 | ≥4.5 | ✓ |
| dark | `status.danger.fg` | `status.danger.bg` | 8.59:1 | ≥4.5 | ✓ |
| dark | `status.danger.on-solid` | `status.danger.solid` | 6.15:1 | ≥4.5 | ✓ |
| dark | `status.danger.solid` | `bg.canvas` | 3.16:1 | ≥3 | ✓ |
| dark | `status.progress.fg` | `bg.canvas` | 10.76:1 | ≥4.5 | ✓ |
| dark | `status.progress.fg` | `status.progress.bg` | 9.03:1 | ≥4.5 | ✓ |
| dark | `status.progress.on-solid` | `status.progress.solid` | 5.23:1 | ≥4.5 | ✓ |
| dark | `status.progress.solid` | `bg.canvas` | 3.71:1 | ≥3 | ✓ |
| dark | `status.neutral.fg` | `bg.canvas` | 10.42:1 | ≥4.5 | ✓ |
| dark | `status.neutral.fg` | `status.neutral.bg` | 9.15:1 | ≥4.5 | ✓ |
| dark | `status.neutral.on-solid` | `status.neutral.solid` | 9.26:1 | ≥4.5 | ✓ |
| dark | `status.neutral.border-strong` | `bg.canvas` | 3.23:1 | ≥3 | ✓ |

## 4. 타이포그래피 (`sys.type.<role>-<size>`)

서체 'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif · 모노 'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace. 역할 display/heading/body/label/code × 크기 lg/md/sm(+xl/xs). 강조는 같은 역할에 굵기 600을 더한다(별도 토큰 없음). 행간은 비율, 자간은 em.

**comfortable (PWA · 터치)**

| 역할 | 크기 | 굵기 | 행간 | 자간 | Tailwind | 설명 |
|---|---|---|---|---|---|---|
| `display-lg` | 40px | 600 | 1.2 | -0.02em | `text-display-lg` | 페이지 히어로·큰 수치 (PWA=Figma HSB40) |
| `display-md` | 32px | 700 | 1.25 | -0.02em | `text-display-md` | 화면 제목 큰 것 (PWA=HB32) |
| `heading-xl` | 24px | 700 | 1.3 | -0.01em | `text-heading-xl` | 페이지 제목 (PWA=HB24) |
| `heading-lg` | 22px | 700 | 1.35 | -0.01em | `text-heading-lg` | 섹션 제목 (PWA=HB22) |
| `heading-md` | 20px | 600 | 1.4 | -0.01em | `text-heading-md` | 카드·패널 제목 (PWA=HSB20) |
| `heading-sm` | 18px | 600 | 1.4 | -0.01em | `text-heading-sm` | 소제목·리스트 그룹 (PWA=BSB18) |
| `body-lg` | 18px | 500 | 1.4 | -0.01em | `text-body-lg` | 강조 본문·주요 값 (PWA=BM18) |
| `body-md` | 16px | 400 | 1.4 | -0.01em | `text-body-md` | 기본 본문 (PWA=BR16 · 웹 13px Linear 밀도) |
| `body-sm` | 14px | 400 | 1.4 | -0.01em | `text-body-sm` | 보조 본문·설명 (PWA=DR14) |
| `label-lg` | 14px | 500 | 1.4 | -0.01em | `text-label-lg` | 버튼·탭·필드 라벨 (PWA=DM14) |
| `label-md` | 13px | 500 | 1.4 | -0.01em | `text-label-md` | 배지·칩·메타 (PWA=LM13) |
| `label-sm` | 12px | 500 | 1.4 | 0em | `text-label-sm` | 하단 내비·캡션 — 최소 크기 (PWA=LM12) |
| `code-md` | 14px | 400 | 1.5 | 0em | `text-code-md` | 식별자·프로토콜·계기 수치(모노) |
| `code-sm` | 12px | 400 | 1.5 | 0em | `text-code-sm` | 작은 코드·타임스탬프(모노) |

**compact (웹 백오피스)**

| 역할 | 크기 | 굵기 | 행간 | 자간 | Tailwind | 설명 |
|---|---|---|---|---|---|---|
| `display-lg` | 32px | 600 | 1.2 | -0.02em | `text-display-lg` | 페이지 히어로·큰 수치 (PWA=Figma HSB40) |
| `display-md` | 28px | 600 | 1.2 | -0.02em | `text-display-md` | 화면 제목 큰 것 (PWA=HB32) |
| `heading-xl` | 24px | 600 | 1.25 | -0.02em | `text-heading-xl` | 페이지 제목 (PWA=HB24) |
| `heading-lg` | 20px | 600 | 1.3 | -0.01em | `text-heading-lg` | 섹션 제목 (PWA=HB22) |
| `heading-md` | 16px | 600 | 1.4 | -0.01em | `text-heading-md` | 카드·패널 제목 (PWA=HSB20) |
| `heading-sm` | 14px | 600 | 1.4 | -0.01em | `text-heading-sm` | 소제목·리스트 그룹 (PWA=BSB18) |
| `body-lg` | 14px | 400 | 1.5 | -0.01em | `text-body-lg` | 강조 본문·주요 값 (PWA=BM18) |
| `body-md` | 13px | 400 | 1.5 | -0.01em | `text-body-md` | 기본 본문 (PWA=BR16 · 웹 13px Linear 밀도) |
| `body-sm` | 12px | 400 | 1.5 | 0em | `text-body-sm` | 보조 본문·설명 (PWA=DR14) |
| `label-lg` | 13px | 500 | 1.4 | 0em | `text-label-lg` | 버튼·탭·필드 라벨 (PWA=DM14) |
| `label-md` | 12px | 500 | 1.4 | 0em | `text-label-md` | 배지·칩·메타 (PWA=LM13) |
| `label-sm` | 11px | 500 | 1.3 | 0.01em | `text-label-sm` | 하단 내비·캡션 — 최소 크기 (PWA=LM12) |
| `code-md` | 13px | 400 | 1.5 | 0em | `text-code-md` | 식별자·프로토콜·계기 수치(모노) |
| `code-sm` | 12px | 400 | 1.5 | 0em | `text-code-sm` | 작은 코드·타임스탬프(모노) |

## 5. 간격 · 크기 · 레이아웃

### 5.1 원시 간격 (`ref.space.<px>`)

| 토큰 | 값 |
|---|---|
| `ref.space.0` | 0px |
| `ref.space.1` | 1px |
| `ref.space.2` | 2px |
| `ref.space.4` | 4px |
| `ref.space.6` | 6px |
| `ref.space.8` | 8px |
| `ref.space.12` | 12px |
| `ref.space.16` | 16px |
| `ref.space.20` | 20px |
| `ref.space.24` | 24px |
| `ref.space.32` | 32px |
| `ref.space.40` | 40px |
| `ref.space.48` | 48px |
| `ref.space.64` | 64px |
| `ref.space.80` | 80px |
| `ref.space.96` | 96px |

### 5.2 시맨틱 간격 (`sys.space.*`) — 밀도별

| 토큰 | comfortable | compact | 원천 | 설명 |
|---|---|---|---|---|
| `sys.space.inset.xs` | 8px | 4px | comfortable: {ref.space.8} · compact: {ref.space.4} | 칩·배지 내부 |
| `sys.space.inset.sm` | 12px | 8px | comfortable: {ref.space.12} · compact: {ref.space.8} | 작은 컨트롤 내부 |
| `sys.space.inset.md` | 16px | 12px | comfortable: {ref.space.16} · compact: {ref.space.12} | 버튼·입력·리스트 행 내부 |
| `sys.space.inset.lg` | 20px | 16px | comfortable: {ref.space.20} · compact: {ref.space.16} | 카드·패널 내부(PWA 카드 20) |
| `sys.space.inset.xl` | 24px | 24px | comfortable: {ref.space.24} · compact: {ref.space.24} | 다이얼로그·시트 내부 |
| `sys.space.stack.xs` | 4px | 4px | comfortable: {ref.space.4} · compact: {ref.space.4} | 라벨→값(카드 2~4) |
| `sys.space.stack.sm` | 8px | 8px | comfortable: {ref.space.8} · compact: {ref.space.8} | 배지→제목·필드 내부 |
| `sys.space.stack.md` | 16px | 12px | comfortable: {ref.space.16} · compact: {ref.space.12} | 필드 그룹·문단 |
| `sys.space.stack.lg` | 24px | 16px | comfortable: {ref.space.24} · compact: {ref.space.16} | 섹션 내 블록 |
| `sys.space.stack.xl` | 32px | 24px | comfortable: {ref.space.32} · compact: {ref.space.24} | 섹션 간 |
| `sys.space.inline.xs` | 4px | 4px | comfortable: {ref.space.4} · compact: {ref.space.4} | 아이콘↔텍스트 |
| `sys.space.inline.sm` | 8px | 8px | comfortable: {ref.space.8} · compact: {ref.space.8} | 칩·버튼 간 |
| `sys.space.inline.md` | 12px | 12px | comfortable: {ref.space.12} · compact: {ref.space.12} | 툴바 요소 간 |
| `sys.space.inline.lg` | 16px | 16px | comfortable: {ref.space.16} · compact: {ref.space.16} | 필드 2열 간(PWA 16) |
| `sys.space.page.gutter` | 20px | 24px | comfortable: {ref.space.20} · compact: {ref.space.24} | 화면 좌우 여백(PWA 20 · 웹 24) |
| `sys.space.page.stack` | 24px | 32px | comfortable: {ref.space.24} · compact: {ref.space.32} | 페이지 헤더↔본문 |

### 5.3 크기 (`sys.size.*`) — 밀도별

| 토큰 | comfortable | compact | 원천 | 설명 |
|---|---|---|---|---|
| `sys.size.control.xs` | 32px | 24px | comfortable: {ref.size.32} · compact: {ref.size.24} | 아이콘 버튼 xs·인라인 칩 |
| `sys.size.control.sm` | 40px | 28px | comfortable: {ref.size.40} · compact: {ref.size.28} | 보조 버튼·필드 sm |
| `sys.size.control.md` | 48px | 32px | comfortable: {ref.size.48} · compact: {ref.size.32} | 기본 버튼·입력(PWA 터치 48 · 웹 32) |
| `sys.size.control.lg` | 56px | 36px | comfortable: {ref.size.56} · compact: {ref.size.36} | 주 CTA·큰 입력 |
| `sys.size.icon.sm` | 16px | 14px | comfortable: {ref.size.16} · compact: {ref.size.14} | 인라인·메타 |
| `sys.size.icon.md` | 20px | 16px | comfortable: {ref.size.20} · compact: {ref.size.16} | 버튼·리스트 기본 |
| `sys.size.icon.lg` | 24px | 20px | comfortable: {ref.size.24} · compact: {ref.size.20} | 내비·헤더 |
| `sys.size.icon.xl` | 32px | 24px | comfortable: {ref.size.32} · compact: {ref.size.24} | 빈 상태·강조 |
| `sys.size.row.default` | 56px | 36px | comfortable: {ref.size.56} · compact: {ref.size.36} | 리스트·표 행(웹 36 Linear 밀도) |
| `sys.size.row.dense` | 48px | 32px | comfortable: {ref.size.48} · compact: {ref.size.32} | 조밀 행 |
| `sys.size.avatar.sm` | 32px | 24px | comfortable: {ref.size.32} · compact: {ref.size.24} |  |
| `sys.size.avatar.md` | 40px | 32px | comfortable: {ref.size.40} · compact: {ref.size.32} |  |
| `sys.size.avatar.lg` | 48px | 40px | comfortable: {ref.size.48} · compact: {ref.size.40} |  |
| `sys.size.touch-min` | 44px | 44px | {ref.size.44} | 터치 최소 영역(밀도 무관) |
| `sys.size.indicator` | 8px | 8px | {ref.size.8} | 상태 점 |
| `sys.size.badge` | 24px | 20px | comfortable: {ref.size.24} · compact: {ref.size.20} | 배지·필 높이 |

### 5.4 레이아웃 (`sys.layout.*`)

| 토큰 | 값 | 원천 | 설명 |
|---|---|---|---|
| `sys.layout.toast.width` | 384px | 384px | 토스트 최대 너비 |
| `sys.layout.prose.width` | 520px | 520px | 설명 문단 최대 너비(빈 상태 등) — 65ch@14px 근사 |
| `sys.layout.sidebar.width` | 240px | 240px | 웹 사이드바 |
| `sys.layout.sidebar.collapsed` | 56px | 56px | 접힘(아이콘만) |
| `sys.layout.topbar.height` | 48px | 48px | 웹 상단 바 |
| `sys.layout.inspector.width` | 360px | 360px | 웹 우측 상세 패널 |
| `sys.layout.appbar.height` | 56px | 56px | PWA 상단 앱바 |
| `sys.layout.bottomnav.height` | 56px | 56px | PWA 하단 내비(+safe-area) |
| `sys.layout.container.max` | 1400px | 1400px | 웹 본문 최대 폭 |
| `sys.layout.content.max` | 960px | 960px | 읽기·상세 최대 폭 |
| `sys.layout.form.max` | 640px | 640px | 폼 최대 폭 |
| `sys.layout.frame.mobile` | 390px | 390px | PWA 기준 뷰포트(375~430 대응) |
| `sys.layout.breakpoint.xs` | 375px | 375px |  |
| `sys.layout.breakpoint.sm` | 640px | 640px |  |
| `sys.layout.breakpoint.md` | 768px | 768px |  |
| `sys.layout.breakpoint.lg` | 1024px | 1024px |  |
| `sys.layout.breakpoint.xl` | 1280px | 1280px |  |
| `sys.layout.breakpoint.2xl` | 1536px | 1536px |  |
| `sys.layout.map.min` | 240px | 240px | 지도 컴포넌트 최소 높이 |
| `sys.layout.panel.height` | 420px | 420px | 지도 행·알림 피드 패널 기본 높이 |
| `sys.layout.menu.min` | 192px | 192px | 드롭다운 메뉴 최소 폭 |
| `sys.layout.field.short` | 96px | 96px | 짧은 입력(숫자·등급 select) 폭 |

## 6. 형태 · 깊이 · 모션

### 6.1 라운드 (`ref.radius.*` · `sys.radius.*`)

| 토큰 | comfortable | compact | 원천 | 설명 |
|---|---|---|---|---|
| `sys.radius.control` | 8px | 6px | comfortable: {ref.radius.8} · compact: {ref.radius.6} | 버튼·입력·칩(사각) |
| `sys.radius.card` | 12px | 8px | comfortable: {ref.radius.12} · compact: {ref.radius.8} | 카드·패널 |
| `sys.radius.dialog` | 16px | 12px | comfortable: {ref.radius.16} · compact: {ref.radius.12} | 다이얼로그·팝오버 |
| `sys.radius.sheet` | 16px | 16px | {ref.radius.16} | 바텀시트 상단 |
| `sys.radius.pill` | 9999px | 9999px | {ref.radius.full} | 배지·캡슐 버튼·FAB |
| `sys.radius.none` | 0px | 0px | {ref.radius.0} | 표 셀·풀블리드 |
| `sys.radius.mark` | 4px | 2px | comfortable: {ref.radius.4} · compact: {ref.radius.2} | 체크박스·소형 인디케이터(아이콘 크기 요소) |

원시: 0=0px · 2=2px · 4=4px · 6=6px · 8=8px · 12=12px · 16=16px · 20=20px · full=9999px

### 6.2 테두리 (`sys.border.*`)

| 토큰 | 값 | 원천 | 설명 |
|---|---|---|---|
| `sys.border.width.default` | 1px | {ref.border.width.1} | 기본 1px |
| `sys.border.width.strong` | 2px | {ref.border.width.2} | 선택·강조 2px |
| `sys.border.width.focus` | 2px | {ref.border.width.2} | 포커스 링 두께 |
| `sys.border.width.radio` | 4px | {ref.border.width.4} | 라디오 선택 점(테두리로 채움) |

### 6.3 그림자 (`sys.shadow.*`) — 테마별

| 토큰 | light | dark | 설명 |
|---|---|---|---|
| `sys.shadow.raised` | 0px 1px 2px 0px #0000000f | 0px 1px 2px 0px #00000066, 0px 0px 0px 1px #ffffff14 | 카드 hover·트리거 |
| `sys.shadow.overlay` | 0px 2px 8px 0px #00000014, 0px 0px 0px 1px #0000000a | 0px 2px 8px 0px #00000080, 0px 0px 0px 1px #ffffff1a | 메뉴·드롭다운 |
| `sys.shadow.popover` | 0px 6px 16px -2px #0000001f, 0px 0px 0px 1px #0000000a | 0px 6px 16px -2px #00000099, 0px 0px 0px 1px #ffffff1f | 팝오버·커맨드 메뉴 |
| `sys.shadow.modal` | 0px 12px 32px -4px #00000029, 0px 0px 0px 1px #0000000f | 0px 12px 32px -4px #000000b3, 0px 0px 0px 1px #ffffff24 | 모달 |
| `sys.shadow.sheet` | 0px -8px 24px -4px #0000001f | 0px -8px 24px -4px #00000099, 0px 0px 0px 1px #ffffff1f | 바텀시트 |

### 6.4 모션 (`sys.motion.*`)

| 토큰 | 값 | 원천 | 설명 |
|---|---|---|---|
| `sys.motion.duration.fast` | 100ms | {ref.motion.duration.fast} | hover·포커스 전환 |
| `sys.motion.duration.base` | 150ms | {ref.motion.duration.base} | 토글·메뉴 열림 |
| `sys.motion.duration.moderate` | 200ms | {ref.motion.duration.moderate} | 시트·패널 슬라이드 |
| `sys.motion.duration.slow` | 300ms | {ref.motion.duration.slow} | 페이지 전환·큰 레이아웃 |
| `sys.motion.easing.standard` | cubic-bezier(0.2, 0, 0, 1) | {ref.motion.easing.standard} | 기본 |
| `sys.motion.easing.enter` | cubic-bezier(0, 0, 0, 1) | {ref.motion.easing.decelerate} | 등장 |
| `sys.motion.easing.exit` | cubic-bezier(0.3, 0, 1, 1) | {ref.motion.easing.accelerate} | 퇴장 |
| `sys.motion.easing.spring` | cubic-bezier(0.34, 1.56, 0.64, 1) | {ref.motion.easing.spring} | FAB·토글 강조(절제) |

### 6.5 z-index (`sys.z.*`) · 불투명도 (`sys.opacity.*`)

| 토큰 | 값 | 원천 | 설명 |
|---|---|---|---|
| `sys.z.base` | 0 | 0 |  |
| `sys.z.sticky` | 100 | 100 | 표 헤더·섹션 헤더 |
| `sys.z.nav` | 200 | 200 | 사이드바·앱바·하단 내비 |
| `sys.z.dropdown` | 300 | 300 |  |
| `sys.z.overlay` | 400 | 400 | 스크림 |
| `sys.z.modal` | 500 | 500 |  |
| `sys.z.popover` | 600 | 600 |  |
| `sys.z.toast` | 700 | 700 |  |
| `sys.z.tooltip` | 800 | 800 |  |
| `sys.opacity.disabled` | 0.4 | 0.4 | 비활성 컨트롤 전체 |
| `sys.opacity.muted` | 0.6 | 0.6 | 보조 아이콘 |
| `sys.opacity.loading` | 0.7 | 0.7 | 로딩 중 콘텐츠 |

## 7. 컴포넌트 토큰 (`cmp.<component>.<property>[.<variant>]`)

cmp 층은 sys만 참조한다(ref 직접 참조 금지 — 검사로 강제). 컴포넌트 구현은 cmp 토큰만 읽고, 밀도·테마는 토큰이 흡수한다.

| 토큰 | comfortable | compact | 원천 | 설명 |
|---|---|---|---|---|
| `cmp.badge.height` | 24px | 20px | {sys.size.badge} |  |
| `cmp.badge.padding-x` | 8px | 4px | {sys.space.inset.xs} |  |
| `cmp.badge.radius` | 9999px | 9999px | {sys.radius.pill} |  |
| `cmp.badge.font` | 13px/1.4 500 -0.01em | 12px/1.4 500 0em | {sys.type.label-md} |  |
| `cmp.badge.dot` | 8px | 8px | {sys.size.indicator} |  |
| `cmp.button.height.sm` | 40px | 28px | {sys.size.control.sm} |  |
| `cmp.button.height.md` | 48px | 32px | {sys.size.control.md} |  |
| `cmp.button.height.lg` | 56px | 36px | {sys.size.control.lg} |  |
| `cmp.button.padding-x.sm` | 12px | 8px | {sys.space.inset.sm} |  |
| `cmp.button.padding-x.md` | 16px | 12px | {sys.space.inset.md} |  |
| `cmp.button.padding-x.lg` | 20px | 16px | {sys.space.inset.lg} |  |
| `cmp.button.gap` | 4px | 4px | {sys.space.inline.xs} | 아이콘↔라벨 |
| `cmp.button.radius` | 8px | 6px | {sys.radius.control} |  |
| `cmp.button.font.sm` | 13px/1.4 500 -0.01em | 12px/1.4 500 0em | {sys.type.label-md} |  |
| `cmp.button.font.md` | 14px/1.4 500 -0.01em | 13px/1.4 500 0em | {sys.type.label-lg} |  |
| `cmp.button.font.lg` | 18px/1.4 500 -0.01em | 14px/1.5 400 -0.01em | {sys.type.body-lg} |  |
| `cmp.button.icon` | 20px | 16px | {sys.size.icon.md} |  |
| `cmp.card.padding` | 20px | 16px | {sys.space.inset.lg} | PWA 20 · 웹 16 |
| `cmp.card.gap` | 16px | 12px | {sys.space.stack.md} | 블록 간 |
| `cmp.card.radius` | 12px | 8px | {sys.radius.card} |  |
| `cmp.card.bg` | #fdfdff | #fdfdff | {sys.color.bg.surface} |  |
| `cmp.card.border` | #d6d9df | #d6d9df | {sys.color.border.default} |  |
| `cmp.card.shadow` | 0px 1px 2px 0px #0000000f | 0px 1px 2px 0px #0000000f | {sys.shadow.raised} | interactive hover |
| `cmp.card.title` | 20px/1.4 600 -0.01em | 16px/1.4 600 -0.01em | {sys.type.heading-md} |  |
| `cmp.card.meta` | 14px/1.4 400 -0.01em | 12px/1.5 400 0em | {sys.type.body-sm} |  |
| `cmp.field.height.md` | 48px | 32px | {sys.size.control.md} |  |
| `cmp.field.height.lg` | 56px | 36px | {sys.size.control.lg} |  |
| `cmp.field.padding-x` | 16px | 12px | {sys.space.inset.md} |  |
| `cmp.field.radius` | 8px | 6px | {sys.radius.control} |  |
| `cmp.field.border` | #d6d9df | #d6d9df | {sys.color.border.default} |  |
| `cmp.field.border-hover` | #9c9ea4 | #9c9ea4 | {sys.color.border.strong} |  |
| `cmp.field.border-focus` | #0d2877 | #0d2877 | {sys.color.focus.ring} |  |
| `cmp.field.border-invalid` | #e25851 | #e25851 | {sys.color.status.danger.border-strong} |  |
| `cmp.field.bg` | #fdfdff | #fdfdff | {sys.color.bg.surface} |  |
| `cmp.field.bg-disabled` | #f1f3f9 | #f1f3f9 | {sys.color.bg.disabled} |  |
| `cmp.field.placeholder` | #84868b | #84868b | {sys.color.fg.placeholder} |  |
| `cmp.field.font` | 16px/1.4 400 -0.01em | 13px/1.5 400 -0.01em | {sys.type.body-md} |  |
| `cmp.field.label` | 13px/1.4 500 -0.01em | 12px/1.4 500 0em | {sys.type.label-md} |  |
| `cmp.field.help` | 14px/1.4 400 -0.01em | 12px/1.5 400 0em | {sys.type.body-sm} |  |
| `cmp.nav.sidebar.width` | 240px | 240px | {sys.layout.sidebar.width} |  |
| `cmp.nav.sidebar.collapsed` | 56px | 56px | {sys.layout.sidebar.collapsed} |  |
| `cmp.nav.sidebar.item-height` | 48px | 32px | {sys.size.control.md} |  |
| `cmp.nav.sidebar.item-padding-x` | 12px | 8px | {sys.space.inset.sm} |  |
| `cmp.nav.sidebar.item-radius` | 8px | 6px | {sys.radius.control} |  |
| `cmp.nav.sidebar.item-font` | 14px/1.4 500 -0.01em | 13px/1.4 500 0em | {sys.type.label-lg} |  |
| `cmp.nav.sidebar.bg` | #f8faff | #f8faff | {sys.color.bg.canvas} |  |
| `cmp.nav.sidebar.item-selected` | #ebf1ff | #ebf1ff | {sys.color.bg.selected} |  |
| `cmp.nav.sidebar.item-hover` | #e8ebf1 | #e8ebf1 | {sys.color.bg.ui-hover} |  |
| `cmp.nav.topbar.height` | 48px | 48px | {sys.layout.topbar.height} |  |
| `cmp.nav.topbar.bg` | #fdfdff | #fdfdff | {sys.color.bg.surface} |  |
| `cmp.nav.topbar.border` | #e0e3e8 | #e0e3e8 | {sys.color.border.subtle} |  |
| `cmp.nav.appbar.height` | 56px | 56px | {sys.layout.appbar.height} |  |
| `cmp.nav.appbar.title` | 20px/1.4 600 -0.01em | 16px/1.4 600 -0.01em | {sys.type.heading-md} |  |
| `cmp.nav.appbar.icon` | 24px | 20px | {sys.size.icon.lg} |  |
| `cmp.nav.bottomnav.height` | 56px | 56px | {sys.layout.bottomnav.height} |  |
| `cmp.nav.bottomnav.icon` | 24px | 20px | {sys.size.icon.lg} |  |
| `cmp.nav.bottomnav.label` | 12px/1.4 500 0em | 11px/1.3 500 0.01em | {sys.type.label-sm} |  |
| `cmp.nav.bottomnav.active` | #0d32a1 | #0d32a1 | {sys.color.accent.fg} |  |
| `cmp.nav.bottomnav.inactive` | #616368 | #616368 | {sys.color.fg.muted} |  |
| `cmp.overlay.toast.width` | 360px | 360px | 360px |  |
| `cmp.overlay.toast.radius` | 12px | 8px | {sys.radius.card} |  |
| `cmp.overlay.toast.bg` | #191b1e | #191b1e | {sys.color.bg.inverse} |  |
| `cmp.overlay.toast.fg` | #fdfdff | #fdfdff | {sys.color.fg.on-inverse} |  |
| `cmp.overlay.toast.shadow` | 0px 6px 16px -2px #0000001f, 0px 0px 0px 1px #0000000a | 0px 6px 16px -2px #0000001f, 0px 0px 0px 1px #0000000a | {sys.shadow.popover} |  |
| `cmp.overlay.dialog.width-sm` | 400px | 400px | 400px |  |
| `cmp.overlay.dialog.width-md` | 560px | 560px | 560px |  |
| `cmp.overlay.dialog.width-lg` | 800px | 800px | 800px |  |
| `cmp.overlay.dialog.radius` | 16px | 12px | {sys.radius.dialog} |  |
| `cmp.overlay.dialog.padding` | 24px | 24px | {sys.space.inset.xl} |  |
| `cmp.overlay.dialog.shadow` | 0px 12px 32px -4px #00000029, 0px 0px 0px 1px #0000000f | 0px 12px 32px -4px #00000029, 0px 0px 0px 1px #0000000f | {sys.shadow.modal} |  |
| `cmp.overlay.sheet.radius` | 16px | 16px | {sys.radius.sheet} |  |
| `cmp.overlay.sheet.handle-width` | 36px | 36px | 36px |  |
| `cmp.overlay.sheet.handle-height` | 4px | 4px | 4px |  |
| `cmp.overlay.sheet.padding` | 20px | 16px | {sys.space.inset.lg} |  |
| `cmp.overlay.sheet.shadow` | 0px -8px 24px -4px #0000001f | 0px -8px 24px -4px #0000001f | {sys.shadow.sheet} |  |
| `cmp.overlay.popover.radius` | 16px | 12px | {sys.radius.dialog} |  |
| `cmp.overlay.popover.padding` | 12px | 8px | {sys.space.inset.sm} |  |
| `cmp.overlay.popover.shadow` | 0px 6px 16px -2px #0000001f, 0px 0px 0px 1px #0000000a | 0px 6px 16px -2px #0000001f, 0px 0px 0px 1px #0000000a | {sys.shadow.popover} |  |
| `cmp.overlay.popover.bg` | #fdfdff | #fdfdff | {sys.color.bg.surface-raised} |  |
| `cmp.overlay.tooltip.bg` | #191b1e | #191b1e | {sys.color.bg.inverse} |  |
| `cmp.overlay.tooltip.fg` | #fdfdff | #fdfdff | {sys.color.fg.on-inverse} |  |
| `cmp.overlay.tooltip.font` | 13px/1.4 500 -0.01em | 12px/1.4 500 0em | {sys.type.label-md} |  |
| `cmp.overlay.tooltip.radius` | 8px | 6px | {sys.radius.control} |  |
| `cmp.table.row-height` | 56px | 36px | {sys.size.row.default} |  |
| `cmp.table.header-height` | 48px | 32px | {sys.size.row.dense} |  |
| `cmp.table.cell-padding-x` | 16px | 12px | {sys.space.inset.md} |  |
| `cmp.table.font` | 16px/1.4 400 -0.01em | 13px/1.5 400 -0.01em | {sys.type.body-md} |  |
| `cmp.table.header-font` | 13px/1.4 500 -0.01em | 12px/1.4 500 0em | {sys.type.label-md} |  |
| `cmp.table.border` | #e0e3e8 | #e0e3e8 | {sys.color.border.subtle} |  |
| `cmp.table.row-hover` | #f1f3f9 | #f1f3f9 | {sys.color.bg.ui} |  |
| `cmp.table.row-selected` | #ebf1ff | #ebf1ff | {sys.color.bg.selected} |  |
| `cmp.table.header-fg` | #616368 | #616368 | {sys.color.fg.muted} |  |

## 8. 컴포넌트 카탈로그 (79)

이름 PascalCase · prop 어휘 고정: `variant`(형태) · `tone`(색 의도: accent/neutral/info/success/warning/danger/progress) · `size`(sm/md/lg) · 상태 boolean(`disabled` `loading` `selected` `invalid`). 플랫폼 both = 같은 Svelte 컴포넌트가 밀도 토큰으로 두 플랫폼을 소화.

### Actions

| 컴포넌트 | 플랫폼 | 참조 | 변형(prop) | 상태 | 비고 |
|---|---|---|---|---|---|
| **Button** | both | Linear · CE Solid/Outline/Text/Capsule | variant solid/outline/ghost/link · tone accent/neutral/danger · size sm/md/lg · iconLeft/iconRight · pill | hover/active/focus/disabled/loading | CE 버튼 6종을 variant×tone으로 정규화. 주 CTA는 solid+accent 화면당 1개 |
| **IconButton** | both | Linear · CE Icon Button | variant ghost/outline/solid · tone · size xs/sm/md/lg | hover/active/focus/disabled | aria-label 필수 · 툴팁 동반 |
| **SplitButton** | web | Linear | tone · size |  | 주 동작 + 메뉴 |
| **FloatingActionButton** | pwa | CE Floating Button | tone accent · extended(label) | default/disabled/active | 우하단 · 56 · pill · shadow.popover |
| **RemoteControlButton** | pwa | CE RemoteControlButton | kind hydraulic/engine/temperature · on/off | pressed/disabled | 원격 제어 전용 — 확인 단계 강제 |

### Inputs

| 컴포넌트 | 플랫폼 | 참조 | 변형(prop) | 상태 | 비고 |
|---|---|---|---|---|---|
| **TextField** | both | Linear · CE Input/short·long | size md/lg · prefix/suffix/clear · type text/number/tel/password | focus/invalid/disabled/readonly/completed | 라벨·도움말·오류를 FieldWrapper가 담당 |
| **TextArea** | both | CE Input/long | autoGrow · maxLength counter | focus/invalid/disabled |  |
| **Select** | both | Linear | size · searchable(웹) | open/focus/invalid/disabled | PWA는 네이티브 시트 선택 |
| **Combobox** | web | Linear | multi · creatable · async | open/loading | 검색형 선택(장비·현장·사용자) |
| **SearchField** | both | Linear ⌘K · CE SearchBar | size · shortcutHint | focus/loading/completed |  |
| **Checkbox** | both | CE Check Box | size | checked/indeterminate/disabled |  |
| **Radio** | both | CE RadioButton | RadioGroup 방향 vertical/horizontal | checked/disabled |  |
| **Switch** | both | Linear | size | on/off/disabled | 즉시 반영 설정에만 |
| **SegmentedControl** | both | CE Segmented Control | size · items 2~5 | selected/disabled | 탭과 구분: 값 선택 용도 |
| **DatePicker** | both | Linear | mode single/range |  | PWA 네이티브 date 우선 |
| **FileUpload** | both | new | variant drop/button/capture(camera) | uploading/error | 서류 촬영 capture=environment → 다운스케일 |
| **FieldWrapper** | both | new | label · help · error · required · counter |  | 모든 입력의 공통 껍데기 |

### Display

| 컴포넌트 | 플랫폼 | 참조 | 변형(prop) | 상태 | 비고 |
|---|---|---|---|---|---|
| **Badge** | both | CE Badge · Label/status | variant dot/count/pill · tone 6 · size sm/md |  | 숫자 99+ 처리 |
| **StatusPill** | both | CE Label/status · Label/Map | tone(domain 매핑) · icon · size |  | 색+아이콘+텍스트 병행 |
| **StatusDot** | both | CE Label/connect | tone · pulse(live) |  | 연결·라이브 표시 |
| **Chip** | both | CE Chip | variant filter/keyword/status/removable/dropdown · count | selected/disabled |  |
| **Tag** | web | Linear | tone · removable |  | 분류 라벨(현장·장비 모델) |
| **Avatar** | both | Linear | size sm/md/lg · fallback initials · status |  |  |
| **KeyValueList** | both | CE 카드 키-값 규칙 | columns 1/2 · align |  | 라벨 muted · 값 default · 행 간 stack.xs |
| **Stat** | both | new · CE 지표 3열 | size · trend · tone | loading | 큰 수치 + 단위 + 변화 |
| **Card** | both | CE Card layout · Linear | variant default/interactive/selected/brand · padding | hover/selected | PWA 카드 5유형(CTA·정보+버튼·배지+제목·지표·키-값) 프리셋 |
| **DataTable** | web | Linear 리스트 | density · sortable · sticky header · selectable · rowActions · groupBy | loading/empty/error | 행 36 · 셀 좌측 정렬 · 수치 우측 · 가상 스크롤 |
| **List** | both | Linear · CE | variant plain/card · leading/trailing · divider |  | PWA 기본 목록 |
| **Timeline** | both | new | orientation · tone per item |  | 업무 이력·에스컬레이션 |
| **EmptyState** | both | Linear | icon · title · description · action |  | 목록 0건·필터 0건·오류 3종 문안 규칙 |
| **Skeleton** | both | Linear | shape text/rect/circle |  | 로딩 300ms 이후 표시 |
| **ProgressBar** | both | new · CE 부하율 | tone · size · label | indeterminate | 계기 대신 선형 우선 |
| **Stepper** | both | CE Stepper · Vertical Progress Step | orientation · current | complete/current/upcoming | 업무 상태 진행 |
| **Divider** | both | — | orientation · inset |  |  |
| **Tooltip** | web | Linear | placement · shortcut |  | PWA는 툴팁 금지(터치) |

### Navigation

| 컴포넌트 | 플랫폼 | 참조 | 변형(prop) | 상태 | 비고 |
|---|---|---|---|---|---|
| **Sidebar** | web | Linear | collapsed · sections · footer |  | 240/56 · 항목 32 · 단축키 힌트 |
| **Topbar** | web | Linear | breadcrumb · actions · search |  | 48 · 페이지 제목은 본문 헤더로 |
| **CommandMenu** | web | Linear ⌘K | groups · recent · actions | open/loading | 이동·생성·검색 통합 |
| **Tabs** | both | CE Tab · Linear | variant underline/pill · size · scrollable | selected/disabled |  |
| **Breadcrumb** | web | Linear | collapse |  |  |
| **Pagination** | web | CE 백오피스 | size · pageSize |  |  |
| **Menu** | both | Linear | items · groups · icons · shortcuts · danger item | open | 드롭다운·컨텍스트 메뉴 공용 |
| **AppBar** | pwa | CE headerWrap | back · title center/left · actions · logo |  | 56 · 제목 heading-md |
| **DemoBar** | both | — | scene/total/title · prev/next 링크 · onjump(장면 6 "1시간 경과") | — | 시연 장면 바(?scene=N) — 진행자 전용, 실사용 흐름엔 나타나지 않는다(QA §3). 셸 bar 슬롯 |
| **BottomNav** | pwa | CE btmNav | items 3~5 · badge | selected | 56 + safe-area · label-sm · 역할별 항목 세트 |
| **Inspector** | web | Linear 상세 패널 | width · resizable · tabs | open/closed | 우측 360 · 목록 선택 시 상세 |

### Feedback

| 컴포넌트 | 플랫폼 | 참조 | 변형(prop) | 상태 | 비고 |
|---|---|---|---|---|---|
| **Toast** | both | CE Toast/Snackbar · Linear | tone · action · duration |  | 하단(PWA) · 우하단(웹) · 최대 3개 |
| **Banner** | both | CE 홈 상태 배너 | tone · dismissible · action |  | 페이지 상단 고정 안내(오프라인·동의·점검) |
| **Dialog** | both | Linear | size sm/md/lg · destructive | open | 확인/파괴 동작 · 포커스 트랩 |
| **BottomSheet** | pwa | CE Bottom Sheet | snap points · handle | open/expanded | PWA 선택·확인·상세 |
| **Drawer** | web | Linear | side right/left · width | open | 폼·상세 편집 |
| **Popover** | both | CE Popover | placement · arrow | open |  |
| **Spinner** | both | — | size |  | 버튼 내 로딩은 Button loading |

### Layout

| 컴포넌트 | 플랫폼 | 참조 | 변형(prop) | 상태 | 비고 |
|---|---|---|---|---|---|
| **WebShell** | web | Linear | sidebar · topbar · content · inspector |  | 3열 · 데이터 밀도 compact 고정 |
| **PwaShell** | pwa | CE 앱 구조 | appbar · content · bottomnav · sheet host · offline banner |  | safe-area · 뒤로가기 규칙 |
| **PageHeader** | both | Linear | title · description · actions · tabs |  |  |
| **Section** | both | — | title · action · divider |  |  |
| **Grid** | both | — | cols · gap(sys.space) |  |  |

### Domain

| 컴포넌트 | 플랫폼 | 참조 | 변형(prop) | 상태 | 비고 |
|---|---|---|---|---|---|
| **EquipmentCard** | both | CE 크레인 카드 | status(domain.equipment) · telemetry summary · actions |  | CPB 호기 카드 — 상태 점+필+수치 |
| **TelemetryGauge** | both | CE 모니터링 계기 | kind voltage/pressure/reach/temp · thresholds | normal/caution/fault | 선형 우선 · 임계 마커 · 모노 수치 |
| **TelemetryStrip** | both | new | items 3~6 |  | 카드 하단 요약 지표 줄 |
| **CameraTile** | both | new | channel main/ai · live/snapshot/rec · badges | live/offline/loading | 16:9 · 라이브 점 · 채널 칩 |
| **CameraWall** | web | new | cols · autoRotate · wall theme |  | 다크 강제([data-theme=dark]) · 쇼케이스 |
| **VideoPlayer** | both | new | source hls/mp4/snapshot · bbox overlay · timeline |  | AI bbox SVG 오버레이 |
| **MapView** | both | CE 지도 · Linear | markers · cluster · fit |  | MapLibre + 토큰화 마커 |
| **MapMarker** | both | CE Map pin | status(domain.map) · selected · label |  | safe=accent · service=progress |
| **TaskCard** | both | new | status(domain.task) · sla timer · assignee |  | 업무함 항목 |
| **EscalationTimer** | both | new | deadline · tone by remaining |  | 1h 규칙 시각화 |
| **CheckinCard** | pwa | CE 출근 카드 | state before/after · geofence |  | 출근·퇴근 · 반경 밖 시트 |
| **ChecklistForm** | pwa | new | items · photo per item |  | 일일점검 |
| **DocumentCard** | both | new | status(domain.doc) · type 5 · actions |  | 서류 5종 워크플로 |
| **SiteProfileForm** | web | new | preset 4 · axes 8 · retention |  | 현장 프로파일(DISC-028) |
| **BodycamSessionCard** | both | new | state · consent badge · upload |  | 바디캠 세션·동의 |
| **ShowcaseOverlay** | both | new | mask · watermark |  | 쇼케이스 마스킹 |
| **ProtocolUploader** | web | new | yaml/json · validation table |  | 프로토콜 업로드·오류 판정 |
| **RuleThresholdRow** | web | new | metric · operator · value · tone |  | 알림 기준 편집 |
| **WeatherStrip** | pwa | CE weather | hours 6 · wind |  | 홈 기상 요약 |
| **BboxOverlay** | both | — | boxes[] 정규화 좌표 · label · tone warning/danger | hidden/visible | AI 채널 클립·스냅샷 위 SVG 오버레이. 텍스트 대체 필수(사람 1 — 호스 주변) |
| **HealthBadge** | both | — | state live/snapshot/recording/offline/ai-unavailable · size sm/md | — | camera 상태기계 값 그대로 표시(labels.ts). 장애 채널을 정상으로 표시하지 않는다(FR-034) |

## 9. 플랫폼 가이드 — 웹 백오피스 (Linear 참조)

대상: B0 로그인 · B1 관제 · B2 본사 · B3 현장 · B4 관리자(백오피스). 기본 모드 light/compact. 사용자가 탑바 토글로 전체 다크를 고를 수 있다(기기 단위 `localStorage dy.theme`, 기본은 light). 모니터링 월보드·쇼케이스(B1-07 · B3-06 · CameraWall)는 사용자 설정과 무관하게 dark 강제.

**참조에서 취한 것(Linear)**: 중립색 우선·액센트 절제, 밀도(행 36 · 본문 13 · 컨트롤 32), 3열 셸(사이드바 240/56 · 상단 48 · 우측 인스펙터 360), ⌘K 커맨드 메뉴, 반투명 분리선(다크에서 white-8~16), 빠른 모션(100~200ms), 목록 → 상세 패널 흐름, 키보드 우선.

1. **셸.** `WebShell` = Sidebar(접힘 56) + Topbar 48 + Content(최대 1400, 좌우 24) + Inspector 360(선택 시). 사이드바 그룹 라벨과 브레드크럼은 표면 이름(운영사 관제 · 관리자 백오피스), 항목마다 아이콘 1(§11.5).
2. **PageHeader는 필수.** 모든 웹 페이지의 첫 요소. 제목 · 부제 1줄 · 메타 칩 · 우측 액션 ≤ 2 · 탭 슬롯(§11.1). 페이지 제목은 Topbar가 아니라 본문.
3. **목록이 기본 화면.** 관제·업무·서류·장비·부품은 `DataTable`(행 `row.default` 36 · 식별자 nowrap · 텍스트 1줄 truncate · 수치 우측 · 첫 열 고정, §11.2)이 기본. 카드 그리드는 대시보드(B1-02)와 지도 병렬 뷰에만.
4. **상세는 옆에서.** 행 선택 → Inspector에 상세(헤더 · KeyValueList · 하단 액션 행 · 이력). 전체 페이지 이동은 편집·생성만. 뒤로가기로 목록 상태 복원.
5. **색은 세 층.** 바탕 `bg.canvas`, 면 `bg.surface`, 컨트롤 `bg.ui`. 액센트는 주 버튼·선택 표시·링크에만. 상태색은 점·필·배너로, 행 전체·숫자·셀 채색은 danger 1종만(§11.4).
6. **텍스트 위계.** heading-xl(24) 페이지 · heading-md(16) 패널 · body-md(13) 본문 · label-md(12) 메타 · code-md 식별자(CPB-004, E-021)는 모노.
7. **폼.** 최대 폭 640 · 라벨 위 · 버튼 내용 폭 우측 정렬(§11.3). 전폭 입력·전폭 버튼은 쓰지 않는다. 반복 편집은 표형.
8. **키보드.** 모든 목록 행 포커스 가능, `/` 검색, `⌘K` 커맨드, `Esc` 패널 닫기, 포커스 링 2px `focus.ring` offset 2.
9. **알림·피드.** B1-02 알림 피드는 `severity` 도메인 색 + 아이콘, 한 항목 = pill · 메시지 1~2줄 · 시각 우측 고정. 에스컬레이션은 `task.escalated`(danger)와 `EscalationTimer`.
10. **다크.** 전체 다크는 문서 루트 `data-theme="dark"`(탑바 토글 · 캡처 `?theme=`)로만 켠다 — 화면·컴포넌트는 다크 전용 스타일을 갖지 않는다. `CameraWall`·쇼케이스는 컴포넌트 루트에 `data-theme="dark"`를 두고 내부만 강제. 큰 수치 display-lg · 상태 solid 9단 · 텍스트 fg.default.
11. **빈·오류·로딩.** 목록 0건 `EmptyState`(행동 버튼 포함), 필터 0건(필터 초기화), 오류(재시도). 로딩은 300ms 후 Skeleton.
12. **밀도 고정.** 웹 루트는 `data-density="compact"`. 사용자가 comfortable로 바꾸는 설정은 두지 않는다(관제 화면 정보량 보호). 화면이 뷰포트 절반 아래를 비우면 요약을 줄이거나 표 밀도를 올린다.
13. **카피.** §12 — 부제 1줄 · 식별자 UI 밖 · "준비 중" 패턴 · 표현 사전.

## 10. 플랫폼 가이드 — 현장 PWA (Crane Eyes 참조)

대상: A1 현장 안전관리자 · A2 운전자 · A3 본사 · A4 사업주(2단계). 기본 모드 light/comfortable, 시스템 다크 따름.

**참조에서 취한 것(Crane Eyes)**: 375~430 프레임·좌우 20, AppBar 56 · BottomNav 56, 카드 규칙(패딩 20 · 배지→제목 8 · 제목→설명 2 · 설명→필드 16 · 필드 2열 · 라벨→값 2 · 버튼 위 16), 상태 배너(success 계열 테두리+아이콘), 큰 CTA(solid, 높이 48~56), 하단 시트, 계기 화면의 큰 수치.

1. **셸.** `PwaShell` = AppBar(뒤로·제목·우측 1~2 액션: 알림 종 · 로그아웃) + Content(좌우 `page.gutter` 20) + BottomNav(역할별 3~5 항목, safe-area) + Sheet host + 큐·오프라인 배너.
2. **탭 라벨.** 아이콘 1 + 라벨 ≤ 4자("오늘" "장비" "서류" "메뉴" / "업무" "관제" "기록" "메뉴" / "현장" "업무" "기록"). 괄호 병기("오늘(출근·알림)")는 AppBar 제목에만.
3. **한 화면 한 목적.** 홈은 오늘 할 일(출근·점검·업무)·현장 상태 배너·CPB 카드 순. 상세는 새 화면(push, AppBar 뒤로), 선택·확인은 `BottomSheet`. 본문 안 `‹ 상위` 링크는 두지 않는다(뒤로는 AppBar).
4. **터치.** 컨트롤 md 48 · 최소 44 · 행 56. 파괴 동작은 시트에서 2단계 확인. 장갑 사용을 전제로 스와이프 제스처에 기능을 숨기지 않는다.
5. **텍스트.** heading-xl(24) 화면 제목 · body-md(16) 본문 · label-lg(14) 버튼 · label-sm(12) 하단 내비. 12 미만 금지. 햇빛 대비: 본문 fg.default(7:1↑). 화면 첫 줄은 맥락 1줄(현장 · 장비 수)이고 설명문이 아니다(§12).
6. **카드 두 종류만.** 그룹 카드(`border` + `bg.surface` — 정보 묶음·폼)와 계기 타일(`bg.sunken`, 라벨 + 값 — 텔레메트리·Stat). 한 화면에 그 밖의 카드 스타일을 만들지 않는다. 카드 밖에 떠 있는 행(현장명·버튼)은 카드 푸터로 넣는다.
7. **상태.** 장비 상태는 `EquipmentCard` 상단 점+필, 카드 테두리는 바꾸지 않는다. 미입력은 중립(빈 체크박스 · `bg.surface`), 정상 확인은 success, 이상은 사용자가 표시했을 때만 warning — 초기 화면을 경고색으로 채우지 않는다. 위험 알림은 `Banner`(danger) + 진동 + 전화 CTA.
8. **긴 화면.** 1.5 뷰포트를 넘으면 섹션을 접거나(요약 헤더 + 펼침) 상단 탭으로 나눈다(장비 상세: 상태 · 서류 · 영상 · 부품). 타일 위·아래에 같은 상태를 두 번 쓰지 않는다.
9. **오프라인.** 체크인·일일점검·서류 업로드는 큐에 저장 후 셸 배너(neutral)로 "동기 대기 n건 · 지금 동기". 실패는 danger 배너 + 재시도. 카드 pill "동기 대기".
10. **카메라·영상.** `CameraTile` 16:9, 라이브는 `video.live` 점 + "LIVE", 스냅샷 모드는 갱신 시각. 재생은 `VideoPlayer`(bbox 오버레이). 프로파일 코드(P-SD)는 "2채널"처럼 뜻으로.
11. **다크.** 시스템 설정을 따르되 강제하지 않는다. 계기·모니터링 화면도 토큰만 바꾸면 되므로 별도 디자인 없음.
12. **동의·개인정보.** 바디캠·촬영 동의는 동의 배지와 `Dialog`(명시 동의). 마스킹은 `ShowcaseOverlay`. 안내문은 1줄("변경은 현장 안전관리자에게 요청").
13. **로그인.** 상단 1/4에 브랜드·제목·역할 요약, 바로 아래 데모 계정 카드 + 전폭 CTA. 세로 중앙 정렬은 쓰지 않는다(엄지 도달·키보드).
14. **설치·복귀.** 홈 화면 추가 안내는 로그인 후 1회 Banner. 앱 복귀 시 마지막 탭 복원, 알림 딥링크는 해당 상세로.

## 11. 페이지 골격 — 헤더 · 표 · 폼 · 요약 지표 · 아이콘

W2 리뷰(`docs/design/REVIEW-2026-09-06.md`)에서 간결함을 깨는 원인은 토큰이 아니라 골격 편차였다 — 헤더 3종, 표 행 높이 불규칙, 전폭 폼, 색 숫자 Stat. 아래가 모든 화면의 기본 골격이다. 벗어나려면 `specs/<feature>/design.md`에 이유를 적는다.

### 11.1 웹 페이지

```
Topbar(브레드크럼 = 표면 이름 / 화면 이름)
PageHeader  제목 heading-xl · 부제 1줄(body-sm muted, ≤ 60자) · 메타 칩(현장 · 기간 · 건수) · 우측 액션 ≤ 2(주 solid 1 · 보조 outline 1) · 탭 슬롯
요약        Stat 행 — 최대 4, 각 폭 ≤ 240, 높이 88(compact) · 값 fg.default · 톤은 값 옆 점 또는 pill · 힌트 1줄
본문        DataTable(목록) 또는 Card 그리드(대시보드·지도) → 보조 섹션(heading-md + 건수)
인스펙터    360 · 헤더(식별자 label-md muted · 제목 heading-md · 상태 pill) · KeyValueList · 액션 행(하단, 주 1 · 보조 1) · 이력 Timeline
```

- 뒤로 가기는 브레드크럼이 담당한다 — 상세 화면(`[id]` 라우트)은 가운데 조각이 부모 화면 링크(`crumbsFor`의 `PARENT`). 본문 안 `‹ 상위 화면` 링크는 두지 않는다.
- 부제에는 화면이 "무엇을 보여주는가"만. 규칙·근거·한계는 §12(카피)의 자리로.
- 섹션 사이 `stack.lg`, 카드 안 `inset.lg`. 콘텐츠가 뷰포트 절반 미만이면 요약을 접거나 표 밀도를 올린다 — 빈 아래쪽을 여백으로 두지 않는다.

### 11.2 표(DataTable)

| 규칙 | 값 |
|---|---|
| 행 높이 | `row.default`(compact 36) 기본 · 조밀 표만 `row.dense`(32) · 두 줄 셀은 만들지 않는다 |
| 식별자 셀 | `code-md` · `whitespace-nowrap` · 최소 폭 = 가장 긴 ID |
| 텍스트 셀 | 1줄 · 넘치면 `truncate` + `title` |
| 수치 셀 | 우측 정렬 · `tabular-nums` · 단위는 헤더에 |
| 상태 셀 | StatusPill sm 하나 · 셀 텍스트 채색은 danger 1종만(예: 전압 이상) |
| 첫 열 | 고정 폭 · 식별자 또는 이름 |
| 선택 | 행 `bg.selected` · 포커스 링 · Enter 열기 |
| 열 수 | 7 이하 — 넘치면 인스펙터로 |

### 11.3 폼

- 웹: 최대 폭 `form.max` 640 · 라벨 위 · 필수 `*` · 도움말 1줄 · 버튼은 내용 폭, 우측 정렬(주 1 · 취소 ghost) · 인스펙터 안 폼은 하단 액션 행.
- PWA: 전폭 · 컨트롤 48 · 주 CTA 전폭 solid 1개 · 파괴 동작은 시트 2단계.
- 반복 편집(규칙 8종 × 속성)은 카드 나열이 아니라 표형(행 = 항목, 열 = 속성). 저장 바는 하단 고정.

### 11.4 요약 지표(Stat)

- 값은 `fg.default`(display-md). 색으로 말하지 않는다 — 톤은 값 옆 점/pill, danger일 때만 값을 `danger.fg`.
- 라벨 label-md muted 위, 값, 힌트 1줄(body-sm muted). 힌트는 분모·기간·범위만.
- 4개 이하, 폭을 늘려 채우지 않는다(`max-w` 240 · 높이 88 — `sys.layout.stat.width`·`sys.size.stat.height` 토큰을 D4에서 추가). 모바일은 2×2.

### 11.5 아이콘

- 세트 `@lucide/svelte`(ui가 `Icon*`으로 재노출) · 크기 `size.icon.md`(웹 16 · PWA 20) · 굵기 기본 · 색 currentColor.
- 내비 항목 1개 = 아이콘 1개 + 라벨. 자리(placeholder) 사각형을 배포하지 않는다.

| 화면·항목 | 아이콘(lucide 정식 이름) |
|---|---|
| 대시보드 · 관제 | layout-dashboard · monitor |
| 수신함 · 업무함 · 업무 | inbox · clipboard-list |
| 에스컬레이션 | siren |
| 서류 | file-text |
| 임대 계약 | file-pen-line |
| 쇼케이스 · 보고 모드 | presentation |
| 이벤트 복기 | rotate-ccw-clock |
| 지도 · 현장 | map · map-pin |
| 프로토콜 | file-code-corner |
| 장비 · 호기 | truck |
| 사용자·권한 | users |
| 알림 기준 · 알림 | bell |
| 부품 · 점검 | wrench · clipboard-check |
| 기록 | scroll-text |
| 오늘 | calendar-check |
| 메뉴·현장 정보 | menu |
| 로그아웃 · 다크 | log-out · moon |

### 11.6 4상태

빈(EmptyState — 행동 버튼) · 오류(재시도) · 오프라인(셸 배너 + 큐, §10) · 로딩(300ms 후 Skeleton). 화면당 spec에 넷을 적는다.

## 12. 카피 · 식별자 정책

화면의 글은 사용자(현장 안전관리자 · 운전자 · 본사 · 운영사)가 읽는다. 추적성은 코드·문서의 일이다.

### 12.1 규칙

1. **부제 1줄, 60자.** 화면이 무엇을 보여주는지만. 규칙 설명·근거·한계는 여기 두지 않는다. 예: "만료 임박 계약이 위에 옵니다" (○) / "만료 임박(D-30) 계약이 최상단 · 재배치 계획은 lease 상태기계(expiring → relocated) · … DISC-037" (✗).
2. **식별자는 UI 밖.** `DISC-` `FR-` `NFR-` `ENT-` `IF-` `API-` `EXT-` `ADR-` `OUT-` `ACC-` `WP-`, 웨이브(`W2` `wave 2` `2단계`), 구현 용어(상태기계 · append-only · mock · canAccess)는 화면 문자열에 쓰지 않는다. 근거가 필요하면 요소에 `data-ref="DISC-015"`(공백 구분 복수 가능 · `PageHeader` `Banner` `EmptyState` `Badge` `ShowcaseOverlay`는 `ref` prop)를 붙이고, 시연 모드 `DemoBar`의 "근거" 토글이 칩으로 보여준다. 보이는 텍스트 · `title` · `aria-label`에는 ID를 쓰지 않는다("다음 단계에서 지원합니다"). `pnpm design:audit`가 센다(목표 0 · D7에서 lint error).
3. **도메인 식별자는 사용자 언어다.** `CPB-003` `3호기` `C-105` `DOC-001` `E-021` `RQ-003` `P-004` `LS-001` `SITE-001`은 화면에 그대로 쓴다(`code-md`).
4. **미확정·미구현은 "준비 중".** 버튼: "태그 스캔 — 준비 중"(disabled + 툴팁 이유). 값: "준비 중". 배너 문장으로 결정 번호를 설명하지 않는다.
5. **버튼은 동사, 상태는 명사.** "접수" "승인" "재시도" / "접수 대기" "검토 중". 같은 뜻은 같은 낱말 — 라벨 원천은 `packages/ui/src/lib/labels.ts`.
6. **숫자·시각.** 시각은 `fmtDateTime`/`fmtTime`(Asia/Seoul) · 기간은 `D-27` `2h 5m` · 백분율은 정수 + `%` · 단위는 값 뒤 한 칸(`342 V`는 계기, `342V`는 텍스트 — 한 화면에서 섞지 않는다).
7. **내부 코드 금지.** 표면 코드(`B1` `A2`)는 사이드바 그룹·브레드크럼·로그인 카드에 표면 이름으로("운영사 관제" "운전자"). 푸터 "wave 2 · mock"은 DemoBar로.
8. **문장 부호.** 항목 구분 `·`, 범위 `~`, 줄임표는 쓰지 않는다. 괄호 안 설명은 한 번, 중첩 금지.

### 12.2 표현 사전(발췌)

| 쓰지 않는다 | 쓴다 |
|---|---|
| 소모품 | 마모·교체 부품 |
| 티켓 | 업무 |
| 직접 처리 불가(DISC-015) | 열람 전용 |
| 2단계 · W4 | 준비 중 |
| 미확정(DISC-038) | 기준 준비 중 |
| append-only · 수정·삭제되지 않습니다(증빙) | 추가만 됩니다 |
| mock · 목업 | (표시하지 않음 — DemoBar) |

## 13. 참조 시스템 대비 변경점

| 축 | Figma [DY] Crane Eyes(참조) | CraneEyes 백오피스 코드(참조) | 이 시스템 |
|---|---|---|---|
| 명명 | `color/gray/300 (Disabled)` · `Semantic: Typogrpahy` · 대소문자 혼용 | `--bg --fg --hair` 약칭 | `<layer>.<category>.<concept>` 문법, 소문자·하이픈, 상태 접미사 |
| 색 원천 | 수동 hex 램프(단계 수 불균일, 980 중복) | 흑백 + 불투명도 5단 | 앵커 hex → OKLCH 12단 자동 생성, 색조 7, 브랜드 앵커 고정 |
| 브랜드 | navi 400/500/600 산발 사용 | 없음(흑백) | `accent` 램프 하나 — 9 solid(#0d2877) · 10 hover(#081849) · 11 텍스트(#0d32a1) · 12(#050f2e) |
| 상태색 | text/bg/icon/border × 4 상태 + accent badge 12 + map pin 4 | error 1색 | tone 6(info success warning danger progress neutral) × 10속성 + 도메인 매핑 32 |
| 경고 대비 | text/warning #de9300 = 2.5:1(미달) | — | warning.fg = yellow 11(≥4.5:1), solid은 어두운 텍스트 자동 선택 |
| 다크 | 없음(모니터링 화면만 수동 다크) | 없음 | light/dark 완전 대칭, 램프 자체가 모드별 생성 |
| 타이포 | 16 스타일(HSB40~LM12), 140% 고정 | 10 크기·6 굵기·비율 행간 | 역할×크기 14, 밀도별 2세트(웹 13 · 앱 16), Figma 코드 대응 유지 |
| 간격 | 0~64 11단 + 카드 규칙 | 4px 격자 19단 | ref 16단 + sys inset/stack/inline/page 밀도별, Figma 카드 규칙 흡수 |
| 라운드 | sm2 md4 lg8 xl12 2xl16 rounded | xs2~lg8 | ref 8단 + sys control/card/dialog/sheet/pill(밀도별) |
| 그림자 | 6종(normal~heavy·brandcard) | 5단 | 4단 + up, 다크에서 1px white 링 추가 |
| 컴포넌트 | 세트 36(모바일 전용) | 셸·표·승인 모달(웹) | 카탈로그 76 — 웹 전용 17 · PWA 전용 9 · 공용 50, 도메인 19 |
| 레이아웃 | 375×812, 여백 20 | 사이드바 240/64 · 탑바 64 | PWA 390 여백 20 · 웹 240/56 · 48 · 360 · 1400 |
| 접근성 | 미검사 | 상수만 | 대비 검사 76쌍 빌드 게이트 |
| 원천 | Figma 변수 | tokens.css | `packages/tokens/src` — Figma·코드 모두 참조로 격하 |

Linear에서 취한 것: 밀도(행 36 · 13px), 중립 우선 팔레트와 절제된 액센트, 3열 셸과 인스펙터, 커맨드 메뉴, 반투명 분리선, 빠른 모션, 키보드 우선. 취하지 않은 것: 다크 기본(관제는 light 기본), 보라 액센트, 글꼴(Inter → Pretendard).

## 14. 거버넌스

| 항목 | 규칙 |
|---|---|
| 원천 | `packages/tokens/src` — `ref/`(값) · `sys/`(역할) · `cmp/`(컴포넌트) · `brands/`(사업자) · `components.json`(카탈로그) · `doc/`(산문) |
| 생성 | `pnpm tokens:build` → `dist/<brand>.tokens.css` · `<brand>.theme.css` · `<brand>.tokens.json` · `<brand>-design.md`. dist는 커밋한다(리뷰 가능한 diff) |
| 게이트 | `pnpm tokens:check` — 문법·계층·모드 차원·대비. 실패 시 CI 실패. 화면 코드는 `tokens:lint`(hex·px·기본 팔레트 0건) |
| 추가 절차 | ① 기존 토큰으로 표현 불가 근거 ② `sys` 역할 이름 제안(문법 준수) ③ light/dark·compact/comfortable 값 ④ 대비 검사 통과 ⑤ 이 문서 재생성·리뷰 |
| 브랜드 추가 | `src/brands/<ID>.json`(액센트 앵커·서체·기본 모드) → 빌드 → `<ID>-design.md`. 램프·역할·컴포넌트는 공통 |
| 버전 | 토큰 패키지 semver. 토큰 삭제·이름 변경 = major, 값 변경 = minor, 설명·문서 = patch. 브랜드 팩은 자체 버전 |
| 참조 자료 | Figma [DY] Crane Eyes 스냅샷(`boomeyes/docs/design/figma/`) · CraneEyes 코드 토큰(`boomeyes/_ref/craneeyes_ds/`) — 읽기 전용 참조, 동기 없음 |
| 금지 | dist 수기 수정 · 화면 전용 토큰 · 다크/브랜드 전용 컴포넌트 · Figma 재동기 |
