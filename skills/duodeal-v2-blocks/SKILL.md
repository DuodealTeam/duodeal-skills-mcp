---
name: duodeal-v2-blocks
description: V2 block system of Duodeal quotations (builderVersion 2) — data model, block types (wysiwyg, html, pricing, header, faq…), off-spec REST contract, MCP tools for safe manipulation, DuoDeal JS API of html blocks, anti-overwrite checklist. Use whenever you read or write blocks, add/update/reorder/delete a block, convert a quote to V2, build an html micro-app inside a quote, or debug a V2 render (iframe height, autoResize, blocks array overwritten).
---

# V2 blocks of Duodeal quotations

A V2 quotation is an **ordered list of `blocks`** (`builderVersion: 2`), edited
in the block editor. Contract verified empirically — **nothing is in openapi.yaml**
(spec predates V2).

## Data model

On the quotation: `builderVersion: 2`, `blocks: [...]` (+ `groupId`/`versionNumber`
for versioning). Each block:

```json
{"id": "<UUID>", "type": "wysiwyg", "version": 1, "visible": true,
 "title": "", "showTitle": true, "layout": {"columns": 1, "rows": 1}, "data": {...}}
```

`data` per type — the main ones:

| Type | data | Notes |
|---|---|---|
| `wysiwyg` | `{columns: [html]}` | Inline render — V2 equivalent of an HtmlSimple CF |
| `html` | `{code, state}` | **Sandboxed iframe**, `window.DuoDeal` JS API injected — **must end with `DuoDeal.autoResize()`** |
| `header` | `{cover, noCover, logo, noLogo}` | |
| `pricing` | `{discountEnabled, discount, discountType, columns}` | Lines attach to it via `blockId` |
| `customfields` | `{fields: [names]}` | |
| `legalnotice` | `{companyName, legalText, other…}` | |
| `faq` | `{items: [{id, question, answer}]}` | **RAW text** (`{{ }}` interpolation, no v-html) — HTML is rendered literally |
| `contacts` | `[]` | |
| `accept` | `{}` | "Accept & sign" button (opens the signature modal). **Disappears once signed** — always pair it with `signstamp` |
| `signstamp` | `{}` | Signature proof (signed date, signer + email, validation CFs). Not signed → renders **nothing** client-side; signed → visible on both faces |

Known types: header, contacts, wysiwyg, html, pricing, customfields, attachments,
legalnotice, paymentschedule, pdfviewer, youtube, faq, pptx, googleslides, canva,
gallery, accept, signstamp, pagebreak.

## REST contract (off-spec) and MCP tools

- **Take the inventory before touching anything** — every block `id`, `type` and the current
  order (connector: `get_quotation(id)` → `blocks[]`; there is **no** block-listing tool).
  One block in full: `get_quotation_block` {`quotation_id` integer, `block_id` **UUID string**}.
- **Write**: `PUT /quotations/{id}` with `{builderVersion: 2, blocks: [...]}` —
  ⚠️ **the array you send REPLACES everything** (same trap as customFields). The V2 editor is
  used in parallel by the team: a blind PUT overwrites their work. **Edit block by block**,
  never by re-posting the whole array:
  - Add a block, then fill it — a new block always lands with the **server's default content**
    (connector: `add_quotation_block` {`quotation_id`, `type`, `position` 0-based, omit =
    append} takes no content argument) → second call to write the content.
  - Change a block's content: send the **COMPLETE `data`** — the merge is **shallow at root**,
    a partial `data` wipes the rest of the object (connector: `update_quotation_block`
    {`quotation_id`, `block_id`, `data` **JSON object, never a JSON string**, `title`,
    `showTitle`, `visible`, `layout`}). Read the block first, edit in memory, send it whole.
  - Large text (html `code`, long wysiwyg column): edit by anchor instead of resending tens of
    KB (connector: `replace_quotation_block_text` {`quotation_id`, `block_id`, `field` =
    dot-path inside `data` — `"code"`, `"columns.0"` — plus `search`+`replace` **or**
    `from`+`to`+`replace`}). Anchors must be **short and unique**: no `replace_all`, no regex,
    no occurrence index. A non-text structure (one `faq.items` entry, one `gallery.images`)
    is **not** reachable this way → complete `data` instead.
  - Delete / reorder: `delete_quotation_block` {`quotation_id`, `block_id`} ·
    `reorder_quotation_blocks` {`quotation_id`, `order`} where `order` is the **COMPLETE** list
    of ids top to bottom — a partial list silently pushes the omitted blocks to the end.
  - Retype or duplicate a block: **no tool for either** — a block's `id` and `type` are
    immutable. Delete + add of the right type + reorder; to copy one, read the source block and
    write its `data` into a freshly added block of the same type (watch internal ids like
    `faq.items`). No history either: keep the `data` you read before any write, it is your undo.
