#!/usr/bin/env python3
"""Prove the pipeline: fixture PDF -> real H.264 MP4."""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from pipeline.render import run_job
from pipeline.video import probe_duration

def main():
    pdf = ROOT / "fixtures" / "sample-deck.pdf"
    if not pdf.exists():
        import subprocess
        subprocess.check_call([sys.executable, str(ROOT / "scripts" / "generate-sample-pdf.py")])
    out = ROOT / "fixtures" / "sample.mp4"
    work = ROOT / "fixtures" / "sample-work"
    result = run_job(str(pdf), work, out, watermark=True)
    dur = result.get("duration") or 0
    size = out.stat().st_size if out.exists() else 0
    print("SAMPLE_OK", out, "bytes", size, "duration", round(dur, 2), "beats", result.get("beats"))
    if not out.exists() or size < 20_000:
        raise SystemExit("sample mp4 missing or too small")
    if dur < 12 or dur > 36:
        print("WARN duration outside 15-30s window:", dur)
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
