# PDF export: A4, 10 mm margins, no section cut in two

Reference file of **duodeal-mcp-best-practices** (its section "PDF export" is the summary).
Read it whole before you write or touch the print rule of a quote.

The client's "Download PDF" button runs a headless Chrome print that passes **no paper format**: every export comes out **US Letter (612 × 792 pt) with near-zero margins**, and sections are sliced wherever the page ends, a totals card left alone on a page, a product line with its price on one page and its description on the next. A Letter file printed on A4 rescales and loses its margins. Clients who print proposals for meetings notice it first.

**One source.** The rule's text lives in [`assets/print-rules.css`](../assets/print-rules.css) of this skill (raw file: https://raw.githubusercontent.com/DuodealTeam/duodeal-skills-mcp/main/skills/duodeal-mcp-best-practices/assets/print-rules.css), its version marker on the first line (`/*dd-print-v7*/`). The inline copy below is checked against that file: change the file, never a copy, and bump the marker when the rule changes.

The export honours a CSS `@page` rule found in the page (`preferCSSPageSize` is on), so the fix lives in the quote's content and needs no key and no dev:

1. **The carrier: the `title` of the FIRST `lineType:"title"` line of the first VISIBLE price table**, in block order. Line weights restart at 0 in every price table, so with two tables "the lowest weight" is ambiguous; and a title line inside a table the rep has hidden is never rendered, so it carries nothing. Write it with the connector, `update_quotation_line {id, title}` on an existing line, or `title` in `create_quotation_line` / `add_quotation_lines` at build time. Put the `<style>` first and keep the section's visible text after it:

   ```
   <style>/*dd-print-v7*/@page { size: A4; margin: 10mm; } [data-block-type="header"] .bg-gradient-to-b { display: none !important; } @media print { [data-block-type] { break-inside: avoid; page-break-inside: avoid; } .qv-row-stacked, .qv-summary, .qv-summary-card { break-inside: avoid; page-break-inside: avoid; } .qv-pricing-head, .qv-title-row, h1, h2, h3, h4, h5, h6, p:has(> strong:only-child), p:has(> b:only-child) { break-after: avoid; page-break-after: avoid; } .qv-row-stacked p, .qv-row-stacked li { break-after: auto !important; page-break-after: auto !important; } [data-block-type], [data-block-type] * { box-shadow: none !important; } [data-block-type="pricing"]:has(.qv-row.grid) .qv-pricing-head, [data-block-type="pricing"] .qv-row.grid { display: flex !important; column-gap: 12px !important; } [data-block-type="pricing"]:has(.qv-row.grid) .qv-pricing-head > [data-qv-col], [data-block-type="pricing"] .qv-row.grid > [data-qv-col] { flex: 0 0 76px; min-width: 0; } [data-block-type="pricing"] .qv-row.grid { flex-wrap: wrap !important; } [data-block-type="pricing"] .qv-row.grid > .qv-option-banner { flex: 0 0 calc(100% + 2rem); } [data-block-type="pricing"] .qv-row.grid > .qv-cell--data { white-space: nowrap; } [data-block-type="pricing"]:has(.qv-row.grid) .qv-pricing-head > [data-qv-col=line_description], [data-block-type="pricing"] .qv-row.grid > [data-qv-col=line_description], [data-block-type="pricing"]:has(.qv-row.grid) .qv-pricing-head > [data-qv-col=line_product_title], [data-block-type="pricing"] .qv-row.grid > [data-qv-col=line_product_title] { flex: 1 1 0; } [data-block-type="pricing"]:has(.qv-row.grid) .qv-pricing-head > [data-qv-col=line_prictures], [data-block-type="pricing"] .qv-row.grid > [data-qv-col=line_prictures] { flex-basis: 88px; } [data-block-type="pricing"] .qv-row.grid > [data-qv-col=line_prictures] img, [data-block-type="pricing"] .qv-row.grid > [data-qv-col=line_prictures] .cursor-pointer { width: 88px !important; height: 88px !important; } [data-block-type="pricing"]:has(.qv-row.grid) .qv-pricing-head > [data-qv-col=line_qty], [data-block-type="pricing"] .qv-row.grid > [data-qv-col=line_qty], [data-block-type="pricing"]:has(.qv-row.grid) .qv-pricing-head > [data-qv-col=line_tax], [data-block-type="pricing"] .qv-row.grid > [data-qv-col=line_tax] { flex-basis: 52px; } [data-block-type="pricing"]:has(.qv-row.grid) .qv-pricing-head > [data-qv-col=line_amount_ht], [data-block-type="pricing"] .qv-row.grid > [data-qv-col=line_amount_ht], [data-block-type="pricing"]:has(.qv-row.grid) .qv-pricing-head > [data-qv-col=line_amount_ttc], [data-block-type="pricing"] .qv-row.grid > [data-qv-col=line_amount_ttc] { flex-basis: 84px; } }</style><p>Your section title</p>
   ```

   Copy it verbatim (it is `assets/print-rules.css` on one line, wrapped in `<style>`). `@page` sets paper and margins; the `header` line, outside `@media print`, removes the dark gradient the native header paints over the bottom of the cover in the client view and in the PDF (the editor never shows it), so the cover looks as uploaded on every quote that carries the rule; `[data-block-type]` keeps each block whole; the three `.qv-` classes keep a price-table row and the totals card whole, so a long table breaks between two lines instead of through one; the `break-after` group keeps a **title with what follows it**: the table's column header row (`.qv-pricing-head`), a price-table section title (`.qv-title-row`), a heading, a bold one-line paragraph used as a title (legal articles, rich text). Measured: a price-table section title left alone at the foot of a page moves to the next page with its lines. The `.qv-row-stacked p, li` override releases the paragraphs inside a boxed product card: without it, a description with one bold phrase chained every card to the next and pushed the whole table to the next page, leaving its header alone on a blank page. `box-shadow: none` is for Apple's PDF engine (Preview, Quick Look), which draws a soft shadow as a flat grey or coloured rectangle; Chrome and most other viewers draw it correctly, so look at the PDF in Preview before you trust it. The last group is for the **classic table layout** (`rowLayout:"inline"`): its number columns have fixed widths, so on an A4 page the description got about a fifth of the width and a description ran sixteen lines where eight suffice. On paper only, the row becomes a flex row with compact number columns and the description takes the rest; the option banner keeps its own line. It touches only tables that have inline rows: a boxed table prints identically with or without it (measured page by page).
