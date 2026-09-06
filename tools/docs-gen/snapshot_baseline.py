# -*- coding: utf-8 -*-
"""snapshot_baseline — 발행된 세트의 ID 목록을 기준선 JSON으로 저장한다(델타표의 비교 기준).

v0.3 기준선은 아카이브(로컬 · git 제외)의 SSOT 인덱스 md에서 화면 코드를 추출하고, 나머지 종류는
archive/README.md "상태 요약"의 범위(DISC-001~032 · ENT-01~15 · FR-001~031 · IF-001~017 · API-001~016 · NFR-001~013)를 쓴다.
결과 tools/docs-gen/baseline/<ver>.json은 커밋한다 — 아카이브가 없는 환경(CI)에서도 델타를 계산할 수 있게.

  python3 tools/docs-gen/snapshot_baseline.py v0.3 archive/2026-09-05_docset-v0.3/docs/ssot/BoomEyes_SSOT_v0.3.md
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
RANGES_V03 = {"FR": (1, 31, 3), "NFR": (1, 13, 3), "IF": (1, 17, 3), "API": (1, 16, 3), "ENT": (1, 15, 2), "DISC": (1, 32, 3)}


def main() -> None:
    ver = sys.argv[1]
    src = Path(sys.argv[2])
    if not src.is_absolute():
        src = ROOT / src
    text = src.read_text(encoding="utf-8")
    scr = sorted(set(re.findall(r"\b[AB]\d-\d{2}M?\b", text)))
    ids = {k: [f"{k}-{str(i).zfill(w)}" for i in range(a, b + 1)] for k, (a, b, w) in RANGES_V03.items()}
    ids["SCR"] = scr
    out = ROOT / "tools" / "docs-gen" / "baseline" / f"{ver}.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    source = src.relative_to(ROOT).as_posix() if str(src).startswith(str(ROOT)) else "archive/" + src.as_posix().split("/archive/", 1)[-1]
    out.write_text(json.dumps({"version": ver, "source": source, "ids": ids}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"✓ baseline {ver}: " + " · ".join(f"{k} {len(v)}" for k, v in ids.items()) + f" → {out.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
