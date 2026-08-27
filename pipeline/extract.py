from __future__ import annotations
import html as htmlmod
import re
import zipfile
from pathlib import Path
from urllib.request import Request, urlopen
from xml.etree import ElementTree as ET
from .util import PDFTOPPM, PDFTOTXT, clean_ws, run

A_NS = "{http://schemas.openxmlformats.org/drawingml/2006/main}"


def extract_source(source: str, work: Path) -> dict:
    work.mkdir(parents=True, exist_ok=True)
    s = (source or "").strip()
    if re.match(r"^https?://", s, re.I):
        return extract_url(s, work)
    path = Path(s)
    if not path.exists():
        raise FileNotFoundError("input not found: " + s)
    ext = path.suffix.lower()
    if ext == ".pdf":
        return extract_pdf(path, work)
    if ext == ".pptx":
        return extract_pptx(path, work)
    if ext == ".ppt":
        raise RuntimeError("Legacy .ppt is not supported. Export as .pptx or PDF.")
    raise RuntimeError("Unsupported file type: " + ext + ". Use PDF, PPTX, or a public URL.")


def extract_pdf(path: Path, work: Path) -> dict:
    txt_path = work / "pdf.txt"
    run([PDFTOTXT, "-layout", str(path), str(txt_path)])
    text = txt_path.read_text(encoding="utf-8", errors="replace")
    prefix = str(work / "page")
    run([PDFTOPPM, "-png", "-r", "120", str(path), prefix])
    images = sorted(work.glob("page*.png"))
    pages = []
    form_feed = chr(12)
    raw_pages = text.split(form_feed) if form_feed in text else _split_pages(text, len(images))
    if not raw_pages:
        raw_pages = [text]
    for i, img in enumerate(images):
        body = raw_pages[i] if i < len(raw_pages) else ""
        pages.append({"index": i, "text": body.strip(), "image": str(img)})
    if not pages:
        pages = [{"index": 0, "text": text.strip(), "image": None}]
    title, subtitle, bullets = _derive(pages)
    return {"kind": "pdf", "label": path.name, "title": title, "subtitle": subtitle, "bullets": bullets, "pages": pages}


def _split_pages(text: str, n: int):
    lines = text.splitlines()
    if n <= 1:
        return [text]
    chunk = max(1, len(lines) // n)
    return ["\n".join(lines[i * chunk : (i + 1) * chunk]) for i in range(n)]


def extract_pptx(path: Path, work: Path) -> dict:
    pages = []
    media_dir = work / "media"
    media_dir.mkdir(exist_ok=True)
    with zipfile.ZipFile(path) as z:
        slides = sorted(
            n for n in z.namelist() if n.startswith("ppt/slides/slide") and n.endswith(".xml")
        )
        for i, name in enumerate(slides):
            root = ET.fromstring(z.read(name))
            parts = [t.text or "" for t in root.iter(A_NS + "t")]
            body = "\n".join(x for x in parts if x.strip())
            pages.append({"index": i, "text": body.strip(), "image": None})
        media_files = [n for n in z.namelist() if n.startswith("ppt/media/")]
        saved = []
        for n in media_files:
            dest = media_dir / Path(n).name
            dest.write_bytes(z.read(n))
            if dest.suffix.lower() in {".png", ".jpg", ".jpeg", ".webp"}:
                saved.append(str(dest))
        for i, pg in enumerate(pages):
            if i < len(saved):
                pg["image"] = saved[i]
            elif saved:
                pg["image"] = saved[i % len(saved)]
    if not pages:
        raise RuntimeError("No slides found in PPTX")
    title, subtitle, bullets = _derive(pages)
    return {"kind": "pptx", "label": path.name, "title": title, "subtitle": subtitle, "bullets": bullets, "pages": pages}


def extract_url(url: str, work: Path) -> dict:
    req = Request(url, headers={"User-Agent": "DeckClip/1.0 (+https://deckclip.app)"})
    with urlopen(req, timeout=15) as resp:
        raw = resp.read(800_000)
    html = raw.decode("utf-8", errors="replace")
    (work / "page.html").write_text(html, encoding="utf-8")
    title = _meta(html, "og:title") or _tag(html, "title") or url
    desc = _meta(html, "og:description") or _meta(html, "description") or ""
    image = _meta(html, "og:image")
    img_path = None
    if image and image.startswith("http"):
        try:
            req2 = Request(image, headers={"User-Agent": "DeckClip/1.0"})
            with urlopen(req2, timeout=10) as r2:
                data = r2.read(4_000_000)
            ext = ".png" if "png" in image.lower() else ".jpg"
            img_path = str(work / ("og" + ext))
            Path(img_path).write_bytes(data)
        except Exception:
            img_path = None
    headings = _tags(html, "h1") + _tags(html, "h2") + _tags(html, "h3")
    paras = _tags(html, "p")
    bullets = []
    for item in headings[1:] + paras:
        item = clean_ws(htmlmod.unescape(item))
        if 20 < len(item) < 180 and item not in bullets:
            bullets.append(item)
        if len(bullets) >= 10:
            break
    page_text = clean_ws(title + ". " + desc + " " + " ".join(bullets[:6]))
    pages = [{"index": 0, "text": page_text, "image": img_path}]
    title = clean_ws(htmlmod.unescape(title))[:90]
    subtitle = clean_ws(htmlmod.unescape(desc))[:160]
    return {
        "kind": "url",
        "label": url,
        "title": title or "Untitled page",
        "subtitle": subtitle,
        "bullets": bullets,
        "pages": pages,
    }


def _meta(html: str, name: str) -> str:
    pat = r'<meta[^>]+(?:property|name)=["\']' + re.escape(name) + r'["\'][^>]+content=["\']([^"\']+)["\']'
    m = re.search(pat, html, re.I)
    if m:
        return clean_ws(htmlmod.unescape(m.group(1)))
    pat2 = r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+(?:property|name)=["\']' + re.escape(name) + r'["\']'
    m = re.search(pat2, html, re.I)
    return clean_ws(htmlmod.unescape(m.group(1))) if m else ""


def _tag(html: str, name: str) -> str:
    m = re.search(r"<" + name + r"[^>]*>(.*?)</" + name + r">", html, re.I | re.S)
    return clean_ws(re.sub(r"<[^>]+>", " ", m.group(1))) if m else ""


def _tags(html: str, name: str):
    out = []
    for m in re.finditer(r"<" + name + r"[^>]*>(.*?)</" + name + r">", html, re.I | re.S):
        t = clean_ws(re.sub(r"<[^>]+>", " ", m.group(1)))
        if t:
            out.append(t)
    return out


def _derive(pages):
    texts = [p.get("text") or "" for p in pages]
    first = texts[0] if texts else ""
    lines = [clean_ws(x) for x in first.splitlines() if clean_ws(x)]
    title = lines[0][:80] if lines else "Untitled deck"
    subtitle = lines[1][:140] if len(lines) > 1 else ""
    bullets = []
    for t in texts:
        for line in t.splitlines():
            line = clean_ws(line)
            if not line or line == title:
                continue
            if line[:1] in "-*•":
                line = line.lstrip("-*• ")
            if 18 <= len(line) <= 160 and line not in bullets:
                bullets.append(line)
    if not bullets:
        splitter = re.compile(r"(?<=[.!?])\s+")
        for t in texts:
            for sent in splitter.split(t):
                sent = clean_ws(sent)
                if 24 <= len(sent) <= 160 and sent not in bullets and sent != title:
                    bullets.append(sent)
    return title, subtitle, bullets[:12]
