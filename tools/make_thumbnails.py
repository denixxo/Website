"""Generate webp thumbnails from the PDFs in assets/pdf/.

- assets/pdf/publications/*.pdf -> assets/img/pubs/<name>.webp      (top slice of page 1)
- assets/pdf/posters/*.pdf      -> assets/img/posters/<name>.webp   (full page 1)
- assets/pdf/presentations/*.pdf-> assets/img/talks/<name>.webp     (full slide 1, 16:9)
- assets/pdf/thesis/*.pdf       -> assets/img/pubs/<name>.webp      (full cover)

Skips outputs that are newer than their source PDF; use --force to regenerate.

Requires:  pip install pymupdf pillow
Usage:     python tools/make_thumbnails.py [--force] [--top 0.38] [--width 900]
"""
import argparse
import io
import sys
from pathlib import Path

try:
    import fitz  # PyMuPDF
    from PIL import Image
except ImportError:
    sys.exit("Missing dependencies — run:  pip install pymupdf pillow")

ROOT = Path(__file__).resolve().parent.parent
JOBS = [
    # (source dir, output dir, top fraction of page 1 to keep)
    (ROOT / "assets/pdf/publications", ROOT / "assets/img/pubs", "TOP"),
    (ROOT / "assets/pdf/posters", ROOT / "assets/img/posters", 1.0),
    (ROOT / "assets/pdf/presentations", ROOT / "assets/img/talks", 1.0),
    (ROOT / "assets/pdf/thesis", ROOT / "assets/img/pubs", 1.0),
]


def render(pdf_path: Path, out_path: Path, top: float, width: int, quality: int) -> str:
    try:
        doc = fitz.open(pdf_path)
    except Exception as exc:
        return f"ERROR opening ({exc})"
    if doc.needs_pass:
        return "ENCRYPTED — export an unprotected copy of this PDF"
    page = doc[0]
    clip = fitz.Rect(0, 0, page.rect.width, page.rect.height * top)
    zoom = width / clip.width
    pix = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom), clip=clip, alpha=False)
    img = Image.open(io.BytesIO(pix.tobytes("png")))
    out_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(out_path, "WEBP", quality=quality, method=6)
    kb = out_path.stat().st_size // 1024
    return f"ok ({img.width}x{img.height}, {kb} KB)"


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--force", action="store_true", help="regenerate everything")
    ap.add_argument("--top", type=float, default=0.38,
                    help="fraction of page 1 kept for publication thumbnails (default 0.38)")
    ap.add_argument("--width", type=int, default=900, help="output width in px (default 900)")
    ap.add_argument("--quality", type=int, default=82, help="webp quality (default 82)")
    args = ap.parse_args()

    total = skipped = errors = 0
    for src_dir, out_dir, top in JOBS:
        if not src_dir.exists():
            continue
        top_frac = args.top if top == "TOP" else top
        for pdf in sorted(src_dir.glob("*.pdf")):
            out = out_dir / (pdf.stem + ".webp")
            if not args.force and out.exists() and out.stat().st_mtime >= pdf.stat().st_mtime:
                skipped += 1
                continue
            status = render(pdf, out, top_frac, args.width, args.quality)
            total += 1
            if status.startswith(("ERROR", "ENCRYPTED")):
                errors += 1
            print(f"{pdf.relative_to(ROOT)} -> {out.relative_to(ROOT)}: {status}")
    print(f"\n{total} generated, {skipped} up to date, {errors} errors")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
