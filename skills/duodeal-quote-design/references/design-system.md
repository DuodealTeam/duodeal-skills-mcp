# Quote design system — tokens, typography, layout

## Derive the 7 tokens from the issuer's branding

- **ACCENT**: the brand's signature color (primary button on the website, logo).
  Only ONE. If the brand has several colors, take the CTA one.
  Usage: eyebrows, KPI figures, ONE word of the H1, numbered badges, a small
  decorative rule. Never as the background of large text areas.
- **INK**: the brand's near-black for headings (e.g. `#1a1d24`, `#14202b`) —
  never pure `#000`.
- **MUTED**: body text gray (e.g. `#5c6470`) — readable, contrast ≥ 4.5:1 on white.
- **PAPER**: tinted light card background (cream/ivory/very light warm gray, e.g.
  `#faf7f2`, `#f7f8fa`) — not pure white; this is what gives the "premium" feel.
- **LINE**: soft border (e.g. `#e8e6e1`, `#e5e8ec`).
- **DARK**: the brand's dark background ("problem" cards, CTA) — often a very dark
  version of ACCENT or INK.
- **FONT**: the brand font WITH a complete fallback:
  `'Police',-apple-system,'Segoe UI',Roboto,sans-serif`.
  Option: a display SERIF for a few headings (issuer name, FAQ title).

Check the whole set on a white background AND on DARK before producing the blocks.

## Brand fonts: the honest rule

- Default: **system font via the fallback stack** — zero risk, and what you should ship.
- 🚫 **No base64 `@font-face`.** Embedding the font file in the HTML bugs every time: the
  block becomes far too heavy, and the editor's auto-save strips the `<style>` anyway as
  soon as the sales rep edits it. A brand font is not worth a broken block.
- If the brand font is genuinely essential, the file goes to the **media library** like any
  other asset and the `@font-face` points at **its url** — never at inlined bytes. Design the
  block to stay good-looking in fallback either way.

## Typographic hierarchy (proven values)

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
- Spacers: `<div style="height:71px" aria-hidden="true"></div>` at the top and bottom of
  every html block (bottom of the legal bundle: ≤ 16 px). Never a spacer INSIDE
  a card.
- Buttons/pills: `border-radius:999px;padding:12px 26px;font-weight:800`.

## Images

- Host every image in the Duodeal media library (S3) before using it — never hotlink
  an external URL. Reuse an existing media first (`list_medias`); otherwise `create_media`
  with `file` in **base64, which is the normal route** for the upload (no multipart, no local
  path, ~4 MB ceiling). **Never `from_url`** despite the tool description — the URL import
  500s on most CDNs.
- 🚫 **The HTML carries the media url, never the base64.** A `data:` URI inside a block bugs
  every time: far too heavy for the editor and the PDF export.
- Intro lockup logos: issuer tile ~96 px (radius 20 px), prospect wordmark
  ~34 px tall; with no prospect logo file available, a styled text wordmark
  (`font-size:34px`, 800, INK) does the job.
- Logo wall: real files, height tuned PER logo for visual balance
  (20-40 px), centered rows `display:flex;justify-content:center;flex-wrap:wrap;gap:44px`.
- Sales rep photo: a real photo, cropped square centered on the face, rendered round
  (`border-radius:50%`, 96 px, `object-fit:cover`).
- Give every pricing product line an image. The connector cannot bind one: line tools
  take no media argument, and product tools take none either. Host the file first
  (`create_media`), then set `medias:[{id}]` on the line through the REST API with
  `X-API-KEY` if a key is already configured in the environment; otherwise attach it
  on the line in the Duodeal interface and tell the user that step is still to do.
