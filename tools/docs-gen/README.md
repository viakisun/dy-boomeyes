# tools/docs-gen — 계약 문서 세트 생성기 (ADR-011)

원천은 `ssot/*.yaml` · `specs/*/spec.md` frontmatter · `shots/manifest.json`(`pnpm capture`)뿐이다. 파이썬 SSOT 복제 금지.

```
pnpm build && pnpm capture --dark --strict     # shots/manifest.json
pnpm docs:set [--pdf]                           # docs/set/<next_set_version>/{DELTA.md, MANIFEST.md} + build/설계서.html(.pdf)
pnpm docs:check                                 # check_set — ① 캡처 매니페스트 ② 설계서 화면 전수·문서 번호 ③ DELTA 신규 ID 전수 ④ MANIFEST 해시
```

| 파일 | 역할 |
|---|---|
| `ssot_loader.py` | yaml · specs frontmatter · manifest 로더, 종류별 현재 ID |
| `assemble.py` | 시스템·화면 설계서 HTML(표지 → 개요 → 목차 → 기준 1~4 → PART A 앱 · PART B 웹 1화면 1페이지 → 부록) · 조판 CSS는 이 파일 안 |
| `delta.py` | 기준선(`baseline/<ver>.json`) 대비 델타표 DELTA.md |
| `check_set.py` | 정합 검사(exit 1) |
| `build.py` | 오케스트레이터 — `--version`(기본 `meta.next_set_version`) · `--baseline`(기본 `meta.set_version`) · `--pdf` |
| `snapshot_baseline.py` | 발행본 ID 목록을 기준선 JSON으로(아카이브 md에서 1회, 결과는 커밋) |

- 의존성: 파이썬 3.9+ · PyYAML. PDF는 WeasyPrint가 있는 파이썬(`DOCS_GEN_PDF_PYTHON`, 없으면 아카이브 `.venv`)으로만 — macOS는 `DYLD_FALLBACK_LIBRARY_PATH=/opt/homebrew/lib` · Pretendard 글꼴.
- git에는 `DELTA.md` · `MANIFEST.md`만. `build/`(HTML · PDF)는 릴리스 아티팩트(`.gitignore build/`).
- 정식 발행(`set_version` 승격 · `history` 추가 · DY 전달)은 사용자 승인 후 — 이 도구는 하지 않는다.
