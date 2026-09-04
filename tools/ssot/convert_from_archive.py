#!/usr/bin/env python3
"""convert_from_archive.py — 아카이브 SSOT(파이썬 5종 + states.json) → ssot/*.yaml (1회성 변환).

  python3 -B tools/ssot/convert_from_archive.py [--force]

원천: boomeyes/archive/2026-09-05_docset-v0.3/_ref/boomeyes_build/{trace_data,system_data,rtm_source,scenario_data}.py
규칙(플랜 §1.1): 화면 ID = 맨 코드 · 참조는 배열 · 어휘는 영문 enum · 저작 방향 1개(화면→trace, FR→screens) · 파생값 저장 금지.
v2.0 델타(부품 모듈·이벤트 복기·카메라 헬스·후보 기종·검토 미결 4)와 웨이브 배정은 DELTA 절에서 함께 생성한다.
Python 3.9 호환.
"""
import os
import re
import sys
import json
import argparse

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
ARCHIVE = os.path.abspath(os.path.join(ROOT, "..", "boomeyes", "archive", "2026-09-05_docset-v0.3", "_ref", "boomeyes_build"))
OUT_DIR = os.path.join(ROOT, "ssot")

sys.dont_write_bytecode = True
sys.path.insert(0, ARCHIVE)
import trace_data as T  # noqa: E402
import system_data as S  # noqa: E402
import rtm_source as R  # noqa: E402
import scenario_data as C  # noqa: E402
import yaml  # noqa: E402

SCR_RE = re.compile(r"\b([AB]\d)-(\d{2})(M?)\b")
ID_RES = {
    "IF": re.compile(r"\bIF-(\d{3})"), "API": re.compile(r"\bAPI-(\d{3})"), "DISC": re.compile(r"\bDISC-(\d{3})"),
    "ACC": re.compile(r"\bACC-(\d{3})"), "RFP": re.compile(r"\bRFP-(\d{3})"), "OUT": re.compile(r"\bOUT-(\d{3})"),
    "WP": re.compile(r"\bWP-([ABC]\d)"), "ENT": re.compile(r"\bENT-(\d{2})"), "FR": re.compile(r"\bFR-(\d{3})"),
    "NFR": re.compile(r"\bNFR-(\d{3})"), "SVC": re.compile(r"\bSVC-(\d{2})"), "SW": re.compile(r"\bSW-(\d{2})"),
}
EXT_RE = re.compile(r"확장-(\d)")
SEC_RE = re.compile(r"\b([45]\.3\.\d{1,2})\b")


def tokens(s):
    if s is None:
        return []
    return [t.strip() for t in re.split(r"\s*·\s*|\s*,\s*|\s+/\s+", str(s)) if t.strip()]


def all_screens_of(app, screens):
    return [sid for sid in screens if sid.startswith(app)]


def parse_screen_refs(s, screens, expand_apps=True):
    """'A1-04 · A3-04 · A1-02.V1(필터) · A3-01~07 · A1-02·03·08 · B1 전 화면' → (ids[], notes[])"""
    ids, notes = [], []
    last_prefix = None
    for tok in tokens(s):
        m = re.match(r"^([AB]\d)-(\d{2})(M?)(?:~(\d{2}))?(?:\.V(\d)\((.*?)\))?(.*)$", tok)
        if m:
            app, n1, mod, n2, var, vnote, rest = m.groups()
            last_prefix = app
            if n2:
                for k in range(int(n1), int(n2) + 1):
                    ids.append("%s-%02d" % (app, k))
            else:
                ids.append("%s-%s%s" % (app, n1, mod))
            if vnote:
                notes.append("%s-%s 변형: %s" % (app, n1, vnote))
            if rest and rest.strip(" ()"):
                notes.append(rest.strip(" ()"))
            continue
        m2 = re.match(r"^(\d{2})(M?)$", tok)
        if m2 and last_prefix:
            ids.append("%s-%s%s" % (last_prefix, m2.group(1), m2.group(2)))
            continue
        m3 = re.match(r"^([AB]\d)(?:\s+.*)?$", tok)
        if m3 and expand_apps and ("전 화면" in tok or tok.strip() == m3.group(1) or "표면" in tok):
            ids.extend(all_screens_of(m3.group(1), screens))
            continue
        if tok.startswith("A1 ") and "전 화면" in tok:
            ids.extend(all_screens_of("A1", screens))
            continue
        if re.fullmatch(r"\d{2,3}", tok):
            continue  # 다른 축 ID의 연속 번호(DISC-004·028) — parse_ids가 처리
        notes.append(tok)
    out = []
    for i in ids:
        if i in screens and i not in out:
            out.append(i)
    return out, [n for n in notes if n not in ("—", "")]


def parse_ids(s, kind):
    """'DISC-004·029' 'ACC-007·104' 'RFP-010~014' 'IF-005 · IF-006' '확장-1' → ID 배열"""
    out = []
    if not s:
        return out
    cont = False  # 직전 토큰이 같은 종류의 ID일 때만 '007' 같은 숫자 토큰을 이어붙인다
    prefix = {"IF": "IF-", "API": "API-", "DISC": "DISC-", "ACC": "ACC-", "RFP": "RFP-", "OUT": "OUT-", "WP": "WP-", "ENT": "ENT-", "FR": "FR-", "NFR": "NFR-"}[kind]
    width = 2 if kind == "ENT" else 3
    for tok in tokens(s):
        m = re.match(r"^%s(\d+)(?:~(\d+))?$" % re.escape(prefix), tok)
        if m:
            a, b = int(m.group(1)), int(m.group(2) or m.group(1))
            out.extend("%s%0*d" % (prefix, width, k) for k in range(a, b + 1))
            cont = True
            continue
        m = re.match(r"^(\d{%d})$" % width, tok)
        if m and cont:
            out.append(prefix + m.group(1))
            continue
        cont = False
        m = EXT_RE.match(tok)
        if m and kind == "RFP":
            out.append("EXT-" + m.group(1))
            continue
        for mm in re.finditer(r"%s(\d{%d})" % (re.escape(prefix), width), tok):
            out.append(prefix + mm.group(1))
    seen = []
    for i in out:
        if i not in seen:
            seen.append(i)
    return seen


