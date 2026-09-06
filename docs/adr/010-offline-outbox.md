---
id: ADR-010
title: 오프라인 제출 큐 — IndexedDB 아웃박스 · ApiClient 데코레이터 · 읽기 오버레이
status: Accepted
date: 2026-09-05
supersedes: —
relates_to: [FR-037, NFR-016, IF-009, IF-011, DISC-045, DISC-046]
---

# ADR-010 — 오프라인 제출 큐 (Accepted 2026-09-06 — B12)

## 맥락
INTENT는 체크인·일일점검·서류 업로드를 "큐에 저장 후 동기"로 규정하고 PwaShell 배너도 그렇게 약속하지만, W1 구현은 오프라인이면 버튼을 비활성화할 뿐 큐가 없다(driver-daily AC-6 "전송 큐는 W2"). 서류 사진(Blob)까지 담아야 하고 앱 재시작·오프라인 새로고침(SW 셸)에도 남아야 한다.

## 결정
`packages/offline`(infra 계층)에 IndexedDB 아웃박스와 `withOutbox(api)` 데코레이터를 둔다. 화면은 `ApiClient`를 그대로 호출하고, 데코레이터가 오프라인이면 항목을 적재하고 낙관 결과(`pending`)를 돌려주며, 읽기(`today`·`docs`)에 대기 항목을 오버레이한다. 재전송은 `online` 이벤트·앱 시작·배너 "지금 동기"에서 사용자별 FIFO로, 항목은 클라이언트 ULID를 멱등 키로 실어 보낸다(mock은 seen-map, W3 서버는 `Idempotency-Key`). 충돌: 같은 사용자의 대기 체크인은 교체, 점검은 최신, 서류는 누적. 전송 실패는 백오프 5회 후 사용자 재시도, 업무 거부는 항목 단위 `rejected`. capture 모드는 메모리 저장소 + 재전송 금지. Background Sync는 쓰지 않는다.

## 대안
| 대안 | 왜 아닌가 |
|---|---|
| localStorage | Blob 불가(base64 5MB 한계) · 동기 API |
| SW Background Sync | 정적 SPA에서 인메모리 mock에 닿지 못함 · iOS 미지원 — W3 http에서 가속기로만 재검토 |
| 메모리 큐 | 새로고침·종료에 유실 — INTENT 위반 |

## 결과
- 얻는 것: 화면 코드 무변경으로 오프라인 제출 · W3 http 전환 시 데코레이터 재사용.
- 잃는 것: `Attendance`·`Inspection`·`Doc`에 `pending?` 필드 · 쓰기 4종 시그니처에 `meta{clientId, at}` · 기존 오프라인 e2e 2건 재작성.
- 되돌리려면: 레이아웃 조립 지점의 `withOutbox` 한 줄 제거(패키지는 남음).

## Rules
- [x] 화면은 큐를 직접 호출하지 않는다 — `ApiClient`만.
- [x] 쓰기 API(체크인·체크아웃·점검·서류)는 `meta{clientId, at}`를 받고 같은 `clientId`에 같은 결과를 돌려준다.
- [x] 네트워크 흉내(`?net=off|fail|slow`)는 앱 레이아웃이 해석한다 — `?state=`는 mock 데이터, `?net=`은 전송 조건.
- [x] 큐 상태 문구는 QA §2의 세 가지(오프라인 · 동기 대기 n건 · 전송 실패 n건)만 쓴다.

사용자 결정 필요: 저장소·데코레이터 방식 승인 · 기록 시각 기준(DISC-045)은 DY.

결정(2026-09-06, 사용자): 승인 — IndexedDB 아웃박스 + `withOutbox(api)` 데코레이터. 기록 시각 기준은 DISC-045 기준안(단말 탭 시각) 채택. B12 착수.
