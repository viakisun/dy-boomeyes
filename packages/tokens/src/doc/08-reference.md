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