- Block `id`s are **client-side generated UUIDs**, persisted as-is (a clone made in the Duodeal
  interface preserves them). The connector has **no `clone_deal` / `clone_quotation`**: either
  rebuild deal → quotation → lines → blocks, or clone in the app and read the result back.
- **Lines ↔ pricing**: each quotation-line attaches to the pricing block via `blockId`
  (payload of `create/update_quotation_line`). Without `blockId`, lines fall back to the
  **first** pricing block — only required when there are several pricing blocks. If you
  replace the pricing block, re-attach the lines. Rows never live in `block.data`, and
  deleting a pricing block does **not** delete its lines — remove them explicitly.
- **Images inside blocks** (header `cover`/`logo`, `gallery`, `attachments`, `pdfviewer`):
  register the media first — ⚠️ reuse an existing media first (`list_medias`); `file` in **base64 is the normal, supported route** for the upload itself. ⚠️ What is forbidden is base64 **inside the HTML**: reference the url the media returns, never a `data:` URI (see **duodeal-mcp-best-practices** → images); **never `from_url`**, the URL import 500s on most CDNs whatever the tool description says (connector: `create_media` {`name`, `folder`, `file`}) —
  then reference its url/id in the **complete `data`** of the
  target block. Line and product tools have **no media argument** — an image on a line is bound
  by REST (`POST|PUT /quotation-lines {medias: [{id}]}`) when a key is already configured,
  otherwise in the Duodeal interface, and you say it is still pending.
- **The quotation must already be V2** for any of this to apply: a quote created through the
  connector starts at `builderVersion: 1, blocks: null`, and **no connector argument exposes
  `builderVersion`**. Check it on the **`builderVersion` field itself** (`get_quotation` →
  `builderVersion == 2`). ⚠️ **Non-empty `blocks[]` is NOT a proof of V2**: a quotation can carry
  V2 blocks and still be `builderVersion: 1` — the menu then opens it in the **old (V1) editor**,
  and the blocks are ignored. To flip it, `PUT
  /quotations/{id}` with `{builderVersion: 2, blocks: [...]}` via REST if a key is configured,
  otherwise convert it in the Duodeal interface — and say so to the user.
- `quotation.shareLinks` = V2 share links (filtered view of the blocks), **read-only** in
  `get_quotation`: the connector cannot create one.

## JS API of `html` blocks (micro-apps)

The `code` runs in a sandboxed iframe with `window.DuoDeal`:

- `DuoDeal.deal / .quotation / .lines / .customFields` — read the quote data
- `DuoDeal.onUpdate(cb)` — re-render on live pricing edits
- `DuoDeal.get/set/update/getData/setData` — per-block persisted state (`data.state`)
- `DuoDeal.formatCurrency(n)` / `formatDate(d)` / `autoResize()`

**Always end with `autoResize()`** — otherwise the iframe keeps its default height
(white space or clipped content). Check the call is there **before** writing the block: no
connector tool validates the code you send.

## Checklist before writing blocks

1. Test/demo tenant only; label anything disposable as "to delete".
2. Read the existing blocks first — understand what exists before touching anything
   (connector: `get_quotation` → `blocks[]`, then `get_quotation_block` for the ones you edit).
3. NEVER post a partial `blocks` array: through REST it replaces the whole page, and the
   connector has **no raw-HTTP tool** (`api_call` does not exist) — edit block by block, and
   send the complete `data` each time.
4. Rich sections → `wysiwyg`; interactive code/logos → `html` (+ `autoResize()`).
5. Do not embed spacers (`<div style="height:71px">…`): each block handles its own
   spacing — the spacer turns into a white band at the top of the card.
6. `faq`: raw text only.
7. `accept` never ships alone → always add a `signstamp` block next to it (the button
   disappears once signed; the stamp is the only remaining proof of signature).
8. Check the render in the V2 editor — no tool returns a preview, so open the edit link in a
   browser (or ask the user to look, and say so). Build it by hand, there is no link tool:
   `https://duodeal.app/app/quotations/{dealId}/{quotationId}` from the deal `id`
   (`get_deal`) and the quotation `id`; the customer link is
   `https://duodeal.app/quotations/deal/{deal.uid}`.

## Reference structure (validated — Onboarding Agent)

Canonical order of a generated V2 quote: 1) `header` (native cover, `noLogo: true`) ·
2) `html` block with sender + client logos side by side · 3) one `wysiwyg` block per section
(cover, your project, who we are, product range, video, gallery, investment) ·
4) `pricing` (lines attached via `blockId`) · 5) post-table wysiwyg (terms,
testimonials, FAQ, contact) · 6) `contacts` then `legalnotice`. Do not change this reference
structure without explicit approval.
