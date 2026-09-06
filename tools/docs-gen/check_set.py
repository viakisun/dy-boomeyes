# -*- coding: utf-8 -*-
"""check_set — 문서 세트 정합 검사(ADR-011 · 아카이브 check_set 계승). 실패 시 exit 1.

① 캡처 매니페스트: 현재 웨이브 이하 화면의 기본 상태 라이트 캡처가 ok인가
② 설계서 HTML: 화면 코드 전수 · 문서 번호 · 세트 버전
③ DELTA.md: 기준선 대비 신규 ID 전수 언급
④ MANIFEST.md: 산출물 해시가 실제 파일과 같은가
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

from ssot_loader import ROOT, current_ids, sha256


def check(d: Dict[str, Any], ver: str, out_dir: Path, manifest: Optional[Dict[str, Any]], baseline_ver: str) -> List[str]:
    errs: List[str] = []
    wave = d["meta"]["current_wave"]
    screens = d["screens"]["screens"]
    # ①
    if not manifest:
        errs.append("① shots/manifest.json 없음 — pnpm build && pnpm capture --dark --strict")
    else:
        ok = {(s["code"], s["state"]) for s in manifest["shots"] if s["ok"] and not s["dark"]}
        for s in screens:
            if s["wave"] <= wave and (s["id"], s["default"]) not in ok:
                errs.append(f"① {s['id']} 기본 상태 {s['default']} 캡처 없음/실패")
        if manifest.get("wave", wave) < wave:
            errs.append(f"① 매니페스트 wave {manifest.get('wave')} < 현재 {wave} — 캡처 재실행")
    # ②
    html_path = out_dir / "build" / f"BoomEyes_시스템화면설계서_{ver}.html"
    if not html_path.exists():
        errs.append(f"② 설계서 없음 {html_path.relative_to(ROOT)}")
    else:
        text = html_path.read_text(encoding="utf-8")
        for s in screens:
            if f'id="scr-{s["id"]}"' not in text:
                errs.append(f"② 설계서에 {s['id']} 페이지 없음")
        for needle in (d["meta"]["doc_numbers"]["sdd"], ver):
            if needle not in text:
                errs.append(f"② 설계서에 '{needle}' 없음")
    # ③
    delta_path = out_dir / "DELTA.md"
    if not delta_path.exists():
        errs.append("③ DELTA.md 없음")
    else:
        base = json.loads((ROOT / "tools" / "docs-gen" / "baseline" / f"{baseline_ver}.json").read_text(encoding="utf-8"))["ids"]
        text = delta_path.read_text(encoding="utf-8")
        for k, cur in current_ids(d).items():
            for id_ in sorted(set(cur) - set(base.get(k, []))):
                if f"`{id_}`" not in text:
                    errs.append(f"③ DELTA.md에 신규 {id_} 없음")
    # ④
    man_path = out_dir / "MANIFEST.md"
    if man_path.exists():
        for m in re.finditer(r"^\| `([^`]+)` \| (\d+) \| `([0-9a-f]{12})` \|", man_path.read_text(encoding="utf-8"), re.M):
            f = out_dir / m.group(1)
            if f.exists() and (f.stat().st_size != int(m.group(2)) or sha256(f) != m.group(3)):
                errs.append(f"④ MANIFEST.md 해시 불일치 {m.group(1)}")
    return errs


def main() -> None:
    from ssot_loader import load_shots_manifest, load_ssot

    ver = sys.argv[1] if len(sys.argv) > 1 else None
    d = load_ssot()
    ver = ver or d["meta"]["next_set_version"]
    baseline_ver = sys.argv[2] if len(sys.argv) > 2 else d["meta"]["set_version"]
    errs = check(d, ver, ROOT / "docs" / "set" / ver, load_shots_manifest(), baseline_ver)
    for e in errs:
        print("  ✗", e)
    print(f"{'✗' if errs else '✓'} docs-gen check_set {ver}: errors {len(errs)}")
    sys.exit(1 if errs else 0)


if __name__ == "__main__":
    main()
