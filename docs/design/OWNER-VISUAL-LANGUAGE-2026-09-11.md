# 소유주 화면 디자인 언어 개선안 — 텍스트에서 시각으로

2026-09-11 · 내부 검토용 · [디자인 진단 v3](OWNER-DEMO-DESIGN-REVIEW-2026-09-11.md)(정보 위계)와 [소유주 모의 의견](OWNER-PERSONA-FEEDBACK-2026-09-11.md)의 후속. 구현 기준 `feat/owner-foundation` `5c59540`, 검토 캡처 [owner-final-2026-09-11/review](evidence/owner-final-2026-09-11/review/owner-review.html).

## 0. 판단

소유주 화면 14장(웹 7 · PWA 7)은 정보 순서는 맞췄지만 모든 객체를 같은 굵기의 텍스트 세 줄로 표현한다. 제목마다 지시 부제가 붙고, 상태는 문장이고, 계약은 날짜 두 개, 담당자는 이름과 직함, 서류는 "날짜 · PDF"다. 지도·장비·영상·원문처럼 화면의 주인공이어야 할 대상은 첫 뷰포트에서 작고, 모든 섹션이 같은 테두리 상자다. 사용자가 읽어서 구조를 복원해야 하는 화면이며, 서구 SaaS 기준으로는 2010년대 포털형 레이아웃에 가깝다.

원인은 언어가 아니라 표현 방식이다. 디자인 시스템(`packages/tokens`, `packages/ui/src/primitives`)은 이미 서구형 어휘(반경 6/8/12 · Linear 밀도 · 색 예산 · lucide 아이콘)를 갖췄고 관리자·현장 화면은 그것을 쓴다. 소유주 화면만 프리미티브를 쓰지 않았다.

개선 방향은 **텍스트에서 시각으로**다. 한 화면 한 주인공, 설명 대신 표시, 큰 숫자와 작은 라벨, 시각 인코딩 우선, 선 대신 여백, 이미지, 역할에 맞는 밀도, 문장 없는 카피. 색 예산(토큰 원칙 4)과 e2e 계약은 유지한다.

## 1. 근거 — 동아시아형·서구형 경향과 서구 SaaS 원칙

확인일 2026-09-11. 1차 출처(학술·공식 문서)와 2차 출처(업계 블로그)를 구분한다.

