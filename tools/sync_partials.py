"""Re-sync shared chrome (sprite, nav, footer, boot snippet) across all pages.

Each root .html file contains fenced regions like:

    <!-- @partial:nav -->
    ... (any content, replaced wholesale) ...
    <!-- /@partial:nav -->

This script replaces every fenced region with the canonical copy from
tools/partials/. The site never *requires* this script to run — it is drift
insurance for when the shared chrome changes.

Usage:  python tools/sync_partials.py
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PARTIALS = {
    "sprite": ROOT / "tools" / "partials" / "sprite.html",
    "nav": ROOT / "tools" / "partials" / "nav.html",
    "footer": ROOT / "tools" / "partials" / "footer.html",
    "boot": ROOT / "tools" / "partials" / "head-snippet.html",
}


def main() -> int:
    contents = {}
    for name, path in PARTIALS.items():
        if not path.exists():
            print(f"!! missing partial: {path}")
            return 1
        contents[name] = path.read_text(encoding="utf-8").strip("\n")

    changed_any = False
    for page in sorted(ROOT.glob("*.html")):
        text = page.read_text(encoding="utf-8")
        original = text
        for name, replacement in contents.items():
            pattern = re.compile(
                rf"<!-- @partial:{name} -->.*?<!-- /@partial:{name} -->",
                re.DOTALL,
            )
            if pattern.search(text):
                text = pattern.sub(lambda _m: replacement, text, count=1)
        if text != original:
            page.write_text(text, encoding="utf-8", newline="\n")
            print(f"updated  {page.name}")
            changed_any = True
        else:
            print(f"ok       {page.name}")
    if not changed_any:
        print("all pages already in sync")
    return 0


if __name__ == "__main__":
    sys.exit(main())
