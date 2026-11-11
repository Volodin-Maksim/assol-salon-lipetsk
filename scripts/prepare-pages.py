from pathlib import Path
from urllib.parse import urlsplit
import os
import zipfile

root = Path(__file__).resolve().parents[1]
site = root / "site"
base = os.environ["PAGES_BASE_URL"].rstrip("/")
if urlsplit(base).scheme != "https" or not urlsplit(base).netloc:
    raise SystemExit("PAGES_BASE_URL must be a complete HTTPS URL")
old_origin = "https://assol-salon-lipetsk.pithybuffalo1.chatgpt.site"
for path in site.rglob("*"):
    if path.is_file() and path.suffix in {".html", ".xml", ".json"}:
        text = path.read_text(encoding="utf-8")
        path.write_text(text.replace(old_origin, base), encoding="utf-8")
with zipfile.ZipFile(site / "assol-source.zip", "w", zipfile.ZIP_DEFLATED) as archive:
    for path in sorted(site.rglob("*")):
        if path.is_file() and path.suffix != ".zip":
            archive.write(path, path.relative_to(site))
print("Prepared client preview for GitHub Pages")