2. **Why a line title and never an html block.** A line title renders in the page's root document, where `@page` reaches the printed page. An `html` block is isolated from the printed page (a sandboxed iframe in the client view, a shadow DOM in the PDF export): a `@page` rule inside it never reaches the printed page, and the PDF stays Letter. This does not relax the inline-first rule (SKILL.md → HTML blocks), which is about html blocks and still stands. On the web page the rule changes one thing only, on purpose: the `header` line removes the dark gradient over the cover there too. Everything else acts on paper, and the section title keeps its exact look.
3. **Exactly one rule per carrier, and a template carries it twice.** On a rework, replace the existing `<style>…@page…</style>` rather than adding a second one in the same field. A **template** carries the rule on its first title line AND in the `legalnotice` block's `other` field (step 5): a rep who deletes every line and rebuilds the table takes the title line with them, and the copy falls back to US Letter (measured: 3 of 7 copies of one template). Two identical copies of the rule do not conflict. Every deal created from the template inherits both, whether or not anyone uses Claude. A **hidden** title line (`hide: 1`) does not work: hidden means not rendered, so the rule never reaches the page.
4. **Selectors come from the print DOM, not the client view.** When printing, each block is a `<div data-block-type="…">`, and the client view's own layout classes do not exist there. A rule written on a class read in the client view matches nothing, silently, and the PDF comes out unchanged, which looks like "CSS does not work here" when it is only a wrong selector. Use the rule above as is.
4bis. **Titles inside html blocks need their own, inline protection.** When printing, an html block renders inside a **shadow DOM**, so the page-level rule above never matches anything in it, whatever the selector. Inline styles do apply there. So every section head in an html block carries `break-inside:avoid;page-break-inside:avoid;break-after:avoid;page-break-after:avoid` on its wrapper, with no empty spacer between it and its content (or the spacer carries `break-after:avoid` too), as in **HTML blocks** (SKILL.md). A legal article title written as a styled paragraph (`<p style="font-weight:600">8. Exclusivity</p>`) carries `break-after:avoid` inline as well.
5. **A quote with no price table** has no title line. The native `legalnotice` block's `other` field also renders in the root document and carries the same `<style>`, as long as the block is **visible**: a hidden legal notice is not rendered and carries nothing, like a hidden title line (measured: four copies of one template exported US Letter after their rep hid the block) (measured by REST; through the connector it is `update_quotation_block` with the complete `data`, then verify, step 7).
6. **An existing quote the client already has**: add the rule only when the user asks for it. It touches one line title and nothing visible, but it is still a write on a live quote.
7. **Verify, always.** Download the PDF from the route in SKILL.md → Checking your work, and read the page size: **595 × 842 pt on every page** (210 × 297 mm), and text no longer touching the edge. An unchanged export means the rule did not land, never that it was useless. Look at the pages too: each section whole, the totals with their table, and **the last lines of every page**: a title, a kicker or an article heading there, with its content on the next page, is a defect to fix before delivery. If you cannot fetch or measure a PDF, ask the user to download it and check the page size in their viewer, and say you have not seen it. A block taller than one page still breaks; that is expected.
8. **Copy that points at the screen is false on paper.** "The button at the top right of this page" or "click here" describes nothing in a PDF. Word it so it holds in both: "the comment button beside any section of the online proposal".

