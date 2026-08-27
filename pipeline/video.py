from __future__ import annotations
import math
import re
from pathlib import Path
from .util import FFMPEG, FFPROBE, run

W, H, FPS = 1080, 1920, 30

def render_video(script: dict, work: Path, out_mp4: Path, watermark: bool = True) -> Path:
    work = Path(work)
    clips_dir = work / "clips"
    clips_dir.mkdir(parents=True, exist_ok=True)
    beats = script.get("beats") or []
    clip_paths = []
    audio_paths = []
    for i, beat in enumerate(beats):
        card = beat.get("card")
        if not card or not Path(card).exists():
            raise RuntimeError("missing card for beat " + str(i))
        dur = float(beat.get("duration") or 3.4)
        clip = clips_dir / f"clip-{i:02d}.mp4"
        _kenburns(card, clip, dur, i)
        clip_paths.append(clip)
        wav = clips_dir / f"vo-{i:02d}.wav"
        if _tts(beat.get("caption") or beat.get("headline") or "", wav, dur):
            audio_paths.append(wav)
        else:
            audio_paths.append(None)
    concat = work / "concat.txt"
    concat.write_text("".join(f"file {c.resolve()}\n" for c in clip_paths), encoding="utf-8")
    silent = work / "video-silent.mp4"
    run([FFMPEG, "-y", "-f", "concat", "-safe", "0", "-i", str(concat),
         "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", str(FPS), str(silent)])
    out_mp4 = Path(out_mp4)
    out_mp4.parent.mkdir(parents=True, exist_ok=True)
    if any(audio_paths):
        audio = work / "voice.wav"
        _concat_audio(audio_paths, [float(b.get("duration") or 3.4) for b in beats], audio)
        run([FFMPEG, "-y", "-i", str(silent), "-i", str(audio),
             "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k",
             "-shortest", "-movflags", "+faststart", str(out_mp4)])
    else:
        run([FFMPEG, "-y", "-i", str(silent), "-c:v", "libx264", "-pix_fmt", "yuv420p",
             "-an", "-movflags", "+faststart", str(out_mp4)])
    return out_mp4

def _kenburns(png, dest, dur, idx):
    frames = max(8, int(round(dur * FPS)))
    # Alternate zoom in / zoom out
    if idx % 2 == 0:
        zexpr = "1.0+0.0014*on"
    else:
        zexpr = "1.12-0.0014*on"
    vf = (
        f"scale=1300:2311,zoompan=z={zexpr}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'"
        f":d={frames}:s={W}x{H}:fps={FPS},format=yuv420p"
    )
    run([FFMPEG, "-y", "-loop", "1", "-i", str(png), "-vf", vf, "-t", f"{dur:.2f}",
         "-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "veryfast", str(dest)])

def _safe_flite(text: str) -> str:
    t = re.sub(r"[^A-Za-z0-9 .,!?\-]+", " ", text)
    t = re.sub(r"\s+", " ", t).strip()
    return t[:90] or "Deck Clip"

def _tts(text, dest, dur) -> bool:
    spoken = _safe_flite(text)
    dest = Path(dest)
    try:
        run([FFMPEG, "-y", "-f", "lavfi", "-i", "flite=text='" + spoken.replace("'", "") + "':voice=kal16",
             "-t", f"{max(dur, 0.8):.2f}", str(dest)], timeout=30)
        return dest.exists() and dest.stat().st_size > 200
    except Exception:
        try:
            run([FFMPEG, "-y", "-f", "lavfi", "-i", f"flite=text={spoken}:voice=kal",
                 "-t", f"{max(dur, 0.8):.2f}", str(dest)], timeout=30)
            return dest.exists() and dest.stat().st_size > 200
        except Exception:
            return False

def _concat_audio(wavs, durs, dest):
    parts = []
    tmp = dest.parent / "audio-parts"
    tmp.mkdir(exist_ok=True)
    for i, (wav, dur) in enumerate(zip(wavs, durs)):
        piece = tmp / f"a-{i:02d}.wav"
        if wav and Path(wav).exists():
            run([FFMPEG, "-y", "-i", str(wav), "-af",
                 f"aresample=44100,apad=whole_dur={dur:.2f}", "-t", f"{dur:.2f}", str(piece)])
        else:
            run([FFMPEG, "-y", "-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono",
                 "-t", f"{dur:.2f}", str(piece)])
        parts.append(piece)
    lst = dest.parent / "audio.txt"
    lst.write_text("".join(f"file {p.resolve()}\n" for p in parts), encoding="utf-8")
    run([FFMPEG, "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "pcm_s16le", str(dest)])

def probe_duration(path) -> float:
    p = run([FFPROBE, "-v", "error", "-show_entries", "format=duration",
             "-of", "default=noprint_wrappers=1:nokey=1", str(path)])
    try:
        return float((p.stdout or "0").strip())
    except Exception:
        return 0.0
