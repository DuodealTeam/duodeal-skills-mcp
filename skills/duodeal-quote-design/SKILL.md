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
   (the native table has only one total per quote). An html block **can be bound to the
   price table** and display its real amounts live — offer it, see the rule below
8. **html SOCIAL PROOF** — real testimonials, otherwise a logo wall (real logo
   files, never names typed as text). **If neither exists, there is a third rung before
   dropping the block: quote the sender itself.** Reproduce sentences they publish on their
   own site, WORD FOR WORD and attributed, plus figures drawn only from those sentences —
   never a testimonial you wrote. If two of their own pages disagree (160 vs 150 years), the
   contradiction does not give you a fact, it forbids two: omit it if it is decorative, quote
   ONE attributed sentence if it carries the argument, never arbitrate and never restate the
   number in the document's own voice.
   ⚠️ **If the recipient is already a client of the sender**, three things flip: the tension is
   EXTEND, not buy (never re-pitch the platform they use daily); **scrub them from the logo
   wall** (showing a client their own logo is an instant tell); and describe the **added
   perimeter only** — you do not know their current contract, and "this gives you a dedicated
   CSM" may promise as new what their tier already includes.
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

1. **INLINE-FIRST**: **no `<style>` at all** in a delivered block — there is no `@font-face` exception any more (see the font rule in `references/design-system.md`: no custom-font route survives the editor).
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
   ⚠️ **Floor of this rule: it targets U+2014 "—" and U+2013 "–", NEVER the ASCII hyphen of
   compound words.** Write « ce soir-là », « ci-dessus », « c'est-à-dire », « quarante-huit »,
   « au cœur ». A de-hyphenation pass applied too broadly has already shipped those five as
   spelling mistakes on a live client page: a typographic rule with no floor eats the text.
6. **Every block has a non-empty `title`** (otherwise the interface shows "html"),
   `showTitle:false` when the block already carries its own title in HTML.
7. Stars/icons as **inline SVG** (never ★ nor emoji); every image must be hosted on
   Duodeal storage, never hotlinked from a third-party site (connector: `create_media`
   with `name` + `folder` + `file` in base64 — ⚠️ reuse an existing media first (`list_medias`); `file` in **base64 is the normal, supported route** for the upload itself. ⚠️ What is forbidden is base64 **inside the HTML**: reference the url the media returns, never a `data:` URI (see **duodeal-mcp-best-practices** → images); **never `from_url`**, the URL import 500s
   on most CDNs; no `upload_media`, no local path; then reference the url it returns inside
   the block's `data`).
8. No orphan lines: any isolated piece of info becomes a 2-line card
   (title + muted text).
9. **An amount that comes from Duodeal is read from Duodeal, never retyped.** An html block
   can read the live quote through `window.DuoDeal` (`quotation`, `lines`, `deal`,
   `customFields`, `formatCurrency(n)`) and re-render on every edit with `onUpdate(cb)` —
   see §9 of [references/block-skeletons.md](references/block-skeletons.md).
   - **Binding is good practice, not mandatory**: a quote is perfectly valid with amounts
     written by hand. **Ask the user** whether they want the block bound, and say what it
     buys them: a bound recap follows the price table on its own, a hand-written one has to
     be re-checked after every line edit and silently lies if someone forgets.
   - **But if the figure already exists in the price table, bind it** — a total, a subtotal,
     a VAT amount or a line price duplicated by hand **will** drift the day a sales rep
     edits a line, and nothing warns anyone.
   - Hard-code only what the table does **not** hold: recurring amounts, options presented
     separately, illustrative packages, figures given by the client. Say which ones are
     hard-coded when you deliver.
   - **Anchor rule, for an interactive block tied to the price**: its DEFAULT position must
     display a figure that also exists in the quote (native total, recurring card, or the sum
     of the `option:true` lines). Correctness then becomes an equality anyone can check
     instead of a judgement call, and any quotation carrying option lines already contains its
     own anchor. A micro-app unrelated to pricing is not forced onto a quote figure — but any
     figure it shows that also appears elsewhere on the page must match it.

10. **No HTML comment in a delivered block.** The platform serves the block's `code`
    verbatim, so anything inside `<!-- … -->` reaches the buyer in view-source — including
    your own reasoning, your TODOs, and the exact wording you just removed for being wrong.
    A check that reads the RENDERED text is structurally blind to it (ten such comments once
    shipped across seven of eight blocks, one of them explaining at length why the sender's
    previous copy was false). Rationale belongs in the conversation, never in the payload.
    ⚠️ Grepping the served page also returns comments and em dashes that are **not yours**:
    the platform injects its own `DuoDeal` bootstrap into each block iframe. Check the strings
    YOU authored, not the host's chrome.

## Step 4 — Delivery checklist (blocking)

Check on the LIVE quotation before delivering — one failing item = not done:

1. Every block has a non-empty `title`.
2. Native header filled in (sender logo + cover).
3. Every product line has an image — out of reach of the connector: bind it via REST if a
   key is configured, otherwise hand the step to the user in the Duodeal interface and say
   it is still pending.
4. No leftover `<style>` at all (mental test: if you strip all
   `<style>` tags, the block still looks presentable).
5. `DuoDeal.autoResize()` at the end of every html block.
6. Recurring in the html recap, not in the native table.
6bis. Every amount duplicated from the price table is bound to `DuoDeal`, not retyped —
   or, if it is hard-coded on purpose, it matches the table today and the user knows it
   is a manual copy to re-check after any line edit.
7. No "—", no ★, no forgotten `{{…}}` placeholder, and **no `<!-- … -->` comment** left in
   any block (rule 10) — check the block `code` you sent, not the rendered text.
8. **Real visual verification**: check the rendering, then deliver both links (client + edition).
   ⚠️ **Opening the CLIENT link is recorded as a prospect visit**: the client view posts a `visit`
   on load and a `heartbeat` every 15 s to `/api/access-sessions` (a plain server-side GET counts
   nothing). Your review then reads as a highly engaged buyer and inflates the Hot Deal Score of
   the deal whose re-opens drive the follow-up. There is no internal-view opt-out today, so: verify
   on the **edit link** and the **PDF export** for everything they can show, and **ask the user
   before opening the client view** — on a real prospect's deal, the honest default is not to open
   it, and if you do, say in your delivery that one visit was recorded. No tool returns a render and no tool returns the
   links (there is no `get_links`): rebuild them — `get_deal(id)` gives the deal `uid` →
   client link `https://duodeal.app/quotations/deal/{deal.uid}`; deal `id` + quotation `id`
   → edit link `https://duodeal.app/app/quotations/{dealId}/{quotationId}` (`/app/deals/…`
   is the V1 editor, never deliver it). If you cannot open a browser, say so and ask the
   user to look — never claim a render you have not seen.