def status_of(s):
    s = (s or "").strip()
    if s in ("", "—"):
        return "void", None
    if s.startswith("반영"):
        note = s[2:].strip(" ()") or None
        return "reflected", note
    if s.startswith("구조 확보"):
        return "structure", None
    if s.startswith("2단계"):
        note = s[3:].strip(" ()") or None
        return "phase2", note
    if s.startswith("옵션"):
        return "option", s[2:].strip(" ()") or None
    if s.startswith("비화면"):
        return "non-screen", s[3:].strip(" ()") or None
    if s.startswith("문서화"):
        return "documented", None
    if s.startswith("미착수"):
        return "not-started", None
    if s.startswith("개발 단계"):
        return "development", None
    if s.startswith("표준 패키지"):
        return "option", s
    if s.startswith("확인 필요"):
        return "check", s
    return "reflected", s


def phase_of(status, text=""):
    if status in ("phase2", "structure") or "2단계" in (text or ""):
        return 2
    return 1


class _Dumper(yaml.SafeDumper):
    pass


def _repr_str(dumper, value):
    # YAML 1.2 파서(yaml npm)가 숫자·불리언으로 오독할 문자열은 따옴표 강제
    if re.fullmatch(r"[-+]?\d[\d_]*(\.\d*)?([eE][-+]?\d+)?|0x[0-9a-fA-F]+|0o[0-7]+|true|false|null|yes|no|on|off|~|\.inf|\.nan", value, re.I):
        return dumper.represent_scalar("tag:yaml.org,2002:str", value, style="'")
    if "\n" in value:
        return dumper.represent_scalar("tag:yaml.org,2002:str", value, style="|")
    return dumper.represent_scalar("tag:yaml.org,2002:str", value)


_Dumper.add_representer(str, _repr_str)


def dump(name, obj, force):
    path = os.path.join(OUT_DIR, name)
    if os.path.exists(path) and not force:
        raise SystemExit("거부: %s 가 이미 있습니다 (1회성 변환). --force 로 덮어쓰기." % path)
    with open(path, "w", encoding="utf-8") as f:
        f.write("# yaml-language-server: $schema=./schema/%s.schema.json\n" % name.replace(".yaml", ""))
        f.write("# 생성: tools/ssot/convert_from_archive.py (아카이브 docset v0.3 + v2.0 델타) — 이후 이 파일이 원천\n")
        yaml.dump(obj, f, Dumper=_Dumper, allow_unicode=True, sort_keys=False, width=120, default_flow_style=False)
    print("  ✓ %s" % name)


# ---------------------------------------------------------------- screens
SCREEN_NAMES = {
    "A1-01": "로그인", "A1-02": "업무함", "A1-03": "업무 상세", "A1-04": "관제(장비·영상)", "A1-05": "장비 상세", "A1-06": "기록", "A1-07": "메뉴·현장 정보", "A1-08": "완료 처리 시트",
    "A2-01": "로그인", "A2-02": "오늘(출근·알림)", "A2-03": "일일점검", "A2-04": "내 장비", "A2-05": "내 서류", "A2-06": "메뉴·현장 정보",
    "A3-01": "로그인", "A3-02": "현장 목록(본사)", "A3-03": "현장 상세", "A3-04": "장비 열람", "A3-05": "업무(열람)", "A3-06": "기록",
    "A4-01": "로그인", "A4-02": "보유·가용 현황", "A4-03": "투입 요청·배정", "A4-04": "운전자 배치", "A4-05": "임대 계약", "A4-06": "운전자 서류",
    "B0-01": "웹 공통 로그인", "B1-02": "관제 대시보드", "B1-02M": "카메라 영상 모달", "B1-03": "수신함", "B1-04": "에스컬레이션", "B1-05": "서류 현황", "B1-06": "임대 계약", "B1-07": "쇼케이스",
    "B2-02": "본사 지도", "B2-03": "현장 상세", "B2-04": "보고 모드", "B3-02": "현장 콘솔", "B3-03": "업무", "B3-04": "서류", "B3-05": "기록", "B3-06": "쇼케이스",
    "B4-02": "프로토콜 관리", "B4-03": "장비·현장·프로파일", "B4-04": "사용자·권한", "B4-05": "알림 기준", "B4-06": "서류 관리",
    # v2.0 델타
    "B1-08": "이벤트 복기", "B4-07": "부품 대장", "B4-08": "점검·교체 이력", "A1-11": "부품 점검 입력", "A2-09": "교체·폐기 처리", "B3-07": "현장 부품 현황",
}
VARIANT_PARENT = {name: (parent, cap) for parent, lst in T.VARIANTS.items() for name, cap in lst}  # 'a1-10-filter' → ('A1-02', 캡션)
LEGACY_OF = {"A1-10": "A1-02", "A1-09": "A1-07", "A2-07": "A2-02", "A2-08": "A2-03", "A3-07": "A3-03"}
APP_ROLES = {"A1": ["site-safety"], "A2": ["driver"], "A3": ["hq-safety"], "A4": ["owner"], "B0": ["control", "hq-safety", "site-safety", "ops-admin"],
             "B1": ["control", "maintenance"], "B2": ["hq-safety"], "B3": ["site-safety"], "B4": ["ops-admin"]}
WAVE = {}
for sid in ["B0-01", "B1-02"]:
    WAVE[sid] = 0
for sid in ["B1-02M", "B1-03", "B1-04", "A1-01", "A1-02", "A1-03", "A1-04", "A1-05", "A2-01", "A2-02", "A2-03", "A2-04", "B4-02", "B4-05"]:
    WAVE[sid] = 1
for sid in ["A1-06", "A1-07", "A1-08", "A2-05", "A2-06", "A3-01", "A3-02", "A3-03", "A3-04", "A3-05", "A3-06", "B1-05", "B1-06", "B1-07", "B2-02", "B2-03", "B2-04", "B4-03", "B4-04", "B4-06",
            "B1-08", "B4-07", "B4-08", "A1-11", "A2-09"]:
    WAVE[sid] = 2
for sid in ["A4-01", "A4-02", "A4-03", "A4-04", "A4-05", "A4-06", "B3-02", "B3-03", "B3-04", "B3-05", "B3-06", "B3-07"]:
    WAVE[sid] = 4


