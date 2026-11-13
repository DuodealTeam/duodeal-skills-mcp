---
name: duodeal-deck-to-blocks
description: Turn a client document (a PowerPoint, a PDF, an Illustrator .ai, a Canva or Keynote export, an old quote) into a Duodeal deal made of V2 html blocks, with every image imported at the right quality, and a designer's deck into blocks that match the source at the pixel and stay readable on a phone. Starts by asking for the original file (the .pptx before the PDF), inventories every image, uploads them in batches and proves none is missing. Method for reading the real values out of the file instead of guessing from a render, cutting the artwork, hosting the brand font, sizing everything in vw, and closing the gap with a measured calibration loop. Use whenever someone hands over a deck, a presentation, a brochure, a PDF, a .pptx, an .ai, a Figma export or "the designer's file" and wants a deal, a quote or a selling page built from it ("create a deal from this PDF"), whenever images are missing or blurry after such an import, whenever a block "does not look like the design", and whenever a transposed block has to be checked on mobile.
---

# A designer's deck to Duodeal V2 blocks

> 🔄 **Are these skills current?** Read through the Duodeal connector (`get_duodeal_skill`),
> they are: the server always serves the latest version, so skip this check. Only a **copy**
> installed locally can be stale (nothing refreshes it on its own): then read the line `Skills Duodeal : mises à jour
> le …` in `DUODEAL-CONTEXT.md` (project root): **absent, or more than 7 days old → offer
> the refresh in one sentence before working**. Procedure: [../duodeal-onboarding/references/updating-skills.md](../duodeal-onboarding/references/updating-skills.md). Ask **once per session**;
> if the user declines, work with what is installed and drop it.


The client sends a deck. Every slide has to become an html block that a rep can edit, that
survives the visual editor, and that a designer will recognise as their own work.

This is not "design a quote" (that is **duodeal-quote-design**, which starts from a brand
and invents the layout). Here the layout already exists and is not yours to reinterpret:
the file is the specification.

## Before anything: the source file, then the images

Two steps come before every method below, for a pixel-faithful deck as for a plain "make me a
deal from this PDF":

1. **Ask once for the original file**: the `.pptx` (Keynote and Google Slides export to it)
   before the `.ai`, the `.ai` before a Canva link, and the PDF only when there is nothing
   else. A `.pptx` is a zip whose `ppt/media/` holds every image at full resolution with its
   transparency: no PDF library, no cropping, no redaction.
2. **Inventory every visual before uploading anything**, show the count to the user, and close
   with the gate "source: N visuals / deal: N visuals". This is the step whose absence loses
   images.

The whole path (PDF types, tools to install, formats and sizes, upload from disk with
`prepare_media_uploads` + `curl`, or `create_medias` without a shell, completeness gate): **`references/from-a-client-document.md`**. Read it first
whenever the request is to build a deal from a document.

## The one rule everything else follows from

**Read the FILE, never the render.**

A rasterised page lies in ways that all point the same direction, and each one costs a
visible defect:

| What you take from a render | What it actually is | The defect it causes |
|---|---|---|
| a sampled background colour | the rasteriser floors, so it is often 1 unit low | a ghost rectangle where an art crop meets the panel |
| an "opaque" fill | usually a colour inside a transparency group | a card several shades off |
| a corner radius walked in pixels | the tangent point, not the radius | corners visibly too sharp |
| a text width measured on screen | the renderer's antialiasing, not the font | you chase a weight when the problem is tracking |
| an ink bounding box | not the baseline | every vertical gap slightly wrong |

Everything you need is declared in the file. `references/reading-the-source.md` says
where each value lives and how to pull it.

## The workflow

**0. Open it and inventory the pages.** An Illustrator `.ai` saved as PDF compatible IS a
PDF: a PDF library opens it directly, text, vectors and colours included, with no round
trip through Illustrator. **Read each page's own rectangle**: a deck often mixes 16:9
slides with much taller artboards, and assuming one height silently crops half the content
off the tall ones.

**1. Extract a spec per page** before writing a single line of HTML: ground colour, every
shape with its effective colour, every text run with its font, size, declared colour,
baseline and tracking, every image with its clip rectangle. Group the pages into
**families**: a deck of N slides is usually 15 to 20 layouts, each declined in 2 to 4
colourways. One builder per family, on a resilient registry so a broken family never
blocks the others from building.

**2. Get the brand font in.** Extract the faces from the file itself, so the block uses the
designer's own cuts. Host them through a stylesheet in the media library, never inlined in
the block. `references/art-fonts-and-qa.md` explains why a font called directly from a
block is refused and how the stylesheet route gets round it.

**3. Cut the artwork.** Redact the text FIRST so no copy is ever baked into an image, crop
at the art's real bounding box, and **knock the ground out to transparency** rather than
baking it in. **Where the source is flat vector, export vector**: shapes, dials, icons and
wordmarks belong in SVG, and only photographs have to stay raster. Icons, logos and
photographs are cut individually, never as one picture of a wall or a collage.

**4. Build the block in `vw`.** Every length is the source's own number divided by
`frame_width / 100`, with a reading floor for the phone and a cap. No media query: one
`clamp()` switches between the desktop value and the stacked value, and the visual editor
cannot strip a `clamp` the way it strips a `<style>`.

**5. Calibrate against the slide.** This is the step that closes the gap, and skipping it
is what makes a block "look right" while sitting 30 px out. Render the block, put the slide
beside it at the same width, and diff the ink band by band until nothing exceeds 2 or 3 px.

