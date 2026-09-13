# 소유주 실행 작업

각 OD의 순서·선행·수정 범위·DoD는 [승인 계획](../../docs/plans/owner-demo-implementation-plan.md) §6을 따른다. 진행 상태와 최종 통과 여부는 [실행 기록](../../docs/plans/owner-demo-execution.md)의 증거 원장에서 관리한다. 아래는 각 작업의 필수 검사 목록이며 실행 결과를 대신하지 않는다.

- OD-00~01 원천·명세: ssot:check, check --specs, ssot:build; Refs: SCR-B1-09 FR-025
- OD-02~04 데이터·검증 도구·공통 패턴: unit, check, tokens:check/lint, verify; Refs: SCR-B1-09 FR-024
- OD-05~11 화면: build, verify, 해당 owner e2e·폭/상태 캡처·육안 확인; Refs: SCR-B1-02 FR-025
- OD-12 문서: owner source/capture 정합, PDF 전페이지 렌더 확인; Refs: SCR-B1-05 FR-016
- OD-13~14 통합: 전체 e2e·strict capture·디자인/스코프/접근성·독립 reviewer. 고객 확인/배포는 별도 상태. Refs: SCR-B1-02 FR-024
