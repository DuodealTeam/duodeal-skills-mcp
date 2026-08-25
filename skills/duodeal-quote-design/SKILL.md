---
name: duodeal-quote-design
description: Build a design-grade Duodeal quote in HTML, at premium selling page quality — token-based design system, narrative structure of the V2 blocks, proven HTML skeletons (intro, value cards, order recap, social proof, FAQ, CTA, legal pack), inline-first rule and delivery checklist. Use whenever someone wants a "beautiful quote", a "design" or "premium" quote, a quote with real wow factor, a polished selling page, a better-looking proposal, or wants to turn a raw quote into a visual proposal. Also covers reworking a quote that already exists: restyle it, rewrite the HTML of a block, add or remove a section, and edit the price table (add, change, reorder or delete lines) — the same way as when the quote was created.
---

# Duodeal design quote (HTML, V2 blocks)

Guide for building a visually premium quote. The context (sender branding, offers,
prospect) is already known: no research to do — apply these instructions.
Getting a designed block on the page always takes two steps: create it, then write its
full content (connector: `add_quotation_block` writes **default** content only, then
`update_quotation_block` with the **complete** `data`, or `replace_quotation_block_text`
for large html). Read the current block inventory from the quotation itself
(connector: `get_quotation` → `blocks[]`; there is no `list_quotation_blocks`).
(see the **duodeal-v2-blocks** skill for the technical contract).

## Step 0 — New quote, or rework of an existing one?

Both use the **same tools and the same rules**: an already-delivered quote is edited exactly like
one being built, block by block. Nothing here is create-only.

Start by reading the server state (`get_quotation {id}` → `blocks[]` with every `id` and `type`,
`list_quotation_lines {quotation_id}`), then touch **only** what was asked — never rebuild a whole
quote to change a section, and never re-post the full `blocks` array.

**Editing the HTML of a block** (same as at creation, on a block that already exists):

- Small change, targeted text: `replace_quotation_block_text` {`quotation_id`, `block_id`,
  `field` (`"code"` for html, `"columns.0"` for wysiwyg), `search`+`replace`} — anchors **short
  and unique**, no regex, no `replace_all`.
- Rewritten block: `update_quotation_block` with the **COMPLETE `data`**. ⚠️ The merge is
  **shallow at root**: a partial `data` wipes the rest of the object. Read the block, edit in
  memory, send it whole — and keep the version you read, it is your only undo.
- New section: `add_quotation_block` {`type`, `position`} (default content) then
  `update_quotation_block` to fill it, then `reorder_quotation_blocks` with the **complete**
  ordered list of ids if it must move.
- The Step 3 golden rules apply to every edit, including a one-line fix: still inline-first,
  still `DuoDeal.autoResize()` at the end, still no "—".

**Editing the price table** (native `pricing` block):

- Rows are **not** in `block.data` (its `data` holds only `discountEnabled`, `discount`,
  `discountType`, `columns`): they are quotation-lines. List them first
  (`list_quotation_lines {quotation_id}`), then `update_quotation_line` to change one,
  `add_quotation_lines` to add several, `create_quotation_line` for a single one,
  `delete_quotation_line` to remove one (nothing cascades: deleting the pricing block leaves
  its lines behind).
- Reordering = the `weight` field (increasing = display order). Every line carries a `tax_id`,
  including `title` and `subtotal` ones. Several pricing blocks on the page → set `blockId` on
  the line so it lands in the right table.
- Ids are per tenant: re-read `list_taxes` / `list_unities` on THIS account, never reuse ids seen
  on another quote.

**Before touching anything**: a real client quote is only edited on explicit request, the Duodeal
editor tab must be closed on that deal (auto-save overwrites API writes with its in-memory copy),
and the changes are re-checked on the live page afterwards (Step 4).

## Step 1 — Lock the design system (BEFORE any HTML)

Define 7 tokens from the sender's branding, and stick to them in ALL blocks:

