# Reading the source file

Where every value actually lives, and how to pull it. Examples use PyMuPDF and fontTools,
which open an Illustrator `.ai` (saved PDF compatible) exactly like a PDF.

## The page itself

```python
import fitz
doc = fitz.open(path)
for i in range(doc.page_count):
    print(i + 1, doc[i].rect)      # the artboard, NOT a constant
```

**Pages do not share a height.** A deck routinely mixes 16:9 slides with artboards two or
three times taller for the pages that carry long copy. Hard code one height and everything
below the fold on the tall pages disappears without any error. The frame WIDTH is usually
constant, which is what makes it a good basis for `vw`.

## Colours: declared, not sampled

```python
for dr in page.get_drawings():
    fill = dr.get("fill")          # floats, e.g. (0.059, 0.094, 0.133)
```

Rounding those floats gives the designer's value; the rasteriser **floors** them, so a
sampled pixel is often one unit low on one or two channels. One unit is invisible on its
own and very visible as a rectangle where a baked art crop meets the panel behind it.

Text colour comes from the span, already an integer: `span["color"]` in a
`page.get_text("dict")` walk.

## Opacities: the flat field lies

`get_drawings()` reports `fill_opacity: 1.0` for a shape that is in fact inside a 6 %
transparency group. The group alphas are only visible in the extended walk:

```python
stack = [1.0]
for dr in page.get_drawings(extended=True):
    if dr.get("type") == "group":
        stack.append(stack[-1] * (dr.get("opacity") or 1.0))
    elif dr.get("type") == "clip":
        stack.append(stack[-1])
    else:
        effective_alpha = stack[-1]        # multiply down the nesting
```

Then express it in CSS as the declared colour at the declared alpha
(`rgba(255,255,255,.06)`), not as the composited hex: it will composite correctly over
whatever ground the version uses, and one asset serves every colourway.

## Corner radii: from the curves

Walking pixels along the top edge of a rounded rectangle finds the **tangent point**, which
underestimates the radius badly (a 19 px radius reads as 14). Read the first Bézier of the
path instead: the distance between its first and last point is the radius.

```python
for it in dr["items"]:
    if it[0] == "c":               # curve
        radius = abs(it[4].x - it[1].x)
        break
```

## Text: baselines, not ink boxes

Use `page.get_text("rawdict")` and take `span["origin"]`: that is the **baseline**, the only
stable anchor. From it:

- **leading** = the difference between two consecutive baselines. Divide by the font size
  for the CSS `line-height`.
- **the left edge of a text frame** = `origin[0]`. The ink bbox starts at the first glyph's
  left side bearing and is a few units off, which is enough to misplace a whole column.
- **a rule drawn under a line** is usually a separate vector object, and often inset a few
  px further than the text. If it is, it cannot be a `border-bottom` on the text box: give
  it its own element with that inset.

## Tracking: the value that gets mistaken for a weight

A headline that comes out 1.5 % narrow than the source is almost never a weight problem.
Design tools apply document tracking, and CSS calls it `letter-spacing` in `em`:

```python
drift = []
for a, b in zip(span["chars"], span["chars"][1:]):
    glyph = cmap.get(ord(a["c"]))
    drift.append(1000 * ((b["origin"][0] - a["origin"][0])
                         - hmtx[glyph][0] / upm * span["size"]) / span["size"])
tracking = statistics.median(drift)        # in 1/1000 em; /1000 gives the em value
```

**Take the median, never the mean**: kerned pairs are a minority and they drag an average
down by a third. A whole document is usually set at one value, so measure a few runs and
check they agree before applying it globally.

Chasing this at the render instead costs real time: ink coverage and stem width measured
on screen mix the font with the renderer's antialiasing, and they will point you at a
heavier weight that is simply wrong.

## Fonts: use the designer's own files, and match the instance on the FILE

```python
name, ext, kind, buf = doc.extract_font(xref)
```

Two subsets can share a family name, and one of them may be a CID subset with no usable
cmap. **Keep the six letter subset prefix in the filename**: overwrite one with the other
and every metric probe reads the wrong face or crashes.

To check that a hosted instance really is the designer's cut, compare the **files**, never
two renders:

- **advance width**: sum `hmtx[glyph][0]` over a test string, normalised by `unitsPerEm`.
  That is the chase, and it must land within a fraction of a percent.
- **stem**: the bounding box width of a plain vertical like `l`. That is the weight.

A variable font makes this essential. A family with an optical size axis serves a
noticeably different cut at its default axis value than the one a designer picked for a
display size, and the two can be several percent apart in width at the same nominal
weight. Pin the axis explicitly when you request the font.

## Images: the clip rectangle, not the placement

Photographs in a deck are usually placed large and then masked. `get_image_rects()` returns
the **placement**, so a neat grid looks like a pile of overlapping images. The masks are in
the extended walk:

```python
for dr in page.get_drawings(extended=True):
    if dr.get("type") == "clip":
        rect = dr.get("scissor")           # what actually shows
```

Pre-crop each photograph to its clip at extraction time: the file then IS what shows, the
layout needs no `object-fit` juggling, and the grid can be flow rather than absolute, which
is what lets it reflow on a phone.

## A grid of many small marks

A logo wall, a row of badges or a set of icons has no useful structure in the file. Detect
them: render the panel, find the rows of non-ground pixels, then the columns within each
row. That gives one bounding box per mark, and from there each becomes its own asset.
