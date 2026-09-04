# ssot — BoomEyes 단일 원천 (구조화 데이터)

계약 문서(SOW·관리대장·설계서), 코드 레지스트리(화면·엔티티·추적), 생성 문서(`docs/generated/*`)는 전부 여기서 생성된다. 손으로 유지하는 카탈로그는 없다.

```
node tools/ssot/check.mjs            # 스키마·ID·유일성·참조·어휘·화면 규칙·DISC 생애주기  → 마지막 줄이 게이트 요약
node tools/ssot/build.mjs            # → packages/domain/src/generated/{ssot.json,ids.ts} · docs/generated/*.md (결정적)
node tools/ssot/check.mjs --specs    # specs/*/spec.md frontmatter·AC
node tools/ssot/check.mjs --docs     # md 링크·ID 실존
```

| 파일 | 축 | ID | 저작 방향 |
|---|---|---|---|
| `meta.yaml` | 세트 버전 · 문서 번호 · 고정 시각 · 단계 · 현재 웨이브 · 일정 · 이력 · 근거 문서 | — | 값 |
| `roles.yaml` | 7역할 · 페르소나 · 데모 계정 | `driver` `site-safety` `hq-safety` `control` `maintenance` `ops-admin` `owner` | 값 |
| `contract.yaml` | 과업 절 `4.3.x/5.3.x` · RFP `RFP-nnn`/`EXT-n` · 산출물 `OUT-nnn` · 검수 `ACC-nnn` · WP `WP-Xn` · 마일스톤 | 계약 축 | rfp·sections → screens[] |
| `requirements.yaml` | `FR-nnn` · `NFR-nnn` | | **FR → screens[]·if[]·acc[]** (역방향 금지) |
| `interfaces.yaml` | `IF-nnn` · `API-nnn` · MQTT 토픽 · 이벤트 · 프로토콜 필드 | | if → screens[] · api → if[] |
| `entities.yaml` | `ENT-nn` · 상태기계(task·doc·equipment·camera·part) · 규칙 · 저장소 · 축적 | | 값 |
| `screens.yaml` | 표면 `A1..B4` · 화면 `A1-03` `B1-02M` | 맨 코드(`SCR-` 접두는 표시용) | **화면 → trace{task,out,rfp,disc,if}** · states · nav · wave |
| `decisions.yaml` | `DISC-nnn` (고객용 미결 원장) | | scope → screens[] · `decided`면 `resolved` 필수 |
| `options.yaml` | 현장 프로파일 옵션 축 `AX-n` · 후보 기종 · 프리셋 | | 값 |
| `glossary.yaml` | 용어 | | 값 (`replaces`로 구 용어 대체) |
| `scenarios.yaml` | 페르소나 · 운영 시나리오 행 · 서술 · 시연 장면 `demo[]` | | ops·demo → screens[] |

## 규칙

- 소문자·숫자·하이픈 세그먼트 · ID는 배열(`" · "` 문자열 금지) · 리스트-오브-맵, `id` 첫 키 · 앵커·멀티독 금지.
- 어휘(영문 enum, 한글 라벨은 build의 라벨 맵): `phase 1|2` · 구현 상태 `reflected|phase2|structure|option|non-screen|documented|not-started|development|check|void` · FR `kind core|proposed|option` · DISC `status open|decided|dropped` + `track A|B|C` · 화면 `wave 0..7`(구현·캡처 여부는 TRACE.md가 계산).
- 화면 `states[].id`는 kebab, `default`는 states 중 하나. 캡처 이름 = `${id.toLowerCase()}-${state}`(`b1-02-cam`). 구 변형 코드(A1-09·A1-10·A2-07·A2-08·A3-07)는 부모의 state + `legacy_codes`. 로그인 샷 4는 `B0-01`.
- 파생값(DISC 범위·건수·커버리지)은 저장하지 않는다. `mgmt:` 슬롯은 관리 열(결정일·결정자·구현 상태 등) 전용.
- ID 채번: 축의 마지막 번호 +1. 결번 재사용 금지. 화면 신설은 표면 내 다음 번호(`A1-12`).
- 되돌리기 어려운 결정 → `docs/adr/`, 범위 변경 → DISC 등록 + spec 변경. DISC = 고객용 미결 원장, ADR = 내부 결정, 둘뿐.

## 원천 이관 (2026-09-05)

`boomeyes/archive/2026-09-05_docset-v0.3/_ref/boomeyes_build/{trace_data,system_data,rtm_source,scenario_data}.py` + `states.json` → `tools/ssot/convert_from_archive.py`(1회). 영상·소모품 운영 검토 v2.0 델타(ENT-16~18 · FR-032~036 · NFR-014/015 · IF-018/019 · API-017/018 · DISC-033~043 · 화면 6 · 용어 · 후보 기종)를 변환 시 함께 넣었다.

아카이브에 남긴 것(계약 문서 생성기 이식 시 함께): `SOW_BLOCKS`(과업지시서 원문 1006 블록) `SOW_UPDATES` `SOW_CHANGES` `PERIOD_CHANGES` `SOW_REVIEW_RESOLVED` `SOW_RFP_MAP` `SOW_CH6_MAP` `CHAPTER_CHIPS` `CH` `READ_GUIDE` `RTM_SHEETS` `SEQ`(화면별 시퀀스) `SVC/SW/NODE_CATALOG` `RACI` `MW_FLOW` `MW_SCOPE` `MSA_PHASES` `PDM_PATH` `SCHEDULE_WEEKS` `COST_ROWS` `VIDEO_STORAGE` `VIA_ROWS` `SEC_INPUTS` `BIZ_BACKGROUND` `BIZ_GOALS`.

변환 함정 기록: 원천의 `08_VIA=16` 하드코딩 · `RTM_SHEETS` 라벨 건수 stale · `VIDEO_OPTIONS` 주석 stale · `BIZ_BACKGROUND`의 `<br>` · 참조 문자열 구분자 혼재(`·`/`,`) · `TRACE[*].if`는 import 시 `IF_MAP` 병합.