## Choose what the PDF keeps, and attach full documents

**One PDF, two copies.** The client's "Download PDF" and the copy sent at signature are printed by the platform from the same render, so everything below shapes both. The signature stamp is the only part the signed copy adds. Measured on the download, 06/11/2026; the signed copy goes through the same render.

**What prints by default**: every visible block, in page order, marketing included. And a **`pdfviewer` block prints only its title and the file name**: the document it shows on the page is **not** in the PDF (measured on a 45-page contract pack: the PDF carried the block title and the file name, nothing else). A client who signs contracts held in a viewer gets a signed PDF without the contracts.

**The recipe: one html block, [assets/pdf-documents-block.html](../assets/pdf-documents-block.html).** On screen it shows one line and loads nothing else. In the PDF it hides the blocks you list, removes its own card and prints the document pages, one image per page, where the block sits. The viewer stays on the page for reading, and the signature block's `consents` keep linking to it (`termsBlockId`).

1. **Ask which sections are contractual.** A common choice: keep the parties (`header`, `contacts`), the scope and the price (the mission recap, the `pricing` block), the documents and the `signature` block; leave out the cover letter, references, FAQ, forms, next steps and any extra « Accept and sign » button blocks (`signature` in `mode: "button"`). The user decides.
2. **Turn each PDF page into ONE image**: grey PNG, 16 levels, **110 dpi**, cropped to the page's content plus a small margin. About 55 KB a page (45 pages = 2.3 MB), sharp at reading size. With code execution: PyMuPDF `page.get_pixmap(dpi=110, colorspace=fitz.csGRAY, clip=rect)`, then Pillow `.quantize(16)` and `save(..., optimize=True)`. Read two or three pages yourself before uploading.
3. **Upload each page** with `create_media` (`file` in base64, a page is far under the ~4 MB limit). The media library shows every file in one list, so name them to group and to search: `<deal> · <document> · page 03`, in a folder named after the deal or the document version. Tell the user these files carry the PDF and must not be deleted while the quote lives.
4. **Add the html block** where the documents should print (usually just before the signature block), paste the file, and fill `HIDE` with the ids of the blocks to leave out (from `get_quotation`), `PAGES` with the page urls in order, and the screen line in the quote's language.
5. **Verify on the artefact**: export, then check the page count, that every page is 595 × 842 pt, that no page is blank, that each document page carries its image (`page.get_images()`), that the first and last page of every document are there, and that the signature comes after the documents. Open the client link once too: the line shows, the viewer is still there, and no page image loads (watch the network).

Why it is built this way (each point measured on 06/11/2026):

