---
id: SPEC-notifications
status: draft
wave: 2
screens: [A1-02, A2-02, A3-02]
fr: [FR-011, FR-010, FR-036]
---
# notifications — PWA 알림(로컬 알림 스텁 · 권한 · 딥링크)

## 목적 · 역할
IF-014(Web Push 딥링크)의 W2 목업: 실시간 mock 이벤트를 서비스 워커 `showNotification`으로 OS 알림에 띄우고 클릭 시 업무로 딥링크한다(ADR-009). 서버 발송·구독은 W3, 채널은 DISC-036. 권한은 사용자 행동(종 아이콘 → 시트)에서만 요청한다.

## 화면
| 코드 | 이름 | 라우트 | 상태 픽스처 |
|---|---|---|---|
| A1-02 | 업무함(알림 권한 시트) | `/a1/inbox` | `push` |
| A2-02 · A3-02 | 오늘 · 현장 목록(본사) | 기존 | 기존 |

## 수용 기준
- **AC-1** Given 알림 권한 `default` When 앱바 종 아이콘 → 시트 "알림 켜기" Then 권한을 요청하고 결과에 따라 시트가 `granted`(켜짐) 또는 `denied`(브라우저 설정 안내) 문구로 바뀐다; 지원하지 않는 환경(iOS 미설치)은 `unsupported` 안내다 [FR-011]
- **AC-2** Given 권한 `granted`와 서비스 워커 활성 When `alert.raised`(IF-010 mock) 도착 Then OS 알림(title = 장비·종류, body = 메시지, tag = caseId)이 생성되고 인앱 배지·토스트도 그대로 동작한다 [FR-011]
- **AC-3** Given OS 알림 When 클릭 Then `/a1/inbox/[case]`(현장) · `/a2/today`(운전자) · `/a3/sites`(본사)로 딥링크되며 로그인이 없으면 로그인 후 복귀한다 — URL 규칙은 `toPushPayload()` 단위 테스트로 고정 [FR-011, FR-010]
- **AC-4** Given 에스컬레이션(B1-04 `escalated` 전이) When 본사 계정 Then A3-02로 딥링크되는 알림이 만들어진다 [FR-010, FR-036]

## 상태 픽스처
`A1-02:push`(권한 시트 열림, `default` 상태). 다른 화면은 별도 상태 없음.

## 비범위
실 Web Push(VAPID·구독 저장·서버 발송, W3+) · 채널(문자·전화, DISC-036) · 시나리오별 등급 편집(FR-036, B4-05) · headless 자동 거부 환경의 OS 알림 클릭(단위 테스트로 대체) · AC-3의 "로그인 없으면 로그인 후 복귀"는 W2 목업에서 도달 불가(로그아웃 세션은 로컬 알림을 만들지 않는다) — W3 실 푸시 도입 시 재검토.
