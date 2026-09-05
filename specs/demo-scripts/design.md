# demo-scripts — 설계

## 데이터
- 장면 정의 원천: `ssot/scenarios.yaml demo[]` → `packages/domain/src/generated/ssot.json scenarios.demo`(scene · title · screens · steps · fixture{account,…}). 코드는 ssot.json을 읽고 손 목록을 만들지 않는다.
- `packages/mock/src/demo.ts`
  - `SCENES`: ssot.json에서 파생 — `{ scene, title, screens, account, entry }`(entry = 첫 화면 라우트; W1 밖 화면이면 자리 화면 라우트 그대로).
  - `SCENE_FIXTURES: Record<number, Fixture>` — 4: `acceptCase('C-105', 'control01')` 적용 · 5: 4 + `callMaintenance` · 6: CPB-004 방치 업무 `createdAt = now − 55min`, 에스컬레이션 0.
  - `createDemoTimeline(scene, api, clock)`: 장면 1만 타임라인(6초 뒤 E-021 긴급 알림 + `db.devices[CPB-003].status = 'fault'`) — realtime mock의 SCRIPT 첫 항목을 장면 1 전용 알림으로 교체하는 대신 `createMockRealtime({ script })`에 장면 스크립트를 주입한다.
  - `jumpHour()`: `clock.jump(H)` + `invalidateAll()` 트리거(장면 6).
- `bootMock` 키: `scene|N`(live). `optionsFromUrl`이 `?scene=`을 읽어 `MockOptions.scene`으로 넘긴다. 장면이 있으면 `applyState`를 건너뛰고 `SCENE_FIXTURES[N]`을 적용한다. 활성 장면은 모듈 상태(`activeScene()`)로 기억해 앱 내 이동(쿼리 없음)에서도 같은 키를 쓴다 — `?state=`·`?capture=`·`resetMock()`이 해제, 새로고침은 리셋.

## 세션
- `?scene=N`은 `demo[].fixture.account`의 계정으로 `login()`한다(localStorage 저장 — 앱 내 이동·새로고침에서도 계정 유지). 그 계정에 진입 화면 권한이 없으면(장면 6 hq01 → B1-04) 화면 첫 역할의 데모 계정으로 로그인한다. 이미 다른 계정이면 장면 계정으로 바꾼다. `?capture=1`과 같은 가드 우회이며 W3 실 인증 전에 함께 제거한다(QA §3).

## 컴포넌트 · 토큰
- `DemoBar`(신규, 카탈로그 등록 `packages/tokens/src/components.json`): 셸 하단 고정 바 — "장면 N/10 · 제목" · 이전/다음(`Button variant="ghost" size="sm"`) · 장면 6에만 "1시간 경과"(`Button variant="outline" size="sm"`). 토큰: `bg-surface border-border-subtle text-body-sm text-fg-muted`. 웹 `WebShell` footer 스니펫 아래 · PWA `PwaShell` sheet 슬롯 위. `data-demo-bar`.
- 자리 화면(`[...rest]`)은 그대로(웨이브 표시).

## 라우트 · 쿼리
- `?scene=N` 유지: 장면 바의 링크는 이웃 장면의 `entry + ?scene=M`. 같은 장면 안의 화면 이동(A1-02 → A1-03)은 앱 링크 그대로 — `bootMock` 캐시 키가 `scene|N`이라 db가 유지된다.
- 장면 바 링크는 `resolve()`로 감싼다(no-navigation-without-resolve).

## 오류 · 빈 상태
- 없는 장면(`?scene=11`)은 무시(장면 바 없음). 장면 계정이 없으면 로그인으로.

## 접근성
- 장면 바 `role="region" aria-label="시연 장면"`, 버튼은 텍스트 라벨. 하단 바가 PWA 하단 내비를 가리지 않도록 내비 위에 둔다(safe-area).

## 테스트
- `tests/e2e/web-demo.spec.ts`: 장면 1(AC-1) · 4(AC-4) · 6(AC-5) · 8(AC-6) · 장면 바(AC-7, 이전/다음 · 계정 전환).
- `tests/e2e/pwa-demo.spec.ts`: 장면 2(AC-2) · 3(AC-3) · 5·7 자리 화면(AC-7).
- 단위(`packages/mock/src/demo.test.ts`): SCENES가 ssot.json demo 10개와 일치 · SCENE_FIXTURES 4·5·6 결과(C-105 in-progress · 정비 호출 이력 · CPB-004 55분).

## 열린 질문
- DISC-017(시연 일정·장비): 장면 1 타임라인 간격(6초)은 리허설에서 조정.
