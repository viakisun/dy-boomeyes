# 소유주 데모 설계

- Session에 바인딩한 OwnerApi를 앱 조립 지점에서 주입한다. ownerId 결측·다른 역할은 fail closed. API의 개별 장비/서류/영상/알림 ID도 소유 검사한다. 응답은 structuredClone, 첨부 입력은 snapshot을 사용한다. domain은 타입·집계, mock은 세트·상태·미디어 원천, ui는 순수 표시, 앱은 합성·라우팅을 담당한다.
- ENT-01 장비·계약·담당자·서류·카메라·알림의 읽기 모델. 배치(deployed/stored/unknown), 통신(current/stale/unintegrated/detached), 장비 이상과 점검은 독립 축이다. 5대=투입4+보관1, 이상/점검은 겹칠 수 있다. 보관=가용 아님.
- owner A 5대와 B 1대는 별도 세트. fixed clock 기준 측정 시각과 계약 기간을 표시한다. 경계 세트와 120대 성능 세트는 일반 데이터와 분리한다. 시드 세계는 화면 이동 동안 유지한다. capture의 화면 ID는 세계의 cache key가 아니다.
- 공통 패턴은 FleetSummary(큰 숫자 + role=img 분포 막대), EquipmentRow(미디어 · 식별 · 배치 Badge · 조건 StatusPill · 수신 · 계약 D-n, layout columns/stacked), AlertCard(IconTile + 제목 + 메타 행 + 미확인 배지), ContextHeader(스크롤 시 sticky 축약 바), PeriodBar(계약 기간), ContactCard(담당자), IconTile, List, DocumentViewer. cmp/sys 토큰만 소비한다. 카드 9개를 나열하지 않는다. 넓은 화면은 비교 가능한 열(List + 정렬 열 행 — DataTable은 `<table>`이라 `role=list` 계약과 충돌해 쓰지 않는다), 좁은 화면은 모든 중요 정보가 남는 줄바꿈이다. 소유주 화면은 웹도 comfortable 밀도이며, 설명 문장은 빈·오류·오프라인 상태에만 둔다(디자인 언어 규칙: `docs/design/OWNER-VISUAL-LANGUAGE-2026-09-11.md` §3).
- 소유주 셸은 4메뉴. WEB 작은 폭·PWA에도 계약/담당자 상세와 복귀를 유지한다. URL의 q/filter/device/doc/alert/purpose/mode/date 및 기존 capture/state/scene/theme를 보존한다. 복귀는 앱 내부 경로만 허용한다.
- 장비 원문은 호기 식별 가능한 샘플 PDF/이미지. 선택→미리보기→확정 후 브라우저 메모리에 추가한다. 지원 형식 PDF/JPEG/PNG, 최대10MiB. 손상·오프라인·취소는 성공으로 처리하지 않는다. 원문 뷰어 오류와 재시도를 제공한다. 새로고침 초기화 문구를 제품 화면에 표시한다.
- 영상은 목적(타설/설치)과 시간(실시간 예시/가동일 저장)을 분리한다. 안전 감지는 실시간 선택에 넣지 않는다. 기존 MP4 6초 무음 샘플을 재사용하고 실제 길이를 표시한다. 재생 실패·미확보·미장착을 구분한다. 뷰 해제 시 재생·폴링을 정리한다.
- 로딩은 skeleton/aria-busy, 빈 상태는 안내, 오류는 재시도, 오프라인은 마지막 화면과 첨부 불가를 명시한다. 오류를 0대/정상으로 대체하지 않는다.
- 접근성: WEB44/PWA48 터치·토큰 대비·200% 확대·키보드·Esc·포커스 복귀. 캡처 112조합+상태, 일반 세션 과제, 독립 API 스코프/집계 검사.
