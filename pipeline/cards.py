from __future__ import annotations
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageEnhance

W, H = 1080, 1920
INK = (11, 12, 16, 255)
PAPER = (247, 243, 234, 255)
GOLD = (232, 163, 23, 255)
MUTED = (168, 160, 142, 255)
SOFT = (42, 43, 52, 255)

def _font(size, bold=False, serif=False):
    candidates = []
    if serif:
        candidates += [
            "/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf" if bold else "/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf",
        ]
    candidates += [
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for c in candidates:
        if Path(c).exists():
            return ImageFont.truetype(c, size)
    return ImageFont.load_default()

def _wrap(draw, text, font, max_w):
    words = (text or "").split()
    lines, cur = [], ""
    for w in words:
        trial = (cur + " " + w).strip()
        if draw.textlength(trial, font=font) <= max_w:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines or [""]

def render_cards(script: dict, work: Path, watermark: bool = True) -> list:
    out_dir = work / "cards"
    out_dir.mkdir(parents=True, exist_ok=True)
    beats = script.get("beats") or []
    n = max(1, len(beats))
    paths = []
    for i, beat in enumerate(beats):
        img = _card(beat, i, n, watermark)
        dest = out_dir / f"card-{i:02d}.png"
        img.save(dest, "PNG")
        paths.append(str(dest))
        beat["card"] = str(dest)
    return paths

def _card(beat, i, n, watermark):
    canvas = Image.new("RGBA", (W, H), INK)
    bg_path = beat.get("image")
    if bg_path and Path(bg_path).exists():
        try:
            bg = Image.open(bg_path).convert("RGB")
            bg = _cover(bg, W, H).convert("RGBA")
            bg = ImageEnhance.Brightness(bg).enhance(0.38)
            bg = ImageEnhance.Color(bg).enhance(0.55)
            bg = bg.filter(ImageFilter.GaussianBlur(6))
            canvas = Image.alpha_composite(canvas, bg)
        except Exception:
            pass
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    d.rectangle((0, 0, W, 220), fill=(7, 8, 10, 90))
    d.rectangle((0, H - 340, W, H), fill=(7, 8, 10, 130))
    d.rectangle((72, 168, 180, 176), fill=GOLD)
    kind = (beat.get("kind") or "beat").upper()
    label = f"{kind}  ·  {i+1:02d} / {n:02d}"
    d.text((72, 96), label, font=_font(28, bold=True), fill=GOLD)
    head_font = _font(86, bold=True, serif=True)
    lines = _wrap(d, beat.get("headline") or "", head_font, W - 160)
    y = 430
    for line in lines[:4]:
        d.text((72, y), line, font=head_font, fill=PAPER)
        y += 102
    y += 28
    d.rectangle((72, y, 200, y + 6), fill=GOLD)
    y += 40
    body_font = _font(40)
    for line in _wrap(d, beat.get("support") or "", body_font, W - 180)[:4]:
        d.text((72, y), line, font=body_font, fill=MUTED)
        y += 56
    cap = beat.get("caption") or ""
    if cap:
        cap_font = _font(32, bold=True)
        cap_lines = _wrap(d, cap, cap_font, W - 200)
        box_h = 48 + 44 * len(cap_lines)
        top = H - 280
        d.rounded_rectangle((56, top, W - 56, top + box_h), radius=28, fill=(20, 21, 28, 210), outline=SOFT, width=2)
        cy = top + 22
        for line in cap_lines:
            d.text((88, cy), line, font=cap_font, fill=PAPER)
            cy += 44
    if watermark:
        wm = _font(26, bold=True)
        d.text((72, H - 64), "DECKCLIP  ·  FREE", font=wm, fill=(232, 163, 23, 180))
    else:
        d.text((72, H - 64), "DECKCLIP", font=_font(22, bold=True), fill=(138, 129, 114, 160))
    return Image.alpha_composite(canvas, overlay).convert("RGB")

def _cover(im, tw, th):
    w, h = im.size
    scale = max(tw / w, th / h)
    nw, nh = int(w * scale), int(h * scale)
    im = im.resize((nw, nh), Image.Resampling.LANCZOS)
    left = (nw - tw) // 2
    top = (nh - th) // 2
    return im.crop((left, top, left + tw, top + th))
