# From a client document to a deal: source file, image inventory, completeness

The case this file covers: a user hands over a document (a presentation, a brochure, an old
quote, a PDF export of anything) and asks for "a deal", "a quote" or "a page" built from it.
It is the most common request, and the one that fails silently: the page looks finished while
a third of the source's images never made it in, or came in blurry, black-backed or 4 MB each.

Nothing here is optional. The order matters: **source file, then inventory, then extraction,
then upload, then a completeness gate**. Skipping the inventory is what loses images.

## Step 0: ask for the original file before touching the PDF

A PDF is the worst source you can get. Before extracting anything, ask **once**, in one
sentence, for the native file, and say why ("the images come out at full quality and the
text is exact"):

| Rank | Source | Why it is better |
|---|---|---|
| 1 | **PowerPoint `.pptx`** (Keynote and Google Slides export to it) | It is a zip. `ppt/media/` holds every image **at its original resolution, transparency intact**. `ppt/slides/slideN.xml` gives each picture's position and size (EMU, 914 400 per inch), every text run with its font, size and colour. Links from a slide to its images are in `ppt/slides/_rels/slideN.xml.rels`. **No PDF library needed**: unzip plus an image library is enough. |
| 2 | **Illustrator `.ai`**, InDesign, Figma export | An `.ai` saved PDF-compatible IS a PDF: a PDF library opens it, with exact colours, opacities, radii, fonts and tracking (see `reading-the-source.md`). Heavier to process than a `.pptx` (text must be redacted out of the art), but the most faithful. |
| 3 | **Canva** | Ask for the share link or a `.pptx` export (Share → Download → PowerPoint). |
| 4 | **PDF** | Only when the user says they have nothing else. Say plainly what it costs: on a flattened PDF, visuals are cropped from a render; with no text layer, the copy is retyped. |

Measured on our own builds: a deck that came as a PowerPoint-born file was rebuilt markedly
faster than one that came from Illustrator. Its images were clean objects, so no redaction,
no background removal and no flood fill were needed.

If the user does send a `.pptx`:
- images in `ppt/media/` can be `.emf`/`.wmf` (vector clip-art): render them through
  LibreOffice if present, otherwise take that one visual from the PDF;
- a picture can be **cropped inside PowerPoint** (`<a:srcRect l= t= r= b=>` in thousandths of
  a percent): apply the same crop, or the image shows parts the designer hid;
- the same media can be used on several slides: upload it once.

## Step 1: when it has to be the PDF, identify its type first

Open the PDF and look at one page's text and images before choosing a method:

| Type | How to spot it | Method |
|---|---|---|
| **Designer / vector** | text extractable, many vector drawings | redact the text, then crop the art (`art-fonts-and-qa.md`) |
| **PowerPoint-born** | text extractable, images are separate clean objects | extract each image object; **merge its soft mask**: `fitz.Pixmap(doc, xref)` then `fitz.Pixmap(pix, fitz.Pixmap(doc, smask_xref))`. `extract_image()` alone does NOT apply the mask, and transparent patterns come out on solid black |
| **Flattened** (one full-page image per page, typical of Canva or "print to PDF") | one image per page, little or no text | render each page at 3840 px wide and crop each visual **with its coloured panel**, as the page shows it; take logos from the client's website (they exist there in clean, transparent form) |
| **Scanned / image text** | no extractable text at all | crop on a measured grid, retype the copy, and run the text audit of step 6 |

## Step 2: inventory, before any upload (mandatory)

Write a manifest, one row per visual:

`page · id · role (photo, logo, icon, background, decoration, chart) · source size · clip rectangle · output file · media url (filled at step 5) · block (filled at build time)`

- On a vector PDF, `page.get_images(full=True)` lists the image objects and
  `page.get_drawings(extended=True)` gives the clip rectangles that separate photos which
  seem to overlap. Pre-cut each photo to its clip.
- Count the decorative art too (patterns, bands, icons in a circle): a rep sees it missing.
- **Show the counts to the user** before going on: "21 pages, 47 visuals: 30 photos,
  9 logos, 8 decorations". It is the number the final gate is checked against.

## Step 3: tools

- From a `.pptx`: only an image library (Pillow) is needed.
- From a PDF: check first, `python3 -c "import fitz, PIL"`. If it fails, **ask, then install**
  (`python3 -m pip install --user pymupdf pillow`). Do not fall back to screenshots of the page
  "to go faster": that is how images end up blurry and cropped wrong.
- No code execution at all (a chat surface): ask the user for the images themselves (the
  `.pptx`, or the folder the designer used), never improvise from page previews.

## Step 4: extraction and format rules

- **Never bake text into an image.** Redact the text out of the page before every crop
  (`add_redact_annot(rect, fill=None)`, then `apply_redactions` keeping the line art). All
  copy stays live html a rep can edit.
- Crop at the art's **real bounding box**; trim 2 px on edges that touch the page (they render
  half-covered and draw a light rim); snap pixels within ±4 of the panel colour to the exact
  token (a 1/255 drift draws a ghost rectangle on a large panel).
