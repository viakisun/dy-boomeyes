"""Fail closed on stale, incomplete or substituted owner capture evidence.

python tools/owner/check-review.py --repo . --manifest <capture>/manifest.json
python tools/owner/check-review.py --repo . --manifest <capture>/manifest.json --review <capture>/review
python tools/owner/check-review.py --repo . --self-test
Dependencies: PyYAML, Pillow; PDF checks also use pypdf.
"""
from __future__ import annotations

import argparse
import copy
import hashlib
import json
from pathlib import Path
import re
import subprocess
import tempfile
from urllib.parse import parse_qs, urlparse

from PIL import Image
import yaml

SIZES = {"web": [(1280, 842), (1024, 842), (768, 842), (390, 800)],
         "pwa": [(375, 800), (390, 800), (430, 900), (768, 1024)]}
# 검토안 확대 페이지: 첫 화면 아래 내용 4 + 드릴다운 현장·호기 단계 3(웹 현장·웹 호기·폰 호기)
EXPECTED_SUPPLEMENTS = {("web", "video", None), ("web", "documents", None), ("pwa", "detail", None), ("pwa", "documents", None),
                        ("web", "overview", "site"), ("web", "overview", "unit"), ("pwa", "overview", "unit")}


def sha256(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def fingerprint(repo):
    def git(*args):
        return subprocess.check_output(["git", *args], cwd=repo)
    source = git("rev-parse", "HEAD").decode().strip()
    digest = hashlib.sha256(git("diff", "HEAD", "--", ".", ":!docs/design/evidence"))
    untracked = git("ls-files", "--others", "--exclude-standard").decode().strip().splitlines()
    for name in sorted(n for n in untracked if n and not n.startswith("docs/design/evidence/")):
        digest.update(name.encode())
        digest.update((repo / name).read_bytes())
    return {"sourceSha": source, "workingTreeHash": digest.hexdigest(),
            "registryHash": sha256(repo / "ssot/screens.yaml")}


def contained_file(directory, name):
    path = (directory / name).resolve()
    if path == directory.resolve() or directory.resolve() not in path.parents:
        raise ValueError(f"File escapes evidence directory: {name}")
    if not path.is_file():
        raise ValueError(f"Evidence file is missing: {name}")
    return path


def owner_views(repo, registry, screens):
    """구현된 소유주 화면 목적 — ssot/meta.yaml owner_demo_wave 이하인 것만.

    목적 수를 고정하지 않는다: 계약·운전자처럼 아직 만들지 않은 화면은 더 높은 웨이브에
    있고, 구현되면 웨이브가 내려와 저절로 편입된다. tools/owner/views.mjs와 같은 규칙이다.
    """
    wave = yaml.safe_load((repo / "ssot/meta.yaml").read_text()).get("owner_demo_wave")
    if not isinstance(wave, int):
        raise ValueError("ssot/meta.yaml: owner_demo_wave가 없다")
    views = [
        v
        for v in registry.get("owner_demo", [])
        if all(isinstance(screens.get(v.get(app), {}).get("wave"), int) and screens[v[app]]["wave"] <= wave for app in SIZES)
    ]
    if not views or len({v.get("view") for v in views}) != len(views):
        raise ValueError("owner_demo: 구현된 화면 목적이 없거나 중복이다")
    return views

def load_evidence(repo, manifest_path):
    registry = yaml.safe_load((repo / "ssot/screens.yaml").read_text())
    clock = yaml.safe_load((repo / "ssot/meta.yaml").read_text())["fixed_clock"]
    screens = {row["id"]: row for row in registry["screens"]}
    views = owner_views(repo, registry, screens)
    expected = {}
    for view in views:
        if not view.get("question") or not view.get("source_cells"):
            raise ValueError(f"Missing customer question or source cells: {view['view']}")
        # 운영 현황은 드릴다운 3단계(전국 · 현장 · 호기)를 각각 캡처한다 — 총수는 아래 expected에서 파생
        levels = ["nation", "site", "unit"] if view["view"] == "overview" else [None]
        for app, sizes in SIZES.items():
            screen = screens.get(view.get(app))
            if not screen or "owner" not in screen["roles"]:
                raise ValueError(f"Missing owner screen: {view.get(app)}")
            for level in levels:
                suffix = f"-{level}" if level and level != "nation" else ""
                for width, height in sizes:
                    for theme in ["light", "dark"]:
                        key = f"{app}-{view['view']}{suffix}-{width}x{height}-{theme}"
                        expected[key] = {"view": view["view"], "app": app, "code": screen["id"],
                                         "width": width, "height": height, "theme": theme, "route": screen["route"]}
                        if level: expected[key]["level"] = level
    manifest = json.loads(manifest_path.read_text())
    for key, value in fingerprint(repo).items():
        if manifest.get(key) != value:
            raise ValueError(f"Evidence {key} does not match current source")
    total = len(expected)
    if (manifest.get("requiredCount"), manifest.get("expectedCount"), manifest.get("actualCount")) != (total, total, total):
        raise ValueError(f"All {total} required captures must be selected and executed")
    if manifest.get("scope") != "full" or manifest.get("status") != "automated-capture-pass" or manifest.get("exitCode") != 0:
        raise ValueError("Capture run is partial, failed or unfinished")
    if manifest.get("command", [])[:2] != ["node", "tools/capture/owner.mjs"]:
        raise ValueError("Evidence must come from the owner browser capture command")
    shots = manifest.get("shots", [])
    if len(shots) != total or {row.get("key") for row in shots} != set(expected):
        raise ValueError("Capture combinations are missing, duplicated or unexpected")
    for row in shots:
        exp = expected[row["key"]]
        if any(row.get(key) != value for key, value in exp.items()):
            raise ValueError(f"Capture identity mismatch: {row['key']}")
        if row.get("ok") is not True or row.get("status") != "automated-capture-pass" or row.get("pageErrors") or row.get("consoleErrors"):
            raise ValueError(f"Capture failed or contains runtime errors: {row['key']}")
        if any("ERR_ABORTED" not in (request.get("error") or "") for request in row.get("failedRequests", [])):
            raise ValueError(f"Unexpected failed request: {row['key']}")
        if row["view"] == "entry":
            if row.get("role") != "anonymous" or row.get("ownerId") is not None:
                raise ValueError(f"Entry must be anonymous: {row['key']}")
        elif (row.get("role"), row.get("renderedRole"), row.get("ownerId"), row.get("dataset"), row.get("clock")) != ("owner", "owner", "OWN-001", "owner", clock):
            raise ValueError(f"Wrong owner, dataset or clock: {row['key']}")
        url = urlparse(row.get("url", ""))
        query = parse_qs(url.query)
        if url.path != row["route"].replace("[device]", "CPB-001") or query.get("theme") != [row["theme"]] or query.get("capture") != ["1"] or query.get("state") != ["owner"]:
            raise ValueError(f"Capture URL disagrees with its screen: {row['key']}")
        if row["view"] == "entry" and row["app"] == "web" and query.get("demo") != ["owner"]:
            raise ValueError("Web entry is not the owner demo")
        if row.get("file") != f"{row['key']}.png":
            raise ValueError(f"Unexpected capture filename: {row['key']}")
        image = contained_file(manifest_path.parent, row["file"])
        if not re.fullmatch(r"[a-f0-9]{64}", row.get("sha256", "")) or sha256(image) != row["sha256"]:
            raise ValueError(f"Capture file hash mismatch: {row['key']}")
        with Image.open(image) as source:
            if source.size != (row["width"], row["height"]):
                raise ValueError(f"Capture image dimensions mismatch: {row['key']}")
            source.verify()
    return views, manifest


def check_review(repo, manifest_path, directory, require_visual=False):
    views, capture = load_evidence(repo, manifest_path)
    record = json.loads((directory / "review-manifest.json").read_text())
    if record.get("captureManifestSha256") != sha256(manifest_path):
        raise ValueError("Review was built from a different capture manifest")
    for key in ["sourceSha", "workingTreeHash", "registryHash"]:
        if record.get(key) != capture[key]:
            raise ValueError(f"Review source mismatch: {key}")
    if record.get("customerReview") != "not-performed":
        raise ValueError("Generated draft cannot claim actual customer acceptance")
    chosen = {(row["view"], row["app"]) for row in record.get("screens", [])}
    expected = {(row["view"], app) for row in views for app in SIZES}
    if chosen != expected or len(record.get("screens", [])) != len(expected):
        raise ValueError(f"Review must contain exactly {len(views)} views for both apps")
    capture_shots = {row["key"]: row for row in capture["shots"]}
    for row in record["screens"]:
        source = capture_shots.get(row.get("captureKey"))
        if not source or any(source.get(key) != row.get(key) for key in ["view", "app", "sha256"]):
            raise ValueError("Review screen is not linked to its actual capture")
        if row.get("file") != f"screens/{source['file']}":
            raise ValueError("Review screen file disagrees with its actual capture")
        if sha256(contained_file(directory, row["file"])) != source["sha256"]:
            raise ValueError("Review image was changed after the browser capture")
    extras = record.get("supplements", [])
    if {(e.get("app"), e.get("view"), e.get("level")) for e in extras} != EXPECTED_SUPPLEMENTS or len(extras) != len(EXPECTED_SUPPLEMENTS):
        raise ValueError("Review must expand all below-fold tasks and the drilldown levels")
    for extra in extras:
        source = capture_shots.get(extra.get("captureKey"))
        if not source or extra.get("sourceFile") != source.get("fullFile") or extra.get("sourceSha256") != source.get("fullSha256"):
            raise ValueError("Expanded image is not linked to a full actual capture")
        original = contained_file(manifest_path.parent, extra["sourceFile"])
        derived = contained_file(directory, extra["file"])
        if sha256(original) != extra["sourceSha256"] or sha256(derived) != extra["sha256"]:
            raise ValueError("Expanded capture hash mismatch")
        box = extra.get("crop", [])
        with Image.open(original) as full, Image.open(derived) as crop:
            if len(box) != 4 or not (0 <= box[0] < box[2] <= full.width and 0 <= box[1] < box[3] <= full.height):
                raise ValueError("Expanded crop is outside the captured screen")
            expected_crop = full.crop(box)
            if expected_crop.size != crop.size or expected_crop.convert("RGBA").tobytes() != crop.convert("RGBA").tobytes():
                raise ValueError("Expanded view is not an unchanged crop of the actual screen")
    artifact_names = {row["file"] for row in record.get("artifacts", [])}
    if not {"owner-review.pdf", "owner-review.html", "five-minute-demo.md"}.issubset(artifact_names):
        raise ValueError("Review artifact manifest omits PDF, HTML or demo script")
    for asset in record.get("artifacts", []):
        path = contained_file(directory, asset["file"])
        if sha256(path) != asset["sha256"]:
            raise ValueError(f"Review artifact hash mismatch: {asset['file']}")
    from pypdf import PdfReader
    reader = PdfReader(directory / "owner-review.pdf")
    if len(reader.pages) != record.get("pageCount"):
        raise ValueError("Review PDF page count mismatch")
    text = re.sub(r"\s+", "", "\n".join(page.extract_text() or "" for page in reader.pages))
    if any(re.sub(r"\s+", "", view["question"]) not in text for view in views) or "고객확인은아직진행하지않았습니다" not in text:
        raise ValueError("Required customer questions or review status missing in PDF")
    if sum(len(page.images) for page in reader.pages) != len(record["screens"]) + len(extras):
        raise ValueError("Review PDF must contain every selected screen and all expanded views")
    html = (directory / "owner-review.html").read_text()
    images = re.findall(r'<img\b[^>]*\bsrc="([^"]+)"', html)
    if len(images) != len(record["screens"]) + len(extras) or set(images) != {row["file"] for row in record["screens"] + extras}:
        raise ValueError("Review HTML does not contain every selected actual screen")
    script = (directory / "five-minute-demo.md").read_text()
    if script.count("**고객의 질문:**") != len(views) or "5:00" not in script:
        raise ValueError("Five-minute script omits scenes or its final time")
    visual_path = directory / "visual-review.json"
    visual = json.loads(visual_path.read_text()) if visual_path.exists() else None
    if require_visual and not visual:
        raise ValueError("Visual review is pending: provide visual-review.json")
    if visual:
        if not visual.get("reviewer") or not visual.get("reviewedAt") or visual.get("pdfSha256") != sha256(directory / "owner-review.pdf"):
            raise ValueError("Visual review identity or PDF hash is missing/wrong")
        pages = visual.get("pages", [])
        if len(pages) != len(reader.pages) or {p.get("page") for p in pages} != set(range(1, len(reader.pages) + 1)):
            raise ValueError("Visual review omits pages")
        if any(p.get("status") != "pass" or p.get("issues") != [] for p in pages):
            raise ValueError("Visual review has unresolved pages/issues")
    return record, bool(visual)


def self_test(repo):
    """Synthetic images exercise only rejection logic; never generate a customer artifact."""
    registry = yaml.safe_load((repo / "ssot/screens.yaml").read_text())
    screens = {row["id"]: row for row in registry["screens"]}
    views = owner_views(repo, registry, screens)
    clock = yaml.safe_load((repo / "ssot/meta.yaml").read_text())["fixed_clock"]
    with tempfile.TemporaryDirectory(prefix="owner-validator-test-") as temporary:
        directory = Path(temporary)
        # 합성 매니페스트의 조합 수는 아래에서 실제로 만든 shots 수로 채운다(리터럴 금지 — 뷰가 늘면 어긋난다)
        manifest = {**fingerprint(repo), "scope": "full", "status": "automated-capture-pass", "exitCode": 0,
                    "command": ["node", "tools/capture/owner.mjs"], "shots": []}
        for view in views:
            levels = ["nation", "site", "unit"] if view["view"] == "overview" else [None]
            for app, sizes in SIZES.items():
                screen = screens[view[app]]
                for level in levels:
                  suffix = f"-{level}" if level and level != "nation" else ""
                  for width, height in sizes:
                    for theme in ["light", "dark"]:
                        key = f"{app}-{view['view']}{suffix}-{width}x{height}-{theme}"
                        path = directory / f"{key}.png"
                        Image.new("RGB", (width, height), "white").save(path)
                        entry = view["view"] == "entry"
                        route = screen["route"]
                        url = "http://localhost:4173" + route.replace("[device]", "CPB-001") + f"?capture=1&state=owner&theme={theme}"
                        if entry and app == "web": url += "&demo=owner"
                        manifest["shots"].append({"view": view["view"], "app": app, "code": screen["id"], **({"level": level} if level else {}),
                            "key": key, "route": route, "width": width, "height": height, "theme": theme,
                            "url": url, "file": path.name, "sha256": sha256(path), "ok": True,
                            "status": "automated-capture-pass", "pageErrors": [], "consoleErrors": [],
                            "role": "anonymous" if entry else "owner", "renderedRole": "owner",
                            "ownerId": None if entry else "OWN-001", "dataset": "owner", "clock": clock})
        # 실제로 만든 조합 수로 세 필드를 채운다 — 뷰가 늘어도 합성 매니페스트가 스스로 맞는다
        total = len(manifest["shots"])
        manifest.update(requiredCount=total, expectedCount=total, actualCount=total)
        target = directory / "manifest.json"
        def run(value):
            target.write_text(json.dumps(value))
            return load_evidence(repo, target)
        run(manifest)
        cases = {
            "partial": lambda m: m.update(scope="partial"),
            "zero": lambda m: m.update(actualCount=0),
            "missing": lambda m: m["shots"].pop(),
            "duplicate": lambda m: m["shots"].__setitem__(0, m["shots"][1]),
            "wrong sha": lambda m: m.update(sourceSha="0" * 40),
            "wrong diff": lambda m: m.update(workingTreeHash="0" * 64),
            "wrong registry": lambda m: m.update(registryHash="0" * 64),
            "wrong role": lambda m: m["shots"][20].update(role="control"),
            "wrong owner": lambda m: m["shots"][20].update(ownerId="OWN-002"),
            "wrong clock": lambda m: m["shots"][20].update(clock="2020-01-01"),
            "runtime error": lambda m: m["shots"][20].update(pageErrors=["failed"]),
            "wrong URL": lambda m: m["shots"][20].update(url="http://localhost/login"),
            "wrong image hash": lambda m: m["shots"][20].update(sha256="0" * 64),
            "wrong source command": lambda m: m.update(command=["prototype"]),
        }
        for name, mutate in cases.items():
            invalid = copy.deepcopy(manifest)
            mutate(invalid)
            try: run(invalid)
            except ValueError: continue
            raise AssertionError(f"Rejection case passed: {name}")
        (directory / manifest["shots"][0]["file"]).unlink()
        try: run(manifest)
        except ValueError: pass
        else: raise AssertionError("Missing image passed")
    print(f"owner review validator: 1 valid synthetic case + {len(cases) + 1} rejection cases passed; no customer artifacts generated")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", type=Path, default=Path(__file__).resolve().parents[2])
    parser.add_argument("--manifest", type=Path)
    parser.add_argument("--review", type=Path)
    parser.add_argument("--require-visual-review", action="store_true")
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    try:
        if args.self_test: self_test(args.repo.resolve())
        elif not args.manifest: parser.error("--manifest is required")
        elif args.review:
            record, visual = check_review(args.repo.resolve(), args.manifest.resolve(), args.review.resolve(), args.require_visual_review)
            print(f"owner review check: {len(record['screens'])} screens, {record['pageCount']} PDF pages, artifact hashes OK; visual review {'pass' if visual else 'pending'}; customer review not performed")
        else:
            load_evidence(args.repo.resolve(), args.manifest.resolve())
            _, manifest = load_evidence(args.repo.resolve(), args.manifest.resolve())
            total = manifest["actualCount"]
            print(f"owner review evidence: {total}/{total}, source/registry/file hashes/owner/clock OK")
    except (ValueError, KeyError, OSError, json.JSONDecodeError) as error:
        parser.exit(1, f"owner review check FAILED: {error}\n")


if __name__ == "__main__":
    main()
