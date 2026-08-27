import json, os, re, shutil, subprocess, time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FFMPEG = os.environ.get("FFMPEG", "ffmpeg")
FFPROBE = os.environ.get("FFPROBE", "ffprobe")
PDFTOTXT = os.environ.get("PDFTOTXT", "pdftotext")
PDFTOPPM = os.environ.get("PDFTOPPM", "pdftoppm")


def which(name):
    return shutil.which(name)


def run(cmd, cwd=None, timeout=180):
    p = subprocess.run(
        cmd,
        cwd=cwd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        timeout=timeout,
        text=True,
    )
    if p.returncode != 0:
        raise RuntimeError(
            "cmd failed (" + str(p.returncode) + "): " + " ".join(cmd) + "\n" + (p.stderr or "")[-2000:]
        )
    return p


def write_json(path, data):
    Path(path).write_text(json.dumps(data, indent=2), encoding="utf-8")


def read_json(path, default=None):
    p = Path(path)
    if not p.exists():
        return default
    return json.loads(p.read_text(encoding="utf-8"))


def slug(s, n=48):
    s = re.sub(r"[^a-zA-Z0-9]+", "-", (s or "").strip()).strip("-").lower()
    return (s or "clip")[:n]


def clean_ws(s):
    return re.sub(r"\s+", " ", (s or "").replace("\x00", "")).strip()


def progress(job_dir, stage, pct, message):
    write_json(
        Path(job_dir) / "progress.json",
        {"stage": stage, "percent": pct, "message": message, "ts": time.time()},
    )