- **The block reaches the page only in the PDF.** There, an html block runs inside a shadow root (`document.host` exists) in the page's own window, so its script can add a `<style>` to the page. On screen it runs in a sandboxed iframe, `document.host` is undefined, and it touches nothing. The hiding exists on paper only.
- **Each block prints inside `<div id="qv-block-<block id>" data-block-type="…">`.** A rule on `#qv-block-<id>` hides exactly that block, native blocks included. Block ids survive a clone (`POST /deals/clone`) and a deal created from a template, so a `HIDE` list written in a template stays valid in every deal made from it.
- **The images are created by the script, in the PDF only.** Static `<img>` tags in a block hidden on screen still download: 90 requests for 45 pages, 3.5 MB on every visit.
- **One image per page, never one tall image per document.** Four images (one per document, pages stacked) cut back into pages by the block made the export run 45 s and answer `{"error":"Failed to generate PDF"}`. One image per page worked every time.
- **Speed (export of a 49-page quote, two runs each)**: the platform's own floor, with the documents left out, is 10.5 to 12 s. 45 pages at 150 dpi add about 5 s (15.8 s, 6.3 MB PDF); at 110 dpi about 2.5 s (13 to 14 s, 4.5 MB). Grey JPEG pages weigh three times the PNG (about 160 KB a page at 110 dpi): keep PNG. Presentation blocks cost more than document pages: the same quote with its marketing blocks printed, and no documents, took 32 s for 10 pages (one run).
- **Never `loading="lazy"`.** Lazy images print as blank pages (45 blank pages measured).
- **Size the pages in %, never in mm.** The PDF prints at about 0.8 scale: `height:270mm` came out 216 mm. `width:92%` of a full-width block gives 163 × 261 mm per page, inside the 277 mm of an A4 page with 10 mm margins.
- **Script rules of the PDF render**: create elements through `DOC` (a shadow root has no `createElement`), export the entry function on `window` (scripts run through `new Function`) and call it at load. See **duodeal-html-block-js** → render contexts.
- **The page rule still applies.** The block does not replace the A4 rule of step 1 above (`@page` lives in a line title or the `legalnotice` block). To only hide sections, with no document to attach, a rule `@media print{#qv-block-<id>{display:none !important}}` in that same carrier works too.

**Limits.** The visual editor strips a block's `<script>` the first time a rep types in it: the documents would then vanish from the PDF while the screen line stays. Build and change the block through the connector, and export again after any edit. A new version of a document means new page images and a new `PAGES` list: never overwrite the pages of a signed quote.

## Fonts and the PDF: declare them in the ROOT document

A block's own `@import` (or `@font-face`) never reaches the PDF. The export renders each html
block in a **shadow DOM**, and font rules declared inside a shadow tree are ignored: the page comes
out in system fonts, every line reflows wider, and fixed-width layouts break — while the web view,
where the block is an iframe, looks perfect.

Put the font import where the print rule already lives: the **root document**, through the native
`legalnotice` block's `other` field (or the first title line of the price table). Fonts declared
there are available to every shadow tree, so one import serves the whole quote. Keep the block's own
`<link>` to the font as well (**duodeal-quote-design** → `references/design-system.md`): that is
what the web view uses.

Verify on the artefact, not on the code: export the PDF and list its embedded fonts
(`page.get_fonts()`); the brand families must appear.

## Pick the paper by what the quote looks like: A4, or one page per slide

Decide the format before you write the rule, from what the reader sees on screen:

| The quote looks like | The PDF prints | Rule |
|---|---|---|
| A document, a letter, a proposal with a price table, a quote built from scratch | **A4 portrait, 10 mm margins** | step 1 above (`dd-print-v6`) |
| **Slides**: a 16:9 deck, a slide-for-slide replica of a presentation, one full-width slide after another | **One page per slide, at the slide's own size** (297 × 167.5 mm for 16:9, no margin), like a PowerPoint exported to PDF | below (`dd-print-deck-16x9`) |
| **A deck reworked into a web page** (the client's presentation turned into tabs, accordions, carousels) | **Slide-size pages too** (297 × 167.5 mm, 8 × 10 mm margins), each section starting a page, the slide images scaled to fit one page | below, "A reworked deck" |

The source decides: what came in as a presentation goes back out in presentation format, even
when the web version was redesigned. The client prints it next to their own deck.

Never print slides on A4 (portrait or landscape): each slide shrinks into a white frame, and a
reader who downloads the deck expects the same deck back, page for page. A4 landscape is no
longer the deck rule.

### The deck rule

In the same carrier (first title line, or the visible `legalnotice` block's `other`; a deck has
no price table, so it is usually the `legalnotice`, which you may have to add), copy verbatim:

```html
<style>/*dd-print-deck-16x9*/@page { size: 297mm 167.5mm; margin: 0; } @media print { html, body { margin: 0 !important; padding: 0 !important; } .qv-public__layout { padding: 0 !important; } .qv-public__body, .qv-public__content, .qv-public__content > * { gap: 0 !important; } [data-block-type] { break-before: page; page-break-before: always; margin: 0 !important; } [data-block-type="legalnotice"] { display: none !important; } [data-block-type] > div { border: 0 !important; border-radius: 0 !important; box-shadow: none !important; } [data-block-type="html"] > div > div { padding: 0 !important; } [data-block-type], [data-block-type] * { box-shadow: none !important; } }</style>
```

What each part does, measured on a 135-slide deck (from 69 fragmented Letter pages to 137 clean
slide pages, 22 to 38 s export):

- **`size: 297mm 167.5mm`, not 167 mm.** 16:9 of 297 mm is 167.06 mm: the slide renders about
  474 pt high, a 167 mm page holds 473 pt, so every slide spilled 1 pt onto a new page and the
  PDF had a **blank page after every slide** (272 pages for 136).
- **`.qv-public__body` gap set to 0.** The page body is a flex column with a 20 px gap: without
  this, the first slide of each block starts 12 pt down the page.
- **`[data-block-type] { break-before: page }`**: every block (header, contacts, each chapter)
  starts on a new page.
- **`legalnotice` hidden on paper.** It is only the carrier here; its `<style>` still applies
  when it is hidden with `display:none` (a block hidden with `visible:false` is not rendered and
  carries nothing).

### Inside the html blocks: one slide, one page

The root rule cannot reach a block's shadow DOM, so each slide carries its own break:

- Each slide element: inline `break-before:page;page-break-before:always;break-inside:avoid`,
  `width:100%;aspect-ratio:16/9`, and **no margin**.
- Space the slides on screen with a flex column `row-gap` on their wrapper, and cancel it on
  paper with one print-only rule placed **inside the block** (a forced page break keeps the gap
  above the slide):
  `<style>@media print{[data-deck]{row-gap:0!important}}</style><div data-deck style="display:flex;flex-direction:column;row-gap:12px">…slides…</div>`.
  This is the one `<style>` tolerated in a block, because it only exists for the PDF: if the
  editor strips it, the PDF keeps working and only gains a thin white band at the top of each
  slide.
- **No `loading="lazy"`** on slide images: lazy images print blank (measured: every slide image
  missing, only the live text left).

### A reworked deck (web page built from a presentation)

Same paper, but the content flows, so the page keeps margins: in the carrier, replace the A4
`@page` of `dd-print-v6` with `@page { size: 297mm 167.5mm; margin: 8mm 10mm; }` and add, inside
`@media print`: `.qv-public__body, .qv-public__content, .qv-public__content > * { gap: 0 }`,
`[data-block-type] { break-before: page }`, `[data-block-type] > div { border: 0; border-radius: 0 }`
and `[data-block-type="html"] > div > div { padding: 0 }` (all `!important`). Without the last two,
the block's frame and padding spill onto a **blank page at the end of each block**.
Inside the blocks:
- Each section or tab panel starts a page: inline `break-before:page` on its print title.
- A slide image kept as a figure is narrower on paper so it fits one landscape page with its
  title: `width:var(--fw,100%);margin:0 auto` on the figure, `--fw:82%` set in the carrier's
  print rule (a custom property crosses the shadow DOM, a selector does not).
- Titles keep `break-after:avoid`, and no `loading="lazy"`.

### Verify on the artefact

Export, then check: every page is **842 × 475 pt**; the page count is the number of slides plus
the header and contacts pages; each slide's background image starts at y = 0 and fills the page
(`page.get_image_rects()`); no page without an image. Render a contact sheet of the first pages
and look at it before you say it is done.

## Links survive the PDF

An `<a href>` inside a block becomes a real link annotation in the exported PDF, whatever its
position, including a whole clickable band. Verified with `page.get_links()`: the URI and the
clickable rectangle are both preserved.

