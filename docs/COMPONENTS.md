# 컴포넌트 목록

이 저장소는 컴포넌트 프레임워크를 쓰지 않는다. **「컴포넌트」는 HTML 문자열을 돌려주는
함수와 그 마크업이 기대는 CSS 클래스의 쌍이다.** 그래서 목록도 둘로 나눠 적는다.

## 공용 — `src/shared`

### 기반

| 파일 | 무엇 |
|---|---|
| `types.ts` | 서버가 돌려주는 것들의 모양. 두 앱이 같은 세계를 본다 |
| `api.ts` | 서버 경계. 화면은 여기만 부른다. `USE_MOCK` 하나로 실서버 전환 |
| `http-error.ts` | 거절(4xx·5xx)과 못 닿음(status 0)을 구분 |
| `notice.ts` | 실패를 화면에 드러낸다 — 배너와 부팅 실패 덮개 |
| `labels.ts` | 상태 어휘 — 라벨·색·「무엇이 문제인가」·정렬 순서 |
| `format.ts` · `dom.ts` | 표시 형식 · `$()` 와 속성 이스케이프 |

### 배선

| 파일 | 무엇 |
|---|---|
| `app-shell.ts` | `bindShell()` 이 카메라 조작·알림 드롭다운·연락·창·키보드·호버를 한 번에 배선하고 인라인 핸들러가 부를 이름들을 돌려준다. `setUnitMode()`(호기 단계의 CSS 약속) · `startApp()`(부팅과 실패 처리) · `badgeText()` |

### 화면 조각

| 파일 | 무엇 | 쓰는 앱 |
|---|---|---|
| `panels/breadcrumb.ts` | 「뿌리 › 현장 › 호기」. 뿌리 이름만 다르고 동작은 `openRoot()` | 둘 다 |
| `panels/status-bar.ts` | 상태 띠 — 호기 묶음을 받아 상태별로 센다 | 둘 다 |
| `panels/site-panel.ts` | 현장의 호기 목록 + 접어 둔 계약·담당자 | 둘 다 |
| `panels/unit-panel.ts` | 호기 상세 — 상태·운전자·수신값·AI·소모품·현장·서류 | 둘 다 |
| `panels/inbox.ts` | 알림 드롭다운 | 둘 다 |
| `camera/camera-view.ts` | 카메라 6분할과 전체 화면 뷰어 | 둘 다 |
| `map/site-map.ts` | 전국 배지·현장 핀·겹침 밀어내기·이름표 자리 찾기 | 둘 다 |

### 목업

| 파일 | 무엇 |
|---|---|
| `mock/dataset.ts` | 시드 — 현장 13·호기 120 |
| `mock/server.ts` | 경로별 응답 · 지연 · 복사본 · 가용 판단 · 알림 생성 |

## 앱 전용

| 앱 | 전용 조각 | 왜 전용인가 |
|---|---|---|
| `owner-web` | `views/nation-panel.ts` | 전국에 현장이 흩어진 건 사업주뿐이다 |
| | `views/fleet.ts` | 장비를 소유하는 건 사업주뿐이다 |
| | `views/requests.ts` | 배정하는 건 사업주뿐이다 |
| `hq-web` | `views/site-list.ts` | 자사 현장 몇 곳 — 전국 지도가 필요 없다 |

## CSS 프리미티브 — `src/style.css`

| 무리 | 클래스 |
|---|---|
| 껍데기 | `rail` `logo` `nav` `top` `crumb` `bell` `avatar` `badge` `stage` `inbox` `notice` `startup` |
| 카드·목록 | `card` `row` `nm` `sub` `cnt` `body` `sec` `sh` `empty` `empty-s` `list` |
| 표 | `ftbl` `ftop` `fmeta` `cnts` `fleet` `search` `tog` `unit` `site` `mono` `soon` |
| 상태 | `band` `cell` `chip` `rst` `ok` `bad` `why` `when` `dim` `hl` `on` |
| 지도 | `mk` `pt` `ld` `grp` `bd` `lb` `um` `pill` `dot` `shifted` `hide` |
| 카메라 | `wall` `feed` `live` `ts` `exp` `evb` `det` `fullv` `fv-*` |
| 호기 카드 | `stat` `drv` `aiev` `tag` `tele` `val` `fold` `chev` `hint` `parts` `part` `bar` `evl` `kv` `docs` `dgrp` `aichip` |
| 요청 | `rdetail` `rcard` `rhead` `rsec` `pick` `pl` `pickb` `confirm` `avail` `rh` `rsub` |

위 표는 자주 쓰는 것만 추렸다. 상태·분기 이름(`new` `assign` `warn` `dim` …)은 값에서
만들어지므로 `class="rst ${r.status}"` 꼴로만 나타난다.

`npm run check` 가 **아무도 쓰지 않는 클래스를 막고, 몇 종인지 알려 준다.**
수를 여기 적지 않는 이유 — 바뀌면 문서만 틀려진다. 손으로 세다가 세 번 놓쳤다.
값에서 만드는 이름 때문에 검사는 느슨하다: 코드 어디에도 그 낱말이 없을 때만 잡는다.

---

## 규칙

### 1. 공용에는 확신하는 것만 올린다

두 번째 앱이 **실제로 쓸 때** 옮긴다. 미리 올리면 쓰지도 않는 옵션이 붙는다.

옮길 때 하는 일: **저장소 의존을 끊고**, 역할마다 다른 것은 **인자로** 바꾼다.
`site-panel` · `unit-panel` · `status-bar` · `inbox` 가 그렇게 올라왔다.

실제 사례 — `site-panel` 에 사업주 전용 「보유 장비에서 보기」 링크가 섞여 있었다. 본사
안전관리자에는 그 탭이 없어서 `npm run check` 가 잡았다. 머리말 링크를 인자로 바꿔 고쳤다.

### 2. 핸들러 이름을 문자열로 넘기지 않는다

넘기면 게이트 시야를 벗어나 **지워도 통과하고 클릭만 조용히 죽는다.** 실제로 한 번
그렇게 만들었다가 되돌렸다. 크럼이 `openRoot()` 를 마크업에 literal 로 두는 이유다.

각 앱은 자기 `main.ts` 끝에서 인라인 핸들러가 부르는 이름을 `window` 에 얹는다.

### 3. 아카이브의 컴포넌트를 통째로 이식하지 않는다

예전 모노레포에는 `packages/ui` 에 컴포넌트가 잔뜩 있었고 통째로 버렸다. 그 과함이
이번 재시작의 판단이었다. 목록은 참고만 한다:

```sh
git ls-tree -r archive/svelte-2026-09-14 --name-only | grep packages/ui/src
```
