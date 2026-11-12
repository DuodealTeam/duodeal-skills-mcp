---
name: duodeal-quote-design
description: The content of EVERY Duodeal quote, built in HTML blocks at premium selling page quality, even when the request says nothing about design ("create a quote", "use the full power of the tool") — token-based design system, narrative structure of the V2 blocks, proven HTML skeletons (intro, value cards, order recap, social proof, FAQ, CTA, legal pack, a rail or slider for a book of work or many testimonials), inline-first rule and delivery checklist. Use right after duodeal-quote-building on any new quote, and whenever someone wants a beautiful or premium quote, a polished selling page, or to turn a raw quote into a visual proposal. Also covers reworking a quote that already exists: restyle it, rewrite the HTML of a block, add or remove a section, and edit the price table (add, change, reorder or delete lines) — the same way as when the quote was created.
---

# Duodeal design quote (HTML, V2 blocks)

> 🔄 **Are these skills current?** Read through the Duodeal connector (`get_duodeal_skill`),
> they are: the server always serves the latest version, so skip this check. Only a **copy**
> installed locally can be stale (nothing refreshes it on its own): then read the line `Skills Duodeal : mises à jour
> le …` in `DUODEAL-CONTEXT.md` (project root): **absent, or more than 7 days old → offer
> the refresh in one sentence before working**. Procedure: [../duodeal-onboarding/references/updating-skills.md](../duodeal-onboarding/references/updating-skills.md). Ask **once per session**;
> if the user declines, work with what is installed and drop it.


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
  still `DuoDeal.autoResize()` at the end.

**Editing the price table** (native `pricing` block):

- Rows are **not** in `block.data` (its `data` holds only `discountEnabled`, `discount`,
  `discountType`, `columns`): they are quotation-lines. List them first
  (`list_quotation_lines {quotation_id}`; a long description comes as a preview, add
  `line_ids` to read it in full before rewriting it), then `update_quotation_lines` to change several
  in ONE call (`update_quotation_line` for a single one),
  `add_quotation_lines` to add several, `create_quotation_line` for a single one,
  `delete_quotation_line` to remove one (nothing cascades: deleting the pricing block leaves
  its lines behind).
- Reordering = the `weight` field (increasing = display order). Every line carries a `tax_id`,
  including `title` and `subtotal` ones. Several pricing blocks on the page → set `blockId` on
  the line so it lands in the right table.
- Ids are per tenant: re-read `list_taxes` / `list_unities` on THIS account, never reuse ids seen
  on another quote.

**Before touching anything**: the target is the user's own account, say which one
(`get_current_user`). Edit in place when the user asks, and keep the data you read before any
write: it is the undo (there is no history tool). Ask before changing a quotation that was already
sent: the client may be reading it. A signed quotation is locked by the platform and cannot be
edited at all: do not try; a change after signature is a new quotation or deal, made on the
user's request. Never delete or archive without an explicit request. The Duodeal editor tab must
be closed on that deal (auto-save overwrites API writes with its in-memory copy), and the changes
are re-checked on the live page afterwards (Step 4).

## Step 1 — Lock the design system (BEFORE any HTML)

**The client's brand wins.** Take their values first: their brand guide, logo colors, fonts and
website, and what `DUODEAL-CONTEXT.md` records (section 2). The third column below holds
Duodeal's defaults: use one only where the client's brand says nothing.

Define 7 tokens from those values, and stick to them in ALL blocks:

