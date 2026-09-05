# admin-protocol-rules — 기술 설계

## 레이아웃 (WebShell · compact)
- **B4-02 프로토콜 관리**: 상단 `DataTable` 버전 목록(버전 · 운영/테스트 · 필드 수 · 마지막 수신 · 상태) · 인스펙터(선택 버전 필드 표: 이름 · 타입 · 단위 · 필수) · 하단 2패널 — `ProtocolUploader`(`FileUpload` + 검증 결과 `List`: 행 번호 · 사유) · 샘플 테스트(`Tabs` 샘플 3 · `<pre>` JSON(`sys.type.code-md`) · 결과 `Banner` + 발생 알림 미리보기).
- **B4-05 알림 기준**: `Tabs`(알림 기준 · 고장코드 · 시나리오 등급) · `RuleThresholdRow` 목록(인라인 `TextField`/`Select` · 저장 바 · 변경 표시) · `Timeline` 변경 이력. 시나리오 탭의 전도·무동작 행은 잠금 `Badge`("현장 검증 후", DISC-042).

## 컴포넌트 · 토큰
카탈로그: `ProtocolUploader` · `FileUpload` · `RuleThresholdRow` · `DataTable` `Tabs` `Banner` `Badge` `Timeline` `Toast`. JSON 표시는 `<pre>` + `sys.type.code-md`(컴포넌트 아님). 토큰: `cmp.table.*` · `sys.type.code-md` · 결과 = `sys.color.status.*`.

## 데이터 · 로직
- ENT-11 프로토콜 버전(version · kind(운영/테스트) · fields[] · sample · uploadedAt) — 시드는 `ssot interfaces.protocol`(cpb.v0.1 필드·샘플). 규칙 = 알림 8종(kind → severity · roles · threshold) · 고장코드 표(시드 E-0xx) · 시나리오 등급(FR-036, 2단계 표시).
- `packages/domain/protocol.ts`: `validateProtocol(def)`(필수 필드 · 타입 · 단위 — number 타입은 `unit` 필수 · 중복) · `parseSample(def, json)` → `{ ok, errors: [{ path, reason }], alerts: [{ kind, severity }] }`. YAML 파싱은 `yaml` 패키지 — **`apps/web` 런타임 의존**(업로드 화면이 텍스트를 객체로 파싱해 `api.uploadProtocol(def)`에 넘김; domain·PWA 번들에는 싣지 않음, ADR-002 Rules 기록). Vitest `[FR-020]`(QA 게이트 5 "프로토콜 파서").
- mock: `api.protocols()` · `api.uploadProtocol(text)`(검증 후 테스트 버전으로 추가, 저장은 메모리) · `api.testSample(version, json)` · `api.rules()` · `api.saveRules(rules, by)`(이력) · `api.errorCodes()`.

## 라우트 · 쿼리
`/b4/protocols?state=proto` · `/b4/rules?state=rules&tab=alerts|codes|scenarios`.

## 오류 · 빈 상태
업로드 실패 → 결과 패널 danger + 저장 안 함 · 샘플 파싱 오류 → 항목별 사유 · 목록 0 → EmptyState.

## 접근성
파일 입력 라벨 · 결과 영역 `aria-live="polite"` · 편집 셀 키보드 진입/Esc 취소 · 잠금 행 `aria-disabled`.

## 열린 질문
DISC-042(전도·무동작 현장 검증) · DISC-036(알림 수신자·방식) · 프로토콜 버전 정책(운영 1 · 테스트 n · 롤백은 비범위).
