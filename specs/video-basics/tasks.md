# video-basics — 작업 (W1)

| # | 작업 | DoD | Refs |
|---|---|---|---|
| 1 | `packages/domain` `profile.ts` 플래그 + camera 상태기계 테스트 · `MediaSource` 인터페이스 | Vitest `[FR-005]` `[FR-034]` | ADR-002 FR-005 FR-034 |
| 2 | video: `VideoPlayer`(스냅샷 폴링 내장) · `BboxOverlay` · `HealthBadge` · 루프 MP4 2 + 스냅샷 자산 · mock `MediaSource` | 타일/플레이어 데모 렌더 · `tokens:lint` 0건 · 자산 ≤ 2MB | FR-004 |
| 3 | B1-02M 완성(라이브/스냅샷 토글 · 프로파일별 소스 탭 · 헬스 오버레이 · bbox) + 월 다크 강제 | AC-4 · AC-5 · control-dashboard AC-5 · AC-7 · `b1-02m-cam.png` | B1-02M FR-004 FR-005 FR-034 |
| 4 | A1-04 현장 모니터 + 바디캠 탭 자리 | AC-1 · AC-6 · `a1-04-monitor.png` | A1-04 FR-004 FR-034 FR-030 |
| 5 | A1-05 장비 상세(텔레메트리 · 소모품 · 서류 · 저장 영상 목록) | AC-3 · `a1-05-dev.png` | A1-05 FR-002 FR-007 FR-016 FR-005 |
| 6 | realtime camera/AI 이벤트 → 타일 · 알림 | AC-2 · e2e | FR-028 |
| 7 | e2e(타일 상태 · 모달 소스 탭 · 헬스 "정상" 금지) · axe · 시각 회귀 기준선 3장 | AC-7 · 게이트 6 녹색 | QA |

순서 1 → 2 → 3 → 4 → 5 → 6 → 7. 커밋 예: `feat(video): VideoPlayer · 스냅샷 폴러 — Refs: SCR-B1-02M FR-004`.
