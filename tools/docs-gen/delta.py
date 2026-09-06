# -*- coding: utf-8 -*-
"""delta — 기준선(발행본) 대비 현재 SSOT의 델타표 DELTA.md (ADR-011). 종류별 신규·삭제·개명 ID, DISC 상태 변화, 웨이브·캡처 범위."""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List

from ssot_loader import ROOT, current_ids

KIND_LABEL = {"SCR": "화면", "FR": "기능 요구", "NFR": "비기능 요구", "IF": "인터페이스", "API": "API", "ENT": "엔티티", "DISC": "결정(DISC)"}


def title_of(d: Dict[str, Any], kind: str, id_: str) -> str:
    table = {
        "SCR": (d["screens"]["screens"], "name"),
        "FR": (d["requirements"]["fr"], "title"),
        "NFR": (d["requirements"]["nfr"], "title"),
        "IF": (d["interfaces"]["if"], "protocol"),
        "API": (d["interfaces"]["api"], "name"),
        "ENT": (d["entities"]["ent"], "name"),
        "DISC": (d["decisions"]["disc"], "title"),
    }[kind]
    for x in table[0]:
        if x["id"] == id_:
            return str(x.get(table[1]) or x.get("title") or x.get("name") or "")
    return ""


def compute(d: Dict[str, Any], baseline: Dict[str, Any]) -> Dict[str, Any]:
    cur = current_ids(d)
    base = baseline["ids"]
    legacy = {lc: s["id"] for s in d["screens"]["screens"] for lc in (s.get("legacy_codes") or [])}
    out: Dict[str, Any] = {"kinds": {}, "renamed": [], "disc_decided": [], "disc_reopened": []}
    for k in KIND_LABEL:
        b = set(base.get(k, []))
        c = set(cur[k])
        new = sorted(c - b)
        removed = sorted(b - c)
        if k == "SCR":
            # 변형 코드(legacy_codes)는 부모 state로 흡수 — 삭제가 아니라 개명
            for lc in list(removed):
                if lc in legacy:
                    out["renamed"].append((lc, legacy[lc]))
                    removed.remove(lc)
        out["kinds"][k] = {"new": new, "removed": removed, "base": len(b), "cur": len(c)}
    for x in d["decisions"]["disc"]:
        if x.get("status") == "decided" and x.get("resolved"):
            out["disc_decided"].append(x)
    return out


