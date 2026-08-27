from __future__ import annotations
import re
from .util import clean_ws

CTA_LINES = [
    "Save this clip. Ship the launch.",
    "Try it this week. Keep the weekend.",
    "Ready when you are — start free.",
]

def write_script(extracted: dict) -> dict:
    title = clean_ws(extracted.get("title") or "Untitled")
    subtitle = clean_ws(extracted.get("subtitle") or "")
    bullets = [clean_ws(b) for b in (extracted.get("bullets") or []) if clean_ws(b)]
    pages = extracted.get("pages") or []
    hook = _hook(title if len(title) > 18 or not subtitle else subtitle)
    points = _pick_points(bullets, title, subtitle)
    proof = _find_proof(bullets + [p.get("text") or "" for p in pages])
    beats = []
    beats.append(_beat(0, "hook", hook, subtitle or "A 20-second cut of the story that matters.", hook, _img(pages, 0)))
    for i, pt in enumerate(points[:5]):
        beats.append(_beat(len(beats), "point", _short_head(pt), pt, _speak(pt), _img(pages, i + 1)))
    if proof and len(beats) < 7:
        beats.append(_beat(len(beats), "proof", proof["head"], proof["body"], proof["head"], _img(pages, -1)))
    if len(beats) < 5:
        extra = bullets[len(points):] or [subtitle, "Built for indie teams who ship without a video editor."]
        for e in extra:
            if e and len(beats) < 5:
                beats.append(_beat(len(beats), "point", _short_head(e), e, _speak(e), _img(pages, len(beats))))
    cta = CTA_LINES[len(title) % len(CTA_LINES)]
    beats.append(_beat(len(beats), "cta", cta, title, cta, _img(pages, 0)))
    beats = beats[:8]
    if len(beats) < 5:
        beats.insert(1, _beat(1, "point", "The problem, cut short", "Stop rebuilding the same story for every channel.", "Stop rebuilding the same story for every channel.", _img(pages, 0)))
    n = len(beats)
    total = 22.0 if n >= 6 else 18.0
    each = round(total / n, 2)
    each = min(4.2, max(2.8, each))
    for i, b in enumerate(beats):
        b["index"] = i
        b["duration"] = each
    total = round(sum(b["duration"] for b in beats), 2)
    if total < 15:
        beats[-1]["duration"] += 15 - total
        total = 15.0
    if total > 30:
        scale = 30 / total
        for b in beats:
            b["duration"] = round(b["duration"] * scale, 2)
        total = round(sum(b["duration"] for b in beats), 2)
    caption = _caption(title, points, cta)
    return {"title": title, "beats": beats, "caption": caption, "duration": total}

def _beat(i, kind, headline, support, caption, image):
    return {
        "index": i, "kind": kind,
        "headline": clean_ws(headline)[:72],
        "support": clean_ws(support)[:180],
        "caption": clean_ws(caption)[:110],
        "duration": 3.4, "image": image,
    }

def _img(pages, i):
    if not pages:
        return None
    if i < 0:
        i = len(pages) - 1
    pg = pages[i % len(pages)]
    return pg.get("image")

def _hook(title):
    t = title.rstrip(".")
    if len(t) <= 42:
        return t
    return t[:39].rsplit(" ", 1)[0] + "…"

def _short_head(s):
    s = re.sub(r"^[\-\*•]\s*", "", s)
    words = s.split()
    if len(s) <= 36:
        return s.rstrip(".")
    return " ".join(words[:5]).rstrip(",.;")

def _speak(s):
    s = clean_ws(s)
    if len(s) > 90:
        s = s[:87].rsplit(" ", 1)[0] + "."
    return s

def _pick_points(bullets, title, subtitle):
    out = []
    seen = set()
    for b in bullets:
        key = b.lower()
        if key == title.lower() or key == subtitle.lower():
            continue
        if "fixture" in key or "public domain" in key:
            continue
        if len(b) < 28:
            continue
        if key in seen:
            continue
        seen.add(key)
        out.append(b)
        if len(out) >= 5:
            break
    return out

def _find_proof(texts):
    pat = re.compile(r"(\d+\s?%|\d+[kKmM]\+?|USD\s?[\d,]+|\d+x)")
    for t in texts:
        m = pat.search(t)
        if m:
            return {"head": m.group(1) + " that lands", "body": clean_ws(t)[:160]}
    return None

def _caption(title, points, cta):
    p1 = points[0] if points else "A short clip from the deck."
    bits = [title.rstrip(".") + ".", _speak(p1), cta, "", "#indiehackers #b2b #content"]
    return "\n".join(bits)
