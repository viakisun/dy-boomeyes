# BoomEyes 운영 현황

소유주가 보유한 CPB(콘크리트 타설 붐)의 현장·상태·계약을 한 화면에서 확인한다.
전국 지도에서 현장을 고르고, 현장에서 호기를 고르면 카메라 여섯 화면과 호기 정보가 나온다.

```sh
npm install
npm run dev      # http://localhost:4300
npm run build    # tsc --noEmit && vite build → dist/
npm run preview  # http://localhost:4301 — 빌드한 dist/를 정적으로
```

## 이 저장소가 무엇인가

**Claude Design 시안 「운영 현황 목업.html」을 그대로 옮긴 것이다.** 시안 원본은
[`design/운영 현황 목업.html`](design/운영%20현황%20목업.html)에 있다 — 한 파일짜리 동작 프로토타입이고,
여기 코드는 그것을 파일로 나누고 인라인 `<style>`·`<script>`를 밖으로 뺀 것이다. 로직은 손대지 않았다.

| 파일 | 무엇 |
|---|---|
| `index.html` | 시안의 `<head>`·`<body>` |
| `src/style.css` | 시안의 `<style>` |
| `src/data.ts` | 시드 — 현장 13곳과 호기 120대를 만든다 |
| `src/main.ts` | 화면 전환·지도·카메라·표. 시안의 `<script>` |

시안과 어긋나는 곳이 보이면 **문서가 아니라 `design/운영 현황 목업.html`과 대조한다.**
이전 라운드는 시안을 읽고 번역한 코드를 문서에 옮겨 적은 대응표로 고치다가 계속 어긋났다.

## 옮기면서 바꾼 것

1. 시안이 `/* legacy (unused) */`로 묶어 둔 블록과 `*_old` 함수들을 뺐다(117줄).
2. 생성 HTML이 `onclick="goTab('ops')"` 꼴을 쓰므로 `main.ts` 끝에서 그 함수들을 `window`에 얹는다.
3. 타입 추론을 푸는 표기 몇 곳(`SITES: any[]`, `$(sel): any` 등). `tsconfig`는 느슨하다 —
   시안 코드에 타입을 채우면 코드가 몇 배로 는다.

## 알아둘 것

- **지도**는 Leaflet + OpenStreetMap(독일 미러) 타일, 전국은 world-atlas 국경선. 시안의 선택 그대로다.
  Leaflet·topojson·글꼴은 CDN에서 받는다.
- **카메라 배경** `public/screens/cpb-scene.png`는 **자리표시 이미지**다. 시안의 원본은 도구 전송 상한에
  걸려 받지 못했다 — Claude Design에서 내려받아 같은 경로에 덮어쓰면 된다(1000×690).
- **데이터는 전부 시연용**이다. 서버도 저장도 없다.
- 화면은 PC 1280 기준 하나다. 모바일 레이아웃·다크 모드·오프라인은 시안에 없어 만들지 않았다.

## 이전 코드

Svelte/SvelteKit 모노레포(앱 2·패키지 7·SSOT·게이트·증거 203MB)는 `archive/svelte-2026-09-14`
태그에 통째로 있다.

```sh
git checkout archive/svelte-2026-09-14
```
