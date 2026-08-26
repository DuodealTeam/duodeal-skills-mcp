---
name: duodeal-api-reference
description: Duodeal REST API reference (api.duodeal.app) — X-API-KEY auth, payload conventions, inventory of the ~80 operations, filters, pagination, recurring errors. Use this skill as the API reference whenever you touch the Duodeal API or the duodeal MCP tools (POST/PUT/GET, debugging a 4xx/5xx, custom fields, media, logos, templates, filters), before generating, editing or delivering a Duodeal quote or selling page, and whenever deals, quotations, quotes, V2 blocks or the Hot Deal Score come up on the API side.
---

# Duodeal API — reference

Operational reference for the Duodeal REST API, compiled from the official OpenAPI spec
(~80 operations) + the rules learned in the field. What follows describes **the server**:
the official Duodeal MCP connector covers only a subset of it.

Before naming any tool, check it against
[references/connector-tools.md](references/connector-tools.md) — that file is
authoritative on tool names and argument names. There is **no generic `api_call` tool**:
an endpoint with no connector tool is reached by a direct REST call with `X-API-KEY`
**only if a key is already configured in the environment**, otherwise through the Duodeal interface — and you say
which route you took.

## Fundamentals

- **Base URL**: `https://api.duodeal.app/api` (override: env `DUODEAL_BASE_URL`)
- **Auth**: header `X-API-KEY: <uuid>` — the RAW UUID, **never** a `Bearer` prefix
- **Content-Type**: `application/json` for every POST/PUT
- **IDs**: integers for resources; **UUID v7** for public links (deal `uid`, quotation `uuid`, pins)
- **Connection**: know which tenant you are acting on before the first write, and state it out loud (connector: `get_current_user` returns the acting user + its company, then `get_company(id)` for the company detail). Never display or log a key

## Payload conventions (valid everywhere)

- Nested refs: `{"entity": {"id": N}}` — never `entity_id`
- ISO dates `YYYY-MM-DD`; JSON booleans; prices as raw numbers
- **VAT rate = decimal 0–1** (0.20 = 20%, 0.055 = 5.5%) — out of range → 400
- HTML accepted in `description`, `title`, `HtmlSimple`/`RichText` custom fields (server-sanitized)
- ⚠️ Never send a partial object where the server replaces the whole one: `customFields` on `PUT /quotations/{id}` **replaces the entire dict**, same trap with `blocks` (V2) and with a block's `data` (merge is shallow at root). Rule: **read, merge in memory, send complete** (connector: `get_quotation` / `get_quotation_block` before `update_quotation` / `update_quotation_block`; for a long text value use the targeted `replace_quotation_custom_field` / `replace_quotation_block_text` instead of resending everything). Nothing re-reads for you.

## Inventory (overview)

The **Connector tools** column lists the tools that really exist. When a cell says
*none*, the operation is impossible through the connector: say it, then take the exit
given in the cell.

