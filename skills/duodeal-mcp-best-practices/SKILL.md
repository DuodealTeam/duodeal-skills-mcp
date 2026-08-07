---
name: duodeal-mcp-best-practices
description: Golden rules, render contract and checklist for generating, editing or delivering a Duodeal quote (HTML selling page) through the official MCP connector. Use before generating, editing or delivering a Duodeal quote, and whenever the user talks about "best practices", "golden rules", "quote checklist", "render contract", "selling page", "design quote", "premium proposal", "V2 blocks" or the Duodeal API reference. Covers the structure of native blocks, the HTML blocks that survive the visual editor and the PDF, prices and currencies, content/copy, and API write guardrails.
---

# Best practices — Duodeal quotes (via MCP)

These rules apply as soon as you generate, edit or deliver a quote through the official Duodeal MCP connector. The client context is already known: apply them directly, with no prior research. For the detailed know-how, see also **duodeal-quote-building**, **duodeal-quote-design** and **duodeal-v2-blocks**.

## Blocking checklist (before any delivery)

One failed item = redo the quote.

1. **Native header filled in** with the sender's logo + cover, never hidden nor recoded in HTML.
2. **Native contacts block present**, sender (dedicated, named owner) AND recipient filled in.
3. **Every block carries a non-empty `title`** (otherwise the interface displays "html" instead of the title).
4. **Every product line has an image**, square and centered, attached to the media of the LINE (not of the linked product).
5. **Every HTML block ends with `DuoDeal.autoResize()`** and stays presentable once its `<style>` tags are stripped (everything styled inline, no separate `<script>`).
6. **`builderVersion` 2 enabled**, language and currency set at deal level, without touching the account settings.
7. **No `{{...}}` placeholder and no em dash left**, rendering verified on the real client view + PDF export (not on code reading alone).
8. **The delivered quotation is marked primary** (`primaryQuotation: true`) — otherwise it does NOT appear in the client dashboard table, which only lists primary quotes.

## Quote structure and native blocks (render contract)

Native blocks carry the sender's identity, the signature and the legal notices: keep them filled in and properly populated.

- ⚠️ **Native header**: the sender's logo + cover, never empty nor recoded in HTML (emptying it or rebuilding it breaks the rendering and forces a rework).
- ⚠️ **Native contacts block** (sender + recipient), never rebuilt in HTML; check that the recipient is present (otherwise the information is out of sync and the delivery is non-compliant).
- Give every block a non-empty `title`; if the visible title lives in the HTML, keep the `title` and set `showTitle:false`.
- An image on every product line, on the media of the LINE, square, centered on the subject (`object-fit: cover`).
- Consistent logos (same format, background, size) across all quotes of the same account.
- Deal owner = a dedicated, named sender user (person + job title) with their real photo, never the company nor a generic account.
- Choose a plausible login address for the owner: the sender card displays the LOGIN email.
- Set language and currency at deal level (per-deal), without touching the account.
- Group legal notices and terms & conditions in the native `legalnotice` block, only once, with every structured field filled in (at minimum the name of the issuing company); ⚠️ an empty field falls back to the ACCOUNT name.
- Single CTA = the native "Accept & sign" button (French deals: « Accepter et signer »); ⚠️ never a fake HTML button (it does not trigger the signature).
- ⚠️ **Always pair the signature with its stamp**: whenever you add an `accept` block (or enable `data.showAcceptButton` on the `pricing` block), add a `signstamp` block next to it. Once the quote is signed the `accept` button **disappears**, and `signstamp` is the only thing that shows the signature (signed date, signer, email, validation custom fields) — without it, a signed quote displays no trace of the signature at all. Before signing, `signstamp` renders nothing on the client side (dashed placeholder in the editor only), so adding it costs nothing.
- Switch every quote to `builderVersion` 2 as soon as it is created.
- ⚠️ **Mark the quotation as primary**: the client dashboard table shows ONLY primary quotes. A quotation created without this flag exists but stays **invisible** to the client (recurring bug). If a quote is replaced by a new quotation, move the primary flag to the new one. **The official connector cannot set it** (`update_quotation` has no `primaryQuotation`, `update_deal` no `primaryQuotationId`): use `PUT /quotations/{id} {primaryQuotation: true}` on the REST API when a key is configured, otherwise ask the user to mark it primary in the Duodeal interface and say so — never deliver silently a quote the client will not see.
- Structure into dedicated blocks (one topic = one block), favoring native blocks (header, contacts, pricing, legalnotice, attachments).
- Consistent visual identity: one reference font, one fixed palette with defined roles (background, accent, primary, contrast).

## HTML blocks: surviving the visual editor and the PDF

⚠️ The visual editor strips `<style>` tags and neutralizes `<script>` tags the first time the sales rep edits; the final rendering also goes through a PDF export. Every block must hold up in both states.

