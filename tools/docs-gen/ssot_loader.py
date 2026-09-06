# -*- coding: utf-8 -*-
"""ssot_loader — ssot/*.yaml · specs/*/spec.md frontmatter · shots/manifest.json 로더 (ADR-011 Rules: 생성기는 이 셋과 docs/generated만 읽는다)

파이썬 SSOT 복제 금지 — 여기서는 파일을 읽어 dict로 돌려줄 뿐, 값을 정의하지 않는다.
"""
from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path
from typing import Any, Dict, List, Optional

import yaml

ROOT = Path(__file__).resolve().parents[2]
SSOT_DIR = ROOT / "ssot"
FILES = ["meta", "roles", "contract", "requirements", "interfaces", "entities", "screens", "decisions", "options", "glossary", "scenarios"]
ID_KINDS = {
    "SCR": re.compile(r"^[AB]\d-\d{2}M?$"),
    "FR": re.compile(r"^FR-\d{3}$"),
    "NFR": re.compile(r"^NFR-\d{3}$"),
    "IF": re.compile(r"^IF-\d{3}$"),
    "API": re.compile(r"^API-\d{3}$"),
    "ENT": re.compile(r"^ENT-\d{2}$"),
    "DISC": re.compile(r"^DISC-\d{3}$"),
}


def load_ssot() -> Dict[str, Any]:
    """tools/ssot/check.mjs loadSSOT()와 같은 11파일을 파일명 키로 읽는다."""
    return {f: yaml.safe_load((SSOT_DIR / f"{f}.yaml").read_text(encoding="utf-8")) for f in FILES}


def load_specs() -> List[Dict[str, Any]]:
    """specs/<feature>/spec.md frontmatter + 수용 기준(AC) 개수."""
    out: List[Dict[str, Any]] = []
    for p in sorted((ROOT / "specs").glob("*/spec.md")):
        text = p.read_text(encoding="utf-8")
        m = re.match(r"^---\n(.*?)\n---\n", text, re.S)
        fm = yaml.safe_load(m.group(1)) if m else {}
        acs = re.findall(r"^- \*\*AC-\d+\*\*", text, re.M)
        out.append({"feature": p.parent.name, "path": p.relative_to(ROOT).as_posix(), "ac": len(acs), **(fm or {})})
    return out


def load_shots_manifest(path: Optional[Path] = None) -> Optional[Dict[str, Any]]:
    """tools/capture가 남긴 shots/manifest.json — 없으면 None(설계서는 캡처 없이도 조립되지만 check_set이 FAIL로 센다)."""
    p = path or (ROOT / "shots" / "manifest.json")
    if not p.exists():
        return None
    return json.loads(p.read_text(encoding="utf-8"))


def sha256(path: Path, n: int = 12) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()[:n]


def current_ids(d: Dict[str, Any]) -> Dict[str, List[str]]:
    """세트 델타·정합 검사가 쓰는 종류별 현재 ID 목록(코드포인트 정렬)."""
    return {
        "SCR": sorted(s["id"] for s in d["screens"]["screens"]),
        "FR": sorted(x["id"] for x in d["requirements"]["fr"]),
        "NFR": sorted(x["id"] for x in d["requirements"]["nfr"]),
        "IF": sorted(x["id"] for x in d["interfaces"]["if"]),
        "API": sorted(x["id"] for x in d["interfaces"]["api"]),
        "ENT": sorted(x["id"] for x in d["entities"]["ent"]),
        "DISC": sorted(x["id"] for x in d["decisions"]["disc"]),
    }
