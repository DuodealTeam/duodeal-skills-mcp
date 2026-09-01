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
4. **Every product line has an image**, square and centered, on the media of the LINE (not of the linked product). ⚠️ The connector cannot attach it: line tools take no media argument, and `create_product`/`update_product` have none either. Upload with `create_media`, then bind the line media through the REST API when a key is already configured, otherwise ask the user to attach it in the Duodeal interface and say so.
5. **Every HTML block ends with `DuoDeal.autoResize()`** and stays presentable once its `<style>` tags are stripped (everything styled inline, no separate `<script>`).
6. **`builderVersion` 2 enabled**, language and currency set at deal level, without touching the account settings. ⚠️ The connector exposes none of the three (no `builderVersion` argument anywhere; `create_deal`/`update_deal` accept no language and no currency): check what you have on the **`builderVersion` field** in `get_quotation` (`builderVersion == 2`, **not** the mere presence of `blocks[]` — blocks can sit on a `builderVersion: 1` quote, which then opens in the old V1 editor) — and set what is missing through REST or in the app, saying which.
7. **No `{{...}}` placeholder and no em dash left**, rendering verified on the PDF export and the rendered page (not on code reading alone). ⚠️ No connector tool returns a render: look yourself, or ask the user to look and say you have not seen it. ⚠️ **But opening the CLIENT link counts as a prospect visit** (see the tracking rule below): decide with the user before you open it.

## Checking your work without polluting the prospect's statistics

⚠️ **Opening the client link is recorded as a prospect visit.** The public client view posts a `visit` on load, then a `heartbeat` every 15 s, to `/api/access-sessions` (browser `fetch`; a plain server-side GET counts nothing). Your own review — open, scroll to hydrate the blocks, read each section — therefore reads as a highly engaged buyer, on the very deal whose re-opens drive the follow-up and the Hot Deal Score.

- There is **no internal-view opt-out** today: you cannot look without being counted.
- So **tell the user before you open the client link**, and let them decide. On a real prospect's deal the honest default is not to open it.
- The **PDF export** (`GET /deals/pdf/{uuid}`) and the **edit link** cost nothing on the prospect's statistics counter: use them for everything they can show.
- If you do open the client view, keep it short and say in your delivery that one visit was recorded.

## Quote structure and native blocks (render contract)

Native blocks carry the sender's identity, the signature and the legal notices: keep them filled in and properly populated.

- ⚠️ **Native header**: the sender's logo + cover, never empty nor recoded in HTML (emptying it or rebuilding it breaks the rendering and forces a rework).
- ⚠️ **Native contacts block** (sender + recipient), never rebuilt in HTML; check that the recipient is present (otherwise the information is out of sync and the delivery is non-compliant).
- Give every block a non-empty `title`; if the visible title lives in the HTML, keep the `title` and set `showTitle:false`.
- An image on every product line, on the media of the LINE, square, centered on the subject (`object-fit: cover`); upload it with `create_media`, then bind it by REST or in the app (no media argument on the line and product tools).
- Consistent logos (same format, background, size) across all quotes of the same account.
- Deal owner = a dedicated, named sender user (person + job title) with their real photo, never the company nor a generic account. Pick the owner among the existing users (`list_users`, `get_user`); the connector creates no user and `create_deal`/`update_deal` take no owner — assign it in the app (or by REST) and say so.
- ⚠️ **On a REST `PUT /deals/{id}`, always resend `users`.** A partial PUT resets `deal.users` to the API key's own owner, and `deal.users` drives the **sender identity displayed on the client page**: another prospect's contact then ships in the delivered HTML, silently and beautifully. Read the deal, keep its `users`, send them back with every write, and re-read them afterwards.
- Choose a plausible login address for the owner: the sender card displays the LOGIN email. That address is set when the user is created, which only the client's admin does in the app.
- Set language and currency at deal level (per-deal), without touching the account. ⚠️ Not reachable from the connector (`create_deal`/`update_deal` have neither, and currency exists only company-wide via `update_company`, which you must not overwrite): do it by REST if a key is configured, otherwise in the app.
- Group legal notices and terms & conditions in the native `legalnotice` block, only once, with every structured field filled in (at minimum the name of the issuing company); ⚠️ an empty field falls back to the ACCOUNT name.
- Single CTA = the native "Accept & sign" button (French deals: « Accepter et signer »); ⚠️ never a fake HTML button (it does not trigger the signature).
- ⚠️ **Always pair the signature with its stamp**: whenever you add an `accept` block (or enable `data.showAcceptButton` on the `pricing` block), add a `signstamp` block next to it. Once the quote is signed the `accept` button **disappears**, and `signstamp` is the only thing that shows the signature (signed date, signer, email, validation custom fields) — without it, a signed quote displays no trace of the signature at all. Before signing, `signstamp` renders nothing on the client side (dashed placeholder in the editor only), so adding it costs nothing.
- Switch every quote to `builderVersion` 2 as soon as it is created. ⚠️ No connector argument selects it: confirm the state with `get_quotation` on the **`builderVersion` field** (`builderVersion == 2`). ⚠️ Having blocks proves nothing: a `builderVersion: 1` quotation can hold V2 blocks and will still open in the **old editor**. If it is still V1, convert by REST or in the app before writing any block.
- **Primary quotation** — matters in some cases only. The first quotation of a deal is primary by default, so the usual one-quote-per-deal flow is fine. But the client dashboard table lists **primary quotes only**: a **second** quotation added to a deal, or a quote rebuilt as a new quotation, may not appear there. When you are in that case, say it, and point out that switching the primary flag is done in the Duodeal interface (the connector has no `primaryQuotation` argument, and neither has the REST-free path).
- Structure into dedicated blocks (one topic = one block), favoring native blocks (header, contacts, pricing, legalnotice, attachments).
- Consistent visual identity: one reference font, one fixed palette with defined roles (background, accent, primary, contrast).

