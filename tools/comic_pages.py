"""Turn a comic PDF into the page images the website's reader shows.

Why: the browser no longer has to download a whole PDF and draw it with PDF.js.
Each page becomes one light .webp image, which opens instantly, and there is
no PDF file on the site to download.

Setup (once, free):
    pip install pymupdf pillow

Use:
    python tools/comic_pages.py my-comic.pdf my-comic

That writes assets/comics/my-comic/01.webp, 02.webp, ... and cover.webp
(page 1, smaller). Want a different cover? Replace cover.webp with your own
image (about 1000 px wide); running the script again won't overwrite it.
Then add a block for it in _data/comics.yml with the same slug and the page count
the script prints. Keep the PDF on your computer; don't upload it to the repo.

Pages exported 2-up (two comic pages side by side on one landscape PDF page)
are split into single pages automatically.
"""
import argparse
import io
import pathlib
import sys

import pymupdf  # PyMuPDF
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "assets" / "comics"
LONG_SIDE = 2000      # biggest a page gets, in pixels
COVER_WIDTH = 1000    # the cover shown on the home page
QUALITY = 82          # webp quality: 80-85 looks like the original at a fraction of the weight


def panels_on(page):
    """Rectangles to cut out of a PDF page: one per comic page on it."""
    area = page.rect.width * page.rect.height
    boxes = []
    for info in page.get_image_info():
        r = pymupdf.Rect(info["bbox"]) & page.rect
        if r.width * r.height < area * 0.2:
            continue  # small decorations, not a comic page
        if any(r.intersects(b) for b in boxes):
            continue  # a layer stacked on a page we already have
        boxes.append(r)
    if len(boxes) < 2:
        return [page.rect], None  # one page per sheet: render all of it
    boxes.sort(key=lambda b: (round(b.y0), b.x0))
    native = max(i["width"] for i in page.get_image_info())
    return boxes, native


def render(page, clip, native_width):
    """Render one rectangle of a page at (about) the resolution it was drawn at."""
    if native_width:
        zoom = native_width / clip.width
    else:
        biggest = max((i["width"] for i in page.get_image_info()), default=0)
        zoom = (biggest / page.rect.width) if biggest else 2.5
    zoom = min(zoom, LONG_SIDE / max(clip.width, clip.height))
    pix = page.get_pixmap(matrix=pymupdf.Matrix(zoom, zoom), clip=clip, colorspace=pymupdf.csRGB, alpha=False)
    return Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGB")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("pdf", type=pathlib.Path, help="the comic PDF")
    ap.add_argument("slug", help="short lowercase name, e.g. universo-goya (same as in _data/comics.yml)")
    ap.add_argument("--no-split", action="store_true", help="never split 2-up sheets into single pages")
    args = ap.parse_args()

    if not args.pdf.exists():
        sys.exit(f"Can't find {args.pdf}")
    out = OUT_DIR / args.slug
    out.mkdir(parents=True, exist_ok=True)
    for old in out.glob("[0-9][0-9].webp"):
        old.unlink()  # pages from an earlier run

    doc = pymupdf.open(args.pdf)
    n = 0
    first = None
    for page in doc:
        boxes, native = ([page.rect], None) if args.no_split else panels_on(page)
        for box in boxes:
            img = render(page, box, native)
            n += 1
            img.save(out / f"{n:02d}.webp", "WEBP", quality=QUALITY, method=6)
            if first is None:
                first = img
            print(f"  page {n:02d}  {img.width}x{img.height}")

    if not (out / "cover.webp").exists():
        cover = first.copy()
        cover.thumbnail((COVER_WIDTH, COVER_WIDTH * 3))
        cover.save(out / "cover.webp", "WEBP", quality=QUALITY, method=6)

    kb = sum(f.stat().st_size for f in out.iterdir()) // 1024
    print(f"\n{n} pages written to {out.relative_to(ROOT)} ({kb} KB in total)")
    print(f"In _data/comics.yml use:  slug: {args.slug}   pages: {n}")


if __name__ == "__main__":
    main()
