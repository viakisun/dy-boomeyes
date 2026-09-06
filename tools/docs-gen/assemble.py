# -*- coding: utf-8 -*-
"""assemble — 시스템·화면 설계서(VIA-BE-SDD-001) HTML 조립 (ADR-011 · 아카이브 assemble.py rev7 구조 계승)

구조: 표지 → 문서 정보·개정 이력 → 시스템 개요(단계·역할·표면) → 목차 → 기준 1~4(식별자 · 과업 절 · 결정 원장 · 용어)
      → PART A 앱(PWA) 1화면 1페이지 → PART B 웹 1화면 1페이지 → 부록(FR · IF/API · ENT · 상태기계 · 캡처 매니페스트)
입력: ssot/*.yaml(로더) · specs frontmatter · shots/manifest.json. 스타일은 이 파일 안(조판 자산) — DS 값은 DY-design.md의 앵커를 따른다.
"""
from __future__ import annotations

import html
from pathlib import Path
from typing import Any, Dict, List, Optional

from ssot_loader import ROOT

CSS = """
@page { size: 297mm 210mm; margin: 0; }
:root { --ink:#16232a; --sub:#5c6b6e; --faint:#8fa0a4; --line:#dde3e4; --bg:#f8faff; --card:#fff; --navy:#0d2877; --navy-bg:#e8ecf7; --danger:#b42318; --danger-bg:#fdecea; --ok:#1e7e4a; --warn:#8a5a00; --warn-bg:#fff4d6; }
* { margin:0; padding:0; box-sizing:border-box; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
body { font-family:"Pretendard Variable","Pretendard","Noto Sans CJK KR","Apple SD Gothic Neo",sans-serif; color:var(--ink); background:#d3dadb; font-size:9.5px; line-height:1.45; }
.page { width:297mm; height:210mm; background:#fff; margin:0 auto 6mm; padding:12mm 14mm 14mm; page-break-after:always; position:relative; overflow:hidden; }
@media print { body { background:#fff; } .page { margin:0; } }
.ph { display:flex; align-items:baseline; gap:8px; border-bottom:2px solid var(--navy); padding-bottom:6px; margin-bottom:5mm; }
.ph .no { font-size:9px; color:var(--faint); font-weight:700; letter-spacing:.04em; }
.ph h2 { font-size:16px; font-weight:800; letter-spacing:-.01em; white-space:nowrap; }
.ph .sub { font-size:9.5px; color:var(--sub); margin-left:6px; }
.ph .right { margin-left:auto; font-size:8.5px; color:var(--navy); border:1px solid var(--line); border-radius:3px; padding:2px 7px; white-space:nowrap; }
.foot { position:absolute; bottom:7mm; left:14mm; right:14mm; display:flex; font-size:8px; color:var(--faint); border-top:1px solid var(--line); padding-top:4px; }
.foot .pn { margin-left:auto; font-weight:700; }
.foot .pn::after { content: counter(page); }
h3 { font-size:10.5px; font-weight:800; color:var(--navy); margin:3mm 0 1.5mm; }
p { margin-bottom:1.5mm; }
table { width:100%; border-collapse:collapse; table-layout:fixed; font-size:8.6px; margin-bottom:2.5mm; }
th { background:var(--navy); color:#fff; font-weight:700; text-align:left; padding:3px 6px; font-size:8.2px; }
td { border-bottom:1px solid var(--line); padding:3px 6px; vertical-align:top; word-break:keep-all; overflow-wrap:anywhere; }
tr:nth-child(even) td { background:#fafbfd; }
code, .id { font-family:"JetBrains Mono","SF Mono",Menlo,monospace; font-size:8.2px; background:var(--navy-bg); color:var(--navy); padding:0 3px; border-radius:2px; white-space:nowrap; }
.chips { display:flex; flex-wrap:wrap; gap:3px; margin:1mm 0 2mm; }
.chip { font-size:7.8px; font-weight:700; border:1px solid var(--line); border-radius:999px; padding:1px 6px; color:var(--sub); white-space:nowrap; }
.chip.fr { border-color:#b8c3e6; color:var(--navy); background:var(--navy-bg); }
.chip.disc { border-color:#e6c7a5; color:var(--warn); background:var(--warn-bg); }
.chip.disc.decided { border-color:#b7dcc5; color:var(--ok); background:#e9f6ee; }
.cols { display:flex; gap:6mm; }
.col-l { width:96mm; flex:none; }
.col-r { flex:1; min-width:0; display:flex; align-items:flex-start; justify-content:center; }
.shot { max-width:100%; max-height:150mm; border:1px solid var(--line); border-radius:4px; background:#fff; }
.shot.phone { max-height:158mm; }
.thumbs { display:flex; gap:3mm; flex-wrap:wrap; margin-top:2mm; }
.thumb { width:30mm; }
.thumb img { width:100%; border:1px solid var(--line); border-radius:3px; }
.thumb .cap { font-size:7.6px; color:var(--sub); text-align:center; margin-top:1px; }
.empty { border:1px dashed var(--line); border-radius:4px; color:var(--faint); padding:12mm; text-align:center; font-size:9px; width:100%; }
.cover { background:var(--navy); color:#fff; }
.cover .brand { font-size:11px; letter-spacing:.2em; text-transform:uppercase; opacity:.8; margin-top:28mm; }
.cover h1 { font-size:34px; font-weight:800; letter-spacing:-.02em; margin:6mm 0 3mm; line-height:1.15; }
.cover .ver { font-size:14px; opacity:.9; }
.cover .meta { position:absolute; bottom:18mm; left:14mm; right:14mm; display:flex; gap:12mm; font-size:9.5px; opacity:.85; }
.cover .meta b { display:block; font-size:8px; opacity:.7; text-transform:uppercase; letter-spacing:.1em; margin-bottom:1px; }
.divider { background:var(--navy-bg); }
.divider h1 { font-size:28px; font-weight:800; color:var(--navy); margin-top:60mm; }
.divider p { font-size:11px; color:var(--sub); max-width:170mm; }
.toc { columns:3; column-gap:8mm; font-size:8.6px; }
.toc a { color:var(--ink); text-decoration:none; display:flex; gap:4px; padding:1.5px 0; border-bottom:1px dotted var(--line); }
.toc a::after { content: target-counter(attr(href url), page); margin-left:auto; color:var(--faint); }
.toc .grp { font-weight:800; color:var(--navy); margin:2mm 0 1mm; break-after:avoid; }
.kv { display:grid; grid-template-columns:22mm 1fr; gap:1px 6px; font-size:8.8px; margin-bottom:2mm; }
.kv b { color:var(--sub); font-weight:600; }
.note { font-size:8.4px; color:var(--sub); }
.two { columns:2; column-gap:8mm; }
"""

