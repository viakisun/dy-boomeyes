# 소유주 데모 검증·검토안

원천은 `ssot/screens.yaml`의 `owner_demo`와 `specs/owner-experience`다. `current_wave`를 올리지 않고 WEB/PWA의 7개 목적을 명시적으로 검증한다.

```sh
pnpm build
pnpm exec playwright test 'web-owner.*spec.ts' 'pwa-owner.*spec.ts' --reporter=json > /tmp/owner-e2e.json
pnpm capture:owner --output docs/design/evidence/owner-local
pnpm owner:check --captures docs/design/evidence/owner-local/manifest.json --e2e /tmp/owner-e2e.json
```

캡처는 화면·역할·데이터·viewport·theme·소스 해시를 확인한다. `--only` 결과는 부분 증거이며 전체 통과로 판정하지 않는다. 서버를 직접 실행했다면 `--reuse-server`를 사용하고 빌드 변경 후 재시작한다. 캡처 성공과 사람이 확인한 디자인 평가는 별도 기록이다.

PDF 검토안은 Python의 PyYAML, Pillow, reportlab, pypdf와 `pdftoppm`, 한글 TrueType 폰트가 필요하다. 격리한 가상 환경에 설치한다. 기존 전체 계약 문서 생성기는 변경하지 않는다.

```sh
python3 tools/owner/build-review.py --manifest docs/design/evidence/owner-local/manifest.json --render
python3 tools/owner/check-review.py --manifest docs/design/evidence/owner-local/manifest.json --review docs/design/evidence/owner-local/review --require-visual-review
```

각 PDF 페이지를 렌더해 검수하고 생성기의 시각 검수 기록 형식으로 판정을 남긴다. 실제 고객 확인은 별도로 기록한다. 이 명령은 로컬 검토 초안을 생성하며 외부 공개·고객 전달을 수행하지 않는다.

예외·복구 26과제(34장면)와 120대 로컬 성능은 같은 preview 서버를 순서대로 사용한다. 두 명령 모두 서버를 실행/종료하지 않는다.

```sh
node tools/capture/owner-exceptions.mjs --output docs/design/evidence/owner-local/exceptions
node tools/owner/performance.mjs --output docs/design/evidence/owner-local/performance.json
```

전체 E2E JSON도 `owner:check --e2e`에 전달할 수 있다. 현재 테스트 discovery의 소유주 파일을 전수 대조하고 전체 보고서의 실패·skip·flaky도 거부한다. 증거 폴더는 소스 변경 해시에서 제외되며 그 외 소스가 바뀌면 캡처와 문서를 다시 생성해야 한다.
