---
name: duodeal-api-reference
description: Duodeal REST API reference (api.duodeal.app) — X-API-KEY auth, payload conventions, inventory of the ~80 operations, filters, pagination, recurring errors. Use this skill as the API reference whenever you touch the Duodeal API or the duodeal MCP tools (POST/PUT/GET, debugging a 4xx/5xx, custom fields, media, logos, templates, filters), before generating, editing or delivering a Duodeal quote or selling page, and whenever deals, quotations, quotes, V2 blocks or the Hot Deal Score come up on the API side.
---

# Duodeal API — reference

Operational reference for the Duodeal REST API, compiled from the official OpenAPI spec
(~80 operations) + the rules learned in the field. This plugin's `duodeal` MCP server
exposes the common operations as ready-to-use tools; for everything else,
the `api_call` tool covers any endpoint.

## Fundamentals

- **Base URL**: `https://api.duodeal.app/api` (override: env `DUODEAL_BASE_URL`)
- **Auth**: header `X-API-KEY: <uuid>` — the RAW UUID, **never** a `Bearer` prefix
- **Content-Type**: `application/json` for every POST/PUT
- **IDs**: integers for resources; **UUID v7** for public links (deal `uid`, quotation `uuid`, pins)
- **Connection**: handled by the MCP server (multi-tenant profiles) — check with the `connection_status` tool, never display a key

## Payload conventions (valid everywhere)

- Nested refs: `{"entity": {"id": N}}` — never `entity_id`
- ISO dates `YYYY-MM-DD`; JSON booleans; prices as raw numbers
- **VAT rate = decimal 0–1** (0.20 = 20%, 0.055 = 5.5%) — out of range → 400
- HTML accepted in `description`, `title`, `HtmlSimple`/`RichText` custom fields (server-sanitized)
- ⚠️ `PUT /quotations/{id}` with `customFields` **replaces the whole dict**; same trap with `blocks` (V2). The `update_quotation` and `*_quotation_block` MCP tools re-read and merge — do not bypass them with a direct `api_call` PUT.

## Inventory (overview)

| Category | Endpoints | MCP tools |
|---|---|---|
| Setup / read | `/taxes`, `/unities`, `/price-categories`, `/quotation-status`, `/users/me` | `list_taxes`, `list_unities`, `list_price_categories`, `get_me` |
| Deals | `/deals` (+`/deals/clone/{id}`) | `list_deals`, `get_deal`, `create_deal`, `update_deal`, `clone_deal`, `delete_deal` |
| Quotations | `/quotations` (+`/{id}/clone`) | `list_quotations`, `get_quotation`, `update_quotation`, `clone_quotation`, `get_links` |
| Lines | `/quotation-lines` (+`/quote/{id}`) | `list_quotation_lines`, `create/update/delete_quotation_line` |
| V2 blocks | via `PUT /quotations/{id}` (off-spec) | `get/add/update/delete_quotation_block`, `reorder_quotation_blocks`, `replace_quotation_block_text` — see the **duodeal-v2-blocks** skill |
| Customers | `/customer-companies`, `/customers` | `list/create_customer_company`, `list/create/update_customer` |
| Catalog | `/products`, `/product-prices`, `/price-categories` | `list/create_product`, `create_product_price`, `create_price_category` |
| Custom fields | `/custom-fields` | `list/create_custom_field` |
| Media | `/medias` | `upload_media` |
| Templates | `/templates` (types `cgv`/`notice`/`email`) | `list_templates`, `ensure_template` |
| Org | `/users`, `/user-groups`, `/filter-views` | `get_me`, `list_users`, `create_user` |
| Webhooks | `/webhooks` (off-spec, verified 2026-07-23) | `list/get/create/update/delete_webhook` |
| Collab | `/pins`, `/comments/{uuid}` | via `api_call` |

Field-by-field detail (Req/Opt/Resp/traps per endpoint): read
[references/endpoints.md](references/endpoints.md).
Recurring errors, deletion rules, media, logos: read
[references/gotchas.md](references/gotchas.md).

## Filters and search

- Filters: `filters[<field>][<op>]=<value>` — op ∈ `eq|neq|contains|startsWith|endsWith|gt|gte|lt|lte|like|in`. Relational fields (`customerCompany.name`) and custom fields (`customFields.<key>`) are supported. The MCP tools take a `filters: {"field": {"op": value}}` object.
- Full-text search `?search=` on Deals & Quotations (weighted PostgreSQL FR/EN: name/number on top, then contact/customer).
- Pagination: `page` + `itemsPerPage` (default 10). Responses are sometimes `[...]`, sometimes `{data: [...], meta: {currentPage, perPage, pages, total}}` — the MCP tools normalize this; use the `all: true` option to fetch everything.

## Public endpoints (no key)

`GET /deals/uuid/{uuid}`, `GET /deals/custom-fields/{uuid}`, `GET /deals/pdf/{uuid}`,
`GET /quotations/uuid/{quoteUuid}`, `GET /quotations/custom-fields/{quoteUuid}`,
`GET /pins/quotation/{quotationUuid}`.

## Link vocabulary (never confuse these)

| Link | URL | Use |
|---|---|---|
| **Edit** (internal) | `https://duodeal.app/app/quotations/{dealId}/{quotationId}` | **V2** editor (⚠️ not `/app/deals/…`) |
| **Customer / selling page** (default) | `https://duodeal.app/quotations/deal/{deal.uid}` | Sent to the prospect; the `deal.uid` is enough |
| Share link (V2) | `https://duodeal.app/quotations/share/{shareUuid}` | Alternative sharing (filtered view of the blocks) |

When a quote is delivered: **always give both links** (customer + edit) — the
`get_links` tool builds them.

## Reflexes

1. Before any line POST: `list_taxes` / `list_unities` of the ACTIVE tenant (ids vary per tenant — never reuse those of another account).
2. Idempotent creations: `create_tax`/`create_unity`/`create_price_category`/`ensure_template` reuse the existing record by default (list → match → create pattern).
3. A deal **with no quotation does not appear** in the list → `create_deal` keeps `createQuotation: true`.
4. A bare `POST /quotations` → 500: quotes are born through `create_deal`; a 2nd quotation through `clone_quotation`.
5. Writes: test/demo account only, never a real client tenant without an explicit request.
6. On an unexplained error: the MCP server messages carry the diagnosis (💡); otherwise check [references/gotchas.md](references/gotchas.md).