def build_screens():
    states_json = json.load(open(os.path.join(ARCHIVE, "states.json"), encoding="utf-8"))
    by_screen = {}
    for job in states_json:
        for st in job["states"]:
            m = re.match(r"^([ab]\d)-(\d{2})(m?)-(.+)$", st["name"])
            app, num, mod, slug = m.groups()
            code = "%s-%s%s" % (app.upper(), num, mod.upper())
            if code in LEGACY_OF:  # 변형 → 부모 state
                parent = LEGACY_OF[code]
                cap = VARIANT_PARENT.get(st["name"], (None, ""))[1]
                by_screen.setdefault(parent, []).append({"id": slug, "name": cap.replace("상태 변형 — ", "") or slug, "legacy_shot": st["name"]})
            elif re.match(r"^B\d-01$", code):  # 웹 로그인 샷 4 → B0-01
                by_screen.setdefault("B0-01", []).append({"id": "login-" + app, "name": "%s 로그인" % app.upper(), "legacy_shot": st["name"]})
            else:
                by_screen.setdefault(code, []).append({"id": slug, "name": slug, "legacy_shot": st["name"]})
    screen_ids = [sid for sid in T.TRACE if sid not in LEGACY_OF] + ["B1-08", "B4-07", "B4-08", "A1-11", "A2-09", "B3-07"]
    screen_ids.sort(key=lambda s: (s[0], int(s[1]), s[3:5], s[5:]))
    nav = {}
    for group in list(S.NAV_A) + list(S.NAV_B):
        for frm, to, label in group[1]:
            frm, to = LEGACY_OF.get(frm, frm), LEGACY_OF.get(to, to)
            if frm == to:
                continue  # 변형(부모 state)으로 가는 간선은 화면 간선이 아님
            nav.setdefault(frm, []).append({"to": to, "label": label})
    screens = []
    for sid in screen_ids:
        app = sid[:2]
        tr = T.TRACE.get(sid, {})
        states = by_screen.get(sid) or [{"id": "default", "name": "기본"}]
        for st in states:
            st.pop("legacy_shot", None)
        default = states[0]["id"]
        route = ROUTES.get(sid) or "/%s/%s" % (app.lower(), default if default != "default" else sid.split("-")[1])
        scr = {
            "id": sid, "name": SCREEN_NAMES.get(sid, sid), "surface": app, "route": route, "roles": APP_ROLES[app],
            "phase": 2 if app in ("A4", "B3") or sid in ("B1-07", "B2-04", "B3-07") else 1,
            "wave": WAVE[sid],
            "legacy_codes": [k for k, v in LEGACY_OF.items() if v == sid] + (["B1-01", "B2-01", "B3-01", "B4-01"] if sid == "B0-01" else []),
            "default": default, "states": states, "nav": nav.get(sid, []),
            "trace": {"task": list(tr.get("task", [])), "out": tr.get("out"), "rfp": [("EXT-" + x[3:]) if x.startswith("확장") else x for x in tr.get("rfp", [])],
                      "disc": list(tr.get("disc", [])), "if": list(tr.get("if", []))},
            "note": T.NOTES.get(sid),
        }
        if not scr["legacy_codes"]:
            del scr["legacy_codes"]
        if not scr["note"]:
            del scr["note"]
        screens.append(scr)
    # v2.0 델타 화면 trace
    delta_trace = {
        "B1-08": {"task": ["5.3.1"], "out": "OUT-012", "rfp": ["RFP-008"], "disc": ["DISC-039", "DISC-040"], "if": ["IF-008", "IF-017", "IF-018", "IF-009"]},
        "B4-07": {"task": ["5.3.3"], "out": "OUT-014", "rfp": ["RFP-016", "RFP-017"], "disc": ["DISC-038", "DISC-043"], "if": ["IF-009", "IF-019"]},
        "B4-08": {"task": ["5.3.3"], "out": "OUT-014", "rfp": ["RFP-016", "RFP-017"], "disc": ["DISC-038"], "if": ["IF-009"]},
        "A1-11": {"task": ["5.3.3"], "out": "OUT-014", "rfp": ["RFP-016", "RFP-017"], "disc": ["DISC-038", "DISC-043"], "if": ["IF-009", "IF-011", "IF-019"]},
        "A2-09": {"task": ["5.3.3"], "out": "OUT-014", "rfp": ["RFP-016", "RFP-017"], "disc": ["DISC-038", "DISC-043"], "if": ["IF-009", "IF-011", "IF-019"]},
        "B3-07": {"task": ["5.3.3"], "out": "OUT-014", "rfp": ["RFP-022"], "disc": ["DISC-019", "DISC-038"], "if": ["IF-009"]},
    }
    delta_note = {"B1-08": "event_id + 공통 시각으로 일반 CCTV·AI CCTV·바디캠·CPB 상태/부품 이력 4소스 동기 재생 (영상·소모품 운영 검토 v2.0 §11)",
                  "B4-07": "부품 ID 중심 등록·장착·재고·발주 — 5군(직관·이송배관 / 엘보·리듀서 / 플랜지·클램프 / 가스켓·안전핀 / 엔드호스·피팅)",
                  "B4-08": "점검(실측두께·외관·체결·OEM 합불)·교체·폐기 이력 — 누적 타설량·운전시간은 보조지표",
                  "A1-11": "현장 점검 입력 — 태그 스캔 → 실측·사진·합불", "A2-09": "교체·폐기 처리 — 사유·작업자·증빙 사진 → 재고 차감",
                  "B3-07": "현장 스코프 부품 현황 (2단계 제안 표면)"}
    for scr in screens:
        if scr["id"] in delta_trace:
            scr["trace"] = delta_trace[scr["id"]]
            scr["note"] = delta_note[scr["id"]]
            scr["states"] = [{"id": "default", "name": "기본"}]
            scr["default"] = "default"
    surfaces = [{"id": k, "name": v, "app": "pwa" if k.startswith("A") else "web"} for k, v in T.PRODUCT.items()]
    return {"surfaces": surfaces, "screens": screens}