**6. Run the mobile pass.** Render every block at the width the iframe really gets on a
phone and fix what breaks. Four faults are systematic and they are listed in
`references/art-fonts-and-qa.md`; the first one alone ruins every text block in the deck.

**7. Measure the served page** with `curl` before delivering. The client view repeats each
block's code roughly **3 x N times**, N being the number of blocks, so weight grows with
the square. A template that carries every colourway at once is heavy by construction; a
real proposal drawn from it uses a fraction of the blocks and lands far lower.

## When the deck becomes the PAGE, not blocks inside a proposal

A pitch deck read on a link is a different object from a deck cut into editable sections: the
slide IS the unit. What works, measured on a full pitch deck (September 2026):

- **One block per slide, each a 16:9 stage.** The stage declares `container-type:inline-size`
  and `aspect-ratio:16/9`; every length inside is the source's own px divided by
  `frame_width/100` expressed in `cqw`. The slide then keeps the designer's proportions at any
  width the platform serves, with no calibration pass and no drift, and the text stays live html.
- **Two layouts in one block, switched by `clamp()`.** The stage for desktop and print, a stacked
  flow for the phone, each wrapped in `max-height:clamp(...)` with `overflow:hidden`.
- ⚠️ **Shift the inactive layout off the page.** `autoResize` measures the block by the LOWEST
  bounding box on the page, and a box clipped by `overflow:hidden` still has its rect. The hidden
  phone layout therefore adds its full height under every slide: up to 1 400 px of blank space.
  Give the inactive wrapper's child `position:relative;top:clamp(-50000px, …, 0px)` so its boxes
  sit above the page and count for nothing. Verify by running the platform's own measurement
  (the `duodeal-microapp-resize` routine in the client bundle) against your block: at desktop
  width it must return exactly the stage height.
- **Fit the text, do not eyeball it.** When the deck's font is replaced (a brand font that cannot
  load, or the client's web font), text no longer fits its fixed box. Render every slide at frame
  width in a headless browser, compare each text's `scrollWidth`/`clientWidth` and its height
  against the source box, and shrink the ones that overflow, iterating until nothing moves. Group
  the texts that must share a size (two columns read as one table, a row of card titles).
- **A band is a slide with another height.** For a link out, a testimonial or a video, use the
  same stage with `aspect-ratio:1920/420` and the platform's own card radius (16 px, read from its
  stylesheet, in absolute px since the block is already the card's width). Wrap the whole stage in
  an `<a>`: anchors survive the PDF export as real link annotations.
- **The PDF of a deck is one page per slide, at the slide's size**, never A4: 297 × 167.5 mm with
  no margin for 16:9, each slide breaking before itself, no lazy images. The exact rule and its
  checks: **duodeal-mcp-best-practices** → references/pdf-export.md → "Pick the paper".

### Three findings that cost time

- **Figma's DM Sans renders at the optical size of its point size, capped at 40** — including the
  face named « DM Sans 9pt ». Setting `font-variation-settings:'opsz' 9` makes every line 8 to 13 %
  too wide. Measure a known string against the Figma render before trusting an axis value.
- **Unicode line separators (U+2028) inside Figma text break the MCP transport**: the response is
  truncated mid-string and the call fails with an opaque JSON error. Escape them in any extractor.
- **Node exports come clipped to the frame**, not to the node's own box: an art layer whose box
  starts at a negative coordinate is returned already cropped, so place it at `max(x,0), max(y,0)`.

## Non-negotiables when transposing

- **No copy is ever baked into an image.** Slide text is redacted out of the page before
  every crop, so all wording on the page is real html a rep can edit and the art is
  decoration only. A diagram whose labels are baked in becomes 3 px type on a phone.
- **Reproduce, do not reinterpret.** If the source indents a block by 19 px, indent it by
  19 px. Ratios that "look about right" are what a designer notices first.
- **The client's copy stays exactly as they wrote it**: deck copy, documents, legal texts,
  T&Cs, dashes included. **Reproduce typos verbatim, and say so.** A misspelled standard or
  product name in the client's copy is theirs to correct. Flag it; never silently rewrite it.
- **One platform exception: a product title in the price table.** The server truncates a
  `productTitle` at an em dash, so there only, replace it with ":", "·" or ",", and say which
  lines you changed.
- **The reading floor wins over fidelity, and you say where.** Body copy on a deck is
  often 11 px once scaled to block width; the floor for something read on a phone is 13.
  Anything held at the floor no longer scales with the slide, and that is the one place a
  transposed block legitimately differs from its source.

## What to hand back

The links, the completeness line ("source: N visuals / deal: N visuals", every gap named), and a drift table: block, source page, panel height against slide height. Give
the mean absolute drift and the worst case rather than a claim that it "matches". State
the deliberate deviations (the reading floor, any hairline that a browser cannot draw),
the copy issues you found, and the media that the build left unreferenced.

**A block is only done after a real visual check** of the client link at desktop AND phone
width. Never claim a render you have not seen.

## References

- `references/from-a-client-document.md` — asking for the original file, the four kinds of
  PDF, the image inventory, formats and sizes, batch upload, the completeness gate.
- `references/reading-the-source.md` — where every value lives in the file: colours,
  opacities, radii, baselines, tracking, font instances, clip rectangles.
- `references/art-fonts-and-qa.md` — cutting the artwork, hosting the brand font, the `vw`
  system and its traps, the calibration loop, the mobile pass.