| Token | Role | Rule |
|---|---|---|
| `ACCENT` | Accent color | **ONE only** — the brand's signature color |
| `INK` | Heading ink | Brand near-black (not pure #000) |
| `MUTED` | Secondary text | Readable mid grey |
| `PAPER` | Light card background | Often cream/ivory, **not pure white** |
| `LINE` | Soft borders | Very light grey |
| `DARK` | Brand dark background | For "problem" cards and CTA |
| `FONT` | Font + fallback | `'Police',-apple-system,'Segoe UI',Roboto,sans-serif` (replace "Police" with the brand's font name) |

Validate mentally: sufficient contrast, accent used sparingly
(eyebrows, key figures, ONE word of the H1 — never whole paragraphs).
Typographic details and choices: [references/design-system.md](references/design-system.md).

## Step 2 — Narrative structure (canonical block order)

1. **native `header`** — sender logo + cover, filled in, never hidden nor recoded in HTML
2. **`contacts`** — native
3. **html INTRO** — 2-logo lockup (sender · separator · prospect) → eyebrow
   "PROSPECT × SENDER" → H1 (ink + ONE accent word) → personalized hook
   (contact name, their context) → dark "what the current situation costs" card
   (3-4 bullets, the last one quantified) → 1-click video if available
4. **html SOLUTION** — 3-4 value cards (the prospect's vocabulary) + a strip of
   4 quantified KPIs
5. *(optional)* **html GALLERY / DEMO** — real photos (physical business) or interface
   mockup (SaaS)
6. **`pricing`** — the priced quote (title "Your quote"); attach every line to this
   block (line tools carry the block's `blockId`) and give every product line an
   **image** — not settable by the connector: line and product tools take no media
   argument, so host the file first (`create_media`) then bind it via REST if a key is
   configured, otherwise in the Duodeal interface, and tell the user
7. **html ORDER RECAP** — one-off vs recurring, spelled out. **Recurring lives HERE**
   (the native table has only one total per quote)
8. **html SOCIAL PROOF** — real testimonials, otherwise a logo wall (real logo
   files, never names typed as text)
9. **html FAQ** — 5-8 real objections + an "Another question?" card pointing to the
   native comment button. ⚠️ **Never the native `faq` block** (it renders HTML
   entities literally)
10. **html NEXT STEPS + CTA** — 3-4 step stepper → dark CTA card pointing to
    the native "Accept & sign" button (French deals: « Accepter et signer ») → **large sender card**
    (real round 96 px photo, name, contact — humanize)
11. **`accept` + `signstamp`, side by side** — the signature block and its stamp always
    ship as a pair: once signed, `accept` disappears and only `signstamp` shows the
    signature (see the pairing rule in **duodeal-mcp-best-practices**)
12. **`legalnotice`** — designed legal pack (T&Cs as a grid of cards)

Adapt (remove/add sections depending on the offer), but keep the logic:
hook → problem → solution → proof → price → reassurance → action.
HTML skeletons ready to adapt: [references/block-skeletons.md](references/block-skeletons.md).

## Step 3 — Golden rules for the HTML (non-negotiable)

1. **INLINE-FIRST**: no `<style>` in a delivered block (except `@font-face`).
   The Duodeal visual editor **strips `<style>` tags** as soon as the sales rep edits the
   block → the whole design breaks. So: everything in `style="…"` on each element.
2. **Responsive without media queries**: never `grid`, never `@media` — use containers
   `display:flex;flex-wrap:wrap` + children `flex:1 1 <base>px;min-width:<x>px`.
3. **Interactivity via inline `onclick`** — no separate `<script>`. The only exception,
   mandatory at the end of EVERY html block:
   `<script>try{if(window.DuoDeal&&DuoDeal.autoResize){DuoDeal.autoResize()}}catch(e){}</script>`
4. **Spacing**: spacer `<div style="height:71px" aria-hidden="true"></div>` at the top
   AND at the bottom of each html block (legal pack: bottom ≤ 16 px, otherwise an empty PDF page).
5. **Never use an em dash "—"** anywhere (titles, cards, T&Cs, product lines):
   use ":", ";", "·", ",".
6. **Every block has a non-empty `title`** (otherwise the interface shows "html"),
   `showTitle:false` when the block already carries its own title in HTML.
7. Stars/icons as **inline SVG** (never ★ nor emoji); every image must be hosted on
   Duodeal storage, never hotlinked from a third-party site (connector: `create_media`
   with `name` + `folder` + `file` in base64 — ⚠️ **never `from_url`**, the URL import 500s
   on most CDNs; no `upload_media`, no local path; then reference the url it returns inside
   the block's `data`).
8. No orphan lines: any isolated piece of info becomes a 2-line card
   (title + muted text).

## Step 4 — Delivery checklist (blocking)

Check on the LIVE quotation before delivering — one failing item = not done:

1. Every block has a non-empty `title`.
2. Native header filled in (sender logo + cover).
3. Every product line has an image — out of reach of the connector: bind it via REST if a
   key is configured, otherwise hand the step to the user in the Duodeal interface and say
   it is still pending.
4. No leftover `<style>` outside `@font-face` (mental test: if you strip all
   `<style>` tags, the block still looks presentable).
5. `DuoDeal.autoResize()` at the end of every html block.
6. Recurring in the html recap, not in the native table.
7. No "—", no ★, no forgotten `{{…}}` placeholder.
8. **Real visual verification**: open the edit link in a browser, check the rendering, then
   deliver both links (client + edition). No tool returns a render and no tool returns the
   links (there is no `get_links`): rebuild them — `get_deal(id)` gives the deal `uid` →
   client link `https://duodeal.app/quotations/deal/{deal.uid}`; deal `id` + quotation `id`
   → edit link `https://duodeal.app/app/quotations/{dealId}/{quotationId}` (`/app/deals/…`
   is the V1 editor, never deliver it). If you cannot open a browser, say so and ask the
   user to look — never claim a render you have not seen.