SURFACE_ORDER = ["A1", "A2", "A3", "A4", "B0", "B1", "B2", "B3", "B4"]


def esc(x: Any) -> str:
    return html.escape("" if x is None else str(x), quote=True)


def chips(items: List[str], cls: str = "") -> str:
    return '<div class="chips">' + "".join(f'<span class="chip {cls}">{esc(i)}</span>' for i in items) + "</div>" if items else ""


def tbl(head: List[str], rows: List[List[Any]], widths: Optional[List[str]] = None) -> str:
    colg = "".join(f'<col style="width:{w}">' for w in widths) if widths else ""
    h = "".join(f"<th>{esc(x)}</th>" for x in head)
    b = "".join("<tr>" + "".join(f"<td>{x if isinstance(x, Html) else esc(x)}</td>" for x in r) + "</tr>" for r in rows)
    return f"<table><colgroup>{colg}</colgroup><thead><tr>{h}</tr></thead><tbody>{b}</tbody></table>"


class Html(str):
    """이미 이스케이프된 HTML 조각."""


def page(body: str, no: str, title: str, sub: str = "", right: str = "", cls: str = "", anchor: str = "", foot: str = "") -> str:
    head = "" if cls in ("cover", "divider") else (
        f'<div class="ph"><span class="no">{esc(no)}</span><h2>{esc(title)}</h2>'
        + (f'<span class="sub">{esc(sub)}</span>' if sub else "")
        + (f'<span class="right">{esc(right)}</span>' if right else "")
        + "</div>"
    )
    idattr = f' id="{esc(anchor)}"' if anchor else ""
    return f'<section class="page {cls}"{idattr}>{head}{body}<div class="foot"><span>{esc(foot)}</span><span class="pn"></span></div></section>'


