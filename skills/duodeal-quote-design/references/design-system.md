# Quote design system — tokens, typography, layout

**The client's brand wins.** Their brand guide, logo colors, fonts and website, and what
`DUODEAL-CONTEXT.md` records (section 2), come first. Every value below that the client's brand
does not set is Duodeal's default: a starting point, never a rule over their identity.

## Derive the 7 tokens from the issuer's branding

- **ACCENT**: the brand's signature color (primary button on the website, logo).
  Default: only ONE; if the brand has several colors, take the CTA one, unless the
  brand guide uses them together.
  Default usage: eyebrows, KPI figures, a word of the H1, numbered badges, a small
  decorative rule. Never as the background of large text areas.
- **INK**: the brand's heading color; default, a near-black (e.g. `#1a1d24`, `#14202b`)
  rather than pure `#000`.
- **MUTED**: body text gray (e.g. `#5c6470`) — readable, contrast ≥ 4.5:1 on white.
- **PAPER**: light card background; default, a tinted one (cream/ivory/very light warm gray,
  e.g. `#faf7f2`, `#f7f8fa`) rather than pure white, unless the brand is white.
- **LINE**: soft border (e.g. `#e8e6e1`, `#e5e8ec`).
- **DARK**: the brand's dark background ("problem" cards, CTA) — often a very dark
  version of ACCENT or INK.
- **FONT**: the brand font WITH a complete fallback:
  `'Police',-apple-system,'Segoe UI',Roboto,sans-serif`, loaded as below.
  Option, when the brand has one: a display SERIF for a few headings (issuer name, FAQ title).

Check the whole set on a white background AND on DARK before producing the blocks.

## Brand fonts: one rule

**The client's brand font is loaded by a `<link>`; the system stack is the fallback.**

- Put one `<link rel="stylesheet" href="…">` at the top of the block, pointing at either:
  - a **Google Fonts css2 URL** with `&display=swap`
    (`https://fonts.googleapis.com/css2?family=Inter:wght@400;800&display=swap`), when the
    brand font is there;
  - a **`.css` hosted in the account's media library** that carries the faces, for a font
    Google Fonts does not have (the route, and why a stylesheet gets past CORS where a font
    file does not: **duodeal-deck-to-blocks** → `references/art-fonts-and-qa.md`).
- A `<link>` is not a `<style>`: the editor does not strip it on the first rep edit.
- Every `font-family` ends on the system stack (`-apple-system,'Segoe UI',Roboto,sans-serif`):
  it is what shows while the font loads, and wherever it cannot load.
- What does not work:
  | Route | What happens |
  |---|---|
  | `@font-face` in the block | needs a `<style>`, which the editor **strips** on the first rep edit |
  | a base64 / `data:` URI font in the block | far too heavy → the block bugs |
  | a font file uploaded as a media | fonts are **not** in the accepted MIME list (images + pdf only) |
- **The PDF** renders each block in a shadow DOM, where a block's own font rules are ignored:
  declare the font in the root document as well (**duodeal-mcp-best-practices** →
  `references/pdf-export.md` → Fonts and the PDF).
- **The logo keeps the typeface exactly.** `image/svg+xml` is accepted by the media library,
  so a wordmark exported as SVG keeps the brand type as outlines.

## Typographic hierarchy (default values, when the client's brand sets none)

| Element | Style |
|---|---|
| Eyebrow | 12 px, 800, `letter-spacing:.16em`, uppercase, ACCENT color |
| H1 (intro) | 27 px, 800, line-height 1.2, INK, ONE `<span style="color:ACCENT">` |
| Section H2 | 23-24 px, 800, line-height 1.25, INK |
| Card title | 15-15.5 px, 800, INK |
| Body | 15 px, line-height 1.75, MUTED |
| Card text | 13.5 px, line-height 1.65, MUTED |
| KPI figure | 22 px, 800, ACCENT |
| KPI label | 11.5 px, MUTED |
| Notes / legal mentions | 12.5 px, line-height 1.6, MUTED |

## Layout

- Content width: `max-width:780-860px;margin:0 auto;padding:0 18px`
  (780 for dense sections such as recap/FAQ, 860 for card grids).
- Cards: `#fff` background (or PAPER), `border:1px solid LINE`, `border-radius:14-16px`,
  padding `22px 24px` to `26px 28px`. Large CTA cards: radius 20 px.
- **Responsive without media queries**: container
  `display:flex;flex-wrap:wrap;gap:14px`, children `flex:1 1 340px` (2 columns that
  collapse to 1 on mobile) or `flex:1 1 150px;min-width:140px` (a band of 4 KPIs that
  reflows to 2×2).
- PDF break protection: `break-inside:avoid;page-break-inside:avoid` on every card.
- Spacers: `<div style="height:clamp(39px,7vw,71px)" aria-hidden="true"></div>` at the top and bottom
  of every html block, the same value at both ends (bottom of the legal bundle: ≤ 16 px).
  A default: the client's own spacing wins. Never a spacer INSIDE a card.
- Buttons/pills: `border-radius:999px;padding:12px 26px;font-weight:800`.

## Images

- Host every image in the Duodeal media library (S3) before using it — never hotlink
  an external URL. Reuse an existing media first (`list_medias`); otherwise `create_media`
  with `file` in **base64, which is the normal route** for the upload (no multipart, no local
  path, ~4 MB ceiling), or `from_url` works for a public image URL (a refused download comes back with its reason, e.g. « the server answered 403 »: then download it yourself and send `file`).
- 🚫 **The HTML carries the media url, never the base64.** A `data:` URI inside a block bugs
  every time: far too heavy for the editor and the PDF export.
- Intro lockup logos: issuer tile ~96 px (radius 20 px), prospect wordmark
  ~34 px tall; with no prospect logo file available, a styled text wordmark
  (`font-size:34px`, 800, INK) does the job.
- Logo wall: real files, height tuned PER logo for visual balance
  (20-40 px), centered rows `display:flex;justify-content:center;flex-wrap:wrap;gap:44px`.
- Sales rep photo: a real photo, cropped square centered on the face; default rendering
  round (`border-radius:50%`, 96 px, `object-fit:cover`).
- When the client has product images, give pricing product lines an image (recommended, not
  blocking: a service business often has none). A line created with `product_id` carries
  the catalog product's photos by itself; otherwise host the file (`create_media`) and
  pass `media_ids` on `create_quotation_line` / `update_quotation_line` /
  `add_quotation_lines`.
