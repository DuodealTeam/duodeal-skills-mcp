# Artwork, fonts, the vw system, and the two QA passes

## Cutting the artwork

**Redact the text first.** Remove the text and keep the line art, so no copy is ever baked
into an image:

```python
for b in page.get_text("dict")["blocks"]:
    if b["type"] == 0:
        page.add_redact_annot(fitz.Rect(b["bbox"]), fill=None)   # fill=None or it paints white
page.apply_redactions(graphics=fitz.PDF_REDACT_LINE_ART_NONE,
                      text=fitz.PDF_REDACT_TEXT_REMOVE)
```

**Crop at the art's real bounding box**, not the whole slide. Scan the redacted page for
pixels that differ from the ground: the same asset comes out about one and a half times
larger on screen, because it fills its frame instead of floating in it.

**Knock the ground out to transparency**, do not bake it in. A baked crop has to match the
panel exactly, and every lossy format drifts a few levels on a flat area (measured: 5 to 7
levels at the 99th percentile, up to 46 at an edge), which reads as a halo at the join.
Cutting the ground removes the problem instead of fighting it, and the same asset then
works on every colourway.

Flood fill from the crop's border rather than keying on colour, so a dark patch **inside** a
photograph that happens to sit near the ground colour stays opaque:

```python
# seed the queue from the four edges, spread over pixels within tolerance of the ground,
# mark them transparent, then feather the alpha by about half a pixel
```

Lossy WebP with alpha is the right container for a photographic crop: a photo crop that is
420 KB as PNG lands around 50 KB with no visible loss and no halo.

**But where the source is flat vector, export vector.** Shapes, dials, connectors,
confetti, wordmarks and outline art should leave the file as SVG, not as a raster crop:
sharp at any zoom, sharp in print, and usually lighter than the 3x bitmap it replaces
(measured on one deck: 35 KB PNG to 16 KB SVG, 49 KB WebP to 15 KB). Set the page's crop
box to the region, export, then drop the path that is the page ground (a rectangle the
size of the mediabox, in the ground colour) so the art is transparent.

Five traps:

- ⚠️ **Drop that ground by geometry, never by matching formatted numbers.** The obvious
  implementation builds the expected path string from the mediabox dimensions and compares
  it to the `d` attribute. It works only while the page height is round: the exporter
  writes `77.78` where the mediabox says `77.8131`, the comparison fails, and the ground
  survives as a coloured slab. Nothing looks wrong until that asset is laid on a panel of a
  different colour, and then it reads as a box around the art. Parse the rectangle, compute
  its bbox, and drop the path when its fill is the ground colour **and** its bbox covers
  the mediabox to within a couple of percent. Audit every exported asset afterwards: list
  the fills that remain and check none of them is the ground.
- **Art outside the crop box is still exported**, because it belongs to the page. It never
  shows, and it can be most of the file. Drop any body path whose bounding box cannot reach
  the viewBox, computing that bbox over every number in the path data, control points
  included: that is a superset of the real bbox, so a path dropped this way is provably
  invisible. Measured on one deck: dials 40 KB to 10 KB, a connector 39 KB to 3 KB, total
  assets cut by about two thirds. Filter the body only, never the `<defs>` clip paths.
- ⚠️ **The SVG export embeds every raster on the PAGE**, not just the cropped region. A
  small wordmark cut from a page carrying a photograph came out at 37 MB. Only convert
  from pages that contain no bitmap image; take a shared element like a wordmark from
  whichever page is cleanest.
- **Some vector art is heavier as SVG.** A dotted connector is dozens of tiny paths, a
  complex diagram hundreds. Convert, compare against the raster, and keep whichever is
  smaller unless the sharpness is worth the bytes. A simple rule: keep the SVG up to about
  1.3x the raster's size, fall back beyond that.
- **The crop box is in the mediabox's own units.** A file with a UserUnit scale (a page
  reported as 1920 wide whose mediabox is 192) needs the region scaled by that factor, or
  the call fails with "CropBox not in MediaBox".

**Trim two source pixels off any edge that touches the page border.** A clip on the border
renders its last row in partial coverage mixed with white, which shows as a bright seam.

## Images the client will replace

The visual editor replaces an image by **swapping its `src` and keeping its style**. Two
consequences, and both are silent until someone actually uses the template:

- **A placeholder must fill its frame.** A centred glyph at 12 % width means the rep's
  photograph arrives at 12 % width, centred, inside an otherwise empty box. Build the
  placeholder as a full frame asset and let the `<img>` cover the whole well.
- **The frame must come from the WRAPPER, not from the image.** Lock the deck's own ratio
  with `padding-top` on a relative wrapper and give the image
  `position:absolute; inset:0; width:100%; height:100%; object-fit:cover`. A photograph
  with a different aspect ratio then crops instead of deforming the grid around it, and the
  block keeps its height to the pixel. Verify it: swap a landscape file into a square slot
  and check the panel height does not move.

Anything the client's brief calls "replaceable" gets this treatment: image wells, headshot
placeholders, photo grids.

**Cut icons, badges and logos individually.** A wall of thirty logos baked as one image
scales to 24 px per logo on a phone; as thirty images in a wrapping grid it reflows to
three columns and stays readable. Same for a diagram: if its labels are baked in, they will
be unreadable on a phone, so either rebuild it in html or give it a minimum width inside a
container that scrolls sideways.

## Hosting the brand font

A `@font-face` request is always made in CORS mode, and a media bucket that serves images
happily may send no `Access-Control-Allow-Origin` header at all. A font called directly
from a block is then **refused by the browser**, with no visible error other than the
fallback:

```
Access to font at '.../font.woff2' from origin 'null' has been blocked by CORS policy
```

The origin is `null` because a block runs in a sandboxed `srcdoc` iframe with no
`allow-same-origin`, so even a same-origin proxy would not help: the header would have to
be `*`.

**A stylesheet is not subject to CORS.** So:

1. convert the extracted faces to woff2,
2. build one `.css` carrying them as `data:` URIs,
3. upload that file to the media library,
4. put a single `<link rel="stylesheet" href="...">` at the top of each block.

Four wins at once: the bytes live in the media library and not in the quotation, the block
stays tiny so nothing multiplies, there is **no `<style>` tag for the editor's auto-save to
strip**, and the typography is the designer's own with no external dependency.

⚠️ **Never build that stylesheet from the subsets embedded in the source file.** A design
tool subsets per page: the cmap still lists every glyph, but the OUTLINE of anything unused
on that page is **empty**, so the letter takes its width and draws nothing. Measured on one
deck, the extracted body face had no digits 1 to 9 and no `d f g j k q x z G K Q Z`, which
is exactly the character set a rep types into the fields. Nothing looks wrong until someone
fills the template in, and then a price reads `£....00`.

So: take the **complete** faces, check they are the designer's cut by comparing the files
(advance and stem, see `reading-the-source.md`), and subset them yourself over a character
set wide enough for any client name, price or date: printable Latin, the Latin-1 accents,
curly quotes, the currency symbols, and the `fi`/`fl` ligatures that PDF text extraction
produces. Audit the result: for every character used in the blocks, assert the glyph exists
AND has a non-empty outline.

**Never inline a font as base64 inside the blocks.** The client view repeats each block's
code about `3 x N` times, N being the number of blocks, so an inlined face is paid
quadratically: negligible on a one block test, tens of megabytes on a full deck.

## The vw system

Every length is the source's own number turned into a share of the block width:

```
vw_value = source_px / (frame_width / 100)
```

with a **floor** for the phone and a **cap** so nothing keeps growing on a very wide
iframe. Sizing this way means the block keeps the deck's proportions at every width the
platform serves, and the iframe width is not what you would guess: measure it on the served
page rather than assuming.

Four traps, all of which produce a silent wrong result:

- **`clamp()` is `max(MIN, min(VAL, MAX))`, so a floor above the cap WINS.** `clamp(14px,
  0vw, 0px)` is 14 px, not 0. Guard both ends in the helper: if the floor is above the cap,
  return the cap; if the value is zero, return `0`.
- **N columns and N-1 gutters must total 100 %.** Choose the bases by hand and the row
  wraps, which silently doubles the block's height. Derive one from the others.
- **A percentage margin resolves against the containing block's WIDTH**, not its height. It
  is a good way to express vertical rhythm that scales, as long as you know which element
  the percentage is resolving against.