def build(d: Dict[str, Any], specs: List[Dict[str, Any]], manifest: Optional[Dict[str, Any]], ver: str, shots_rel: str) -> str:
    meta = d["meta"]
    prog = meta["program"]
    docno = meta["doc_numbers"]["sdd"]
    wave = meta["current_wave"]
    surfaces = {s["id"]: s for s in d["screens"]["surfaces"]}
    screens = sorted(d["screens"]["screens"], key=lambda s: (SURFACE_ORDER.index(s["surface"]), s["id"]))
    roles = {r["id"]: r for r in d["roles"]["roles"]}
    sections = {s["id"]: s for s in d["contract"]["sections"]}
    outputs = {o["id"]: o for o in d["contract"].get("outputs", [])}
    discs = {x["id"]: x for x in d["decisions"]["disc"]}
    frs = d["requirements"]["fr"]
    ifs = d["interfaces"]["if"]
    fr_by_scr: Dict[str, List[Dict[str, Any]]] = {}
    for x in frs:
        for c in x.get("screens") or []:
            fr_by_scr.setdefault(c, []).append(x)
    if_by_scr: Dict[str, List[str]] = {}
    for x in ifs:
        for c in x.get("screens") or []:
            if_by_scr.setdefault(c, []).append(x["id"])
    disc_by_scr: Dict[str, List[str]] = {}
    for x in d["decisions"]["disc"]:
        for c in x.get("scope") or []:
            disc_by_scr.setdefault(c, []).append(x["id"])
    spec_by_scr: Dict[str, List[Dict[str, Any]]] = {}
    for sp in specs:
        for c in sp.get("screens") or []:
            spec_by_scr.setdefault(c, []).append(sp)
    shots: Dict[str, Dict[str, Any]] = {}
    if manifest:
        for s in manifest["shots"]:
            if s["ok"] and not s["dark"]:
                shots[f"{s['code']}:{s['state']}"] = s
    foot = f"{prog['name']} · {docno} · {ver} · {prog['vendor']} → {prog['owner']}"
    pages: List[str] = []

    # 표지
    pages.append(page(
        f'<div class="brand">{esc(prog["vendor"])} · {esc(prog["owner"])}</div><h1>{esc(prog["name"])}<br>CPB 관제 시스템<br>시스템·화면 설계서</h1>'
        f'<div class="ver">{esc(docno)} · 세트 {esc(ver)} · 현재 웨이브 {wave}</div>'
        f'<div class="meta"><div><b>문서 번호</b>{esc(docno)}</div><div><b>세트 버전</b>{esc(ver)}(초안 · 발행 전)</div><div><b>기준 시각</b>{esc(meta["fixed_clock"])} (DemoClock)</div><div><b>생성</b>tools/docs-gen · ssot/*.yaml · shots/manifest.json</div></div>',
        "", "", cls="cover", anchor="cover", foot=foot))

    # 문서 정보 · 개정 이력
    hist = tbl(["버전", "일자", "요약"], [[h["version"], h["date"], h["summary"]] for h in meta["history"]] + [[ver, "(초안)", "앱 캡처 기반 설계서 — 발행 시 history에 추가"]], ["18mm", "22mm", "auto"])
    basis = tbl(["구분", "문서", "버전", "역할"], [[b["kind"], b["title"], b["version"], b["role"]] for b in meta.get("basis_docs", [])], ["24mm", "60mm", "24mm", "auto"])
    pages.append(page(f'<div class="cols"><div style="width:50%"><h3>개정 이력</h3>{hist}</div><div style="width:50%"><h3>근거 문서</h3>{basis}</div></div>', "0.1", "문서 정보", "문서 번호 · 세트 버전 · 개정 이력 · 근거 문서", anchor="docinfo", foot=foot))

    # 시스템 개요
    ph = tbl(["단계", "기간", "비고"], [[f"{p['id']}단계 {p['name']}", f"{p['start']} ~ {p['end']}", p.get("note", "")] for p in meta["phases"]], ["24mm", "40mm", "auto"])
    sched = tbl(["마일스톤", "시점", "기준"], [[m["milestone"], m["when"], m["criterion"]] for m in meta.get("schedule", [])], ["50mm", "30mm", "auto"])
    rl = tbl(["역할", "이름", "소속", "표면", "요약"], [[r["id"], r.get("name", ""), r.get("org", ""), " ".join(r.get("surfaces") or []), r.get("summary", "")] for r in d["roles"]["roles"]], ["20mm", "24mm", "22mm", "14mm", "auto"])
    sf_rows = []
    for sid in SURFACE_ORDER:
        if sid not in surfaces:
            continue
        ss = [s for s in screens if s["surface"] == sid]
        sf_rows.append([sid, surfaces[sid]["name"], surfaces[sid]["app"], len(ss), " ".join(s["id"] for s in ss)])
    sf = tbl(["표면", "이름", "앱", "화면", "코드"], sf_rows, ["12mm", "40mm", "10mm", "10mm", "auto"])
    pages.append(page(f'<div class="cols"><div style="width:48%"><h3>단계</h3>{ph}<h3>일정</h3>{sched}</div><div style="width:52%"><h3>역할</h3>{rl}<h3>표면 · 화면</h3>{sf}</div></div>', "0.2", "시스템 개요", f"{prog['name']} · 1단계 데이터 인입 · 2단계 운영형 고도화", anchor="overview", foot=foot))

    # 목차
    toc = ['<div class="toc">']
    toc.append('<div class="grp">0. 개요 · 기준</div>')
    for a, t in [("docinfo", "0.1 문서 정보"), ("overview", "0.2 시스템 개요"), ("ids", "1. 식별자 체계"), ("tasks", "2. 과업 절 · 산출물"), ("disc", "3. 결정 원장"), ("glossary", "4. 용어")]:
        toc.append(f'<a href="#{a}"><span>{esc(t)}</span></a>')
    for sid in SURFACE_ORDER:
        if sid not in surfaces:
            continue
        toc.append(f'<div class="grp">{esc(sid)} {esc(surfaces[sid]["name"])}</div>')
        for s in screens:
            if s["surface"] == sid:
                toc.append(f'<a href="#scr-{esc(s["id"])}"><span class="id">{esc(s["id"])}</span><span>{esc(s["name"])}</span></a>')
    toc.append('<div class="grp">부록</div>')
    for a, t in [("fr", "A. 기능 요구(FR)"), ("ifapi", "B. 인터페이스(IF) · API"), ("ent", "C. 엔티티(ENT) · 상태기계"), ("shots", "D. 캡처 매니페스트")]:
        toc.append(f'<a href="#{a}"><span>{esc(t)}</span></a>')
    toc.append("</div>")
    pages.append(page("".join(toc), "0.3", "목차", f"화면 {len(screens)} · 1화면 1페이지", anchor="toc", foot=foot))

    # 기준 1 식별자
    kinds = [["SCR", "화면", len(screens), "ssot/screens.yaml · 라우트 루트 data-scr"], ["FR / NFR", "기능 · 비기능 요구", f"{len(frs)} / {len(d['requirements']['nfr'])}", "requirements.yaml"], ["IF / API", "인터페이스 · API", f"{len(ifs)} / {len(d['interfaces']['api'])}", "interfaces.yaml"], ["ENT", "엔티티", len(d["entities"]["ent"]), "entities.yaml · 상태기계 machines"], ["DISC", "결정(고객 원장)", len(discs), "decisions.yaml · open/decided/dropped"], ["OUT / ACC / WP", "산출물 · 검수 · 작업 분해", f"{len(outputs)} / {len(d['contract'].get('acceptance', []))} / {len(d['contract'].get('wp', []))}", "contract.yaml"]]
    pages.append(page("<p>식별자는 전 문서(과업지시서 · 개발관리대장 · 설계서 · 코드 · 테스트 · 커밋)에서 같은 값으로 쓰인다. 원천은 <code>ssot/*.yaml</code>이며 코드 상수(<code>ids.ts</code>)·이 문서·추적표는 생성물이다.</p>" + tbl(["종류", "뜻", "수", "원천"], kinds, ["26mm", "44mm", "20mm", "auto"]), "1", "식별자 체계", "SCR · FR/NFR · IF/API · ENT · DISC · OUT/ACC/WP", anchor="ids", foot=foot))

    # 기준 2 과업 절 · 산출물
    rows = []
    for sec in d["contract"]["sections"]:
        items = sec.get("items") or []
        rows.append([sec["id"], sec["name"], f"{sec.get('phase', '')}단계", len(items), " ".join(sorted({c for it in items for c in (it.get("screens") or [])}))])
    outs = [[o["id"], o.get("name", ""), o.get("phase", ""), " ".join(o.get("screens") or [])] for o in d["contract"].get("outputs", [])]
    pages.append(page(f'<div class="cols"><div style="width:52%"><h3>과업 절</h3>{tbl(["절", "이름", "단계", "항목", "화면"], rows, ["12mm", "40mm", "12mm", "10mm", "auto"])}</div><div style="width:48%"><h3>산출물(OUT)</h3>{tbl(["OUT", "이름", "단계", "화면"], outs, ["16mm", "50mm", "12mm", "auto"])}</div></div>', "2", "과업 절 · 산출물", "contract.yaml sections · outputs", anchor="tasks", foot=foot))

    # 기준 3 결정 원장 (2쪽 분할)
    disc_rows = [[x["id"], x["title"], x.get("track", ""), {"open": "미결", "decided": "확정", "dropped": "철회"}.get(x.get("status"), x.get("status")), (x["resolved"]["summary"] if x.get("resolved") else x.get("baseline", ""))] for x in d["decisions"]["disc"]]
    half = (len(disc_rows) + 1) // 2
    for i, part in enumerate([disc_rows[:half], disc_rows[half:]]):
        pages.append(page(tbl(["ID", "항목", "트랙", "상태", "기준안 · 결정"], part, ["16mm", "56mm", "10mm", "10mm", "auto"]), f"3.{i + 1}", "결정 원장(DISC)", "확정은 결정 내용 · 미결은 기준안(DY 확정 전 진행 기준)", anchor="disc" if i == 0 else "", foot=foot))

    # 기준 4 용어
    terms = [[t["term"], t["definition"]] for t in d["glossary"]["terms"]]
    pages.append(page(f'<div class="two">{tbl(["용어", "정의"], terms, ["28mm", "auto"])}</div>', "4", "용어", "glossary.yaml", anchor="glossary", foot=foot))

    # PART A/B
    def screen_page(s: Dict[str, Any], idx: int) -> str:
        sid = s["id"]
        app = surfaces[s["surface"]]["app"]
        phone = app == "pwa"
        role_names = [roles.get(r, {}).get("name", r) for r in s.get("roles") or []]
        kv = [("표면", f"{s['surface']} {surfaces[s['surface']]['name']} ({app})"), ("라우트", Html(f"<code>{esc(s['route'])}</code>")), ("역할", " · ".join(role_names)), ("단계 · 웨이브", f"{s.get('phase', '')}단계 · wave {s['wave']}")]
        tr = s.get("trace") or {}
        task_names = [f"{t} {sections.get(t, {}).get('name', '')}".strip() for t in tr.get("task") or []]
        if task_names:
            kv.append(("과업 절", " · ".join(task_names)))
        if tr.get("out"):
            kv.append(("산출물", f"{tr['out']} {outputs.get(tr['out'], {}).get('name', '')}".strip()))
        if tr.get("rfp"):
            kv.append(("RFP", " ".join(tr["rfp"])))
        sp = spec_by_scr.get(sid, [])
        if sp:
            kv.append(("spec", " · ".join(f"{x['feature']}(AC {x['ac']})" for x in sp)))
        kvh = '<div class="kv">' + "".join(f"<b>{esc(k)}</b><span>{v if isinstance(v, Html) else esc(v)}</span>" for k, v in kv) + "</div>"
        frl = fr_by_scr.get(sid, [])
        frh = "<h3>기능 요구</h3>" + tbl(["FR", "제목", "상태"], [[x["id"], x["title"], x.get("status", "")] for x in frl], ["14mm", "auto", "16mm"]) if frl else ""
        disc_ids = sorted(set((tr.get("disc") or []) + disc_by_scr.get(sid, [])))
        dh = chips([f"{x} {'✓' if discs.get(x, {}).get('status') == 'decided' else ''}".strip() for x in disc_ids], "disc") if disc_ids else ""
        ifh = chips(if_by_scr.get(sid, []), "") if if_by_scr.get(sid) else ""
        states = tbl(["상태", "설명", "캡처"], [[st["id"], st.get("name", ""), "○" if f"{sid}:{st['id']}" in shots else "—"] for st in s.get("states") or []], ["20mm", "auto", "12mm"])
        nav = " · ".join(f"{n['to']}({n['label']})" for n in s.get("nav") or [])
        navh = f'<p class="note">이동: {esc(nav)}</p>' if nav else ""
        left = kvh + (f"<h3>인터페이스 · 결정</h3>{ifh}{dh}" if (ifh or dh) else "") + frh + "<h3>상태 픽스처</h3>" + states + navh
        main = shots.get(f"{sid}:{s['default']}")
        if main:
            right = f'<img class="shot{" phone" if phone else ""}" src="{esc(shots_rel + main["file"])}" alt="{esc(sid)} {esc(s["default"])}">'
        elif s["wave"] > wave:
            right = f'<div class="empty">캡처 없음 — 웨이브 {s["wave"]}(2단계)에서 구현. 구조·추적만 확정.</div>'
        else:
            right = '<div class="empty">캡처 없음 — shots/manifest.json에 기본 상태가 없다(check_set FAIL)</div>'
        thumbs = [st for st in s.get("states") or [] if st["id"] != s["default"] and f"{sid}:{st['id']}" in shots]
        th = ""
        if thumbs:
            parts = []
            for st in thumbs:
                src = shots_rel + shots[f"{sid}:{st['id']}"]["file"]
                parts.append('<div class="thumb"><img src="' + esc(src) + '" alt="' + esc(st["id"]) + '"><div class="cap">' + esc(st["id"]) + ' · ' + esc(st.get("name", "")) + "</div></div>")
            th = '<div class="thumbs">' + "".join(parts) + "</div>"
        body = f'<div class="cols"><div class="col-l">{left}</div><div class="col-r"><div>{right}{th}</div></div></div>'
        part = "A" if phone else "B"
        return page(body, f"{part}.{idx}", f"{sid} {s['name']}", surfaces[s["surface"]]["name"], f"wave {s['wave']} · {s.get('phase', '')}단계", anchor=f"scr-{sid}", foot=foot)

    for part, is_phone, title, desc in [("A", True, "PART A — 현장 앱(PWA)", "A1 현장 안전관리자 · A2 운전자 · A3 본사 · A4 사업주(2단계). comfortable 밀도 · 시스템 다크 추종 · 오프라인 큐 · 기기 알림."), ("B", False, "PART B — 웹(관제 · 본사 · 백오피스)", "B0 공통 로그인 · B1 운영사 관제 · B2 건설사 본사 · B3 현장(2단계) · B4 관리자. compact 밀도 · Linear 참조 셸 · 목록 → 인스펙터.")]:
        pages.append(page(f"<h1>{esc(title)}</h1><p>{esc(desc)}</p>", "", "", cls="divider", foot=foot))
        i = 0
        for s in screens:
            if (surfaces[s["surface"]]["app"] == "pwa") == is_phone:
                i += 1
                pages.append(screen_page(s, i))

    # 부록 A FR
    fr_rows = [[x["id"], x["title"], f"{x.get('phase', '')}", x.get("kind", ""), x.get("status", ""), " ".join(x.get("screens") or [])] for x in frs]
    half = (len(fr_rows) + 1) // 2
    for i, part in enumerate([fr_rows[:half], fr_rows[half:]]):
        pages.append(page(tbl(["FR", "제목", "단계", "종류", "상태", "화면"], part, ["14mm", "auto", "10mm", "16mm", "18mm", "50mm"]), f"A.{i + 1}", "부록 A — 기능 요구(FR)", f"requirements.yaml · {len(frs)}건", anchor="fr" if i == 0 else "", foot=foot))
    nfr_rows = [[x["id"], x["title"], x.get("criterion", ""), x.get("verify", "")] for x in d["requirements"]["nfr"]]
    pages.append(page(tbl(["NFR", "제목", "기준", "검증"], nfr_rows, ["16mm", "50mm", "auto", "50mm"]), "A.3", "부록 A — 비기능 요구(NFR)", f"{len(nfr_rows)}건", foot=foot))
    # 부록 B IF/API
    if_rows = [[x["id"], x.get("segment", ""), x.get("protocol", ""), x.get("data", ""), f"{x.get('phase', '')}", " ".join(x.get("screens") or [])] for x in ifs]
    pages.append(page(tbl(["IF", "구간", "프로토콜", "데이터", "단계", "화면"], if_rows, ["14mm", "40mm", "44mm", "auto", "10mm", "34mm"]), "B.1", "부록 B — 인터페이스(IF)", f"interfaces.yaml · {len(ifs)}건", anchor="ifapi", foot=foot))
    api_rows = [[x["id"], x.get("resource", ""), x.get("summary", ""), " ".join(x.get("if") or [])] for x in d["interfaces"]["api"]]
    pages.append(page(tbl(["API", "자원", "요약", "IF"], api_rows, ["16mm", "36mm", "auto", "34mm"]), "B.2", "부록 B — API", f"{len(api_rows)}건", foot=foot))
    # 부록 C ENT + machines
    ent_rows = [[x["id"], x.get("name", ""), " · ".join(x.get("fields") or []), " · ".join(x.get("relations") or []), x.get("store", ""), f"{x.get('phase', '')}"] for x in d["entities"]["ent"]]
    pages.append(page(tbl(["ENT", "이름", "필드", "관계", "저장소", "단계"], ent_rows, ["14mm", "34mm", "auto", "60mm", "16mm", "10mm"]), "C.1", "부록 C — 엔티티(ENT)", f"entities.yaml · {len(ent_rows)}건", anchor="ent", foot=foot))
    machines = d["entities"].get("machines") or {}
    m_rows = []
    for name, m in machines.items():
        trans = m.get("transitions") or []
        m_rows.append([f"{name} ({m.get('entity', '')})", " · ".join(m.get("states") or []), "; ".join(f"{t.get('from')} → {t.get('to')} ({t.get('by', '')})" for t in trans)])
    if m_rows:
        pages.append(page(tbl(["상태기계", "상태", "전이"], m_rows, ["24mm", "60mm", "auto"]), "C.2", "부록 C — 상태기계", "entities.yaml machines · 코드는 transition()으로만 전이", foot=foot))
    # 부록 D 캡처 매니페스트
    if manifest:
        sh_rows = [[s["code"], s["state"], s["file"], s.get("app", ""), f"{s.get('width', '')}×{s.get('height', '')}", "다크" if s["dark"] else "", "○" if s["ok"] else "✗"] for s in manifest["shots"]]
        half = (len(sh_rows) + 2) // 3
        for i in range(3):
            part = sh_rows[i * half:(i + 1) * half]
            if part:
                pages.append(page(tbl(["코드", "상태", "파일", "앱", "픽셀", "테마", "OK"], part, ["16mm", "18mm", "auto", "10mm", "22mm", "10mm", "8mm"]), f"D.{i + 1}", "부록 D — 캡처 매니페스트", f"shots/manifest.json · wave {manifest['wave']} · DPR {manifest['dpr']} · {len(manifest['shots'])}장", anchor="shots" if i == 0 else "", foot=foot))
    else:
        pages.append(page('<div class="empty">shots/manifest.json 없음</div>', "D", "부록 D — 캡처 매니페스트", "", anchor="shots", foot=foot))

    return f'<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8"><title>{esc(prog["name"])} — 시스템·화면 설계서 {esc(ver)}</title><style>{CSS}</style></head><body>{"".join(pages)}</body></html>'