ROUTES = {
    "B0-01": "/login", "B1-02": "/b1/dash", "B1-02M": "/b1/dash?cam=[camera]", "B1-03": "/b1/inbox", "B1-04": "/b1/escalation", "B1-05": "/b1/docs", "B1-06": "/b1/leases", "B1-07": "/b1/showcase", "B1-08": "/b1/events/[event]",
    "B2-02": "/b2/map", "B2-03": "/b2/sites/[site]", "B2-04": "/b2/report", "B3-02": "/b3/console", "B3-03": "/b3/tasks", "B3-04": "/b3/docs", "B3-05": "/b3/records", "B3-06": "/b3/showcase", "B3-07": "/b3/parts",
    "B4-02": "/b4/protocols", "B4-03": "/b4/assets", "B4-04": "/b4/users", "B4-05": "/b4/rules", "B4-06": "/b4/docs", "B4-07": "/b4/parts", "B4-08": "/b4/parts/history",
    "A1-01": "/a1/login", "A1-02": "/a1/inbox", "A1-03": "/a1/inbox/[case]", "A1-04": "/a1/monitor", "A1-05": "/a1/monitor/[device]", "A1-06": "/a1/records", "A1-07": "/a1/menu", "A1-08": "/a1/inbox/[case]?sheet=complete", "A1-11": "/a1/parts/inspect",
    "A2-01": "/a2/login", "A2-02": "/a2/today", "A2-03": "/a2/today/inspect", "A2-04": "/a2/device", "A2-05": "/a2/docs", "A2-06": "/a2/menu", "A2-09": "/a2/parts/replace",
    "A3-01": "/a3/login", "A3-02": "/a3/sites", "A3-03": "/a3/sites/[site]", "A3-04": "/a3/sites/[site]/devices", "A3-05": "/a3/tasks", "A3-06": "/a3/records",
    "A4-01": "/a4/login", "A4-02": "/a4/fleet", "A4-03": "/a4/requests", "A4-04": "/a4/drivers", "A4-05": "/a4/leases", "A4-06": "/a4/drivers/docs",
}


# ---------------------------------------------------------------- others
def build_meta():
    return {
        "program": {"name": "BoomEyes(가칭)", "alias_disc": "DISC-021", "owner": "DY(운영사)", "vendor": "VIA"},
        "set_version": S.SET_VER, "next_set_version": "v0.4-draft",
        "doc_numbers": dict(S.DOC_NOS, scn="VIA-BE-SCN-001"),
        "fixed_clock": "2026-07-03T10:42:00+09:00",
        "phases": [{"id": 1, "name": "1단계", "start": "2026-07-01", "end": "2026-09-30", "note": "기능 동결 2026-09-10 · 시연 2026-09-30 (계약 기준선 — 재기준선은 docs/PLAN.md)"},
                   {"id": 2, "name": "2단계", "start": "2026-10-01", "end": "2026-12-31", "note": "운영형 고도화 (범위 DISC-019)"}],
        "current_wave": 0,
        "schedule": [{"milestone": a, "when": b, "criterion": c} for a, b, c in S.SOW_SCHEDULE],
        "history": [{"version": v, "date": d, "summary": s} for v, d, s in T.HISTORY],
        "basis_docs": [{"kind": k, "title": t, "version": v, "role": r} for k, t, v, r in S.BASIS_DOCS],
    }


def build_roles():
    ids = ["driver", "site-safety", "hq-safety", "control", "maintenance", "ops-admin", "owner"]
    demo = {"driver": "driver03", "site-safety": "safety01", "hq-safety": "hq01", "control": "control01", "maintenance": "maint01", "ops-admin": "ops01", "owner": "owner01"}
    persona = {p[1]: p for p in C.PERSONAS}
    role_persona = {"driver": "CPB 운전자", "site-safety": "현장 안전관리자", "hq-safety": "본사 안전관리팀장", "control": "CPB 관제 담당", "maintenance": "정비 담당", "ops-admin": "CPB 운영 관리자", "owner": "CPB 사업주 (장비 소유주)"}
    roles = []
    for rid, (name, org, surf, summary) in zip(ids, T.ROLES):
        p = persona.get(role_persona[rid])
        surfaces = re.findall(r"\b([AB]\d)\b", surf)
        roles.append({"id": rid, "name": name, "org": org, "surfaces": surfaces, "surface_note": surf, "summary": summary,
                      "persona": {"name": p[0], "env": p[3], "goal": p[4], "pain": p[5]} if p else None,
                      "demo_account": {"login": demo[rid], "display": (p[0] if p else name)}})
    return {"roles": roles}


def build_contract(screens):
    sections = []
    for sec, name in T.TASK_NAME.items():
        items = []
        for s1, lst in T.TASKS_1:
            if s1 == sec:
                for title, scr, st in lst:
                    ids, notes = parse_screen_refs(scr, screens)
                    status, note = status_of(st)
                    it = {"title": title, "screens": ids, "status": status}
                    if note or notes:
                        it["note"] = " · ".join([x for x in [note] + notes if x])
                    items.append(it)
        for s2, scr, note in T.TASKS_2:
            if s2 == sec:
                ids, notes = parse_screen_refs(scr, screens)
                items.append({"title": note, "screens": ids, "status": "structure" if ids else "non-screen"})
        sections.append({"id": sec, "name": name, "phase": 1 if sec.startswith("4.") else 2, "items": items})
    rfp = []
    for rid, title, owner, st, disc in T.RFP_ROWS:
        ids, notes = parse_screen_refs(owner, screens)
        status, note = status_of(st)
        row = {"id": rid, "title": title, "screens": ids, "status": status if rid != "RFP-006" else "void", "disc": parse_ids(disc, "DISC")}
        if notes or note:
            row["note"] = " · ".join([x for x in notes + [note] if x])
        rfp.append(row)
    for rid, title, owner, st in T.RFP_EXTRA:
        if rid == "데이터":
            continue  # → DISC-037
        ids, notes = parse_screen_refs(owner, screens)
        status, note = status_of(st)
        row = {"id": "EXT-" + rid[3:], "label": rid, "title": title, "screens": ids, "status": status, "disc": parse_ids(st, "DISC")}
        if notes or note:
            row["note"] = " · ".join([x for x in notes + [note] if x])
        rfp.append(row)
    outputs = [{"id": oid, "name": nm, "phase": 1 if ph == "1단계" else 2, "lead_wp": S.OUT_WP[oid][0], "contrib_wp": list(S.OUT_WP[oid][1])} for oid, (nm, ph) in T.OUT_DEF.items()]
    acceptance = []
    for aid, when, area, crit, outs, note in R.ACC_ROWS:
        acceptance.append({"id": aid, "date": "2026-09-10" if when == "9/10" else "2026-09-30", "area": area, "criterion": crit, "outputs": parse_ids(outs, "OUT"), "note": note or None,
                           "status": "undefined" if area == "정의 필요" else "defined"})
    wp = []
    for row in S.WP_CATALOG:
        wid, title, sw, outs, chkey, done, s1, s2, dep = row
        wp.append({"id": wid, "title": title, "sw": re.findall(r"SW-\d{2}", sw), "outputs": parse_ids(outs, "OUT"), "done_when": done, "phase1": s1, "phase2": s2, "depends": dep, "chapter_key": chkey})
    milestones = [{"id": m.split()[0], "title": m, "date": d, "criterion": c, "outputs": parse_ids(o, "OUT")} for m, d, c, o in R.MILESTONES]
    return {"sections": sections, "rfp": rfp, "outputs": outputs, "acceptance": acceptance, "wp": wp, "milestones": milestones}