- **A switching `clamp()` only fires if its two bounds can be ORDERED, and the smaller one
  must be the first argument.** Growing on a phone (a measure going to 100 %) and shrinking
  on a phone (art going to 0) need the switching term's sign mirrored; feed a shrinking
  switch to the growing form and it silently returns the DESKTOP value on the phone. And
  two bounds can only be ordered when they share a unit: mixing `69.9%` with `128px` gives
  a length that is wrong at BOTH ends. Express both in the same unit.
- **In the helper that writes inline styles, drop only null and empty values.** A truthiness
  test treats a numeric `0` as absent, which silently swallows every `top:0`, `right:0` and
  `bottom:0` and quietly un-anchors absolutely positioned art.
- **A bottom-anchored column moves as a system.** With `align-items:flex-end`, the tallest
  item sets the row height and everything else hangs from the bottom, so shortening a card
  slides the whole column DOWN. The vertical gaps then have to be solved together, not one
  at a time, or the calibration oscillates for ever.

**No media query.** They live in `<style>`, which the visual editor strips. One `clamp`
switches instead:

```
clamp(<desktop>, (<threshold>px - 100vw) * 999, <stacked>)
```

Above the threshold the middle term goes hugely negative and the minimum wins; below it,
hugely positive and the maximum wins. Note the order: the DESKTOP value is the minimum.

## The calibration loop

The step that actually closes the gap. Eyeballing does not: a block can look right and sit
30 px out.

1. render the block at the served width,
2. render the source page at the same width,
3. reduce both to **bands of ink**: runs of rows carrying ink of one class (bright text,
   accent text, a raised card ground), restricted to the text column,
4. match the bands in order and print `dy`, `dx`, `dw` for each.

Matching in order rather than by fixed windows means a block that has drifted vertically is
still compared against the right element. Iterate until nothing exceeds 2 or 3 px, then
record the panel height against the slide height as the single headline number.

Run it over every block at the end and report the **mean absolute drift and the worst
case**. That is a number a designer can argue with; "it matches" is not.

⚠️ **A harness that renders nothing reports perfect agreement.** Building the comparison
page with the driver's `set_content` puts it at an `about:blank` origin, where `file://`
sub-resources are blocked: every local asset fails to load, and a diff of two broken-image
placeholders is 0.000 %. The same trap hides behind any silent load failure. So before
trusting a comparison, **assert the images actually loaded** (`naturalWidth > 0`, or a
minimum ink coverage), and load the page from a real file with file access allowed. Treat a
run of exact zeroes as a suspect harness, not as a result.

**Verify the fix on the artefact the client is served**, not only on the local build: fetch
the uploaded asset back from its URL and check its content, and confirm the stored block
points at the new URL. Rebuild, re-upload and re-push are three chances to compare the
wrong thing.

## The mobile pass

Render every block at the width the iframe really gets on a phone, and check three things:
nothing overflows sideways, no text falls under the reading floor, and no absolutely placed
element has landed on the copy.

Four faults are systematic, and the first ruins every text block in the deck:

1. **A text measure in `vw` collapses.** A `max-width` of `36vw` is about 127 px on a phone,
   which turns a headline into a two word column. Route every measure through a helper that
   keeps the source's width above the wrap threshold and takes the full column below it.
2. **An absolutely placed overlay does not scale with its art.** Its text is held at the
   reading floor while the artwork under it shrinks, so it ends up two or three times too
   big and spills. Give it its own stacked position.
3. **Decorative art in a zero height container lands on the text** once the layout stacks.
   Reduce it or take it out below the threshold. Beware the opposite error too: adding
   `overflow:hidden` to a zero height container to tidy that up will clip the art to nothing
   on DESKTOP as well.
4. **A fixed `min-width` inside a narrow card bursts it.** It forces narrow items far past
   their share and the card overflows. Set the stacked size on the WIDTH instead, never with
   a min-width.

## Two things to say when you hand it over

**Weight.** Measure the served page with `curl`. A template that carries every colourway at
once is heavy by construction because of the `3 x N` repetition; a real proposal drawn from
it uses a fraction of the blocks. Give both numbers so nobody reads the template's weight as
what a client will download.

**Leftovers.** A build of this size uploads assets that later get superseded. List the media
that no block references any more, verified against the served page, and let the account's
owner delete them. Never delete them yourself.
