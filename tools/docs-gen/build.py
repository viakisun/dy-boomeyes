# -*- coding: utf-8 -*-
"""build — 문서 세트 초안 생성(`pnpm docs:set`, ADR-011). 로컬 실행 · verify 밖.

  python3 tools/docs-gen/build.py [--version v0.4-draft] [--baseline v0.3] [--pdf]
출력 docs/set/<ver>/: DELTA.md · MANIFEST.md(커밋) · build/BoomEyes_시스템화면설계서_<ver>.html|.pdf(gitignore, 릴리스 아티팩트)
PDF는 WeasyPrint가 있는 파이썬(DOCS_GEN_PDF_PYTHON 또는 아카이브 .venv)으로만 — 없으면 건너뛰고 MANIFEST에 기록한다.
정식 발행(set_version 승격 · history 추가 · DY 전달)은 사용자 승인 후 — 이 스크립트는 하지 않는다.
"""
from __future__ import annotations

import argparse
import os
import subprocess
import sys
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from assemble import build as assemble_html  # noqa: E402
from check_set import check  # noqa: E402
from delta import build_delta  # noqa: E402
from ssot_loader import ROOT, load_shots_manifest, load_specs, load_ssot, sha256  # noqa: E402

ARCHIVE_VENV = ROOT / "archive" / "2026-09-05_docset-v0.3" / "_ref" / "boomeyes_build" / ".venv" / "bin" / "python"


def git_head() -> str:
    try:
        return subprocess.check_output(["git", "rev-parse", "--short", "HEAD"], cwd=ROOT, text=True).strip()
    except Exception:
        return "unknown"


def render_pdf(html_path: Path, pdf_path: Path) -> str:
    py = os.environ.get("DOCS_GEN_PDF_PYTHON") or (str(ARCHIVE_VENV) if ARCHIVE_VENV.exists() else "")
    if not py:
        return "PDF 미생성 — WeasyPrint 파이썬 없음(DOCS_GEN_PDF_PYTHON)"
    env = {**os.environ, "DYLD_FALLBACK_LIBRARY_PATH": os.environ.get("DYLD_FALLBACK_LIBRARY_PATH", "/opt/homebrew/lib")}
    code = f"import weasyprint,sys\nweasyprint.HTML({str(html_path)!r}).write_pdf({str(pdf_path)!r})\nfrom pypdf import PdfReader\nprint(len(PdfReader({str(pdf_path)!r}).pages))"
    r = subprocess.run([py, "-c", code], env=env, capture_output=True, text=True)
    if r.returncode != 0:
        return "PDF 실패 — " + (r.stderr.strip().splitlines() or ["?"])[-1][:160]
    return f"PDF {r.stdout.strip()}쪽"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--version")
    ap.add_argument("--baseline")
    ap.add_argument("--pdf", action="store_true")
    a = ap.parse_args()
    d = load_ssot()
    ver = a.version or d["meta"]["next_set_version"]
    baseline_ver = a.baseline or d["meta"]["set_version"]
    manifest = load_shots_manifest()
    specs = load_specs()
    out = ROOT / "docs" / "set" / ver
    (out / "build").mkdir(parents=True, exist_ok=True)
    html_name = f"BoomEyes_시스템화면설계서_{ver}.html"
    html_path = out / "build" / html_name
    html_path.write_text(assemble_html(d, specs, manifest, ver, "../../../../shots/"), encoding="utf-8")
    (out / "DELTA.md").write_text(build_delta(d, ver, baseline_ver, manifest), encoding="utf-8")
    pdf_note = ""
    pdf_path = out / "build" / html_name.replace(".html", ".pdf")
    if a.pdf:
        pdf_note = render_pdf(html_path, pdf_path)
        print("  ", pdf_note)
    elif pdf_path.exists():
        pdf_path.unlink()  # 이전 실행의 PDF가 표에 남아 문구와 어긋나지 않게 — --pdf 없이는 PDF를 산출하지 않는다
    # MANIFEST.md — 입력·출력 해시 · 캡처 요약 · check_set 결과(발행 승인의 근거)
    inputs = [f"| `ssot/{f}.yaml` | `{sha256(ROOT / 'ssot' / f'{f}.yaml')}` |" for f in ["meta", "roles", "contract", "requirements", "interfaces", "entities", "screens", "decisions", "options", "glossary", "scenarios"]]
    outputs = []
    for f in [html_path, pdf_path, out / "DELTA.md"]:
        if f.exists():
            rel = f.relative_to(out).as_posix()
            outputs.append(f"| `{rel}` | {f.stat().st_size} | `{sha256(f)}` |")
    cap = "없음" if not manifest else f"wave {manifest['wave']} · DPR {manifest['dpr']} · 라이트 {sum(1 for s in manifest['shots'] if s['ok'] and not s['dark'])} · 다크 {sum(1 for s in manifest['shots'] if s['ok'] and s['dark'])} · 실패 {sum(1 for s in manifest['shots'] if not s['ok'])}"
    # 직전 실행의 MANIFEST.md는 해시가 낡았다 — ④는 새 MANIFEST를 쓴 뒤 docs:check가 본다
    old = out / "MANIFEST.md"
    if old.exists():
        old.unlink()
    errs = check(d, ver, out, manifest, baseline_ver)
    lines = [
        f"# 문서 세트 매니페스트 — {ver}",
        "",
        f"생성물 — `pnpm docs:set`(`tools/docs-gen/build.py`) · 커밋 `{git_head()}` · 생성일 {date.today().isoformat()} · 수기 수정 금지.",
        "",
        f"세트 {ver}(초안). 기준선 {baseline_ver}. 문서 번호 {d['meta']['doc_numbers']['sdd']}(설계서) · {d['meta']['doc_numbers']['sow']}(과업지시서, 이번 초안 범위 밖) · {d['meta']['doc_numbers']['rtm']}(관리대장, 범위 밖). PDF·HTML은 git 밖(`build/`, 릴리스 아티팩트) — 아래 해시로 동일성을 확인한다.",
        "",
        "## 입력",
        "",
        "| 파일 | sha256(12) |",
        "|---|---|",
        *inputs,
        f"| `shots/manifest.json` | {cap} |",
        "",
        "## 산출물",
        "",
        "| 파일 | bytes | sha256(12) |",
        "|---|---|---|",
        *outputs,
        "",
        f"PDF: {pdf_note or '미생성(--pdf 없이 실행)'}",
        "",
        "## 정합 검사(check_set)",
        "",
        *([f"- ✗ {e}" for e in errs] or ["- ✓ errors 0"]),
        "",
        "## 발행 조건(사람 게이트)",
        "",
        "- `set_version` 승격 · `ssot/meta.yaml history` 추가 · DY 전달은 사용자 승인 후(ADR-011 · CLAUDE.md). 과업지시서·관리대장·시나리오 생성기는 W3(같은 로더).",
        "",
    ]
    (out / "MANIFEST.md").write_text("\n".join(lines), encoding="utf-8")
    for e in errs:
        print("  ✗", e)
    print(f"{'✗' if errs else '✓'} docs:set {ver}: 설계서 {html_path.stat().st_size // 1024}KB · DELTA.md · MANIFEST.md · check_set errors {len(errs)} → docs/set/{ver}/")
    sys.exit(1 if errs else 0)


if __name__ == "__main__":
    main()
