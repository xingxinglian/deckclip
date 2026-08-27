#!/usr/bin/env python3
"""Write fixtures/sample-deck.pdf — a 6-page indie SaaS deck."""
from pathlib import Path

PAGES = [
    [
        ("H", 28, 64, 720, "HARBOR"),
        ("H", 32, 64, 660, "CRM that fits in a Friday"),
        ("B", 16, 64, 600, "For indie consultants who still send follow-ups"),
        ("B", 16, 64, 576, "from a sticky note."),
        ("B", 13, 64, 120, "DeckClip fixture  ·  6 slides  ·  public domain copy"),
    ],
    [
        ("H", 22, 64, 720, "The leak"),
        ("B", 16, 64, 640, "You closed the call. Then the week ate the follow-up."),
        ("B", 16, 64, 600, "Pipelines live in three tabs and a guilty feeling."),
        ("B", 16, 64, 540, "Indie teams do not need another enterprise cockpit."),
        ("B", 16, 64, 500, "They need one list that does not forget."),
    ],
    [
        ("H", 22, 64, 720, "What Harbor does"),
        ("B", 16, 64, 640, "One pipeline. Next action on every card."),
        ("B", 16, 64, 600, "Nudges that sound like you, not a robot."),
        ("B", 16, 64, 560, "Weekly review in twelve minutes."),
        ("B", 16, 64, 500, "No seats. No implementation Slack."),
    ],
    [
        ("H", 22, 64, 720, "Three moves"),
        ("B", 16, 64, 640, "Capture the call before you stand up."),
        ("B", 16, 64, 600, "Harbor drafts the follow-up in your voice."),
        ("B", 16, 64, 560, "Friday review shows what actually slipped."),
        ("B", 16, 64, 500, "That is the whole product."),
    ],
    [
        ("H", 22, 64, 720, "Proof, not theater"),
        ("B", 18, 64, 640, "41 percent more replies in week three."),
        ("B", 16, 64, 590, "Consultants who ship notes the same day"),
        ("B", 16, 64, 566, "stop losing warm deals to silence."),
        ("B", 16, 64, 500, "Used by 2k independents. Zero CSMs."),
    ],
    [
        ("H", 24, 64, 700, "Start free this week"),
        ("B", 16, 64, 630, "Import a CSV. Book the Friday review."),
        ("B", 16, 64, 590, "Keep the weekend."),
        ("B", 16, 64, 520, "harbor.test  ·  fixture only"),
    ],
]

def esc(s):
    return s.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")

def page_stream(items):
    cmds = ["BT"]
    for kind, size, x, y, text in items:
        font = "F1" if kind == "H" else "F2"
        cmds.append(f"/{font} {size} Tf")
        cmds.append(f"1 0 0 1 {x} {y} Tm")
        cmds.append(f"({esc(text)}) Tj")
    cmds.append("ET")
    # gold-ish bar via a filled rect (device RGB)
    header = "0.91 0.64 0.09 rg 64 740 72 6 re f\n"
    return (header + "\n".join(cmds)).encode("latin-1", "replace")

def build(path: Path):
    streams = [page_stream(p) for p in PAGES]
    objs = []
    objs.append(b"1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n")
    kids = " ".join(f"{3+i} 0 R" for i in range(len(PAGES)))
    objs.append(f"2 0 obj << /Type /Pages /Kids [{kids}] /Count {len(PAGES)} >> endobj\n".encode())
    # fonts
    # page objects come first after pages; fonts after contents
    # layout: 1 catalog, 2 pages, 3.. pages, then contents, then fonts
    # Simpler: catalog=1 pages=2 pages=3..8 contents=9..14 fonts=15,16
    n = len(PAGES)
    page_ids = list(range(3, 3 + n))
    content_ids = list(range(3 + n, 3 + 2 * n))
    f1, f2 = 3 + 2 * n, 4 + 2 * n
    objs = []
    objs.append(b"1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n")
    kids = " ".join(f"{i} 0 R" for i in page_ids)
    objs.append(f"2 0 obj << /Type /Pages /Kids [{kids}] /Count {n} >> endobj\n".encode())
    content_bytes = []
    for i in range(n):
        pid, cid = page_ids[i], content_ids[i]
        objs.append(
            (f"{pid} 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
             f"/Contents {cid} 0 R /Resources << /Font << /F1 {f1} 0 R /F2 {f2} 0 R >> >> >> endobj\n").encode()
        )
    for i, data in enumerate(streams):
        cid = content_ids[i]
        content_bytes.append((cid, data))
        objs.append(f"{cid} 0 obj << /Length {len(data)} >> stream\n".encode() + data + b"\nendstream endobj\n")
    objs.append(f"{f1} 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> endobj\n".encode())
    objs.append(f"{f2} 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n".encode())
    # assemble with xref
    out = bytearray(b"%PDF-1.4\n")
    offsets = [0]
    for obj in objs:
        offsets.append(len(out))
        out.extend(obj)
    xref_pos = len(out)
    out.extend(f"xref\n0 {len(offsets)}\n".encode())
    out.extend(b"0000000000 65535 f \n")
    for off in offsets[1:]:
        out.extend(f"{off:010d} 00000 n \n".encode())
    out.extend(f"trailer << /Size {len(offsets)} /Root 1 0 R >>\nstartxref\n{xref_pos}\n%%EOF\n".encode())
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(bytes(out))
    print("wrote", path, "bytes", path.stat().st_size)

if __name__ == "__main__":
    root = Path(__file__).resolve().parent.parent
    build(root / "fixtures" / "sample-deck.pdf")
