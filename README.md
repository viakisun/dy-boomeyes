# BoomEyes

CPB(콘크리트 타설 붐) 관제. 역할마다 앱이 하나다.

| 앱 | 주소 | 누가 | 무엇 |
|---|---|---|---|
| `owner-web` | `/` | 사업주(장비 소유주) | 전국 현장 → 호기 → 카메라 · 보유 장비 120대 · 요청 배정 |
| `hq-web` | `/hq-web.html` | 건설사 본사 안전관리자 | 자사 현장 → 호기 → 카메라. 읽기 전용 |

앱 이름은 `<대상>-<플랫폼>` 이다 — 한 역할이 웹과 폰을 둘 다 갖기 때문이다.
역할 7·앱 8의 전체 지도와 각 앱이 **일부러 안 하는 것**은 [docs/APPS.md](docs/APPS.md).
무엇이 공용이고 무엇이 전용인지는 [docs/COMPONENTS.md](docs/COMPONENTS.md).

로그인이 생기기 전까지 회사는 주소로 고른다 — `/hq-web.html?company=대양건설`.

```sh
npm install
npm run dev      # http://localhost:4300
npm run check    # 인라인 핸들러 검사 + tsc --noEmit
npm run build    # check + vite build → dist/
npm run preview  # http://localhost:4301 — 빌드한 dist/를 정적으로
```

## 폴더

```
index.html              owner-web 의 껍데기
hq-web.html             hq-web 의 껍데기
src/
  shared/               역할이 늘어도 같이 쓰는 것
    types.ts            도메인 — 서버가 돌려주는 것들의 모양
    api.ts              서버 경계. 화면은 여기만 부른다
    http-error.ts       거절(4xx·5xx)과 못 닿음(status 0)을 구분
    notice.ts           실패를 화면에 드러낸다
    labels.ts           상태 어휘 — 라벨·색·정렬 순서
    format.ts  dom.ts   표시 형식 · DOM 잔심부름
    map/site-map.ts     지도. 저장소를 모르고 보여 줄 것을 인자로 받는다
    camera/camera-view.ts  카메라 6분할과 전체 화면
    panels/             두 앱이 함께 쓰는 화면 조각
      site-panel · unit-panel · status-bar · inbox
    mock/               목업 데이터와 목업 서버
  apps/
    owner-web/          사업주 운영 WEB
      main.ts           부팅 · 화면 전환 · 인라인 핸들러 배선
      store.ts          서버에서 받아 둔 것(server)과 보고 있는 것(view)
      views/            nation-panel · fleet · requests
    hq-web/             본사 안전관리자 WEB
      main.ts  store.ts  views/site-list.ts
docs/APPS.md  docs/COMPONENTS.md   앱 지도 · 컴포넌트 목록
tools/check-wiring.mjs  배선 검사 — 인라인 핸들러 · 요소 id · 죽은 CSS
```

**`shared`에는 확신하는 것만 올린다.** 두 번째 역할이 실제로 쓸 때 옮긴다 — 미리 올리면
쓰지도 않는 옵션이 붙는다. 호기 상세 카드·현장 카드·상태 띠·알림은 건설사가 실제로 쓰게 된
시점에 `shared/panels` 로 옮겼고, 그때 저장소 의존을 끊고 다른 것(고른 호기, 머리말 링크)은
인자로 바꿨다. 소유주 전용인 전국 목록·보유 장비·요청은 `apps/owner` 에 남아 있다.

### 역할을 하나 더 만들 때

1. `<앱>.html` 을 만들고 `<script type="module" src="/src/apps/<앱>/main.ts">` 를 넣는다
2. `src/apps/<앱>/` 에 `main.ts` · `store.ts` · `views/` 를 둔다
3. `vite.config.ts` 의 `input` 에 한 줄 더한다

이름은 [docs/APPS.md](docs/APPS.md)의 표에서 고른다 — 지어내지 않는다.

`npm run check` 가 앱마다 따로 검사한다 — 마크업이 그 앱에 없는 핸들러를 부르거나, 코드가
그 앱에 없는 요소를 찾으면 막는다. 공용 조각에 한 역할 전용 동작이 섞이면 여기서 걸린다
(실제로 걸렸다). 아무도 쓰지 않는 CSS 클래스도 함께 막는다.