def build_requirements(screens):
    fr = []
    for fid, title, src, scr, ifs, acc, st in S.FR_CATALOG:
        ids, notes = parse_screen_refs(scr, screens)
        status, note = status_of(st)
        kind = "proposed" if status == "phase2" or "제안" in (st or "") else ("option" if status == "option" else "core")
        row = {"id": fid, "title": title, "source": {"text": src, "rfp": parse_ids(src, "RFP"), "sections": SEC_RE.findall(src), "disc": parse_ids(src, "DISC")},
               "screens": ids, "if": parse_ids(ifs, "IF"), "acc": parse_ids(acc, "ACC"), "phase": phase_of(status, st), "kind": kind, "status": status}
        if note or notes:
            row["note"] = " · ".join([x for x in [note] + notes if x])
        fr.append(row)
    for row in fr:
        if row["id"] == "FR-001" and "A4-01" not in row["screens"]:
            row["screens"].append("A4-01")
        if row["id"] == "FR-018":
            for sid in ("A1-07", "A2-06"):
                if sid not in row["screens"]:
                    row["screens"].append(sid)
            row["note"] = (row.get("note") + " · " if row.get("note") else "") + "현장 기본정보 열람(A1-07 · A2-06) 포함"
    nfr = [{"id": n, "title": t, "criterion": c, "source": s, "verify": v} for n, t, c, s, v in S.NFR_CATALOG]
    # ---- 델타 (영상·소모품 운영 검토 v2.0)
    fr += [
        {"id": "FR-032", "title": "마모·교체 부품 생애주기 — 등록·장착·누적·점검·교체·폐기·재고·발주", "source": {"text": "영상·소모품 운영 검토 v2.0 §9~10 / DISC-038", "rfp": ["RFP-016", "RFP-017"], "sections": ["5.3.3"], "disc": ["DISC-038"]},
         "screens": ["B4-07", "B4-08", "A1-11", "A2-09", "B3-07"], "if": ["IF-009", "IF-019"], "acc": [], "phase": 2, "kind": "proposed", "status": "phase2",
         "note": "부품 ID 중심 · 누적 타설량·운전시간은 점검 우선순위 보조지표(단독 폐기 기준 아님) · 임계·주기는 CPB 모델별 OEM 기준"},
        {"id": "FR-033", "title": "이벤트 복기 — event_id·공통 시각 기준 4소스 동기 재생(일반 CCTV·AI CCTV·바디캠·CPB 상태/부품 이력)", "source": {"text": "v2.0 §11 / DISC-039", "rfp": ["RFP-008"], "sections": ["5.3.1"], "disc": ["DISC-039"]},
         "screens": ["B1-08"], "if": ["IF-008", "IF-017", "IF-018"], "acc": [], "phase": 2, "kind": "proposed", "status": "phase2"},
        {"id": "FR-034", "title": "카메라 헬스·AI 판단 불가 표시 — 정지화면·흐림·가림·수신 끊김 시 정상 표시 금지, 복구 후 누락분 재전송 표시", "source": {"text": "v2.0 §8 시나리오 6 / DISC-040", "rfp": ["RFP-007"], "sections": ["4.3.8"], "disc": ["DISC-040"]},
         "screens": ["B1-02", "B1-02M", "A1-04"], "if": ["IF-006", "IF-010", "IF-018"], "acc": [], "phase": 1, "kind": "core", "status": "reflected", "note": "웨이브 1 화면에 상태 배지로 반영"},
        {"id": "FR-035", "title": "부품 태그 스캔 — QR/RFID로 부품 ID 식별 후 점검·교체 입력", "source": {"text": "v2.0 §12 부품 태그 / DISC-043", "rfp": [], "sections": ["5.3.3"], "disc": ["DISC-043"]},
         "screens": ["A1-11", "A2-09"], "if": ["IF-019"], "acc": [], "phase": 2, "kind": "proposed", "status": "phase2"},
        {"id": "FR-036", "title": "시나리오별 알림 등급 — 정상 타설 무알림 · 호스 주변 인원 접근 즉시 · 전도/무동작 고우선 · 배관·호스 이상 긴급 · 영상 장애 알림", "source": {"text": "v2.0 §3~8 / DISC-036·040", "rfp": ["RFP-015"], "sections": ["4.3.11"], "disc": ["DISC-036", "DISC-040"]},
         "screens": ["B4-05", "B1-02", "A1-05"], "if": ["IF-010", "IF-014", "IF-015"], "acc": [], "phase": 2, "kind": "proposed", "status": "phase2", "note": "전도·무동작은 현장 검증 후 적용(DISC-042)"},
    ]
    nfr += [
        {"id": "NFR-014", "title": "이벤트 복기 시각 동기", "criterion": "4소스(일반·AI CCTV·바디캠·CPB 상태) 공통 시각 오차 ±1초 이내(목표) · 시간 동기 원천 명시", "source": "v2.0 §11·12 / DISC-039", "verify": "B1-08 동기 재생 검증"},
        {"id": "NFR-015", "title": "긴급 이벤트 원본 보존", "criterion": "긴급(배관·호스 이상, 전도) 이벤트 전후 원본 영상 보존·잠금(Object Lock) · 복기 완료 전 삭제 금지", "source": "v2.0 §7·12", "verify": "S3 잠금 정책 · 복기 절차"},
    ]
    return {"fr": fr, "nfr": nfr}