- **One logo, one image.** A wall of client logos is cut logo by logo: as one picture each
  logo falls to about 24 px on a phone.
- A periodic band (a repeated pattern strip) goes as **one tile** in `repeat-x`: stretched as a
  whole strip it gets crushed on a phone.
- **Formats and sizes**:

| Visual | Format | Size |
|---|---|---|
| photo | WebP (or JPEG q≈84) | longest side **1800 px max**, 1200 is usually enough |
| cut-out art, photo with transparency | WebP with alpha (typically 8x lighter than PNG) | same |
| logo, icon, flat art | palette PNG (or SVG) | 2x its displayed size |
| flat vector art | SVG, **only exported from a page that has no bitmap** (an SVG export embeds every image of the page) | keep the raster if the SVG is more than ~1.3x heavier |

- `create_media` answering **"An image could not be created"** on a valid PNG: flatten it on
  white and save it as a 16-to-256-colour palette PNG, then retry. Full RGBA PNGs are refused
  more often than palette ones.

## Step 5: upload

1. `list_medias` (with `search`) and reuse what is already in the library: logos and photos of
   an earlier proposal are often there.
2. **With a shell (Claude Code): `prepare_media_uploads`**, the default. One call returns an
   upload URL per file (50 at most per call, each usable once, valid one hour); then send
   each file from disk with `curl -sS -F "file=@<path>" "<uploadUrl>"`. The answer is the
   created media `{id, name, url, mime, size}`. Nothing passes through the conversation, so
   the files keep the step 4 quality whatever their number, and nothing gets dropped. Name
   the items after the manifest's file names, in one folder named after the source document.
   A `404` means the URL was used or expired: prepare a new one; a `413` / `415` (size,
   type) leaves the URL usable for a fixed file. Max 50 MB per file.
3. **Without a shell**: **`create_medias`, 20 files at most per call**, base64 in `file`.
   Keep each file small **before** encoding it (step 4 sizes): a call carrying a dozen 4 MB
   photos in base64 is where images get dropped. `from_url` for an image that is already
   online (the client's website), on either path.
4. Fill the manifest's `media url` column from what each upload returns, file by file. A file
   that failed is retried or listed, never forgotten.

## Step 6: completeness gate (blocks "done")

Before saying the deal is ready:

- every manifest row has a media url, and that url is referenced by a block of the quote
  (`get_quotation` → grep each url in the blocks' html) and answers 200;
- print the line **"source: N visuals / deal: N visuals"**. Any gap is listed by name, with
  the reason (deliberately left out, failed upload, replaced by html). Never silent;
- text audit: take 3 to 5 distinctive phrases per source page and check each one appears in the
  live blocks. A page whose phrases are all missing is a page that was skipped.

## Step 7: render check

Then the usual delivery checks of this skill and of **duodeal-mcp-best-practices**: client link at
desktop and phone width (a real visual check), PDF export, served page weight measured with `curl`
on the client link, fonts loaded through a Google Fonts `<link>` and never as base64 in a block.
