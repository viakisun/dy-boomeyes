대상: A1 현장 안전관리자 · A2 운전자 · A3 본사 · A4 사업주(2단계). 기본 모드 light/comfortable, 시스템 다크 따름.

**참조에서 취한 것(Crane Eyes)**: 375~430 프레임·좌우 20, AppBar 56 · BottomNav 56, 카드 규칙(패딩 20 · 배지→제목 8 · 제목→설명 2 · 설명→필드 16 · 필드 2열 · 라벨→값 2 · 버튼 위 16), 상태 배너(success 계열 테두리+아이콘), 큰 CTA(solid, 높이 48~56), 하단 시트, 계기 화면의 큰 수치.

1. **셸.** `PwaShell` = AppBar(뒤로·제목·우측 1~2 액션) + Content(좌우 `page.gutter` 20) + BottomNav(역할별 3~5 항목, safe-area) + Sheet host + 오프라인 Banner.
2. **한 화면 한 목적.** 홈은 오늘 할 일(출근·점검·업무)·현장 상태 배너·크레인/CPB 카드 순. 상세는 새 화면(push), 선택·확인은 `BottomSheet`.
3. **터치.** 컨트롤 md 48 · 최소 44 · 행 56. 파괴 동작은 시트에서 2단계 확인. 장갑 사용을 전제로 스와이프 제스처에 기능을 숨기지 않는다.
4. **텍스트.** heading-xl(24) 화면 제목 · body-md(16) 본문 · label-lg(14) 버튼 · label-sm(12) 하단 내비. 12 미만 금지. 햇빛 대비: 본문 fg.default(7:1↑).
5. **상태.** 장비 상태는 `EquipmentCard` 상단 점+필, 카드 테두리는 바꾸지 않는다. 위험 알림은 `Banner`(danger) + 진동 + 전화 CTA(Crane Eyes 위험 알림 패턴).
6. **오프라인.** 체크인·일일점검·서류 업로드는 큐에 저장 후 상단 Banner(neutral)로 "동기 대기 n건". 실패는 danger Banner + 재시도.
7. **카메라·영상.** `CameraTile` 16:9, 라이브는 `video.live` 점 + "LIVE", 스냅샷 모드는 갱신 시각. 재생은 `VideoPlayer`(bbox 오버레이).
8. **다크.** 시스템 설정을 따르되 강제하지 않는다. 계기·모니터링 화면도 토큰만 바꾸면 되므로 별도 디자인 없음.
9. **동의·개인정보.** 바디캠·촬영 동의는 `BodycamSessionCard`의 동의 배지와 `Dialog`(명시 동의). 마스킹은 `ShowcaseOverlay`.
10. **설치·복귀.** 홈 화면 추가 안내는 로그인 후 1회 Banner. 앱 복귀 시 마지막 탭 복원, 푸시 딥링크는 해당 상세로.
