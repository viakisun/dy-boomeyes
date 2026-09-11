# owner-visual-2026-09-11 — 검증 기록

- 소스: `feat/owner-entry-login` `accecbe`(C0~C3 + 문서 + 크롭 조정 + 진입 로그인 카드) · 작업 트리 clean(manifest `sourceSha`·`workingTreeHash`).
- 캡처: `pnpm capture:owner --output docs/design/evidence/owner-visual-2026-09-11` → 112/112 required · failed 0(라이트·다크 × 웹 4폭 · PWA 4폭 × 7뷰). 첫 실행에서 `pwa-detail-768x1024-light`가 지도 준비 대기 20초 초과로 1회 실패(같은 조합 다크는 통과) → 재실행 통과. 표본 1회라 flaky 판정은 보류.
- e2e: `pnpm exec playwright test 'web-owner.*spec.ts' 'pwa-owner.*spec.ts' --reporter=json` → 88 passed(web 44 · pwa 44, AC-O01~16).
- 정합: `pnpm owner:check --captures …/manifest.json --e2e /tmp/owner-e2e.json` → captures 112 · executed 88 · errors 0.
- 검토안: `tools/owner/build-review.py --render`(격리 venv: PyYAML · Pillow · reportlab · pypdf) → `review/owner-review.{html,pdf}` 14화면 · PDF 18쪽 · 보충 크롭 4(좌표는 `tools/owner/build-review.py` SUPPLEMENTS, 육안 확인) · `check-review.py`: artifact hashes OK.
- `before/`: `owner-final-2026-09-11/review/screens`의 같은 14조합(웹 1280 · PWA 390, 라이트)을 비교용으로 복사.
- 육안: 14장 대표 캡처를 세션에서 확인(주인공 · 설명 문장 0 · 미디어 카드 · comfortable 밀도). 고객 확인은 미실시.