빌드는 앱마다 따로 묶이고 `shared`는 공유 청크로 빠진다.

## 서버

화면은 `src/shared/api.ts` 만 부른다. 실서버가 생기면 `USE_MOCK` 을 `false` 로 두고
`BASE_URL` 에 주소를 넣는다. **화면 코드는 손대지 않는다.**

| | |
|---|---|
| `GET /sites` | 현장과 그 안의 호기 전부 |
| `GET /requests` | 현장에서 온 요청 |
| `GET /alerts` | 고장·지연·점검·AI·계약 종료 임박 |
| `GET /requests/:id/candidates` | 그 요청에 배정할 수 있는 호기 |
| `POST /requests/:id/assign` | `{ codes: string[] }` — 배정 확정 |

목업 서버(`shared/mock/server.ts`)는 지연 60 ms를 주고 **복사본**을 돌려준다. 화면이 받은 것을
고쳐도 서버 쪽은 바뀌지 않는다 — 실 HTTP와 같게 두려는 것이다. 잘못된 요청은 실서버처럼
`HttpError` 로 막는다(400·404·409).

**가용 호기 판단과 알림 생성은 서버가 한다.** 화면이 규칙을 들고 있으면 역할마다 달라진다.

## 실패를 다루는 방식

- 부팅이 실패하면 `#startup` 덮개에 이유와 「다시 시도」를 보여 준다. 빈 화면으로 두지 않는다.
- 액션이 실패하면 `showNotice()` 로 알리고, 화면이 뒤처졌을 수 있으므로 목록을 다시 받는다.
- 확정 같은 쓰기는 `view.submitting` 으로 이중 제출을 막는다.
- 지도 국경선처럼 없어도 되는 것은 조용히 넘긴다.

## 인라인 핸들러

생성 HTML이 `onclick="openTab('ops')"` 꼴을 쓴다. 이벤트 위임으로 바꾸지 않는다 — 마크업이
시안과 달라지고 코드가 는다. 대신 `main.ts` 끝에서 `window` 에 얹고, **`npm run check` 가
마크업이 부르는 이름과 얹은 이름이 맞는지 검사한다.** 이 어긋남은 런타임에만 드러나서
클릭이 조용히 죽는다 — 이번 작업에서 세 번 겪었다.

**핸들러 이름을 문자열로 넘기지 않는다** — 넘기면 검사기 시야를 벗어난다
([docs/COMPONENTS.md](docs/COMPONENTS.md) 규칙 2).

## 이 저장소가 무엇인가

Claude Design 시안 [`design/운영 현황 목업.html`](design/운영%20현황%20목업.html)에서 출발했다.
시안과 어긋나는 곳이 보이면 **문서가 아니라 그 파일과 대조한다.** 다만 코드는 읽기 좋게
나누고 이름을 바꿨으므로 **줄 단위로는 맞지 않는다** — 대조는 화면과 의미로 한다.

## 알아둘 것

- **지도**는 Leaflet + OpenStreetMap(독일 미러) 타일, 전국은 world-atlas 국경선. 시안의 선택 그대로다.
  Leaflet·topojson·글꼴은 CDN에서 받는다.
- **카메라 배경** `public/screens/cpb-scene.png`는 **자리표시 이미지**다. 시안의 원본은 도구 전송
  상한에 걸려 받지 못했다 — Claude Design에서 내려받아 같은 경로에 덮어쓰면 된다(1000×690).
- **데이터는 전부 시연용**이다. 저장되지 않는다 — 새로 고치면 시드로 돌아간다.
- 화면은 PC 1280 기준이다. 모바일 레이아웃·다크 모드·오프라인은 아직 없다.
- 시드 표(`shared/mock/dataset.ts`)는 열을 맞춰 두려고 `// prettier-ignore` 를 달았다.

## 이전 코드

Svelte/SvelteKit 모노레포(앱 2·패키지 7·SSOT·게이트·증거 203MB)는 `archive/svelte-2026-09-14`
태그에 통째로 있다.

```sh
git checkout archive/svelte-2026-09-14
```
