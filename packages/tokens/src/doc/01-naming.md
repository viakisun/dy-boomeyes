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