## HTML blocks: surviving the visual editor and the PDF

⚠️ The visual editor strips `<style>` tags and neutralizes `<script>` tags the first time the sales rep edits; the final rendering also goes through a PDF export. Every block must hold up in both states.

- All styling inline (`style="..."`); **no `<style>` at all** (no `@font-face` exception — see the font rule below), no separate `<script>` (interactivity through inline `onclick`).
- Responsive without media queries: `flex` + `flex-wrap` + `flex:1 1 basis` (never `grid-template-columns`), falling back to a single column on narrow screens and in print.
- Before delivery, check that every block stays presentable once its `<style>` tags are stripped: that is the state the prospect will see.
- End every block with `DuoDeal.autoResize()` inside a `try/catch`; ⚠️ otherwise the iframe keeps a fixed height and cuts off the bottom.
- Brand font: ship the **system fallback stack**, full stop. No CDN `<link>` (CORS, and missing from the PDF), no base64 `@font-face` (far too heavy), no `@font-face` on a media url (fonts are not in the accepted MIME list) — and every `@font-face` route dies anyway, because it needs a `<style>` and the editor strips `<style>` on the first rep edit. Carry the brand through color, weights, scale and spacing instead. The typeface is preserved where it counts by shipping the **logo as SVG** (`image/svg+xml` is accepted): outlines, not a font.
- Images/logos in the Duodeal media library, `max-width:100%; height:auto`; never an external hotlink. A media cannot be renamed, moved or deleted from the connector, so create a new one and re-point the block rather than trying to replace it.
- **Getting an image into the library:**
  1. **Reuse what is already there** (`list_medias`, `search`) before uploading anything.
  2. **`create_media` {`name`, `folder`, `file` in base64}** — this is the **normal, supported route**. Base64 is how the API takes a file: there is no multipart, no local path and no `upload_media` tool. Ceiling ~4 MB, nothing resizes for you.
  3. **`from_url` — never**, whatever the tool description says: the URL import 500s on most CDNs.
  4. Then reference the **url the media returns** inside the block's `data`.
- 🚫 **Never base64 inside the HTML.** A `data:` URI in a block (`<img src="data:image/png;base64,…">`, an inline background, a base64 font) **bugs every time**: the block is far too heavy, the editor and the PDF export choke on it, and the same bytes travel back through every read of the quote. An image always goes to the media library first and the HTML carries **its url**. The rule holds for every asset: images, logos, icons, fonts.
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
- Do not rely on the `option` flag on a line to keep a mandatory amount out of the total (it displays an unsuitable "Option not included" badge; French deals: « Option non incluse »).
- Foreign currency through the deal's cosmetic formatting (`displayCurrencyFormat`: symbol, position, separators), without changing the real currency; enter the amounts natively in the target currency. ⚠️ The connector has no such argument on `create_deal`/`update_deal`: set it by REST when a key is configured, otherwise state that the formatting stays the account default.
- ⚠️ Deal in a currency different from the account: edit the amounts line by line (`update_quotation_line`, one call per line — never a whole-quotation rewrite), keep the totals STATIC in the HTML blocks without reading the amount returned by the API, re-check after every write — the change rate rescales silently.