- All styling inline (`style="..."`); no `<style>` except `@font-face`, no separate `<script>` (interactivity through inline `onclick`).
- Responsive without media queries: `flex` + `flex-wrap` + `flex:1 1 basis` (never `grid-template-columns`), falling back to a single column on narrow screens and in print.
- Before delivery, check that every block stays presentable once its `<style>` tags are stripped: that is the state the prospect will see.
- End every block with `DuoDeal.autoResize()` inside a `try/catch`; ⚠️ otherwise the iframe keeps a fixed height and cuts off the bottom.
- Brand font as inline base64 `@font-face` + a readable system fallback; never a CDN `<link>` nor an external font (blocked by CORS or missing in the PDF).
- Images/logos in the Duodeal media library, `max-width:100%; height:auto`; never an external hotlink.
- `box-sizing:border-box` on every sized element; ⚠️ its absence is the number one cause of mobile overflow (`width:100%` + padding).
- `break-inside:avoid` (+ `page-break-inside:avoid`) on cards, steps, panels, CTAs; wrap kicker + title + content in a single container; ⚠️ the PDF engine does not honor `break-after:avoid`.
- Height determined by the content: no fixed `height`, no `vh`, no forced page break.
- ⚠️ No internal scroller (`max-height` + `overflow-y:auto`): auto-sizing injects thousands of pixels of blank space in the client view and the PDF, invisible in the editor.
- One print override for every mobile media query; cap spacers on mobile and restore the desktop value in print.
- Consistent spacers at the top (and bottom) of every section block, except the cover/intro that follows the header; one spacer before the pricing table.
- Namespace every CSS class with a short prefix specific to the block (avoids collisions between blocks on the same page).
- Icons as inline SVG (no exotic unicode glyphs → tofu), no gradient text (`background-clip:text` → stray hairline), no `box-shadow` on critical blocks (prefer a 1px border, better PDF rendering).
- ⚠️ No native FAQ block: it renders the HTML literally (entities show up as-is). Build the FAQ as an HTML block.
- Flex card with text + media: `min-width:0` on the text column, `overflow-wrap:anywhere` on long words/emails, stack into a column on narrow screens.
- Cap wide images on mobile through `width`/`max-width`, never `transform:scale` (it does not reduce the layout width).
- Table with an incompressible minimum width inside an `overflow-x:auto` container, or make it fit under ~360 px.
- Covers/full-bleed at `width:100%` and `border-radius:0`, validated against the client view (not the editor card, which has a radius and a clip that are absent on the client side).
- Portrait shot in a landscape frame: `object-fit:contain` on a white background, never `cover` (which crops and zooms).
- Video: check that the embed is allowed, opaque branded poster over an `about:blank` iframe, inject the embed URL (autoplay, playsinline) when the poster is clicked.

## Prices, totals and currencies

The native table exposes only ONE total and the platform can rescale amounts through a change rate.

- ⚠️ Recurring amounts (subscriptions) in an HTML recap block, never in the native table; one single total per quote (otherwise the total is nonsensical).
- Do not rely on the "option" flag to keep a mandatory amount out of the total (it displays an unsuitable "Option not included" badge; French deals: « Option non incluse »).
- Foreign currency through the deal's cosmetic formatting (`displayCurrencyFormat`: symbol, position, separators), without changing the real currency; enter the amounts natively in the target currency.
- ⚠️ Deal in a currency different from the account: edit the amounts line by line (never a global PUT), keep the totals STATIC in the HTML blocks without reading the amount returned by the API, re-check after every write — the change rate rescales silently.

## Content and copy

- ⚠️ Never use an em dash "—" anywhere (the server truncates a `productTitle` at the em dash); prefer ":", ";", "·" or the comma.
- Real logo files (official SVG/PNG), never a brand name typed as styled text; do not stretch, distort, recolor or rotate it.
- A real photo of the sales rep (square portrait centered on the face) in the sender card; an initials monogram as a last resort, never a fabricated face.
- No `{{...}}` placeholder and no unreplaced generic content on the client page.
- ⚠️ Accented characters as literal UTF-8 everywhere; never HTML entities in a plain text field (an `&eacute;` shows up literally).
- Line descriptions in the native table: curly apostrophe, not straight (the PDF does not draw the straight apostrophe).
- Cover image used only once; no reuse in a gallery or on a product line.
- One single accent color reserved for details; only the colors and fonts of the validated design system.
- No disclaimer-style captions under images (they weigh the page down and cheapen the premium rendering).

## Process and API write guardrails

The server state is authoritative; writes are partial or destructive.

- ⚠️ Always a NEW deal and a NEW quotation; never modify, delete, archive nor clone an existing deal, quote, user or media. A rework is isolated on a new deal, the old version stays intact.
- Never overwrite the account's global settings (name, currency, logo, banner): all customization goes into the new deal (the account is shared between senders and quotes).
- Have the design (structure, data, colors, font, tone) validated by the human BEFORE generating any HTML.
- Server state (the quotation JSON) = the only source of truth: re-read it before any edit, re-check after every write.
- Surgical edits block by block (targeted text replacement, line-by-line PUT); ⚠️ never rewrite the whole `blocks` array blindly (it wipes the sales rep's manual edits) — re-read and merge.
- Block update: send back the COMPLETE `data` object (shallow merge); `customFields`: re-read then send back every section (sending replaces the whole object).
- A targeted text replacement with no target found (0 replacements) = a conflict: re-read the server state and restart from the server version, never force.
- ⚠️ Never leave a Duodeal editor tab open on the deal during API writes: auto-save rewrites with its in-memory copy and cancels the work done through the API.
- Before any write, check that the connector is connected to the target account (`get_current_user`); a 403 on a known deal signals a connection to the wrong account, not a rate limit.
- Do not read a large `get_quotation` response raw (~80 KB): save it, then parse it.
- Never expose the connection credentials (API key, token): neither displayed nor logged.
- Validate a block only after a real rendering (PDF export + live web view) and a test of each block in isolation at a real mobile width, never on code reading alone.
- If an interactive HTML block sends data outside the platform, flag it; never present hosting, compliance or "real-time" validation as operational on the client page (demo validations are only format checks).
