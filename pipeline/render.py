#!/usr/bin/env python3
from __future__ import annotations
import argparse, json, sys, traceback
from pathlib import Path

# Allow running as a script: python3 pipeline/render.py
if __name__ == "__main__" and (__package__ is None or __package__ == ""):
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
    from pipeline.util import progress, write_json
    from pipeline.extract import extract_source
    from pipeline.script import write_script
    from pipeline.cards import render_cards
    from pipeline.video import render_video, probe_duration
else:
    from .util import progress, write_json
    from .extract import extract_source
    from .script import write_script
    from .cards import render_cards
    from .video import render_video, probe_duration

def run_job(source: str, work: Path, out: Path, watermark: bool = True) -> dict:
    work = Path(work)
    work.mkdir(parents=True, exist_ok=True)
    progress(work, "extracting", 8, "Reading deck or URL")
    extracted = extract_source(source, work / "extract")
    write_json(work / "extracted.json", extracted)
    progress(work, "scripting", 28, "Writing 5-8 beat script")
    script = write_script(extracted)
    write_json(work / "script.json", script)
    (work / "caption.txt").write_text(script.get("caption") or "", encoding="utf-8")
    progress(work, "cards", 48, "Rendering motion cards")
    render_cards(script, work, watermark=watermark)
    write_json(work / "script.json", script)
    progress(work, "rendering", 70, "Encoding H.264 clip")
    render_video(script, work, out, watermark=watermark)
    dur = 0.0
    try:
        dur = probe_duration(out)
    except Exception:
        dur = script.get("duration") or 0
    result = {
        "ok": True,
        "output": str(out),
        "duration": dur,
        "beats": len(script.get("beats") or []),
        "caption": script.get("caption") or "",
        "title": script.get("title") or "",
        "watermark": watermark,
    }
    write_json(work / "result.json", result)
    progress(work, "done", 100, "Clip ready")
    return result

def main():
    ap = argparse.ArgumentParser(description="DeckClip render pipeline")
    ap.add_argument("--input", help="PDF / PPTX path")
    ap.add_argument("--url", help="Public landing URL")
    ap.add_argument("--out", required=True, help="Output MP4 path")
    ap.add_argument("--work", help="Working directory")
    ap.add_argument("--watermark", action="store_true")
    ap.add_argument("--no-watermark", action="store_true")
    args = ap.parse_args()
    source = args.url or args.input
    if not source:
        ap.error("pass --input or --url")
    out = Path(args.out)
    work = Path(args.work) if args.work else out.parent / (out.stem + "-work")
    watermark = not args.no_watermark
    if args.watermark:
        watermark = True
    try:
        result = run_job(source, work, out, watermark=watermark)
        print(json.dumps(result, indent=2))
    except Exception as e:
        progress(work, "error", 0, str(e)[:240])
        write_json(work / "result.json", {"ok": False, "error": str(e)})
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
