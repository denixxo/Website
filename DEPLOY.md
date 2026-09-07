# jankovic.phd — deployment & maintenance

Static site: no build step. Everything in this folder (except `tools/`, which is
optional to deploy and harmless if deployed) is served as-is.

## Deploy to GitHub Pages

The repository is [`denixxo/Website`](https://github.com/denixxo/Website) and
`main` is what gets served. Pushing to `main` is the whole deploy — every save
made in the content manager is such a push.

1. On GitHub: **Settings → Pages → Source: Deploy from a branch → main / (root)**.
2. Custom domain: entering it in **Settings → Pages** creates the `CNAME` file
   in the repository root — do not add or delete that file by hand, GitHub
   manages it. At your DNS provider, point the domain at GitHub Pages:
   - `A` records for the apex `jankovic.phd`: 185.199.108.153, 185.199.109.153,
     185.199.110.153, 185.199.111.153
   - (optional) `CNAME` record for `www` → `denixxo.github.io`
3. Back in **Settings → Pages**, enter `jankovic.phd` as the custom domain and
   enable **Enforce HTTPS** once the certificate is issued.

## Local preview

```
python -m http.server 8321
```
then open http://localhost:8321. A web server is now required for
`publications.html`, `talks.html` and `lectures.html`: they fetch their content
from `data/*.json`, and `file://` blocks that. The other pages still open
directly via `file://`, minus the embedded thesis viewer and the automatic
hiding of buttons for missing files.

## Adding content

Content lives in `data/*.json` and is edited through **Decap CMS** at
`/admin/` — see "Content manager" below. The files can also be edited by hand;
each one holds a single named list, e.g. `{ "posters": [ … ] }`.

| What | File | PDF goes in | Thumbnail goes in |
|---|---|---|---|
| Paper | `data/publications.json` | `assets/pdf/publications/` | `assets/img/pubs/` |
| Talk | `data/presentations.json` | `assets/pdf/presentations/` | `assets/img/talks/` |
| Poster | `data/posters.json` | `assets/pdf/posters/` | `assets/img/posters/` |
| Course | `data/lectures.json` | `assets/lectures/` | — |

Name every file after the entry's `id`. Order does not matter: lists are sorted
by year and month at render time. `doi`, `arxiv`, `pdf`, `thumbnail`, `award`
and friends may be left empty — buttons, badges and thumbnails only render for
the values that exist, and buttons pointing at a missing file are removed on
load. `selected: true` features a paper on the homepage.

Thumbnails are generated from the PDFs by `python tools/make_thumbnails.py`
(needs `pip install pymupdf pillow` once). The CMS cannot run it, so after
uploading a PDF through `/admin/`, pull and run it locally to refresh the
thumbnails.

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

## Content manager (Decap CMS)

Decap is a **git-based CMS: it has no database**. The admin page reads and
writes files in this repository and commits them; GitHub Pages then redeploys.
Netlify is involved only to provide the login (Identity) and the token exchange
(Git Gateway) — it never holds a copy of the content, and `jankovic.phd` keeps
being served by GitHub Pages.

### One-time setup

1. **Netlify** → *Add new site* → *Import an existing project* → pick
   `denixxo/Website`. No build command, publish directory `.` (already set in
   `netlify.toml`). This deploy exists only to host the login; it is marked
   `noindex` so it never competes with `jankovic.phd` in search results.
2. **Site configuration → Identity → Enable Identity.**
   Under *Registration*, choose **Invite only**.
3. **Identity → Services → Git Gateway → Enable Git Gateway.**
4. **Identity → Invite users** → invite yourself. Accept the emailed link and
   set a password; `index.html` forwards you to `/admin/` once you are in.
5. Edit at `https://<site>.netlify.app/admin/`.

> Netlify has put Identity into maintenance mode, so step 2 may not be offered
> on a newly created site. If the button is missing, switch `admin/config.yml`
> to the `github` backend with an OAuth proxy (a small Cloudflare Worker in your
> own account) and drop the Identity script from `admin/index.html`; everything
> else — the collections, the JSON files, the commit flow — stays as it is.

### Editing locally, without logging in

`local_backend: true` in `admin/config.yml` only takes effect on localhost. With
the site served locally, run `npx decap-server` in the repo root, open
`http://localhost:8321/admin/` and click **Login** — the CMS then reads and
writes the working copy directly, with no Identity and no commits. Useful for
trying out config or preview changes before pushing them.

### Serving /admin from jankovic.phd instead

The admin page works from GitHub Pages too, but the Identity API only exists on
the Netlify host. Set `window.IDENTITY_API` at the top of `admin/index.html` to
`https://<site>.netlify.app/.netlify/identity` and log in at
`jankovic.phd/admin/`.

### Where the pieces are

| File | Role |
|---|---|
| `admin/index.html` | Loads the CMS and the Identity widget |
| `admin/config.yml` | Collections, fields and per-field upload folders |
| `admin/preview.js` | The Files panel: expected filename per entry, and mismatch warnings |
| `js/boot.js` | Fetches `data/*.json`, then runs the page scripts in order |
| `netlify.toml` | Publish settings + `noindex` for the Netlify copy |

Adding a field means adding it in **both** `admin/config.yml` and the rendering
script in `js/`. A field present in the JSON but absent from the config is
silently dropped the next time that file is saved through the CMS.

### Filenames

Every uploaded file is named after its entry's `id`:

| Collection | PDF | Thumbnail |
|---|---|---|
| Publications | `assets/pdf/publications/<id>.pdf` | `assets/img/pubs/<id>.webp` |
| Talks | `assets/pdf/presentations/<id>.pdf` | `assets/img/talks/<id>.webp` |
| Posters | `assets/pdf/posters/<id>.pdf` | `assets/img/posters/<id>.webp` |

Course material is `assets/lectures/<id>` plus `-slides.pdf`, `-notebooks.zip`,
`-handout.pdf` or `-tutorial.pdf`.

The **Files** panel beside each list in the CMS states the expected name for
every entry and marks it ✓ when the stored path matches, `!` when it does not,
and `*` for the one deliberate exception (the thesis PDF, which sits in
`assets/pdf/thesis/` because `thesis.html` links the same file). Nothing
enforces the convention — a path that drifts simply stops rendering its button
— so the panel is the only thing that will tell you.

## Languages

Content is written inline in four languages (`en`, `fr`, `ko`, `de`) as sibling
`<span lang="…">` elements; CSS shows only the active one. To edit text, edit
all four spans. UI labels rendered by JavaScript live in `data/i18n.js`.