| Token | Role | Default when the brand sets nothing |
|---|---|---|
| `ACCENT` | Accent color | The brand's signature color; one accent only, unless the brand works with a wider palette |
| `INK` | Heading ink | A near-black rather than pure #000 |
| `MUTED` | Secondary text | Readable mid grey |
| `PAPER` | Light card background | A tinted cream or ivory rather than pure white |
| `LINE` | Soft borders | Very light grey |
| `DARK` | Brand dark background | For "problem" cards and CTA |
| `FONT` | Font + fallback | `'Police',-apple-system,'Segoe UI',Roboto,sans-serif` (replace "Police" with the brand's font name, loaded by a `<link>`: see the font rule in `references/design-system.md`) |

Check the contrast. Default use of the accent, when the brand says nothing else: eyebrows, key
figures, a word of the H1, never whole paragraphs.
Typographic details and choices: [references/design-system.md](references/design-system.md).

## Step 2 — Narrative structure (recommended default order)

**Follow the client's stated preference first**: the structure recorded in `DUODEAL-CONTEXT.md`,
or the one their existing quotes follow. With none, the order below is the recommended default.
If the user asks for a plain quote, build a plain quote: the native blocks (header, contacts,
pricing, signature, legal notice) with little or no html around them.

1. **native `header`** — sender logo (a cover is recommended), filled in, never hidden nor recoded in HTML
2. **`contacts`** — native
3. **html INTRO** — a hook, for example: a 2-logo lockup (sender · separator · prospect),
   an eyebrow, an H1, a personalized hook (contact name, their context), what the current
   situation costs (3-4 bullets, the last one quantified), a 1-click video if available
4. **html SOLUTION** — value cards in the prospect's vocabulary, and the figures the client
   can back up (a KPI strip, for example)
5. *(optional)* **html GALLERY / DEMO** — real photos (physical business) or interface
   mockup (SaaS)
6. **`pricing`** — the priced quote (title "Your quote"); attach every line to this
   block (line tools carry the block's `blockId`) and, when the client has product images,
   give product lines an **image**: host the file first (`create_media`, or `create_medias` for several), then
   `media_ids` on the line tools; a line created with `product_id` already gets the
   product's photos (set them with `media_ids` on `create_product` / `update_product`)
7. **html ORDER RECAP** — one-off vs recurring, spelled out. **Recurring lives HERE**
   (the native table has only one total per quote). An html block **can be bound to the
   price table** and display its real amounts live — offer it, see the rule below
8. **html SOCIAL PROOF** — real testimonials, otherwise a logo wall (real logo
   files, never names typed as text). **If neither exists, there is a third rung before
   dropping the block: quote the sender itself.** Reproduce sentences they publish on their
   own site, WORD FOR WORD and attributed, plus figures drawn only from those sentences —
   never a testimonial you wrote. If two of their own pages disagree, the
   contradiction does not give you a fact, it forbids two: omit it if it is decorative, quote
   ONE attributed sentence if it carries the argument, never arbitrate and never restate the
   number in the document's own voice.
   ⚠️ **If the recipient is already a client of the sender**, three things flip: the tension is
   EXTEND, not buy (never re-pitch the platform they use daily); **scrub them from the logo
   wall** (showing a client their own logo is an instant tell); and describe the **added
   perimeter only** — you do not know their current contract, and "this gives you a dedicated
   CSM" may promise as new what their tier already includes.
   **Five or more references or testimonials with photos, or a book of realised work**: a rail
   (slider), not a grid: [references/block-skeletons.md](references/block-skeletons.md) §10.
9. **html FAQ** — the real objections + an "Another question?" card pointing to the
   native comment button. ⚠️ **Never the native `faq` block** (it renders HTML
   entities literally)
10. **html NEXT STEPS + CTA** — a short stepper → a CTA card pointing to
    the native "Accept & sign" button (French deals: « Accepter et signer ») → a **sender card**
    (the rep's real photo, name, contact)
11. **`accept` + `signstamp`, side by side** — the signature block and its stamp always
    ship as a pair: once signed, `accept` disappears and only `signstamp` shows the
    signature (see the pairing rule in **duodeal-mcp-best-practices**)
12. **`legalnotice`** — designed legal pack (T&Cs as cards, one column by default; the
    client's wording stays verbatim)

Adapt (remove/add sections depending on the offer and the client's preference); as a default,
the logic is: hook → problem → solution → proof → price → reassurance → action.
HTML skeletons ready to adapt: [references/block-skeletons.md](references/block-skeletons.md).

## Step 3 — Golden rules for the HTML (non-negotiable)

1. **INLINE-FIRST**: **no `<style>` at all** in a delivered block, and no `@font-face` exception: the brand font comes in through a `<link>` (see the font rule in `references/design-system.md`).
   The Duodeal visual editor **strips `<style>` tags** as soon as the sales rep edits the
   block → the whole design breaks. So: everything in `style="…"` on each element.
2. **Responsive without media queries**: never `grid`, never `@media` — use containers
   `display:flex;flex-wrap:wrap` + children `flex:1 1 <base>px;min-width:<x>px`.
3. **Interactivity via inline `onclick`** — no separate `<script>` for presentation. Two
   exceptions, both at the very END of the block, after the markup (the editor deletes
   whatever precedes the first element, so position matters more than count):
   - mandatory on EVERY html block:
     `<script>try{if(window.DuoDeal&&DuoDeal.autoResize){DuoDeal.autoResize()}}catch(e){}</script>`
   - a block that genuinely **reads the quote or collects data from the client** (a bound
     recap, a form, a file upload, a configurator) carries its logic in that same final
     script — see **duodeal-html-block-js**. That is a micro-app, not decoration: the rule
     above bans decorative scripts, not the `DuoDeal` logic.
4. **Spacing**: the same spacer at the top AND at the bottom of each html block,
   `<div style="height:clamp(39px,7vw,71px)" aria-hidden="true"></div>`: about 39 px on a phone,
   71 px on a wide screen, inside the card the platform already draws around every block
   (**duodeal-v2-blocks**, rule 5). A default: the client's own spacing wins. Legal pack:
   bottom ≤ 16 px, otherwise an empty PDF page.
5. **No em dash "—" in a product title**: the server truncates a `productTitle` at the em
   dash, so use ":", "·" or "," there. The rule targets U+2014 "—" and U+2013 "–", never the
   ASCII hyphen of a compound word (« ci-dessus », « c'est-à-dire »).
   Everywhere else, the client's copy stays exactly as they wrote it: legal texts, T&Cs,
   documents, deck copy. Flag a typo, never silently rewrite it.
6. **Every block has a non-empty `title`** (otherwise the interface shows "html"),
   `showTitle:false` when the block already carries its own title in HTML.
7. Stars/icons as **inline SVG** (never ★ nor emoji); every image must be hosted on
   Duodeal storage, never hotlinked from a third-party site (connector: `create_media`
   with `name` + `folder` + `file` in base64 — ⚠️ reuse an existing media first (`list_medias`); `file` in **base64 is the normal, supported route** for the upload itself. ⚠️ What is forbidden is base64 **inside the HTML**: reference the url the media returns, never a `data:` URI (see **duodeal-mcp-best-practices** → images); or `from_url` for an image already online (a refused download answers with its
   reason: then send `file`); no `upload_media`, no local path; then reference the url it returns inside
   the block's `data`).
8. No orphan lines: any isolated piece of info becomes a 2-line card
   (title + muted text).
9. **An amount that comes from Duodeal is read from Duodeal, never retyped.** An html block
   can read the live quote through `window.DuoDeal` (`quotation`, `lines`, `deal`,
   `customFields`, `formatCurrency(n)`) and re-render on every edit with `onUpdate(cb)` —
   see §9 of [references/block-skeletons.md](references/block-skeletons.md), and the full
   API in **duodeal-html-block-js** (which also covers collecting data FROM the client:
   forms, choices, uploaded documents).
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
    ⚠️ Grepping the served page also returns comments that are **not yours**:
    the platform injects its own `DuoDeal` bootstrap into each block iframe. Check the strings
    YOU authored, not the host's chrome.

## Step 4 — Delivery checklist (blocking)

Check on the LIVE quotation before delivering — one failing item = not done:

1. Every block has a non-empty `title`.
2. Native header filled in (sender logo; a cover is recommended).
3. Product lines carry an image when the client has product images (recommended, not
   blocking: a service business often has none): `media_ids` on the line tools, or a catalog
   line (`product_id`) that inherits the product's photos.
4. No leftover `<style>` at all (mental test: if you strip all
   `<style>` tags, the block still looks presentable).
5. `DuoDeal.autoResize()` at the end of every html block.
6. Recurring in the html recap, not in the native table.
6bis. Every amount duplicated from the price table is bound to `DuoDeal`, not retyped —
   or, if it is hard-coded on purpose, it matches the table today and the user knows it
   is a manual copy to re-check after any line edit.
7. No "—" in a product title, no ★, no forgotten `{{…}}` placeholder, and **no `<!-- … -->` comment** left in
   any block (rule 10) — check the block `code` you sent, not the rendered text.
7bis. **The PDF exports A4** (595 × 842 pt on every page, 10 mm margins, no section cut in two,
   and no title left alone at the foot of a page: section heads in html blocks carry
   `break-inside:avoid` + `break-after:avoid` inline, with no empty spacer before their content):
   the print rule sits in the first title line's `title`, never in an html block
   (**duodeal-mcp-best-practices** → PDF export). No copy that points at the screen ("the
   button at the top right of this page"): it is false on paper.
   **No shadow on paper**: Apple's PDF viewer (Preview, Quick Look) draws every blurred
   `box-shadow` as a flat tinted rectangle, darker where two overlap, while Chrome shows the
   same PDF correctly. Keep screen shadows discreet and switch them off for print: add
   `@media print{*{box-shadow:none !important}}` inside the `<style>` that carries each html
   block's `@font-face` (an html block prints in its own root, out of reach of a page-level rule).
   Check one exported page on a Mac (or with `sips -s format png page.pdf`) before delivering.
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
