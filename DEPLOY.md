# jankovic.phd — deployment & maintenance

Static site: no build step. Everything in this folder (except `tools/`, which is
optional to deploy and harmless if deployed) is served as-is.

## Deploy to GitHub Pages

1. Create a GitHub repository (e.g. `jankovic-phd`) and push this folder:
   ```
   git init
   git add .
   git commit -m "Personal website"
   git branch -M main
   git remote add origin https://github.com/<you>/jankovic-phd.git
   git push -u origin main
   ```
2. On GitHub: **Settings → Pages → Source: Deploy from a branch → main / (root)**.
3. Custom domain: the `CNAME` file (containing `jankovic.phd`) is already in place.
   At your DNS provider, point the domain at GitHub Pages:
   - `A` records for the apex `jankovic.phd`: 185.199.108.153, 185.199.109.153,
     185.199.110.153, 185.199.111.153
   - (optional) `CNAME` record for `www` → `<you>.github.io`
4. Back in **Settings → Pages**, enter `jankovic.phd` as the custom domain and
   enable **Enforce HTTPS** once the certificate is issued.

## Local preview

```
python -m http.server 8321
```
then open http://localhost:8321. (Opening `index.html` directly via file://
also works; only the embedded thesis viewer and the automatic hiding of
buttons for missing files are disabled there.)

## Adding content

**A new paper**
1. Drop the PDF at `assets/pdf/publications/<year>-<venue>-<slug>.pdf`
2. `python tools/make_thumbnails.py`   (needs `pip install pymupdf pillow` once)
3. Add one entry to `data/publications.js` (the file's header comment documents
   every field; `doi`, `arxiv`, `pdf`, `thumbnail` are each optional)

**A talk / poster** — same pattern with `data/presentations.js` /
`data/posters.js` and the matching `assets/pdf/…` folders.

**Buttons and thumbnails appear automatically** once the files exist; entries
whose files are missing simply render without that button/thumbnail.

**Thesis** — drop the PDF at `assets/pdf/thesis/thesis-jankovic-2024.pdf`;
the thesis page then switches its Download/Open links from the KIT record to
the local copy and offers the embedded reader.

**CV PDF** — export an *unprotected* PDF to
`assets/pdf/cv/cv-denis-jankovic-fr.pdf` (the current `CV FR CPJ bleu.pdf` is
password-protected and cannot be used for the download button).

**Portrait** — save as `assets/img/portrait.jpg` and swap the placeholder block
in `index.html` (see the comment near `hero__portrait`).

**Editing shared chrome** (nav / footer / icon sprite / boot snippet): edit the
file in `tools/partials/`, then run `python tools/sync_partials.py` to stamp it
into every page.

## Languages

Content is written inline in four languages (`en`, `fr`, `ko`, `de`) as sibling
`<span lang="…">` elements; CSS shows only the active one. To edit text, edit
all four spans. UI labels rendered by JavaScript live in `data/i18n.js`.