def build_interfaces(screens):
    ifs = []
    for row in S.IF_CATALOG:
        iid, seg, proto, data, trig, ph, basis, scr = row
        ids, notes = parse_screen_refs(scr, screens)
        r = {"id": iid, "segment": seg, "protocol": proto, "data": data, "trigger": trig, "phase": 2 if ph == "2" else 1, "optional": ph == "옵션",
             "basis": {"text": basis, "disc": parse_ids(basis, "DISC"), "sections": SEC_RE.findall(basis)}, "screens": ids}
        if notes:
            r["note"] = " · ".join(notes)
        ifs.append(r)
    ifs += [
        {"id": "IF-018", "segment": "현장 수집 계층 ↔ 서버 (시간 동기·재전송)", "protocol": "NTP/PTP 시각 동기 · 로컬 버퍼(Edge/SD) → 복구 후 누락분 재전송(세그먼트·이벤트)", "data": "영상 세그먼트·이벤트·바디캠 파일의 공통 시각·event_id", "trigger": "장애 복구 시 / 상시",
         "phase": 2, "optional": False, "basis": {"text": "v2.0 §8·12 / DISC-039·040", "disc": ["DISC-039", "DISC-040"], "sections": []}, "screens": ["B1-08", "B1-02M"]},
        {"id": "IF-019", "segment": "부품 태그 → PWA", "protocol": "QR(카메라 스캔) 또는 RFID(NFC) — 방식 DISC-043", "data": "부품 ID · 품번 · 로트", "trigger": "점검·교체 시",
         "phase": 2, "optional": False, "basis": {"text": "v2.0 §12 부품 태그 / DISC-043", "disc": ["DISC-043"], "sections": []}, "screens": ["A1-11", "A2-09"]},
    ]
    api = [{"id": a, "resource": b, "summary": c, "if": parse_ids(d, "IF")} for a, b, c, d in S.API_CATALOG]
    api += [{"id": "API-017", "resource": "부품·재고", "summary": "부품 등록·장착·점검·교체·폐기 이력 · 재고·안전재고·발주 (FR-032·035)", "if": ["IF-009", "IF-019"]},
            {"id": "API-018", "resource": "이벤트 복기", "summary": "event_id 기준 4소스 세그먼트·메타 조회 · 공통 시각 정렬 · 원본 보존 잠금 (FR-033 · NFR-015)", "if": ["IF-008", "IF-017", "IF-018"]}]
    topics = [{"topic": a, "direction": b, "payload": c, "qos": d} for a, b, c, d in S.TOPIC_ROWS]
    events = [{"event": a, "publisher": b, "subscribers": re.findall(r"SVC-\d{2}", c), "summary": d} for a, b, c, d in S.EVT_ROWS]
    protocol = {"version": "cpb.v0.1", "fields": [{"group": a, "fields": tokens(b), "summary": c, "required": d == "필수"} for a, b, c, d in S.PROTO_FIELDS],
                "identifiers": [{"id": a, "summary": b} for a, b in S.SYS_IDS], "sample": S.PROTO_JSON.strip()}
    return {"if": ifs, "api": api, "topics": topics, "events": events, "protocol": protocol}


def build_entities():
    ent = []
    for eid, name, attrs, rel, store in S.ENT_CATALOG:
        ent.append({"id": eid, "name": name, "fields": tokens(attrs), "relations": tokens(rel), "store": store, "phase": 2 if "2단계" in store or "옵션" in store else 1})
    ent += [
        {"id": "ENT-16", "name": "부품 (Part)", "fields": ["part_id", "품번", "부품군(직관·이송배관/엘보·리듀서/플랜지·클램프/가스켓·안전핀/엔드호스·피팅)", "압력등급", "기준두께", "로트", "호환규격", "장착 위치·설치일", "누적 타설량·운전시간", "상태(장착/재고/폐기)"],
         "relations": ["N─1 장비(장착)", "1─N 부품 이력", "N─1 재고"], "store": "RDS — 2단계 제안 (DISC-038)", "phase": 2},
        {"id": "ENT-17", "name": "부품 이력 (PartEvent)", "fields": ["event_id", "part_id", "구분(등록/장착/점검/교체/폐기)", "실측두께·외관·체결·OEM 합불", "사유", "작업자", "증빙(사진)", "시각"], "relations": ["N─1 부품", "N─1 사용자", "0─1 이벤트(영상 복기 연결)"], "store": "RDS (append-only) · 사진은 S3", "phase": 2},
        {"id": "ENT-18", "name": "재고·발주 (Stock)", "fields": ["stock_id", "품번", "현재고", "안전재고", "발주 상태·수량·일자"], "relations": ["1─N 부품"], "store": "RDS — 2단계 제안", "phase": 2},
    ]
    rules = [{"group": g, "items": [{"title": a, "rule": b} for a, b in lst]} for g, lst in T.RULES]
    machines = {
        "task": {"entity": "ENT-06", "states": ["new", "assigned", "in-progress", "done", "escalated"], "transitions": [
            {"from": "new", "to": "assigned", "by": "관제 배정 / 자동"}, {"from": "assigned", "to": "in-progress", "by": "담당자 접수"}, {"from": "in-progress", "to": "done", "by": "정비 보고 → 현장 완료 확인 (2단계, DISC-015)"},
            {"from": "new", "to": "escalated", "by": "1h 미접수 자동 (제안)"}, {"from": "escalated", "to": "in-progress", "by": "접수"}]},
        "doc": {"entity": "ENT-07", "states": ["valid", "expiring", "submitted", "review", "approved", "rejected"], "transitions": [
            {"from": "valid", "to": "expiring", "by": "D-30 스케줄러"}, {"from": "expiring", "to": "submitted", "by": "촬영 업로드"}, {"from": "submitted", "to": "review", "by": "자동"},
            {"from": "review", "to": "approved", "by": "현장 승인"}, {"from": "review", "to": "rejected", "by": "반려(사유)"}, {"from": "rejected", "to": "submitted", "by": "재제출"}]},
        "equipment": {"entity": "ENT-02", "states": ["normal", "caution", "fault", "offline", "maintenance"], "transitions": [
            {"from": "normal", "to": "caution", "by": "임계 접근(수송관·필터·전압)"}, {"from": "caution", "to": "fault", "by": "E-코드 / 임계 초과"}, {"from": "*", "to": "offline", "by": "LWT 통신 두절"},
            {"from": "fault", "to": "maintenance", "by": "정비 출동"}, {"from": "maintenance", "to": "normal", "by": "현장 완료 확인"}]},
        "camera": {"entity": "ENT-04", "states": ["live", "snapshot", "recording", "offline", "ai-unavailable"], "transitions": [
            {"from": "live", "to": "snapshot", "by": "저대역 전략(NFR-003)"}, {"from": "*", "to": "offline", "by": "수신 끊김"}, {"from": "*", "to": "ai-unavailable", "by": "정지화면·흐림·가림 (FR-034)"}, {"from": "offline", "to": "live", "by": "복구 + 누락분 재전송(IF-018)"}]},
        "part": {"entity": "ENT-16", "states": ["registered", "installed", "inspected", "due", "replaced", "discarded"], "transitions": [
            {"from": "registered", "to": "installed", "by": "장착(위치·설치일·로트)"}, {"from": "installed", "to": "inspected", "by": "점검 입력(A1-11)"}, {"from": "inspected", "to": "due", "by": "OEM 기준 합불=불 / 임계"},
            {"from": "due", "to": "replaced", "by": "교체(A2-09) → 재고 차감"}, {"from": "replaced", "to": "discarded", "by": "폐기(사유·증빙)"}]},
    }
    stores = [{"store": a, "node": b, "entities": c, "purpose": d, "phase": e} for a, b, c, d, e in S.DATA_STORES]
    accumulation = [{"item": a, "source": b, "entities": parse_ids(c, "ENT"), "tier": d} for a, b, c, d in S.ACCUM_CATALOG]
    return {"ent": ent, "machines": machines, "rules": rules, "stores": stores, "accumulation": accumulation}


