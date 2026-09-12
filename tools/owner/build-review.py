"""Build a local owner review draft exclusively from verified browser captures.

python tools/owner/build-review.py --manifest <capture>/manifest.json --font /path/to/Korean.ttf --render
Optional: --repo <checkout> --output <directory outside source or under docs/design/evidence>
Outputs: owner-review.pdf, owner-review.html, five-minute-demo.md, review-manifest.json.
Dependencies: PyYAML, Pillow, reportlab, pypdf; --render additionally uses pdftoppm.
No publishing or customer acceptance is performed.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
from html import escape
import importlib.util
import json
from pathlib import Path
import shutil
import subprocess

from PIL import Image
from reportlab.lib.pagesizes import A3, landscape, portrait
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen.canvas import Canvas
from reportlab.platypus import Paragraph

CHECK_PATH = Path(__file__).with_name("check-review.py")
SPEC = importlib.util.spec_from_file_location("owner_review_check", CHECK_PATH)
CHECK = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(CHECK)

# Narrative templates, not a screen catalog: inventory, order, labels, questions,
# routes and references are always read from owner_demo and capture evidence.
NARRATION = {
    "entry": (20, "아이디와 비밀번호로 로그인합니다.", "시연에서는 데모 계정으로 로그인을 눌러 소유주 계정으로 들어갑니다."),
    "overview": (40, "전국 지도에서 현장을 고르고, 현장의 호기를 눌러 영상과 정보를 봅니다.", "상태 띠로 가동·고장·점검·지연·보관 대수를 읽고, 현장 알약을 누르면 현장 지도와 호기 목록, 호기를 누르면 실시간 영상·계약·담당자·전압·서류가 한 패널에 옵니다. 보관 중이라는 표시만으로 투입 가능 여부를 판단하지 않습니다."),
    "fleet": (45, "호기 또는 현장명으로 검색하고 장비를 선택합니다.", "이상이 있는 장비뿐 아니라 정상 장비와 보관 장비도 같은 목록에서 찾습니다. 검색 결과 수와 선택한 장비의 현장을 함께 확인합니다."),
    "detail": (55, "계약 기간, 현장 담당자, 마지막 수신 시각을 확인합니다.", "선택한 호기를 기준으로 계약과 연락처를 확인합니다. 수신이 지연된 값은 현재 상태와 구분해서 읽고, 필요한 서류나 영상으로 이동합니다."),
    "video": (45, "타설 위치와 마스트 설치를 선택하고 가동일 저장을 재생합니다.", "영상의 용도와 시점을 따로 선택합니다. 화면의 시연 표시는 6초 샘플임을 뜻하며, 저장 영상은 끝에서 멈춥니다."),
    "documents": (50, "선택한 호기의 제작증과 검사 성적서 원문을 엽니다.", "문서 안의 장비 번호와 화면의 호기가 같은지 확인합니다. 시연 파일은 내용을 미리 본 뒤 첨부하며, 새로고침하거나 로그아웃하면 초기화됩니다."),
    "alerts": (45, "알림의 대상 호기를 확인한 뒤 장비 상세에서 연락 정보를 봅니다.", "알림을 읽었다는 표시와 장비 문제가 해소됐다는 판단을 구분합니다. 대상 장비와 현장 연락처를 확인하는 흐름을 마칩니다."),
}
ASSUMPTIONS = [
    "이 문서는 내부 검토용 초안입니다. 고객 확인은 아직 진행하지 않았습니다.",
    "장비·계약·연락처와 원문 서류는 시연용 예시입니다. 실제 인증이나 검사 결과를 대체하지 않습니다.",
    "보관 중인 장비가 즉시 투입 가능한 장비를 뜻하지는 않습니다.",
    "수신 지연·미연동·단말기 미장착은 구분하며, 과거 측정값에는 마지막 수신 시각을 표시합니다.",
    "영상은 실제 현장 스트림이 아닌 6초 샘플입니다. 저장 정책과 실제 장비 연동은 별도 확인 대상입니다.",
    "시연용 첨부는 현재 브라우저 메모리에만 남습니다. 새로고침·로그아웃 시 초기화되고 오프라인에서는 첨부하지 않습니다.",
]
INK, MUTED, RULE, PAPER, ACCENT = "#172D39", "#4A5F69", "#CAD5D9", "#F0F4F4", "#0A6166"


def find_font(explicit):
    candidates = [explicit] if explicit else [
        Path("/System/Library/Fonts/Supplemental/Arial Unicode.ttf"),
        Path("/usr/share/fonts/truetype/nanum/NanumGothic.ttf"),
        Path("/usr/share/fonts/truetype/noto/NotoSansKR-Regular.ttf"),
    ]
    for candidate in candidates:
        if candidate and candidate.is_file(): return candidate
    raise ValueError("A Korean TTF font is required; pass --font /path/to/font.ttf")


def context(views, capture):
    shots = {(row["view"], row["app"], row["width"], row["height"], row["theme"]): row for row in capture["shots"] if row.get("level") in (None, "nation")}
    result = []
    elapsed = 0
    for index, view in enumerate(views):
        if view["view"] not in NARRATION:
            raise ValueError(f"Narration template is missing for source view: {view['view']}")
        seconds, action, talk = NARRATION[view["view"]]
        next_view = views[index + 1] if index + 1 < len(views) else next(v for v in views if v["view"] == "fleet")
        result.append({**view, "number": index + 1, "action": action, "talk": talk,
                       "next": f"다음 화면: {next_view['label']}", "seconds": seconds,
                       "start": elapsed, "end": elapsed + seconds,
                       "web_shot": shots[(view["view"], "web", 1280, 842, "light")],
                       "pwa_shot": shots[(view["view"], "pwa", 390, 800, "light")]})
        elapsed += seconds
    if elapsed != 300: raise ValueError("Source narration must total exactly five minutes")
    return result


class ReviewPDF:
    def __init__(self, path, font):
        pdfmetrics.registerFont(TTFont("ReviewKorean", str(font)))
        self.w, self.h = landscape(A3)
        self.canvas = Canvas(str(path), pagesize=(self.w, self.h), invariant=1)
        self.canvas.setTitle("BoomEyes 소유주 화면 검토안")
        self.canvas.setAuthor("VIA · BoomEyes")
        self.page = 0
        self.pages = []

    def paragraph(self, text, x, y, width, size=13, color=INK, leading=None):
        style = ParagraphStyle("body", fontName="ReviewKorean", fontSize=size,
                               leading=leading or size * 1.55, textColor=color, wordWrap="CJK")
        item = Paragraph(escape(str(text)).replace("\n", "<br/>"), style)
        _, height = item.wrap(width, self.h)
        if y - height < 44: raise ValueError(f"PDF text overflows page {self.page}: {text}")
        item.drawOn(self.canvas, x, y - height)
        return y - height

    def start(self, title, subtitle="", tall=False):
        if self.page: self.canvas.showPage()
        self.w, self.h = portrait(A3) if tall else landscape(A3)
        self.canvas.setPageSize((self.w, self.h))
        self.page += 1
        self.pages.append({"page": self.page, "title": title})
        self.canvas.setFillColor(PAPER)
        self.canvas.rect(0, self.h - 111, self.w, 111, fill=1, stroke=0)
        self.paragraph("BOOMEYES / OWNER DEMO", 44, self.h - 26, self.w - 88, 10, ACCENT)
        self.paragraph(title, 44, self.h - 51, self.w - 88, 25)
        if subtitle: self.paragraph(subtitle, 44, self.h - 87, self.w - 88, 10, MUTED)
        self.canvas.setStrokeColor(RULE)
        self.canvas.line(44, 37, self.w - 44, 37)
        self.paragraph("소유주 화면 검토안 · 내부 검토용 초안", 44, 61, self.w - 150, 9, MUTED)
        self.paragraph(str(self.page), self.w - 76, 61, 32, 9, MUTED)

    def image(self, path, x, top, width, height):
        with Image.open(path) as image: iw, ih = image.size
        ratio = min(width / iw, height / ih)
        width, height = iw * ratio, ih * ratio
        self.canvas.drawImage(str(path), x, top - height, width=width, height=height, mask="auto")
        self.canvas.setStrokeColor(RULE)
        self.canvas.rect(x, top - height, width, height, fill=0, stroke=1)
        return height


# Reviewed crop rectangles in the canonical 1280px WEB / 390px PWA full captures.
# Preserve actual pixels; the manifest records source file/hash and every crop.
SUPPLEMENTS = [
    ("web", "video", None, "영상의 재생과 시간 조작", (260, 175, 1260, 1012), False),
    ("web", "documents", None, "1호기 제작증 원문", (260, 480, 1260, 1510), True),
    ("pwa", "detail", None, "휴대폰에서 계약과 현장 담당자 확인", (20, 620, 370, 1140), True),
    ("pwa", "documents", None, "휴대폰에서 제작증 원문 열람", (20, 490, 370, 1180), True),
    ("web", "overview", "site", "현장 단계 — 마포 주상복합 신축의 호기 5대", (56, 160, 1280, 842), False),
    ("web", "overview", "unit", "호기 단계 — 1호기 실시간 영상·계약·담당자", (56, 160, 1280, 842), False),
    ("pwa", "overview", "unit", "휴대폰 호기 단계 — 시트에서 영상·계약·전압·서류", (20, 320, 370, 1700), True),
]

def supplement_images(output, directory, capture):
    result = []
    for app, view, level, title, box, tall in SUPPLEMENTS:
        row = next(s for s in capture["shots"] if s["app"] == app and s["view"] == view and s.get("level") == (level or ("nation" if view == "overview" else None)) and s["theme"] == "light" and s["width"] == (1280 if app == "web" else 390))
        path = CHECK.contained_file(directory, row["fullFile"])
        if CHECK.sha256(path) != row["fullSha256"]: raise ValueError("Full capture hash mismatch")
        with Image.open(path) as source:
            if not (0 <= box[0] < box[2] <= source.width and 0 <= box[1] < box[3] <= source.height):
                raise ValueError("Supplement crop exceeds actual capture")
            name = f"screens/{app}-{view}{'-' + level if level else ''}-expanded.png"
            source.crop(box).save(output / name)
        result.append({"app": app, "view": view, "level": level, "title": title, "tall": tall,
                       "captureKey": row["key"], "sourceFile": row["fullFile"], "sourceSha256": row["fullSha256"],
                       "crop": list(box), "file": name, "sha256": CHECK.sha256(output / name)})
    return result


def pdf_document(output, scenes, capture, font, supplements):
    pdf = ReviewPDF(output / "owner-review.pdf", font)
    pdf.start("내 장비를 찾고, 현장 확인까지", "소유주를 위한 PC·휴대폰 데모 화면")
    y = pdf.paragraph("보유 장비의 현장과 상태를 찾고, 계약·담당자·서류·영상으로 이어지는 흐름을 살펴봅니다.", 58, pdf.h - 168, 780, 25)
    y = pdf.paragraph("같은 호기를 기준으로 PC와 휴대폰에서 필요한 정보를 확인합니다.", 58, y - 26, 780, 17, MUTED)
    for scene in scenes:
        y = pdf.paragraph(f"{scene['number']:02}  {scene['label']}  /  {scene['question']}", 58, y - 20, pdf.w - 116, 15)
    pdf.paragraph("고객 확인은 아직 진행하지 않았습니다. 이 자료는 검토를 위한 로컬 초안입니다.", 58, 134, pdf.w - 116, 12, MUTED)
    for scene in scenes:
        pdf.start(f"{scene['number']:02}  {scene['label']}", "PC 첫 화면 · 영상·서류의 하단 내용은 뒤의 확대 페이지에서 확인")
        image_width = 808
        pdf.image(output / "screens" / scene["web_shot"]["file"], 44, pdf.h - 139, image_width, 582)
        x, width, y = 879, pdf.w - 923, pdf.h - 143
        y = pdf.paragraph("확인할 질문", x, y, width, 11, ACCENT)
        y = pdf.paragraph(scene["question"], x, y - 13, width, 19)
        y = pdf.paragraph("화면에서 해볼 일", x, y - 29, width, 11, ACCENT)
        y = pdf.paragraph(scene["action"], x, y - 13, width, 14)
        y = pdf.paragraph(scene["talk"], x, y - 22, width, 12, MUTED)
        pdf.paragraph(scene["next"], x, y - 25, width, 12)
    for first in range(0, len(scenes), 2):
        pair = scenes[first:first + 2]
        pdf.start("휴대폰에서 이어서 확인하기", "휴대폰 첫 화면 · 계약·원문은 뒤의 확대 페이지에서 확인")
        cell_width = (pdf.w - 110) / 2
        for column, scene in enumerate(pair):
            x = 44 + column * (cell_width + 22)
            pdf.paragraph(f"{scene['number']:02}  {scene['label']}", x, pdf.h - 137, cell_width, 17)
            pdf.image(output / "screens" / scene["pwa_shot"]["file"], x, pdf.h - 177, 269, 552)
            tx, tw, y = x + 289, cell_width - 289, pdf.h - 179
            y = pdf.paragraph(scene["question"], tx, y, tw, 17)
            y = pdf.paragraph(scene["action"], tx, y - 26, tw, 13)
            pdf.paragraph(scene["next"], tx, y - 26, tw, 11, MUTED)
    for extra in supplements:
        pdf.start(extra["title"], "같은 호기의 실제 화면 확대 · 첫 화면 아래에서 이어지는 내용", tall=extra["tall"])
        pdf.image(output / extra["file"], 44, pdf.h - 140, pdf.w - 88, pdf.h - 220)
    pdf.start("검토 전에 알아둘 시연 조건", "예시 데이터와 실제 운영 판단을 구분합니다")
    y = pdf.h - 143
    for index, assumption in enumerate(ASSUMPTIONS):
        y = pdf.paragraph(f"{index + 1}. {assumption}", 55, y, pdf.w - 110, 15) - 20
    pdf.start("원문 근거와 빌드 기록", "부록 · 검토용 추적 정보")
    y = pdf.paragraph("고객 요구사항: 신규 사업 검토 CPB 사업 검토 자료 V5 (2026-09-08), 관제기능 시트", 55, pdf.h - 139, pdf.w - 110, 13)
    for scene in scenes:
        y = pdf.paragraph(f"{scene['label']}  |  {', '.join(scene['source_cells'])}  |  PC {scene['web']} / 휴대폰 {scene['pwa']}", 55, y - 15, pdf.w - 110, 12)
    evidence = [
        "캡처 조합: PC·휴대폰 7종(운영 현황은 전국·현장·호기 3단계) × 4화면 크기 × 라이트·다크 = 144 / 144",
        f"캡처 시각: {capture.get('createdAt', '미기록')}",
        f"시연 기준 시각: {next(s['clock'] for s in capture['shots'] if s['view'] != 'entry')}",
        f"소스 커밋: {capture['sourceSha']}",
        f"작업 내용 해시: {capture['workingTreeHash']}",
        f"화면 원천 해시: {capture['registryHash']}",
        f"캡처 육안 검토 상태: {capture.get('visualReview', 'pending')}",
        "자동 캡처 검사는 실제 고객 검토나 운영 환경 검증을 뜻하지 않습니다.",
    ]
    for line in evidence: y = pdf.paragraph(line, 55, y - 12, pdf.w - 110, 10, MUTED)
    pdf.canvas.save()
    return pdf.pages


def html_document(output, scenes, capture, supplements):
    nav = "".join(f'<a href="#{s["view"]}">{s["number"]}. {escape(s["label"])}</a>' for s in scenes)
    sections = []
    for scene in scenes:
        shots = "".join(f'<figure><figcaption>{app}</figcaption><a href="screens/{scene[key]["file"]}" target="_blank"><img src="screens/{scene[key]["file"]}" alt="{escape(scene["label"])} {app} 실제 데모 화면"></a></figure>' for app, key in [("PC", "web_shot"), ("휴대폰", "pwa_shot")])
        sections.append(f'<section id="{scene["view"]}"><p class="eyebrow">{scene["number"]:02} / {escape(scene["label"])}</p><h2>{escape(scene["question"])}</h2><p class="action">{escape(scene["action"])}</p><p>{escape(scene["talk"])}</p><div class="screens">{shots}</div><p class="next">{escape(scene["next"])}</p></section>')
    expanded = "".join(f'<section><h2>{escape(e["title"])}</h2><p>같은 호기의 실제 화면 확대</p><a href="{e["file"]}" target="_blank"><img style="max-width:800px" src="{e["file"]}" alt="{escape(e["title"])}"></a></section>' for e in supplements)
    assumptions = "".join(f"<li>{escape(text)}</li>" for text in ASSUMPTIONS)
    rows = "".join(f'<tr><th>{escape(s["label"])}</th><td>{escape(", ".join(s["source_cells"]))}</td><td>{s["web"]} / {s["pwa"]}</td></tr>' for s in scenes)
    style = """*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;color:#172D39;background:#F0F4F4;font:17px/1.65 system-ui,sans-serif}header,main,footer{max-width:1280px;margin:auto;padding:32px}header{padding-top:56px}h1{font-size:42px;line-height:1.2}h2{font-size:29px;line-height:1.4}nav{display:flex;flex-wrap:wrap;gap:12px}a{color:#075A60}nav a{padding:12px 16px;background:white;border:1px solid #CAD5D9;border-radius:8px}section{padding:30px;background:white;border:1px solid #CAD5D9;border-radius:12px;margin:24px 0;scroll-margin-top:24px}.eyebrow{color:#0A6166;font-weight:650}.action{font-size:21px}.screens{display:grid;grid-template-columns:minmax(0,3fr) minmax(200px,1fr);gap:24px;align-items:start}figure{margin:0}figcaption{font-weight:650;margin:12px 0}img{width:100%;height:auto;border:1px solid #CAD5D9}p,li,td{overflow-wrap:anywhere}li{margin:12px 0}table{width:100%;border-collapse:collapse;font-size:15px}th,td{text-align:left;padding:12px;border-bottom:1px solid #CAD5D9}.next{font-weight:650}code{font-size:13px}footer{font-size:14px}a:focus-visible{outline:3px solid #0A6166;outline-offset:4px}@media(max-width:700px){header,main,footer{padding:20px}h1{font-size:32px}h2{font-size:25px}section{padding:20px}.screens{grid-template-columns:1fr}.screens figure:last-child{max-width:390px;margin:auto}}@media print{@page{size:A3 landscape;margin:14mm}body{background:white}nav{display:none}header,main,footer{max-width:none;padding:0}section{break-before:page;border:0;padding:0}.screens{grid-template-columns:3fr 1fr}a{color:inherit;text-decoration:none}}"""
    html = f'<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BoomEyes 소유주 화면 검토안</title><style>{style}</style></head><body><header><p class="eyebrow">BOOMEYES / OWNER DEMO</p><h1>내 장비를 찾고, 현장 확인까지</h1><p>소유주 화면 검토안 · 내부 검토용 초안</p><nav aria-label="검토 화면">{nav}</nav></header><main>{"".join(sections)}{expanded}<section><h2>시연 조건</h2><ol>{assumptions}</ol></section><section><h2>부록 · 원문 근거와 빌드 기록</h2><p>2026-09-08 V5 · 관제기능 시트</p><table><thead><tr><th>화면</th><th>원문 셀</th><th>검토 코드 (PC / 폰)</th></tr></thead><tbody>{rows}</tbody></table><p>전체 자동 캡처 144 / 144(운영 현황은 전국·현장·호기 3단계). 고객 확인은 아직 진행하지 않았습니다.</p><p>소스 커밋 <code>{capture["sourceSha"]}</code><br>작업 내용 해시 <code>{capture["workingTreeHash"]}</code><br>원천 해시 <code>{capture["registryHash"]}</code></p></section></main><footer>로컬 검토용 자료입니다. 화면 이미지를 선택하면 원래 크기로 열립니다.</footer></body></html>'
    (output / "owner-review.html").write_text(html, encoding="utf-8")