| 구분 | 자료 | 이 개선안이 가져오는 것 |
|---|---|---|
| 1차 · 리서치 | NN/g, [China website complexity](https://www.nngroup.com/articles/china-website-complexity/) | 고맥락 문화 사용자는 밀도 높은 화면을 "정상"으로 여기지만 실제 과제에서는 더 느리고 망설인다 — 텍스트 축소는 한국 소유주에게도 이득이다 |
| 1차 · 학술 | Marcus & Gould 2000, [Crosscurrents](https://dl.acm.org/doi/10.1145/345190.345238) | 문화 차원에 따라 정보 계층의 깊이·구조 강조가 달라진다 — 얕은 계층, 적은 접근 장벽 |
| 1차 · 학술 | Würtz 2005, [High-/Low-Context Web sites](https://academic.oup.com/jcmc/article/11/1/274/4616666) | 고맥락 사이트는 그림·상징으로 메시지를 전달한다 — 시각 전략은 문화 중립적으로 유효하다 |
| 1차 · 학술 | Cyr 2008, [Modeling Web Site Design Across Cultures](https://www.tandfonline.com/doi/abs/10.2753/MIS0742-1222240402) | 서구 사용자는 콘텐츠와 구조에서 신뢰를 형성한다 — 장식보다 위계 |
| 2차 · 관찰 | Rakuten vs Amazon, Naver vs Google 비교 블로그 | 밀도·텍스트·배너 vs 단일 초점·균일 레이아웃. 방법론이 없어 관찰로만 인용한다 |
| 1차 · 원칙 | [Apple HIG — Writing](https://developer.apple.com/design/human-interface-guidelines/writing) | "When labeling buttons and links, it's almost always best to use a verb." · "If you can use fewer words, do so." |
| 1차 · 원칙 | [Atlassian — Voice and tone](https://atlassian.design/content/voice-and-tone-principles/) | "Tell people only what they need to know in the moment and nothing more." |
| 1차 · 원칙 | [GOV.UK Design Principles](https://www.gov.uk/guidance/government-design-principles) | "Do the hard work to make it simple." |
| 1차 · 원칙 | NN/g, [Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/) | "Initially, show users only a few of the most important options." |
| 1차 · 사례 | [Apple HIG — Charts](https://developer.apple.com/design/human-interface-guidelines/charts) · [Activity Rings](https://developer.apple.com/design/human-interface-guidelines/activity-rings) | 값 나열 대신 형태로 정보를 전달한다 |
| 1차 · 사례 | [Airbnb — Building a Visual Language](https://medium.com/airbnb-design/building-a-visual-language-behind-the-scenes-of-our-airbnb-design-system-224748775e4e) | Iconic · Conversational — 시각·모션 언어 |
| 1차 · 사례 | [Samsara — New Platform Experience](https://www.samsara.com/blog/meet-the-new-samsara-platform-experience) · [Trackunit — Using the Map](https://help.trackunit.com/en/articles/236810-using-the-map-in-trackunit-manager) · [Trackunit Go](https://help.trackunit.com/en/articles/137625-how-do-i-get-started-in-the-trackunit-go-app) | 지도 + 접이식 목록 개요 · 심각도 순 Attention 목록 · 지도 ↔ 목록 실시간 동기 |
| 1차 · 사례 | [Samsara Fleet App](https://kb.samsara.com/hc/en-us/articles/360040058532-Samsara-Fleet-App-Features) · [Samsara Alerts](https://kb.samsara.com/hc/en-us/articles/4408735637005-View-Alerts-in-the-Samsara-Fleet-App) | 인라인 전화 행동 · 스와이프 읽음/미확인 |
| 1차 · 사례 | [Hilti ON!Track 인증 갱신](https://help.ontrack3.hilti.com/hc/en-us/articles/34399865103249-How-to-renew-employee-certificates) · [Motive Documents](https://helpcenter.gomotive.com/hc/en-us/articles/31075948317853-Documents-Overview) | 만료 예정 필터 · 만료 자동 알림 — 서류는 D-day로 읽는다 |
| 1차 · 주의 | [Linear — Behind the latest design refresh](https://linear.app/now/behind-the-latest-design-refresh) | 아이콘을 줄이고 정리한다 — 아이콘은 텍스트를 대신할 때만, 장식 0 |

인용하지 않은 것: Stripe·Notion의 "시각화로 텍스트 대체" 공식 원문(미확인), 장비 사진 썸네일이 관제 카드의 표준 요소라는 1차 근거(미확인 — 이 문서는 카메라 스틸이 있을 때만 쓴다). 특정 시스템을 그대로 이식하는 방식은 [CLAUDE.md](../../CLAUDE.md) 금지 항목이며, 규칙만 채택한다.

## 2. 측정 — 현재 화면의 텍스트성

`packages/ui/src/owner/*.svelte` 11개 + `packages/video/src/OwnerVideo.svelte` 마크업(`<script>` 제외) 집계(부록 A 스크립트, 2026-09-11).

| 지표 | 값 | 뜻 |
|---|---|---|
| 설명 문장(…하세요 / …합니다.) | **58** | 부제 · 각주 · 상태 설명 · 안내가 문장이다 |
| `·`로 이어 붙인 메타 | **29** | `2026-07-02 · PDF · 시연용 첨부` · `7. 3. 오전 10:38 · 미확인` |
| `<p>` | 80 | 단락이 주 표현 수단이다 |
| `border` | **149** | 목록 · 카드 · 패널 전부 선으로 구분한다 |
| 아이콘 | 18 | 내비 · 화살표 위주 |
| `<img>` | 2 | 서류 뷰어 · 영상 poster — 카드 안 이미지 0 |

| 파일 | 문장 | `·` | `<p>` | border | 아이콘 | img |
|---|---|---|---|---|---|---|
| OwnerDetail.svelte | 10 | 3 | 19 | 34 | 8 | 0 |
| OwnerDocuments.svelte | 11 | 3 | 13 | 25 | 0 | 0 |
| OwnerVideo.svelte | 13 | 4 | 11 | 9 | 0 | 1 |
| OwnerAlerts.svelte | 5 | 2 | 8 | 16 | 1 | 0 |
| OwnerOverview.svelte | 6 | 4 | 6 | 14 | 4 | 0 |
| OwnerFleet.svelte | 4 | 2 | 2 | 13 | 1 | 0 |
| OwnerEntry.svelte | 4 | 4 | 9 | 9 | 2 | 0 |
| OwnerShell.svelte | 2 | 1 | 1 | 13 | 1 | 0 |
| DocumentViewer.svelte | 2 | 3 | 4 | 10 | 0 | 1 |
| EquipmentRow.svelte | 0 | 1 | 5 | 0 | 1 | 0 |
| FleetSummary.svelte | 0 | 0 | 0 | 3 | 0 | 0 |
| OwnerWorkspace.svelte | 1 | 2 | 2 | 3 | 0 | 0 |

프리미티브 사용: Button · EmptyState · PageHeader · Dialog · Logo 5종. StatusPill · StatusDot · Badge · Chip · Card · KeyValueList · Stat · Tabs · Skeleton · Banner · IconButton · FileUpload · Figure · Timeline 0회. 상태 톤은 `equipmentCondition()`([core-helpers.ts:16](../../packages/ui/src/owner/core-helpers.ts#L16))이 만들지만 소비처가 `text-danger-fg / text-warning-fg / text-fg` 삼항으로 풀어 본문 굵기 그대로 색만 바꾼다([EquipmentRow.svelte:47](../../packages/ui/src/owner/EquipmentRow.svelte#L47), [OwnerDetail.svelte:116](../../packages/ui/src/owner/OwnerDetail.svelte#L116)).

### 캡처에서 보이는 흔적

| 흔적 | 위치 |
|---|---|
| 지시 부제 "…의 장비와 현장을 한눈에 확인하세요" · "호기나 현장으로 찾아 계약과 담당자를 확인하세요" · "호기를 선택하고 제작증과 검사 성적서 원문을 확인하세요" · "N대에서 N건의 확인이 필요합니다" | [OwnerOverview.svelte:36](../../packages/ui/src/owner/OwnerOverview.svelte#L36) · [OwnerFleet.svelte:46](../../packages/ui/src/owner/OwnerFleet.svelte#L46) · [OwnerDocuments.svelte:167](../../packages/ui/src/owner/OwnerDocuments.svelte#L167) · [OwnerAlerts.svelte:46](../../packages/ui/src/owner/OwnerAlerts.svelte#L46) |
| 각주 · 푸터 "전체 알림 N건 중 N건 표시 · 같은 장비에 여러 알림이 있을 수 있습니다" · "시연 기준 …" · "… · 시연용 자료 · 기준 2026. 7. 3. 10:42" | [OwnerOverview.svelte:117](../../packages/ui/src/owner/OwnerOverview.svelte#L117) · [OwnerOverview.svelte:37](../../packages/ui/src/owner/OwnerOverview.svelte#L37) · [OwnerWorkspace.svelte:115](../../packages/ui/src/owner/OwnerWorkspace.svelte#L115) |
| 상태가 문장 "새 데이터가 도착하지 않아 현재 상태를 확인할 수 없습니다" · "읽음 표시는 장비 이상을 해소하거나 점검을 완료하지 않습니다" | [OwnerDetail.svelte:132](../../packages/ui/src/owner/OwnerDetail.svelte#L132) · [OwnerAlerts.svelte:119](../../packages/ui/src/owner/OwnerAlerts.svelte#L119) |
| 자리 문장 "알림을 선택하면 해당 장비의 현장 담당자와 발생 정보를 함께 확인할 수 있습니다" | [OwnerAlerts.svelte:132](../../packages/ui/src/owner/OwnerAlerts.svelte#L132) |
| 카드가 라벨 목록 — 계약 "설치일" 행, 담당자 "현장 담당자" 라벨, 진입 미리보기 `<dl>` | [OwnerDetail.svelte:74](../../packages/ui/src/owner/OwnerDetail.svelte#L74) · [OwnerDetail.svelte:91](../../packages/ui/src/owner/OwnerDetail.svelte#L91) · [OwnerEntry.svelte:79](../../packages/ui/src/owner/OwnerEntry.svelte#L79) |
| 표 머리글 텍스트 "호기 · 현장 / 장비 상태 · 수신 시각" | [OwnerFleet.svelte:120](../../packages/ui/src/owner/OwnerFleet.svelte#L120) |
| 제품 표면의 "시연" 칩 · "예시" 라벨 | [OwnerShell.svelte:64](../../packages/ui/src/owner/OwnerShell.svelte#L64) · [OwnerEntry.svelte:58](../../packages/ui/src/owner/OwnerEntry.svelte#L58) |
| 주인공이 작다 — 웹 운영 현황 지도 약 482×237(첫 뷰포트 1280×842의 약 11%) | [web-overview](evidence/owner-final-2026-09-11/review/screens/web-overview-1280x842-light.png) |

## 3. 규칙 8개

1. **한 화면 한 주인공.** 운영 현황 = 지도, 보유 장비 = 장비 카드, 호기 상세 = 장비(큰 호기 번호 · 스틸 · 상태 · 주 행동), 영상 = 플레이어, 장비 서류 = 원문 페이지, 이상·점검 = 선택한 알림. 주인공이 첫 뷰포트의 절반 이상을 차지한다.
2. **설명하지 않고 보여준다.** 지시 부제 · 각주 · 상태 설명 문장을 없앤다. 상태는 아이콘 + 2~4어 라벨(StatusPill · Badge). 설명이 꼭 필요하면 빈 상태 · 오류 · 오프라인에만 문장을 쓴다. 목표 58 → ≤ 8.
3. **큰 숫자, 작은 라벨.** 값은 `display`, 라벨은 `label-sm` muted eyebrow, 단위는 작은 글자. `·` 나열은 아이콘 메타 행 또는 KeyValueList로 바꾼다. 목표 29 → 0.
4. **시각 인코딩 우선.** 계약 기간 = PeriodBar, 보유 구성 = 분포 막대, 전압 = Stat + 기준값, 마지막 수신 = 시계 아이콘 + 상대 시각, 위치 = 지도 스니펫 · MapPin, 담당자 = 이니셜 아바타, 서류 = 썸네일, 장비 = 카메라 스틸.
5. **선이 아니라 여백 · 층 · 타이포로 구분한다.** 테두리는 상호작용 카드 외곽에만(149 → ≤ 40). 섹션은 제목 + 간격 + `bg-surface-sunken` 층. 표 머리글 텍스트는 없앤다. 행 구분선은 `border-subtle` 또는 없음.
6. **이미지.** 장비 카드 미디어 슬롯(카메라 poster 스틸이 `available`일 때, 아니면 IconTile), 서류 `previewUrl` 썸네일, 상세 · 진입 히어로에 장비 스틸(`packages/video/src/assets/front.webp` · `boom.webp` 재사용). 전용 장비 삽화는 후속 자산 과제다.
7. **밀도는 역할에서 온다**(토큰 원칙 6). 소유주는 관제 요원이 아니다. 소유주 웹도 comfortable(카드 패딩 20 · 행 56 · 본문 16). 토큰 CSS는 `:root` = comfortable, `[data-density="compact"]`만 오버라이드하므로 소유주 레이아웃에서 `html`의 `data-density`를 전환하면 된다([app.html:2](../../apps/web/src/app.html#L2), [OwnerShell.svelte:41](../../packages/ui/src/owner/OwnerShell.svelte#L41)). 사용자 결정 항목.
8. **카피.** 버튼은 동사, 라벨은 명사, 문장 없음. "시연" 칩 · "시연 기준" 문장 · "예시" 라벨 · 푸터는 DemoBar(`?scene=`)로 옮긴다. 색 예산(토큰 원칙 4: 색 필은 warning · danger만, 점은 LIVE만, 화면당 색 계열 ≤ 3), FR-034(미수신을 정상처럼 두지 않음), e2e 문자열 계약은 유지한다.

## 4. 화면별 전/후

| 화면(웹/PWA) | 주인공 · 첫 뷰포트 | 없애는 것 | 시각화 |
|---|---|---|---|
| 진입 B0-01 / A4-01 | 실제 로그인 폼(아이디 · 비밀번호 표시 토글 · 로그인 상태 유지 · 비밀번호 찾기 · 로그인 · 오류 한 줄) + "데모 계정으로 로그인" 보조 링크 + "데모 환경" 배지 + 도움말·약관·개인정보 푸터 — 랜딩·미리보기 없음(사용자 결정 2026-09-12) | 히어로 카피 · 미리보기 · "예시" 라벨 · 각주 · "소유주" 역할 제목 | 폼 시맨틱(autocomplete username/current-password) · mock 인증(데모 계정만 통과, DISC-020) |
| 운영 현황 B1-02 / A4-07 | 지도 히어로(웹 12열 중 8, 높이 첫 뷰포트 60%) + 오른쪽 "확인할 것" 레일(sticky) + 위 한 줄 구성 막대 | 부제 · 지도 각주 · 알림 각주 · "시연 기준" · 푸터 | 지도 ↔ 카드 선택 동기 · AlertCard(IconTile) · 분포 막대 · display 숫자 |
| 보유 장비 B1-09 / A4-02 | 장비 카드 열(웹: 미디어 + 정렬 열 · PWA: 미디어 카드) | 부제 · 표 머리글 텍스트 · "전체 5대 중 5대 표시" → 카운트 칩 | 스틸 썸네일 · StatusPill · Badge 배치 · 시계 메타 · 계약 D-n |
| 호기 상세 B1-10 / A4-08 | 장비 히어로(display `1호기` · 스틸 · StatusPill · Badge · 전화/영상/서류 행동) → 지도 스니펫 · PeriodBar · 아바타 담당자 · Stat 전압 | 카드 4개 테두리 · "설치일" 행 · 수신 설명 문장 · "현장 담당자" 중복 라벨 | ContextHeader sticky · 미니맵 · PeriodBar · ContactCard · Stat · Timeline 이력 |
| 영상 B1-11 / A4-09 | 플레이어(첫 뷰포트 70%) + 위 Chip 2행 | 캡션 문단 · "영상 끝에서 재생이 멈춥니다" 안내 · 하단 문장 | 오버레이 StatusPill · 아이콘 재생 · KeyValueList 캡션 |
| 장비 서류 B1-05 / A4-10 | 원문 페이지(선택 뒤 2/3) + 왼쪽 썸네일 목록 | 부제 · "시연용 원문 · 1페이지" · 첨부 안내 문단 | 썸네일 · IconTile 파일 종류 · Badge · ExternalLink |
| 이상·점검 B1-12 / A4-11 | 선택 알림 상세(IconTile 큰 톤 · 값 · 담당자 카드) + 왼쪽 AlertCard 목록 | 부제 · "표시 3건 / 전체 3건" · 자리 문장 · "읽음 표시는…" | AlertCard · KeyValueList · ContactCard · Chip 카운트 |
| 셸 | 사이드바 아이콘 + 라벨(현행) | "시연" 칩 · 푸터 · 오프라인 문장 → Banner 아이콘 + 짧은 라벨 | DemoBar |

### 시안(정적 · 제품 캡처 아님)

실제 토큰 CSS(`packages/tokens/dist/DY.tokens.css`)를 링크한 HTML을 Playwright chromium으로 렌더했다. 지도는 기존 캡처 크롭, 장비 스틸은 `packages/video/src/assets`, 서류는 `packages/mock/src/assets/owner`. 데이터는 시연 세트(한빛중기 5대)와 같다. 렌더 조건은 [render-check.json](proposals/owner-visual-2026-09-11/render-check.json).

| 전 | 후 |
|---|---|
| [운영 현황 웹](evidence/owner-final-2026-09-11/review/screens/web-overview-1280x842-light.png) | ![운영 현황 웹 시안](proposals/owner-visual-2026-09-11/01-overview-web-after.png) |
| [호기 상세 웹](evidence/owner-final-2026-09-11/review/screens/web-detail-1280x842-light.png) | ![호기 상세 웹 시안](proposals/owner-visual-2026-09-11/02-detail-web-after.png) |
| [보유 장비 PWA](evidence/owner-final-2026-09-11/review/screens/pwa-fleet-390x800-light.png) | ![보유 장비 PWA 시안](proposals/owner-visual-2026-09-11/03-fleet-pwa-after.png) |

![컴포넌트 시트](proposals/owner-visual-2026-09-11/04-components.png)

## 5. 컴포넌트 명세

공통: Svelte 5 runes, `sys`·`cmp` 토큰 유틸리티만, 밀도는 `[data-density]`가 정한다(컴포넌트에 밀도 prop 없음). 색 필 톤 타입은 `neutral | warning | danger`로 제한해 색 예산을 컴파일 타임에 지킨다. 사용자 문자열은 `labels.ts` 상수 또는 prop으로 받는다. 시각은 `now`(DemoClock `data.at`)를 주입받고 `new Date()`를 쓰지 않는다.

### 5.1 IconTile — 신규 · `packages/ui/src/primitives/IconTile.svelte`

```
┌────┐
│ ⚠ │  size-avatar-md/lg 정사각 · rounded-control · aria-hidden
└────┘  neutral = bg-surface-sunken/text-fg-muted · warning = bg-warning-bg/text-warning-fg · danger = bg-danger-bg/text-danger-fg
```

```ts
let { tone = 'neutral', size = 'lg', class: cls, children }: {
  tone?: 'neutral' | 'warning' | 'danger'; size?: 'md' | 'lg'; class?: string; children: Snippet;
} = $props();
```

의미는 옆 텍스트가 진다. 알림 행 · 알림 상세 헤더 · 서류 행 · 뷰어 헤더 · 상세 자료 카드 · 진입 미리보기. 카탈로그 family Display.

### 5.2 List — 카탈로그에 있고 미구현 · `packages/ui/src/primitives/List.svelte`

```ts
let { items, key, item, label, variant = 'card', as = 'ul', header, footer, empty, class: cls }: {
  items: T[]; key: (it: T) => string; item: Snippet<[T, number]>; label: string;
  variant?: 'card' | 'plain'; as?: 'ul' | 'ol'; header?: Snippet; footer?: Snippet; empty?: Snippet; class?: string;
} = $props();
```

`<ul aria-label>` + `<li>`를 보장한다(e2e `listitem` 카운트). 카드 크롬(`rounded-card border bg-surface overflow-hidden`)은 여기 한 곳에만 있고 `plain`은 구분선만. 로딩은 호출자가 Skeleton 항목을 넣는다(`role=status`는 호출자 통제).

### 5.3 PeriodBar — 신규 · `packages/ui/src/primitives/PeriodBar.svelte` + `lib/period.ts`

```
2026. 06. 01.                                   2026. 09. 30.
├──────────────●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┤   ● 오늘(rounded-mark) · ┃설치 마커
                                 종료까지 D-89
```

```ts
export function periodProgress(start: string, end: string, now: string): { pct: number; state: 'before' | 'during' | 'after'; remainingDays: number };
let { start, end, now, label, format, markers = [], warnWithinDays = 30, class: cls }: {
  start: string; end: string; now: string; label: string; format?: (iso: string) => string;
  markers?: { at: string; label: string }[]; warnWithinDays?: number; class?: string;
} = $props();
```

양끝 `<time datetime>`, 트랙 `h-size-indicator rounded-pill bg-surface-sunken`, 경과 채움 중립, 오늘 마커 `rounded-mark`(점 감사 제외), 캡션 "종료까지 D-n"은 `remainingDays ≤ warnWithinDays`일 때 warning 텍스트. 절대 위치 텍스트 없음(375px). `period.ts`가 vitest 대상. 계약 없음은 호출자가 원인 문구를 보여준다. family Display.

### 5.4 ContactCard — 신규 · `packages/ui/src/primitives/ContactCard.svelte`

```
(김)  김현장                     [📞 010-0000-0000] [⧉]
      현장 담당자 · 마포 주상복합 신축
```

```ts
let { name, role, phone, note, copy = true, actions, class: cls }: {
  name: string; role?: string; phone?: string; note?: string; copy?: boolean; actions?: Snippet; class?: string;
} = $props();
```

이니셜 아바타 `size-size-avatar-md rounded-pill bg-ui text-label-md`(aria-hidden) · 이름 `heading-sm` · 역할 muted · `Button href="tel:{digits}" variant="outline"` + Phone 아이콘(번호 텍스트 유지) · 복사 `IconButton label="전화번호 복사" class="min-w-size-touch-min"` + toast. 담당자 미등록은 호출자가 문구를 보여준다. family Domain.

### 5.5 ContextHeader — 신규 · `packages/ui/src/primitives/ContextHeader.svelte`

상세 페이지가 스크롤되면 제목 · 상태 필 · 주 행동만 남긴 축약 헤더가 sticky로 붙는다. `IntersectionObserver`로 전환, `motion-reduce`는 즉시. 아래 콘텐츠에 `scroll-margin-top`을 줘 포커스가 가려지지 않게 한다(WCAG 2.4.11).

```ts
let { title, subtitle, status, actions, back, class: cls }: {
  title: string; subtitle?: string; status?: Snippet; actions?: Snippet; back?: { href: string; label: string }; class?: string;
} = $props();
```

### 5.6 Button `href` — 추가 prop

`href`가 있으면 `<a>`(role link)로 렌더한다. 기본 경로 불변이라 관리자 화면 시각 diff 0. 수기 링크 버튼 6곳(`장비 목록으로` · `알림 전체 보기` · `전체 장비 보기` · `관련 알림 보기` · `장비 상세` · `원문 새 창 열기`)을 대체한다.

### 5.7 EquipmentRow v2 — `packages/ui/src/owner/EquipmentRow.svelte`

```
columns(웹 ≥ sm)
┌──────┬─────────────────────┬──────────────┬─────────────────┬───────────┬──┐
│[스틸] │ 1호기  CPB-001       │ ⓘ 이상 없음   │ ◷ 3분 전         │ 계약 D-89  │ ›│
│      │ 마포 주상복합 신축 ·한빛│ [현장 투입]   │                 │           │  │
stacked(PWA · 현황)
┌──────────────────────────────────┐
│ [스틸 16:9]        [현장 투입]     │
│ 1호기  CPB-001    ⚠ 공급 전압 저하 │
│ 마포 주상복합 신축                  │
│ ◷ 3분 전 · 계약 D-89   [📞][▶][🗎] │
└──────────────────────────────────┘
```

```ts
let { device, now, href, onselect, layout = 'stacked', media, actions, selected = false, location = false, class: cls }: {
  device: OwnerDevice; now: string; href?: string; onselect?: (d: OwnerDevice) => void;
  layout?: 'columns' | 'stacked'; media?: Snippet; actions?: Snippet; selected?: boolean; location?: boolean; class?: string;
} = $props();
```

식별 `{unit}호기` `heading-sm` + `{id}` `code-sm muted` · 현장 `body-md`(줄바꿈 허용) + 건설사 muted · 배치 `Badge tone="neutral" variant="outline"` · 조건 `StatusPill size="sm" tone={condition.tone}`(danger · warning 필, neutral은 텍스트) · 수신 = Clock 아이콘 + 상대 시각(`<time title>` 절대) — 문자열 "최근 수신 / 마지막 수신 / 단말기 미장착" 유지 · 계약 종료 D-n(`dueLabel`, ≤ 30일 warning, 없음 muted) · 미디어 슬롯 `shrink-0`(poster `<img alt="">` 또는 IconTile Truck) · 빠른 행동 IconButton 3(전화 · 영상 · 서류, ≥ 44) · 후행 Chevron(href일 때). `columns`는 `sm:grid-cols-[minmax(0,3fr)_…_auto]`, 아래에서 스택. 루트 `data-device` · `data-condition` · `aria-current` · aria-label 유지.

### 5.8 AlertCard — 신규 · `packages/ui/src/owner/AlertCard.svelte`

```
┌────┐  공급 전압 저하                          ○ 미확인
│ ⚠ │  🚚 2호기 · 송도 업무시설 신축
└────┘  ◷ 10:38                                     →
```

```ts
let { alert, device, href, onclick, onread, selected = false, class: cls, ...rest }: HTMLAttributes<HTMLElement> & {
  alert: OwnerAlert; device?: Pick<OwnerDevice, 'id' | 'unit' | 'site'>;
  href?: string; onclick?: () => void; onread?: () => void; selected?: boolean; class?: string;
} = $props();
```

루트는 `href` → `<a>`, `onclick` → `<button aria-pressed>`, 둘 다 없으면 `<div>`. `rest`로 `data-alert` · `data-device`를 루트에 싣는다(e2e). IconTile 톤 = `OWNER_ALERT_TONE[kind]`(fault danger · inspection warning · connection warning, FR-034) + 종류 아이콘(TriangleAlert · ClipboardCheck · Radio) · 제목(미확인 `font-semibold`) · Truck 메타 · 시각 + `Badge variant="outline"` "미확인" 또는 muted "읽음" · 인라인 읽음 IconButton(`onread`) · 후행 Arrow. 종류 색 필은 상세 헤더에만.

### 5.9 FleetSummary — 변경

`display` 숫자 5 + `label-sm` "보유 장비" · 분포 막대 `role="img" aria-label="현장 투입 4대, 보관 1대"` · 범례는 링크 유지(`?filter=`) · `interactive={false}`면 span. `data-owner-summary` · `data-total` 등 유지.

### 5.10 서류 행 — `OwnerDocuments` 로컬 스니펫

소비처가 하나라 컴포넌트로 뽑지 않는다. `<button data-doc aria-label="{title} 열기" aria-pressed>` → `previewUrl` 썸네일(`h-size-avatar-lg aspect-[210/297] object-cover`) 또는 IconTile(FileText · Image) · 제목 · 메타(발급일 · 종류 · `유효 D-n`은 `expiresAt` 있을 때만) · `Badge outline` 종류 · `Badge outline` 시연용 첨부 · "원문 보기" + ExternalLink. 두 번째 목록이 생기면 추출한다.

### 5.11 미니맵 타일 — 상세

ui는 map을 import하지 않으므로 `apps/*/src/lib/OwnerPage.svelte`가 `MapView interactive={false} fitMarkers` 스니펫을 상세에 주입한다. `tools/capture/owner.mjs`의 마커 5개 단언을 뷰별 기대값(현황 5 · 상세 1)으로 바꾼다.

### 5.12 재사용만

Stat(전압 — 값 380 · 단위 V · 힌트 "마지막 수신 10:41" · fault면 danger) · KeyValueList(상세 dl 3곳 · 알림 상세 · 영상 캡션) · Chip 그룹(`role="group" aria-label`, 배치 필터 · 알림 종류 · 영상 용도/시점 — Tabs는 `role=tab`이라 e2e `getByRole('button')`과 충돌) · StatusPill(미디어 오버레이는 `solid tone="neutral"`, 6초 루프에 `signal` 금지) · Card interactive(상세 자료 2) · Badge(뷰어 파일 종류) · Skeleton · Banner(셸 오프라인만 — `role=status`라 보유 장비 뷰 안 금지) · EmptyState(아이콘 스니펫) · PageHeader(부제 없이 제목 + 메타 칩 + 행동) · Timeline(상세 이력) · IconButton(`min-w-size-touch-min` — `OwnerShell` `<style>`이 컨트롤 높이를 강제한다).

채택하지 않음: Tabs · DataTable(`<table>`이라 `role=list "보유 장비 목록"` 단언과 충돌) · TextField/Select(셸 높이 강제와 충돌) · TelemetryGauge(부품 값이 문자열) · StatusDot.

### 5.13 라벨 · 톤 · 아이콘

`lib/cx.ts`: `OWNER_ALERT_TONE` · `OWNER_CONNECTION_TONE`(stale warning, 나머지 neutral). `lib/labels.ts`: `OWNER_ALERT_KIND_LABEL` · `OWNER_DOC_TYPE_LABEL`. `owner/core-helpers.ts`: `OWNER_ALERT_ICON`. 아이콘 추가(lucide, DY-design §11.5 매핑 확장): truck · map-pin · clock · phone · copy · image · external-link · video · play · pause.

## 6. 시스템 변경(구현 시)

| 대상 | 변경 |
|---|---|
| `packages/tokens/src/components.json` | IconTile · PeriodBar(Display) · ContactCard · ContextHeader(Domain) · AlertCard(Owner experience) 등록, List · EquipmentRow 설명 갱신 → `pnpm tokens:build` |
| `packages/tokens/src/doc/04-page.md` | §11.7 "소유주 데모 패턴": 한 화면 한 주인공 · 카드 해부도 · 아이콘 메타 행 · 설명 문장 규칙. `00-principles.md` · `06-web.md`의 중복 문단은 참조로 축약 |
| `packages/tokens/src/sys/motion.json` · 유틸 | `motion-reduce` 변형. 선택: `sys.size.thumb.md`(96/80) — 없으면 `w-layout-field-short aspect-video` |
| `specs/owner-experience/design.md` | 공통 패턴에 신규 컴포넌트, DataTable 대신 List + 열 행인 이유, 밀도 결정 |
| `tools/design/color-audit.mjs` | `--owner` 패스(현재 wave ≤ 2만 방문해 소유주 화면은 감사 밖) |
| `tools/capture/owner.mjs` | 마커 검사 뷰별 기대값 · 320px 폭 추가 |
| `apps/web/src/app.html` · `OwnerShell.svelte` | 소유주 웹 comfortable 전환(결정 시) |
| `packages/ui/package.json` | vitest(`period.ts`) |

새 토큰은 필요 없다(avatar · icon · badge · row · motion 토큰이 이미 있다). SSOT 변경 없음(화면 · FR 추가 없음).

## 7. 완료 정의

| 지표 | 지금 | 목표 | 확인 |
|---|---|---|---|
| 설명 문장 | 58 | ≤ 8(빈 · 오류 · 오프라인만) | 부록 A |
| `·` 나열 메타 | 29 | 0 | 부록 A |
| `border` | 149 | ≤ 40 | 부록 A |
| 아이콘 | 18 | 상태 · 메타 자리마다 1개, 장식 0 — 개수 목표 없음 | 리뷰 |
| 카드 미디어(`<img>` · IconTile) | 0 | 모든 장비 · 알림 · 서류 카드 | 캡처 |
| 첫 뷰포트 주인공 면적 | 현황 지도 약 11% | ≥ 50% | 1280×842 · 390×800 캡처 |
| 프리미티브 사용 | 5종 | StatusPill · Badge · Chip · Card · Stat · KeyValueList · Skeleton · Banner · IconButton | grep |
| 상태를 `text-*-fg` 삼항으로 그리는 곳 | 2 | 0 | grep |
| 색 계열 · 점 · axe · 오버플로 · e2e | ≤ 3 · 0 · 0 · 0 · 녹색 | 유지 | `color-audit --owner` · owner e2e |

## 8. 구현 계획

승인 뒤 별도 작업. PR당 화면 ≤ 3, 게이트는 단독 문장으로 실행하고 exit code를 본다([QA](../QA.md) §6). 각 PR은 reviewer "머지 가능" 인용 뒤 머지.

| PR | 브랜치 | 범위 | 증거 |
|---|---|---|---|
| C0 | `chore/owner-copy-density` | 설명 문장 · 각주 · `·` 메타 · "시연" 표면 제거(카피만) · 소유주 웹 comfortable(결정 시) · `color-audit --owner` · capture 마커/320px · 측정 스크립트 `tools/design/` | verify · owner e2e · capture:owner · 지표 표 |
| C1 | `feat/owner-visual-list` | IconTile · List · Button href · EquipmentRow v2 · AlertCard · FleetSummary · 운영 현황 벤토 + 보유 장비 | + `tools/owner/performance.mjs` p95(120대) · `capture:compare` 관리자 diff 0 |
| C2 | `feat/owner-visual-detail` | ContactCard · PeriodBar · ContextHeader · 미니맵 · Timeline · 호기 상세 + 이상·점검 | + 오프라인 innerText 테스트 · color `--owner` |
| C3 | `feat/owner-visual-media` | 장비 서류 · 뷰어 · 영상 · 진입 · 셸 | + content/resources 스위트 · exceptions 캡처 |
| C4 | `docs/owner-visual-evidence` | 토큰 원천 §11.7 · design.md · PLAN · `owner-final-<date>` 112+14 캡처 · owner-review 재생성 · 지표 전/후 표 | capture:owner · owner:check · docs:owner:check |

지켜야 할 e2e 계약(`tests/e2e/owner-*.ts`): `data-owner-view` · `data-owner-summary` · `data-device` · `data-alert` · `data-doc` · `data-camera[data-mode]` · `data-document-viewer`, region "장비 상태" · "알림 목록" · "선택한 알림 상세", list "우선 확인 알림" · "현장별 장비" · "보유 장비 목록", label "호기·현장 검색" · "배치 필터" · "시연 파일 선택", 버튼 · 링크 이름, 상태 문자열 "수신 지연" · "단말기 미장착" · "미연동" · "공급 전압 · 마지막 수신값" · "380", "0 V" 없음, "승인" 0, 오프라인 전후 "장비 상태" 텍스트 동일, 가로 오버플로 0.

## 9. 구현 결과(2026-09-11, C0~C3)

브랜치 체인 `docs/owner-visual-language` → `chore/owner-copy-density` → `feat/owner-visual-list` → `feat/owner-visual-detail` → `feat/owner-visual-media` → `docs/owner-visual-evidence`. 사용자 결정: 소유주 웹 comfortable 밀도 전환(2026-09-11).

### 측정 전/후

| 지표 | 전 | 후 | 목표 | 판정 |
|---|---|---|---|---|
| 설명 문장 | 58 | **23** | ≤ 8 | 미달 — 남은 23은 오류 · 오프라인 · 첨부 안내 · 로딩 sr-only · 진입 카피(e2e가 문장을 단언하는 것 6건 포함). 제품 표면의 지시 부제 · 각주 · 자리 문장은 0 |
| `·` 나열 메타 | 29 | **13** | 0 | 미달 — 남은 13은 `N호기 · 현장`(식별자 쌍 · e2e 단언), 서류 select option, 알림 요약 `N대 · N건` |
| `border` | 149 | **40** | ≤ 40 | 충족 |
| `<img>` | 2 | **6** | 카드마다 미디어 | 충족(스틸 · 썸네일 · IconTile) |
| 아이콘 | 18 | 40 | 상태 · 메타 자리 1개, 장식 0 | 충족 |
| 상태를 `text-*-fg` 삼항으로 그리는 곳 | 2 | **1**(전압 값 danger 채색 — §11.4 허용) | 0 | 충족 |
| 프리미티브 사용 | 5종 | **16종**(Badge · Banner · Button · Chip · ContactCard · ContextHeader · Dialog · EmptyState · IconButton · IconTile · KeyValueList · List · PageHeader · PeriodBar · Skeleton · StatusPill) | 전부 | 충족 |
| 첫 뷰포트 주인공 | 현황 지도 약 11% | 지도 8/12열 × 420px ≈ 33% · 상세 히어로 첫 뷰포트 45% | ≥ 50% | 부분 — 지도는 폭 8/12 기준 첫 뷰포트의 절반 이상을 차지하나 높이 기준 33% |

### 전/후 캡처(웹 1280×842 · PWA 390×800, 라이트)

증거: [owner-visual-2026-09-11](evidence/owner-visual-2026-09-11/manifest.json) — 112/112 · failed 0 · owner e2e 88 · `owner:check` errors 0. 검토안 [owner-review.html](evidence/owner-visual-2026-09-11/review/owner-review.html). "전"은 `owner-final-2026-09-11`의 같은 조합을 복사한 것.

| 화면 | 전 | 후 |
|---|---|---|
| 운영 현황 웹 | ![전](evidence/owner-visual-2026-09-11/before/web-overview-1280x842-light.png) | ![후](evidence/owner-visual-2026-09-11/web-overview-1280x842-light.png) |
| 보유 장비 웹 | ![전](evidence/owner-visual-2026-09-11/before/web-fleet-1280x842-light.png) | ![후](evidence/owner-visual-2026-09-11/web-fleet-1280x842-light.png) |
| 호기 상세 웹 | ![전](evidence/owner-visual-2026-09-11/before/web-detail-1280x842-light.png) | ![후](evidence/owner-visual-2026-09-11/web-detail-1280x842-light.png) |
| 이상·점검 웹 | ![전](evidence/owner-visual-2026-09-11/before/web-alerts-1280x842-light.png) | ![후](evidence/owner-visual-2026-09-11/web-alerts-1280x842-light.png) |
| 장비 서류 웹 | ![전](evidence/owner-visual-2026-09-11/before/web-documents-1280x842-light.png) | ![후](evidence/owner-visual-2026-09-11/web-documents-1280x842-light.png) |
| 영상 웹 | ![전](evidence/owner-visual-2026-09-11/before/web-video-1280x842-light.png) | ![후](evidence/owner-visual-2026-09-11/web-video-1280x842-light.png) |
| 진입 웹 | ![전](evidence/owner-visual-2026-09-11/before/web-entry-1280x842-light.png) | ![후](evidence/owner-visual-2026-09-11/web-entry-1280x842-light.png) |
| 운영 현황 PWA | ![전](evidence/owner-visual-2026-09-11/before/pwa-overview-390x800-light.png) | ![후](evidence/owner-visual-2026-09-11/pwa-overview-390x800-light.png) |
| 보유 장비 PWA | ![전](evidence/owner-visual-2026-09-11/before/pwa-fleet-390x800-light.png) | ![후](evidence/owner-visual-2026-09-11/pwa-fleet-390x800-light.png) |
| 호기 상세 PWA | ![전](evidence/owner-visual-2026-09-11/before/pwa-detail-390x800-light.png) | ![후](evidence/owner-visual-2026-09-11/pwa-detail-390x800-light.png) |
| 이상·점검 PWA | ![전](evidence/owner-visual-2026-09-11/before/pwa-alerts-390x800-light.png) | ![후](evidence/owner-visual-2026-09-11/pwa-alerts-390x800-light.png) |
| 장비 서류 PWA | ![전](evidence/owner-visual-2026-09-11/before/pwa-documents-390x800-light.png) | ![후](evidence/owner-visual-2026-09-11/pwa-documents-390x800-light.png) |
| 영상 PWA | ![전](evidence/owner-visual-2026-09-11/before/pwa-video-390x800-light.png) | ![후](evidence/owner-visual-2026-09-11/pwa-video-390x800-light.png) |
| 진입 PWA | ![전](evidence/owner-visual-2026-09-11/before/pwa-entry-390x800-light.png) | ![후](evidence/owner-visual-2026-09-11/pwa-entry-390x800-light.png) |

### 명세와 다르게 한 것

- ContextHeader는 교차 관찰자 대신 스크롤 컨테이너(`[data-owner-scroll]`)의 스크롤 이벤트로 판정한다. 캡처 도구의 `scrollIntoView` 왕복에서 교차 관찰자가 되돌리지 않았다. 축약 바는 compact일 때만 렌더한다(`aria-hidden` 안 포커스 요소 = axe serious).
- Chip 필터는 `role=group` 안 `<button aria-pressed>`(Tabs 미채택 이유 그대로). 영상 재생 버튼은 아이콘 + 텍스트(이름 "재생"/"일시정지" 유지).
- 진입은 C3에서 실제 컴포넌트 미리보기로 만들었다가 사용자 결정(2026-09-12 "랜딩이 아니라 로그인 화면")으로 실제 로그인 폼(아이디·비밀번호·상태 유지·비밀번호 찾기·오류)으로 교체했다(`feat/owner-entry-login`). 인증은 앱의 `ownerLogin`이 `OWNER_DEMO_LOGIN` 데모 계정만 통과시키는 mock이며, e2e·캡처 도구의 진입은 "데모 계정으로 로그인" 버튼을 누른다. 영상 화면의 lucide 아이콘은 ui 재수출(`IconPlay` 등)로 쓴다(video 패키지는 lucide 의존이 없다).
- 캡처 도구 `tools/capture/owner.mjs`의 마커 검사는 뷰별 기대값(현황 5 · 상세 1)이다.
- 320px 폭 캡처 · `color-audit --owner` · 측정 스크립트의 `tools/design/` 이관은 하지 않았다(후속).

### 게이트 기록

| PR | verify | build | owner e2e | capture:owner | 비고 |
|---|---|---|---|---|---|
| C0 `c663db4` | 0 | 0 | 88 passed | 112/112 failed 0 | 설명 문장 58→34 |
| C1 `afae05f` | 생성물 diff(DY-design.md)만 | 0 | 88 passed | 112/112 + overview/fleet 재캡처 | heading 이름에 배지 텍스트가 섞여 1회 실패 → 배지를 제목 밖으로 |
| C2 `7253626` | 생성물 diff만 · ui vitest 4 passed | 0 | 88 passed | detail/alerts 32/32 | axe aria-hidden-focus 1회 실패 → 축약 바 조건 렌더 |
| C3 `5df0683` | 0 | 0 | 88 passed | entry/documents/video 48/48 | Button target/rel · video 아이콘 재수출 |
| C4(이 문서) | — | — | 88(JSON) | 112/112 · owner:check 0 · review 재생성 | 증거 커밋 |

### 남은 것

- 설명 문장 23 → 8: e2e가 단언하는 안내 문장(첨부 · 오프라인 · 파일 확인)을 짧은 라벨로 바꾸려면 테스트 계약을 함께 고쳐야 한다(별도 PR).
- reviewer "머지 가능" 판정 · CI(`baseline` 기준선은 wave ≤ 2 화면만이라 소유주 화면은 비교 대상 아님) · main 병합은 사용자 지시 뒤.
- 부록 B 별도 트랙(다국어 · 해외 규제)은 그대로.

## 부록 A — 측정 스크립트

```python
import re, glob, os
files = sorted(glob.glob('packages/ui/src/owner/*.svelte')) + ['packages/video/src/OwnerVideo.svelte']
for f in files:
    m = re.sub(r'<script[\s\S]*?</script>', '', open(f).read())
    sent = len(re.findall(r'[가-힣]+(요|다|세요|니다|습니다)\.', m))
    dot = m.count(' · ')
    p = len(re.findall(r'<p\b', m))
    border = len(re.findall(r'\bborder\b', m))
    icon = len(re.findall(r'<(?:[A-Z][A-Za-z]+)\s[^>]*aria-hidden', m))
    img = len(re.findall(r'<img\b', m))
    print(os.path.basename(f), sent, dot, p, border, icon, img)
```

## 부록 B — 별도 트랙(이번 범위 아님)

- 다국어 · 로케일 · 시간대: 컴포넌트에 문자열 · 날짜 · 전화 형식을 결합하지 않는 것은 이번 규칙에 포함되지만, 메시지 카탈로그와 `Intl` 포맷터 도입은 INTENT 범위 변경이라 별도 결정이다.
- 해외 출시 규제(장비 등록 · 면허 · 감시 통지 · WCAG 2.2 세부): 서류 스키마와 카메라 고지가 달라지므로 별도 DISC로 다룬다. DISC-052(소유주 확장 화면)의 범위 노트와 DISC-031(마스킹)이 현재 전제다.