def build_decisions(screens):
    disc = []
    for did, title, scope, baseline in T.DISC_ROWS:
        ids, notes = parse_screen_refs(scope, screens)
        disc.append({"id": did, "title": title, "scope": ids, "scope_note": " · ".join(notes) if notes else None, "baseline": baseline, "ask": T.DISC_ASK[did], "track": T.DISC_TRACK[did],
                     "status": "open", "source": "docset-v0.3"})
    review = ["일일점검 체크리스트 항목·판정 기준", "작업(타설) 일정 데이터의 입력 주체", "정비 담당자의 조치 보고 입력 채널", "알림 수신자와 알림 방식 확정"]
    extra = [
        ("DISC-033", review[0], ["A2-03"], "A", "일일점검 체크리스트 항목·판정 기준 확정", "과업지시서 검토 요청 미결(원문 적색 표시) — 현행 목업은 5항목 샘플"),
        ("DISC-034", review[1], ["B4-03", "A1-07"], "B", "타설 일정 입력 주체·채널 확정", "과업지시서 검토 요청 미결 — 현장 안전관리자 입력 가정"),
        ("DISC-035", review[2], ["B1-04", "A1-03"], "A", "정비 조치 보고 입력 채널 확정", "과업지시서 검토 요청 미결 — B1 연계(호출·보고) 가정, 정비 담당 전용 화면 없음"),
        ("DISC-036", review[3], ["B4-05", "A1-02", "A2-02"], "A", "알림 수신자·방식(푸시·문자·전화) 확정", "과업지시서 검토 요청 미결 — 현행 Web Push(IF-014) 가정 · 시나리오별 등급은 FR-036"),
        ("DISC-037", "장비 대수 정합 (지도 180대 vs 호기 120대)", ["B1-02", "B1-06"], "A", "관제 표시 대수와 호기 범위(1~120) 정합 확인", "원본 첨부자료 상충 — 지도 샘플 180대, 호기 정의 1~120"),
        ("DISC-038", "마모·교체 부품 임계·주기 확정 주체 (CPB 모델별 OEM 기준)", ["B4-07", "B4-08", "A1-11"], "B", "부품군별 기준두께·임계·점검 주기를 DY CPB 모델별 OEM 기준으로 제공", "영상·소모품 운영 검토 v2.0 §9~10 — 공통 임계·주기 미제시, 누적 타설량은 보조지표"),
        ("DISC-039", "event_id·공통 시각 체계 (4소스 동기 복기)", ["B1-08"], "A", "event_id 채번·공통 시각 원천(NTP/PTP)·오차 허용치 확정", "v2.0 §11 — 일반 CCTV·AI CCTV·바디캠·CPB 상태·부품 이력 동기 복기"),
        ("DISC-040", "카메라 후보 변경 (AXIS P3925-LRE M12 일반 · Hanwha TNV-C8014RM AI · Hikvision 이동 붐 비권장)", ["B1-02M", "A1-04", "B4-03"], "A", "우선 후보 2종 채택 및 진동·EIS·M12·AI 실증 계획 확정", "v2.0 §13 — 세 제품 모두 CPB 전용 인증 아님 · 브래킷·안전 와이어·케이블 스트레인 릴리프 필요"),
        ("DISC-041", "바디캠 도크 설치 조건 (CPB 상부 서비스함)", ["B3-02"], "C", "방진·방수 서비스함 · 결로·온도 · 전원·접지 · 접근 조건 설계 주체 확정", "v2.0 §14 — 도크 상부 노출 설치 금지"),
        ("DISC-042", "전도·무동작 감지의 현장 검증 후 적용", ["A1-04", "B1-02M"], "C", "가림·자세로 인한 오검출 검증 계획·적용 시점 확정", "v2.0 §6 — 후보 이벤트로 취급, 장비 정지·구조 판단은 담당자"),
        ("DISC-043", "부품 태그 방식 (QR 라벨 vs RFID)", ["A1-11", "A2-09"], "B", "태그 방식·부착 위치·내구 조건 확정", "v2.0 §12 — PWA 스캔 UI 결정 필요"),
    ]
    for did, title, scope, track, ask, baseline in extra:
        disc.append({"id": did, "title": title, "scope": scope, "scope_note": None, "baseline": baseline, "ask": ask, "track": track, "status": "open",
                     "source": "sow-review-open" if did <= "DISC-036" else ("rfp-extra-data" if did == "DISC-037" else "video-parts-review-v2.0")})
    return {"disc": disc}