def script_document(output, scenes):
    def time(seconds): return f"{seconds // 60}:{seconds % 60:02}"
    lines = ["# 소유주 데모 5분 대본", "", "내부 리허설용 초안. 고객 확인은 아직 진행하지 않았습니다.", "", "PC 또는 휴대폰 하나를 주 화면으로 사용합니다. 같은 호기에서 계약·담당자·영상·서류로 이어갑니다.", ""]
    for scene in scenes:
        lines += [f"## {time(scene['start'])}–{time(scene['end'])} · {scene['label']}", "", f"**고객의 질문:** {scene['question']}", "", f"**화면에서:** {scene['action']}", "", f"**설명:** {scene['talk']}", "", f"**이어서:** {scene['next']}", ""]
    lines += ["## 시연 전에 확인", "", "- 데모 시작 화면을 열고 장비·계약·담당자·원문 파일이 표시되는지 확인합니다.", "- 저장 영상은 6초 샘플이며, 첨부는 새로고침 시 사라진다고 안내합니다.", "- 고객 의견은 별도 기록합니다. 내부 리허설을 실제 고객 검토로 표시하지 않습니다.", ""]
    (output / "five-minute-demo.md").write_text("\n".join(lines), encoding="utf-8")


def render_pages(output, pages):
    directory = output / "rendered-pages"
    directory.mkdir()
    subprocess.run(["pdftoppm", "-png", "-scale-to", "1800", str(output / "owner-review.pdf"), str(directory / "page")], check=True)
    images = sorted(directory.glob("page-*.png"))
    if len(images) != len(pages): raise ValueError("Rendered PDF page count mismatch")
    cards = "".join(f'<article><h2>{page["page"]}. {escape(page["title"])}</h2><a href="{image.name}"><img src="{image.name}" alt="검토 PDF {page["page"]}페이지"></a></article>' for page, image in zip(pages, images))
    (directory / "index.html").write_text(f'<!doctype html><html lang="ko"><meta charset="utf-8"><title>PDF 전체 페이지 검토</title><style>body{{font:16px system-ui;background:#eee;padding:24px}}img{{width:100%;max-width:1500px}}article{{margin:40px auto;max-width:1500px}}</style><h1>PDF 전체 페이지 검토 · {len(pages)}페이지</h1>{cards}</html>')
    return [{"page": page["page"], "file": f"rendered-pages/{image.name}", "sha256": CHECK.sha256(image)} for page, image in zip(pages, images)]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", type=Path, default=Path(__file__).resolve().parents[2])
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--font", type=Path)
    parser.add_argument("--render", action="store_true")
    args = parser.parse_args()
    repo, manifest_path = args.repo.resolve(), args.manifest.resolve()
    output = (args.output or manifest_path.parent / "review").resolve()
    try:
        if output.exists(): raise ValueError(f"Output already exists; choose a new directory: {output}")
        if repo in output.parents and repo / "docs/design/evidence" not in output.parents:
            raise ValueError("Output inside the checkout must be under docs/design/evidence to preserve the capture source fingerprint")
        views, capture = CHECK.load_evidence(repo, manifest_path)
        scenes = context(views, capture)
        font = find_font(args.font)
        output.mkdir(parents=True)
        (output / "screens").mkdir()
        selected = []
        for scene in scenes:
            for app in ["web", "pwa"]:
                shot = scene[f"{app}_shot"]
                shutil.copyfile(manifest_path.parent / shot["file"], output / "screens" / shot["file"])
                selected.append({"view": scene["view"], "app": app, "captureKey": shot["key"],
                                 "file": f"screens/{shot['file']}", "sha256": shot["sha256"]})
        supplements = supplement_images(output, manifest_path.parent, capture)
        pages = pdf_document(output, scenes, capture, font, supplements)
        html_document(output, scenes, capture, supplements)
        script_document(output, scenes)
        rendered = render_pages(output, pages) if args.render else []
        if any(CHECK.fingerprint(repo)[key] != capture[key] for key in ["sourceSha", "workingTreeHash", "registryHash"]):
            raise ValueError("Source changed during generation; generated output is not valid review evidence")
        artifacts = [{"file": path.relative_to(output).as_posix(), "sha256": CHECK.sha256(path)} for path in sorted(output.rglob("*")) if path.is_file()]
        record = {**{key: capture[key] for key in ["sourceSha", "workingTreeHash", "registryHash"]},
                  "captureManifestSha256": CHECK.sha256(manifest_path), "captureManifest": str(manifest_path),
                  "generatedAt": datetime.now(timezone.utc).isoformat(), "status": "generated-awaiting-visual-review",
                  "customerReview": "not-performed", "visualReview": "pending", "pageCount": len(pages),
                  "pages": pages, "screens": selected, "supplements": supplements, "renderedPages": rendered, "fontSha256": CHECK.sha256(font),
                  "artifacts": artifacts}
        (output / "review-manifest.json").write_text(json.dumps(record, ensure_ascii=False, indent=2) + "\n")
        CHECK.check_review(repo, manifest_path, output)
        print(f"owner review generated: 14 actual screen captures, {len(pages)} PDF pages, 5-minute script → {output}")
        print("Visual review pending. Customer review not performed. No publishing was performed.")
    except (ValueError, KeyError, OSError, json.JSONDecodeError) as error:
        parser.exit(1, f"owner review generation FAILED: {error}\n")


if __name__ == "__main__":
    main()
