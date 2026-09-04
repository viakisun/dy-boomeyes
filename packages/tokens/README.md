# @boomeyes/tokens — BoomEyes 디자인 시스템 원천

`src/`가 원천, `dist/`가 생성물이다. 문서 자체(`dist/DY-design.md`)도 생성물이다.

```
src/brands/DY.json       사업자 브랜드 팩(액센트 앵커·서체·기본 모드)
src/ref/                 원시값 — color.config(색조 앵커) · space · size · radius · border · shadow · font · motion
src/sys/                 시맨틱 — color(bg/fg/border/accent/focus/status) · domain · type · space · size · layout · radius · border · shadow · motion · z · opacity
src/cmp/                 컴포넌트 토큰 — button · field · table · card · nav · badge · overlay (sys만 참조)
src/components.json      컴포넌트 카탈로그(이름·플랫폼·참조·변형·상태)
src/doc/*.md             문서 산문(원칙·명명·플랫폼 가이드·참조 대비·거버넌스)
scripts/oklch.mjs        색 과학(OKLCH·색역 매핑·WCAG 대비)
scripts/ramps.mjs        앵커 → 12단 램프(light/dark)
scripts/tokens.mjs       로드·평탄화·모드 해석
scripts/prepare.mjs      브랜드별 트리 구성
scripts/check.mjs        문법·계층·모드·대비 검사
scripts/build.mjs        CSS·theme·JSON·문서 생성
scripts/doc.mjs          <brand>-design.md 렌더
```

```
node scripts/build.mjs   # dist/DY.tokens.css · DY.theme.css · DY.tokens.json · DY-design.md
node scripts/check.mjs   # 검사만
```

모드: 테마 `data-theme="light|dark"`(없으면 prefers-color-scheme) · 밀도 `data-density="compact|comfortable"`(웹 compact · PWA comfortable). 값 형식은 DTCG(`$type`/`$value`)이며 모드는 `$value: { light, dark }` 또는 `{ comfortable, compact }`로 표현한다.