def build_options():
    axes = []
    for i, (name, choices, disc) in enumerate(S.SOW_VIDEO_OPTS, 1):
        ch = []
        for tok in re.split(r"\s+·\s+|\s+/\s+", choices):
            m = re.match(r"^([A-Z]\d|[ABC])\s+(.*)$", tok.strip())
            if m:
                ch.append({"code": m.group(1), "name": m.group(2)})
            else:
                ch.append({"code": None, "name": tok.strip()})
        axes.append({"id": "AX-%d" % i, "name": name, "choices": ch, "disc": parse_ids(disc, "DISC")})
    candidates = [{"item": a, "role": b, "products": c, "if": parse_ids(d, "IF"), "owner": e, "group": "video"} for a, b, c, d, e in S.HW_VIDEO]
    candidates += [{"item": a, "role": b, "products": c, "if": parse_ids(d, "IF"), "owner": e, "group": "telemetry"} for a, b, c, d, e in S.HW_TELE]
    for c in candidates:
        if c["item"].startswith("카메라 ① 일반"):
            c["products"] = "우선 후보: AXIS P3925-LRE M12 (780g · EN 50155 · IP6K9K · EIS · M12 · RTSP/VAPIX/MQTT · microSD) — v2.0 §13 (DISC-040)"
        if c["item"].startswith("카메라 ② AI"):
            c["products"] = "우선 후보: Hanwha TNV-C8014RM (466g · EN 50155 · IP66/IK10 · EIS · M12 · 사람·차량 AI · RTSP/MQTT/SUNAPI · ONVIF Profile M) · Hikvision DS-2CD3186G2-ISU 계열은 이동 붐 비권장(진동 인증·EIS·M12 미확인) — v2.0 §13 (DISC-040)"
        if c["item"].startswith("바디캠"):
            c["products"] = "후보: Transcend DrivePro Body 70 + DPD6N(도킹 수집) · AXIS W120 + W701 Mk II + W800(Body Worn Integration API, 직접 연동형) · Motorola V500(VideoManager 제조사 연동형) — v2.0 §14 (DISC-030·041)"
    return {"axes": axes, "candidates": candidates, "profiles": [
        {"id": "P-LITE", "name": "라이트", "choices": {"AX-1": "1채널", "AX-2": "E1", "AX-3": "L1", "AX-4": "서버 서브스트림", "AX-5": "PoE 인젝터", "AX-6": None, "AX-7": "표준 패키지", "AX-8": "T1"}},
        {"id": "P-SD", "name": "SD 병행", "choices": {"AX-1": "2채널", "AX-2": "E1", "AX-3": "L1", "AX-4": "서버 서브스트림 + SD 병행", "AX-5": "산업용 PoE 스위치", "AX-6": "A", "AX-7": "표준 패키지", "AX-8": "T1"}},
        {"id": "P-NVR", "name": "NVR", "choices": {"AX-1": "2채널", "AX-2": "E5", "AX-3": "L3", "AX-4": "소형 NVR", "AX-5": "NVR PoE 내장", "AX-6": "B", "AX-7": "표준 패키지", "AX-8": "T2"}},
    ]}


def build_glossary():
    terms = [{"term": t, "definition": d} for t, d in T.GLOSSARY]
    for t in terms:
        if t["term"] == "수송관·필터":
            t["definition"] = t["definition"].replace("소모품", "마모·교체 부품")
    terms += [
        {"term": "마모·교체 부품", "replaces": "소모품", "definition": "CPB 이송계통에서 마모·손상으로 점검·교체하는 부품 — 직관·이송배관 / 엘보·리듀서 / 플랜지·클램프 / 가스켓·안전핀(R-clip) / 엔드호스·엔드피팅. 사용 가능 여부는 두께 측정과 OEM 기준으로 판단 (DISC-038)"},
        {"term": "이벤트 복기", "definition": "event_id와 공통 시각을 기준으로 일반 CCTV·AI CCTV·바디캠·CPB 상태·부품 이력을 함께 재생·검토하는 절차 (B1-08 · FR-033 · DISC-039)"},
        {"term": "AI 판단 불가", "definition": "영상 장애(정지화면·흐림·가림·수신 끊김) 중 AI 판단이 불가한 상태 — 화면은 정상으로 표시하지 않고 이 상태를 명시한다 (FR-034)"},
        {"term": "event_id", "definition": "감지 이벤트의 고유 식별자 — 알림·클립·복기·부품 이력을 연결하는 축 (DISC-039)"},
        {"term": "부품 태그", "definition": "부품에 부착하는 QR/RFID 식별 태그 — 점검·교체 입력 시 스캔 (IF-019 · DISC-043)"},
    ]
    return {"terms": terms}


def build_scenarios(screens):
    personas = [{"name": a, "role": b, "org": c, "env": d, "goal": e, "pain": f, "surfaces": g} for a, b, c, d, e, f, g in C.PERSONAS]
    ops = []
    for key, title, rows, prep in C.SCENARIOS:
        for when, actor, a930, a1231, refs, tier in rows:
            ids, notes = parse_screen_refs(refs or "", screens, expand_apps=False)
            other = []
            for kind in ("IF", "ENT", "DISC", "WP", "ACC", "API"):
                other += parse_ids(refs or "", kind)
            ops.append({"scenario": key, "when": when, "actor": actor, "action_930": a930, "action_1231": ("same" if a1231 == "동일" else a1231),
                        "screens": ids, "refs": other, "note": (" · ".join(str(n) for n in notes if not re.match(r"^(IF|ENT|DISC|WP|ACC|API)-", str(n))) or None), "tier": "core" if tier == "핵심" else None})
    scenarios = [{"id": k, "title": t, "prep": p} for k, t, _r, p in C.SCENARIOS]
    narrative = [{"title": t, "paragraphs": list(ps)} for t, ps in C.NARRATIVE]
    return {"personas": personas, "scenarios": scenarios, "ops": ops, "narrative": narrative, "demo": []}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true")
    args = ap.parse_args()
    os.makedirs(OUT_DIR, exist_ok=True)
    scr = build_screens()
    screen_ids = [s["id"] for s in scr["screens"]]
    print("ssot ← archive (%s)" % ARCHIVE)
    dump("meta.yaml", build_meta(), args.force)
    dump("roles.yaml", build_roles(), args.force)
    dump("contract.yaml", build_contract(screen_ids), args.force)
    dump("requirements.yaml", build_requirements(screen_ids), args.force)
    dump("interfaces.yaml", build_interfaces(screen_ids), args.force)
    dump("entities.yaml", build_entities(), args.force)
    dump("screens.yaml", scr, args.force)
    dump("decisions.yaml", build_decisions(screen_ids), args.force)
    dump("options.yaml", build_options(), args.force)
    dump("glossary.yaml", build_glossary(), args.force)
    dump("scenarios.yaml", build_scenarios(screen_ids), args.force)
    print("screens %d" % len(screen_ids))


if __name__ == "__main__":
    main()
