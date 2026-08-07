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

- **Read**: `GET /quotations/{id}` → `blocks` key. Tools: `get_quotation_blocks`
  (summaries by default, `full: true` for everything), `get_quotation_block` (one full block).
- **Write**: `PUT /quotations/{id}` with `{builderVersion: 2, blocks: [...]}` —
  ⚠️ **the array you send REPLACES everything** (same trap as customFields). The V2 editor is
  used in parallel by the team: a blind PUT overwrites their work. **Always
  go through the MCP tools**, which re-read then merge:
  - `add_quotation_block` {quotationId, type, data, title?, position?} — generates the UUID id
  - `update_quotation_block` {quotationId, blockId, data (merged key by key), …}
  - `replace_quotation_block_text` {quotationId, blockId, path, find?, replace} — targeted
    edit by dotted path (`code`, `columns.0`, `items.2.answer`) inside large blocks
  - `delete_quotation_block`, `reorder_quotation_blocks` (COMPLETE list of ids)
- Block `id`s are **client-side generated UUIDs**, persisted as-is
  (`clone_deal` preserves them).
- **Lines ↔ pricing**: each quotation-line attaches to the pricing block via `blockId`
  (payload of `create/update_quotation_line`). Without `blockId`, lines fall back to the
  **first** pricing block — only required when there are several pricing blocks. If you
  replace the pricing block, re-attach the lines.
- A quote created through the API starts at `builderVersion: 1, blocks: null`; the first block
  write flips it to V2 — always set `builderVersion: 2` right at creation.
- `quotation.shareLinks` = V2 share links (filtered view of the blocks).

## JS API of `html` blocks (micro-apps)

The `code` runs in a sandboxed iframe with `window.DuoDeal`:

- `DuoDeal.deal / .quotation / .lines / .customFields` — read the quote data
- `DuoDeal.onUpdate(cb)` — re-render on live pricing edits
- `DuoDeal.get/set/update/getData/setData` — per-block persisted state (`data.state`)
- `DuoDeal.formatCurrency(n)` / `formatDate(d)` / `autoResize()`

**Always end with `autoResize()`** — otherwise the iframe keeps its default height
(white space or clipped content). The MCP tools emit a ⚠️ if the call is missing.

## Checklist before writing blocks

1. Test/demo tenant only; label anything disposable as "to delete".
2. `get_quotation_blocks` first — understand what exists before touching anything.
3. NEVER push a partial `blocks` array through `api_call` — the block tools merge.
4. Rich sections → `wysiwyg`; interactive code/logos → `html` (+ `autoResize()`).
5. Do not embed spacers (`<div style="height:71px">…`): each block handles its own
   spacing — the spacer turns into a white band at the top of the card.
6. `faq`: raw text only.
7. `accept` never ships alone → always add a `signstamp` block next to it (the button
   disappears once signed; the stamp is the only remaining proof of signature).
8. Check the render in the V2 editor (`editionLink` link from `get_links`).

## Reference structure (validated — Onboarding Agent)

Canonical order of a generated V2 quote: 1) `header` (native cover, `noLogo: true`) ·
2) `html` block with sender + client logos side by side · 3) one `wysiwyg` block per section
(cover, your project, who we are, product range, video, gallery, investment) ·
4) `pricing` (lines attached via `blockId`) · 5) post-table wysiwyg (terms,
testimonials, FAQ, contact) · 6) `contacts` then `legalnotice`. Do not change this reference
structure without explicit approval.