| Category | Endpoints | Connector tools |
|---|---|---|
| Setup / read | `/taxes`, `/unities`, `/price-categories`, `/quotation-status`, `/deal-status`, `/users/me` | `list_taxes`, `list_unities`, `list_price_categories`, `list_quotation_statuses`, `list_deal_statuses`, `get_current_user` (**not** `get_me`) — read-only: no create tool on any of them |
| Deals | `/deals` (+`/deals/clone/{id}`) | `list_deals`, `get_deal`, `create_deal`, `update_deal` — **no `clone_deal`, no `delete_deal`**: rebuild a new deal, or clone/delete in the app |
| Quotations | `/quotations` (+`/{id}/clone`) | `list_quotations`, `get_quotation`, `create_quotation`, `update_quotation` — **no `clone_quotation`, no `get_links`**: a 2nd quotation is rebuilt, the links are built by hand (see below) |
| Lines | `/quotation-lines` (+`/quote/{id}`) | `list_quotation_lines`, `create_quotation_line`, `add_quotation_lines` (use it as soon as there are 2+ lines), `update_quotation_line`, `delete_quotation_line` |
| V2 blocks | via `PUT /quotations/{id}` (off-spec) | inventory via `get_quotation` → `blocks[]` (**no `list_quotation_blocks`**), then `get/add/update/delete_quotation_block`, `reorder_quotation_blocks`, `replace_quotation_block_text` — see the **duodeal-v2-blocks** skill |
| Customers | `/customer-companies`, `/customers` | `list/get/create/update_customer_company`, `list/get/create/update_customer` — no delete tool, `archived: true` only |
| Catalog | `/products`, `/product-prices`, `/price-categories` | `list/get/create/update_product`, `list/get/create/update/delete_product_price` (hard delete), `list/get/create/update_price_category` |
| Custom fields | `/custom-fields` | definitions: `list/get/create/update_custom_field` · values: the `customFields` argument of the entity tools, or `replace_quotation_custom_field` for a long text value |
| Media | `/medias` | `list_medias`, `get_media` (integer `id`), `create_media` (**not** `upload_media`; ⚠️ reuse an existing media first (`list_medias`); `file` in **base64 is the normal, supported route** for the upload itself. ⚠️ What is forbidden is base64 **inside the HTML**: reference the url the media returns, never a `data:` URI (see **duodeal-mcp-best-practices** → images); **never `from_url`** — the URL import 500s on most CDNs despite what the tool description says; no local path) — no delete/rename/move tool: do it in the app. To show an image: lines and products have **no media argument**, so reference the returned url/id inside a block (`gallery.images`, `attachments`, `header.cover`/`logo`, `pdfviewer`) via `update_quotation_block` with the complete `data`, or bind it in the app |
| Templates | `/templates` (types `cgv`/`notice`/`email`) | **none** (no `list_templates`, no `ensure_template`, no `template` argument anywhere): create or flag the template in the Duodeal interface, then read it back with `get_quotation` and tell the user that step was theirs |
| Org | `/users`, `/user-groups`, `/filter-views` | `get_current_user`, `list_users`, `get_user`, `get_user_activity` — **no `create_user`**: account creation belongs to the client's admin, never to us |
| Webhooks | `/webhooks` (off-spec, verified 2026-07-23) | `list/get/create/update_webhook` — **no `delete_webhook`**: repoint or disable it with `update_webhook`, or delete it in the app |
| Collab | `/pins`, `/comments/{uuid}` | `list_quotation_pins`, `create_pin`, `add_pin_comment`, `list_pin_comments`, `update_comment`, `delete_comment` (`quotation_uuid` from `get_quotation`) — ⚠️ `create_pin` and `add_pin_comment` **send an email** to the deal contact/owner: ask before calling them |
| Company / numbering | `/companies`, numbering settings | `get_company`, `update_company`, `update_numbering_setting` — fill only what is empty, never overwrite an existing setting |
| Statistics | engagement + amounts | `get_deal_access_statistics` / `get_quotation_access_statistics` (views and time, **no amounts**) · `get_deals_amounts_summary` / `get_quotations_amounts_summary` (amounts, **no view counts**) |

Tool names, argument names and the workaround for every impossible operation: read
[references/connector-tools.md](references/connector-tools.md) — it also lists the tools
people expect but that do **not** exist (`api_call`, `get_links`, `clone_deal`,
`clone_quotation`, `ensure_template`, `create_tax`, `create_unity`, `create_user`,
`send_quotation`, most `delete_*`). If a tool is not in that file, it does not exist:
do not guess a name.
Field-by-field detail (Req/Opt/Resp/traps per endpoint): read
[references/endpoints.md](references/endpoints.md).
Recurring errors, deletion rules, media, logos: read
[references/gotchas.md](references/gotchas.md).

## Filters and search