## Content and copy

- ⚠️ Never use an em dash "—" anywhere (the server truncates a `productTitle` at the em dash); prefer ":", ";", "·" or the comma.
  ⚠️ **Floor of the rule: it targets U+2014 "—" and U+2013 "–", never the ASCII hyphen of compound words.** Keep « ce soir-là », « ci-dessus », « c'est-à-dire », « quarante-huit ». A too-broad de-hyphenation pass has already shipped those as spelling errors on a live client page.
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

- ⚠️ Always a NEW deal and a NEW quotation (`create_deal` then `create_quotation`); never modify, delete, archive nor clone an existing deal, quote, user or media. A rework is isolated on a new deal, the old version stays intact. The connector has no clone and no hard-delete tool for them anyway: do not route around that in the app either.
- Never overwrite the account's global settings (name, currency, logo, banner, taxes, numbering — the `update_company` and `update_numbering_setting` territory): all customization goes into the new deal (the account is shared between senders and quotes).
- Have the design (structure, data, colors, font, tone) validated by the human BEFORE generating any HTML.
- Server state (the quotation JSON) = the only source of truth: re-read it before any edit (`get_quotation` for the inventory of `blocks[]`, `get_quotation_block` for one block), re-check after every write.
- Surgical edits block by block (`replace_quotation_block_text` for long html/wysiwyg, `update_quotation_line` line by line); ⚠️ never rewrite the whole `blocks` array blindly (it wipes the sales rep's manual edits) — re-read and merge. The connector offers no such bulk write; keep the same discipline when falling back to REST.
- Block update: send back the COMPLETE `data` object to `update_quotation_block` (merge is shallow at root); `customFields`: re-read then send back every section (sending replaces the whole object), or edit a long value in place with `replace_quotation_custom_field`.
- A targeted text replacement with no target found (0 replacements) = a conflict: re-read the server state and restart from the server version, never force. Anchors must be short and unique — there is no `replace_all`, no regex, no occurrence index and no dry-run on `replace_quotation_block_text` / `replace_quotation_custom_field`.
- ⚠️ Never leave a Duodeal editor tab open on the deal during API writes: auto-save rewrites with its in-memory copy and cancels the work done through the API.
- Before any write, check that the connector is connected to the target account (`get_current_user`); a 403 on a known deal signals a connection to the wrong account, not a rate limit.
- Do not read a large `get_quotation` response raw (~80 KB): save it, then parse it.
- Never expose the connection credentials (API key, token): neither displayed nor logged.
- Validate a block only after a real rendering (PDF export + live web view) and a test of each block in isolation at a real mobile width, never on code reading alone. ⚠️ No tool returns the rendered page: open the customer link in a browser, or say plainly that you have not seen the render and ask the user to check.
- Deliver both links, rebuilt by hand from the ids (there is no links tool): customer link `https://duodeal.app/quotations/deal/{deal.uid}` from the `uid` of `get_deal`, edit link `https://duodeal.app/app/quotations/{dealId}/{quotationId}` whose `{dealId}` is the **real parent deal read on `get_quotation` → `deal.id`** (never a deal id from memory or from another quote). ⚠️ `/app/deals/{dealId}/{quotationId}` is the V1 editor, never deliver it. Sending the quote by email and creating a share link are not connector operations (`shareLinks` comes back read-only in `get_quotation`): the user sends from the app.
- ⚠️ Some steps have **no connector tool at all**: primary flag, `builderVersion`, deal language/currency and `displayCurrencyFormat`, line medias, creating a tax, a unity, a status, a template or a user, cloning, hard-deleting, sending. Do not simulate them and do not invent a tool name — `api_call`, `get_links`, `upload_media` (it is `create_media`), `get_me` (it is `get_current_user`), `ensure_template`, `create_tax`, `create_unity`, `clone_deal`, `clone_quotation`, `list_quotation_blocks`, `send_quotation` do not exist. Take the REST API with `X-API-KEY` only if a key is already configured in the environment, otherwise hand the step to the user in the Duodeal interface and state it in the delivery.
- If an interactive HTML block sends data outside the platform, flag it; never present hosting, compliance or "real-time" validation as operational on the client page (demo validations are only format checks).