def render(d: Dict[str, Any], baseline: Dict[str, Any], delta: Dict[str, Any], ver: str, manifest: Dict[str, Any] | None) -> str:
    meta = d["meta"]
    wave = meta["current_wave"]
    screens = d["screens"]["screens"]
    in_wave = [s for s in screens if s["wave"] <= wave]
    later = [s for s in screens if s["wave"] > wave]
    lines: List[str] = []
    lines.append(f"# 문서 세트 델타 — {baseline['version']} → {ver}")
    lines.append("")
    lines.append(f"생성물 — `pnpm docs:set`(`tools/docs-gen/delta.py`) · 원천 `ssot/*.yaml` · 기준선 `tools/docs-gen/baseline/{baseline['version']}.json`({baseline['source']}) · 수기 수정 금지.")
    lines.append("")
    lines.append(f"세트 규칙: 하나가 바뀌면 전부 재발행. {baseline['version']}은 DY 전달분, {ver}는 발행 전 초안(정식 발행·`set_version` 승격은 사용자 승인 후 — ADR-011).")
    lines.append("")
    lines.append("## 1. 식별자 델타")
    lines.append("")
    lines.append("| 종류 | 기준선 | 현재 | 신규 | 삭제·개명 |")
    lines.append("|---|---|---|---|---|")
    for k, lab in KIND_LABEL.items():
        v = delta["kinds"][k]
        rm = len(v["removed"]) + (len(delta["renamed"]) if k == "SCR" else 0)
        lines.append(f"| {lab} | {v['base']} | {v['cur']} | {len(v['new'])} | {rm} |")
    lines.append("")
    for k, lab in KIND_LABEL.items():
        v = delta["kinds"][k]
        if not v["new"] and not v["removed"] and not (k == "SCR" and delta["renamed"]):
            continue
        lines.append(f"### 1.{list(KIND_LABEL).index(k) + 1} {lab}")
        lines.append("")
        if v["new"]:
            lines.append("| 신규 | 이름 | 비고 |")
            lines.append("|---|---|---|")
            for id_ in v["new"]:
                note = ""
                if k == "SCR":
                    s = next(x for x in screens if x["id"] == id_)
                    note = f"{s['surface']} · wave {s['wave']} · `{s['route']}`"
                elif k == "FR":
                    x = next(x for x in d["requirements"]["fr"] if x["id"] == id_)
                    note = f"{x.get('status', '')} · " + " ".join(x.get("screens") or [])
                elif k == "DISC":
                    x = next(x for x in d["decisions"]["disc"] if x["id"] == id_)
                    note = f"{x.get('track', '')} · {x.get('status', '')}"
                lines.append(f"| `{id_}` | {title_of(d, k, id_)} | {note} |")
            lines.append("")
        if k == "SCR" and delta["renamed"]:
            lines.append("| 개명(변형 → 부모 state) | 현재 |")
            lines.append("|---|---|")
            for old, new in delta["renamed"]:
                lines.append(f"| `{old}` | `{new}` |")
            lines.append("")
        if v["removed"]:
            lines.append("| 삭제 |")
            lines.append("|---|")
            for id_ in v["removed"]:
                lines.append(f"| `{id_}` |")
            lines.append("")
    lines.append("## 2. 결정(DISC) 상태 변화")
    lines.append("")
    if delta["disc_decided"]:
        lines.append("| ID | 항목 | 결정 | 일자 · 주체 |")
        lines.append("|---|---|---|---|")
        for x in delta["disc_decided"]:
            r = x["resolved"]
            lines.append(f"| `{x['id']}` | {x['title']} | {r['summary']} | {r['date']} · {r['by']} |")
    else:
        lines.append("확정된 DISC 없음.")
    lines.append("")
    open_n = sum(1 for x in d["decisions"]["disc"] if x.get("status") == "open")
    lines.append(f"미결 {open_n} · 확정 {len(delta['disc_decided'])} (원장 `docs/generated/DECISIONS.md`).")
    lines.append("")
    lines.append("## 3. 설계서 범위 · 캡처")
    lines.append("")
    lines.append(f"- 현재 웨이브 {wave}: 화면 {len(in_wave)}은 앱 캡처(`tools/capture`, 상태 픽스처 전수), 웨이브 {', '.join(sorted({str(s['wave']) for s in later}))} 화면 {len(later)}은 설계서에 메타·추적만 싣고 캡처 없음(2단계).")
    if manifest:
        ok = sum(1 for s in manifest["shots"] if s["ok"] and not s["dark"])
        dark = sum(1 for s in manifest["shots"] if s["ok"] and s["dark"])
        lines.append(f"- 캡처 매니페스트: 라이트 {ok} · 다크 {dark} · 실패 {sum(1 for s in manifest['shots'] if not s['ok'])} · DPR {manifest['dpr']} (`shots/manifest.json`).")
    else:
        lines.append("- 캡처 매니페스트 없음 — `pnpm build && pnpm capture --dark --strict` 뒤 재생성.")
    lines.append("")
    lines.append("## 4. 세트 개정 이력(원천 `ssot/meta.yaml history`)")
    lines.append("")
    lines.append("| 버전 | 일자 | 요약 |")
    lines.append("|---|---|---|")
    for h in meta["history"][-3:]:
        lines.append(f"| {h['version']} | {h['date']} | {h['summary']} |")
    lines.append(f"| {ver} | (초안) | 앱 캡처 기반 설계서 · 부품 생애주기(ENT-16~18) · 이벤트 복기(ENT-19) · 신청(ENT-20) · 오프라인 큐(FR-037) · DISC 7건 기준안 확정 — 발행 시 history에 추가 |")
    lines.append("")
    return "\n".join(lines)


def build_delta(d: Dict[str, Any], ver: str, baseline_ver: str, manifest: Dict[str, Any] | None) -> str:
    baseline = json.loads((ROOT / "tools" / "docs-gen" / "baseline" / f"{baseline_ver}.json").read_text(encoding="utf-8"))
    return render(d, baseline, compute(d, baseline), ver, manifest)
