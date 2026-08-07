---
name: duodeal-quote-design
description: Build a design-grade Duodeal quote in HTML, at premium selling page quality — token-based design system, narrative structure of the V2 blocks, proven HTML skeletons (intro, value cards, order recap, social proof, FAQ, CTA, legal pack), inline-first rule and delivery checklist. Use whenever someone wants a "beautiful quote", a "design" or "premium" quote, a quote with real wow factor, a polished selling page, a better-looking proposal, or wants to turn a raw quote into a visual proposal.
---

# Duodeal design quote (HTML, V2 blocks)

Guide for building a visually premium quote. The context (sender branding, offers,
prospect) is already known: no research to do — apply these instructions. Block
manipulation: MCP tools `add/update_quotation_block`…
(see the **duodeal-v2-blocks** skill for the technical contract).

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
6. **`pricing`** — the priced quote (title "Your quote"); every product line
   carries an **image** and this block's `blockId`
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
7. Stars/icons as **inline SVG** (never ★ nor emoji); images uploaded via
   `upload_media` (S3), never hotlinked from a third-party site.
8. No orphan lines: any isolated piece of info becomes a 2-line card
   (title + muted text).

## Step 4 — Delivery checklist (blocking)

Check on the LIVE quotation before delivering — one failing item = not done:

1. Every block has a non-empty `title`.
2. Native header filled in (sender logo + cover).
3. Every product line has an image.
4. No leftover `<style>` outside `@font-face` (mental test: if you strip all
   `<style>` tags, the block still looks presentable).
5. `DuoDeal.autoResize()` at the end of every html block.
6. Recurring in the html recap, not in the native table.
7. No "—", no ★, no forgotten `{{…}}` placeholder.
8. **Real visual verification**: open the `editionLink` (`get_links`) and check
   the rendering — then deliver both links (client + edition).