- Filters (REST): `filters[<field>][<op>]=<value>` — op ∈ `eq|neq|contains|startsWith|endsWith|gt|gte|lt|lte|like|in`. Relational fields (`customerCompany.name`) and custom fields (`customFields.<key>`) are supported. The connector has **no generic `filters` argument**: it exposes named ones (`search`, `customer_id`, `status_id`, `owner_id`, `date_from`/`date_to`, `min_amount`/`max_amount`, `sort_by`/`sort_order`) — for anything they do not cover, go through REST or filter the result yourself.
- Full-text search: `?search=` on Deals & Quotations (weighted PostgreSQL FR/EN: name/number on top, then contact/customer) — connector: the `search` argument of `list_deals` / `list_quotations`.
- Pagination: `page` + `itemsPerPage` on REST, `page` + `limit` on the connector (default 10). Responses are sometimes `[...]`, sometimes `{data: [...], meta: {currentPage, perPage, pages, total}}` — read `meta.total` / `meta.pages` and loop over `page` yourself: there is **no "fetch everything" flag**, and a truncated list read as complete is how a deal goes missing.

## Public endpoints (no key)

`GET /deals/uuid/{uuid}`, `GET /deals/custom-fields/{uuid}`, `GET /deals/pdf/{uuid}`,
`GET /quotations/uuid/{quoteUuid}`, `GET /quotations/custom-fields/{quoteUuid}`,
`GET /pins/quotation/{quotationUuid}`.

## Link vocabulary (never confuse these)

| Link | URL | Use |
|---|---|---|
| **Edit** (internal) | `https://duodeal.app/app/quotations/{dealId}/{quotationId}` | **V2** editor (⚠️ not `/app/deals/…`). `{dealId}` = the real parent deal, read on `GET /quotations/{id}` → `deal.id` |
| **Customer / selling page** (default) | `https://duodeal.app/quotations/deal/{deal.uid}` | Sent to the prospect; the `deal.uid` is enough |
| Share link (V2) | `https://duodeal.app/quotations/share/{shareUuid}` | Alternative sharing (filtered view of the blocks) |

When a quote is delivered: **always give both links** (customer + edit). There is **no
`get_links` tool** — build them by hand: `get_deal(id)` gives the deal `uid` (customer
link) and the deal `id`, `get_quotation(id)` gives the quotation `id` (edit link). A
share link can only be **read** from `shareLinks` in `get_quotation`: the connector
cannot create one, so if none exists, deliver the customer link and say why.

## Reflexes

1. Get the tenant's own ids before writing a single line: ids vary per tenant, never reuse those of another account (connector: `list_taxes` / `list_unities`; every line, including `title` and `subtotal`, needs a `tax_id`).
2. Never create a duplicate setup record: list first, match, create only what is missing (connector: `list_price_categories` → `create_price_category`). **Taxes, unities, deal/quotation statuses and templates have no create tool at all** — create them in the Duodeal interface (Settings), re-list to pick up the new ids, and tell the user that step was theirs.
3. A deal **with no quotation does not appear** in the list: make sure a quotation exists right after creating the deal (REST `POST /deals` carries `createQuotation: true`; the connector has no such argument, so follow `create_deal` with `create_quotation(deal_id=…)`).
4. A bare `POST /quotations` → 500: the first quotation is born with the deal. For a **2nd quotation on the same deal** there is no clone tool: `create_quotation(deal_id=…)` then rebuild it (`add_quotation_lines`, `add_quotation_block` + `update_quotation_block` per block), or clone in the app and read the result back with `get_quotation`.
5. Writes: test/demo account only, never a real client tenant without an explicit request.
6. On an unexplained error: read the tool's own error message first, then [references/gotchas.md](references/gotchas.md). A 403 on a resource you know exists means the **wrong tenant**, not a rate limit — re-check with `get_current_user`.
7. When an operation has no connector tool (set a quotation **primary**, flag a template, `builderVersion`, deal language/currency, delete a media, send the quote by email, hard delete): say it plainly, then take the exit — a direct REST call with `X-API-KEY` **only if a key is already configured in the environment**, otherwise hand the step to the user in the Duodeal interface, click by click, and record it as still to do. Never ask for a key in the chat, and never deliver a quote as finished when a step you could not do is still pending.
