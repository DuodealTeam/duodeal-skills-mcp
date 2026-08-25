# Official MCP connector — what the tools can and cannot do

These tools come from the **official Duodeal MCP connector** (`api.duodeal.app/api/mcp`): arguments are **flat** (no nested `{"entity": {"id": N}}` payloads), foreign keys are **snake_case ids** (`quotation_id`, `deal_id`, `tax_id`, `block_id`), and a few business fields keep the REST API's camelCase (`customFields`, `productTitle`, `unitPrice`, `lineType`, `blockId`).
This file is **authoritative on tool names and argument names** — if a tool is not listed here, it does not exist on the connector; do not guess a name, check this file first.

## Tool map by intent

| Intent | Tool(s) | Key arguments |
|---|---|---|
| Identify the account / tenant | `get_current_user`, `get_company` | `get_current_user` takes nothing and returns the acting user + its company; `get_company(id)` uses that company id |
| Users of the tenant | `list_users`, `get_user`, `get_user_activity` | `search`, `active`, `page`, `limit` · `id` · `user_id` + `date_from` / `date_to` (deals created/owned, amounts) |
| List / read deals | `list_deals`, `get_deal` | `search`, `customer_id`, `status_id`, `owner_id`, `date_from`/`date_to`, `min_amount`/`max_amount`, `sort_by` (`name`, `createdAt`, `opportunityAmountHt`), `sort_order`, `page`, `limit` · `id` |
| Create / update a deal | `create_deal`, `update_deal` | `name` (**required**), `customer_id`, `date`, `validUntil`, `introduction`, `customFields` · update adds `id` (**required**) and `status_id` |
| Deal statuses | `list_deal_statuses` | no argument — status ids are **per company**, call it before any `status_id` filter |
| List / read quotations | `list_quotations`, `get_quotation` | `deal_id`, `status_id`, `customer_name`, `date_from`/`date_to`, `min_amount_ht`/`max_amount_ht`, `min_amount_ttc`/`max_amount_ttc`, `page`, `limit` · `id` — the `get_quotation` response carries the V2 `blocks` array **and** `shareLinks` |
| Create / update a quotation | `create_quotation`, `update_quotation` | `deal_id` (**required**), `title`, `description`, `valid_until`, `discount`, `discount_type` (`percentage`\|`amount`), `price_category_id`, `status_id`, `customFields`, `archived` · update takes `id` instead of `deal_id`. Signature fields are preserved automatically |
| Quotation statuses | `list_quotation_statuses` | no argument — ids are per company, never standardized |
| Price-table lines | `list_quotation_lines`, `create_quotation_line`, `add_quotation_lines`, `update_quotation_line`, `delete_quotation_line` | `quotation_id`; per line: `productTitle`, `description` (**required** for `lineType:"normal"`, simple HTML), `quantity`, `unitPrice`, `tax_id`, `unity_id`, `lineType` (`normal`\|`title`\|`subtotal`), `discount`, `discountType`, `blockId`, `option`, `hide`, `weight`, `coef`, `product_id`, `customFields`. **Use `add_quotation_lines` (array `lines`) as soon as there is more than one line**; every line, including title/subtotal, must carry a `tax_id` |
| Taxes and units for lines | `list_taxes`, `list_unities` | no argument — ids are **per tenant**, never reuse another account's ids; rates come back as decimals (0.20 = 20 %) |
| V2 blocks — inventory | `get_quotation` | there is **no** `list_quotation_blocks`; read `blocks[]` here to get every `id`, `type` and the current order |
| V2 blocks — read one | `get_quotation_block` | `quotation_id` (integer), `block_id` (**UUID string**) |
| V2 blocks — add | `add_quotation_block` | `quotation_id`, `type`, `position` (0-based, omit = append). Types: `header`, `contacts`, `wysiwyg`, `html`, `pricing`, `customfields`, `attachments`, `legalnotice`, `paymentschedule`, `pdfviewer`, `youtube`, `faq`, `pptx`, `googleslides`, `canva`, `gallery`, `accept`, `signstamp`, `pagebreak`. The server creates the block with **default content only** |
| V2 blocks — edit content | `update_quotation_block` | `quotation_id`, `block_id`, `data` (JSON object, **never** a JSON string), `title`, `showTitle`, `visible`, `layout` (`{columns, rows}`). Merge is **shallow at root**: always send the **complete** `data` |
| V2 blocks — targeted text edit | `replace_quotation_block_text` | `quotation_id`, `block_id`, `field` (dot-path inside `data`: `"code"` for html, `"columns.0"` for wysiwyg) + either `search` + `replace`, or `from` + `to` + `replace` (short **unique** anchors, bounds included). Use this, not `update_quotation_block`, for large html/wysiwyg text |
| V2 blocks — delete / reorder | `delete_quotation_block`, `reorder_quotation_blocks` | `quotation_id` + `block_id` · `quotation_id` + `order` (**full** array of block ids, top to bottom) |
| Custom-field **values** | `customFields` argument of `create_deal`/`update_deal`, `create_quotation`/`update_quotation`, line tools, customer / customer-company / product tools · `replace_quotation_custom_field` for large text | key = the custom-field **name**. `replace_quotation_custom_field(quotation_id, field, search+replace \| from+to+replace)` with a dot-path such as `"html.html"` — targeted edit, avoids rewriting the whole field |
| Custom-field **definitions** | `list_custom_fields`, `get_custom_field`, `create_custom_field`, `update_custom_field` | `name`, `type`, `scope` (**all three required** on create: deals, quotations, customers, products…), `label`, `options` (select), `required`, `public`, `activate`, `enableAi`, `formula`, `weight`, `size` |
| Media library | `list_medias`, `get_media`, `create_media` | `folder`, `search`, `page`, `limit` · `id` (**integer**) · `name` + `folder` (**both required**) + `file` (base64 string) **or** `from_url` (public URL), optional `mime`. ⚠️ The tool description says `from_url` is preferred: **do not follow it** — the URL import returns a 500 on most CDNs (Cloudinary, Shopify, S3…). Download the file yourself and send `file` in base64 |
| Customers (contacts) | `list_customers`, `get_customer`, `create_customer`, `update_customer` | `search` · `first_name`, `last_name`, `email`, `phone`, `civility`, `company_name`, `customer_company_id`, `billing_address`, `delivery_address`, `type`, `customFields`, `archived` |
| Client organizations | `list_customer_companies`, `get_customer_company`, `create_customer_company`, `update_customer_company` | `name` (**required** on create), `trade_name`, `siret`, `vat_number`, `address`, `delivery_address`, `different_delivery_address`, `customFields`, `archived` |
| Catalogue — products | `list_products`, `get_product`, `create_product`, `update_product` | `search` · `name` (**required**), `reference`, `description` (HTML), `url`, `tips`, `active`, `archived`, `customFields`. Prices live in their own tools |
| Catalogue — prices | `list_product_prices`, `get_product_price`, `create_product_price`, `update_product_price`, `delete_product_price` | `product_id`, `price_category_id`, `tax_id`, `price` (all four required on create). `delete_product_price` is a **hard delete** |
| Catalogue — price categories | `list_price_categories`, `get_price_category`, `create_price_category`, `update_price_category` | `name`, `by_default` |
| Engagement statistics | `get_deal_access_statistics`, `get_quotation_access_statistics` | `deal_id` · `quotation_id` → `uniqueVisitors`, `totalVisits`, `avgVisitDuration`, `totalTimeSpent`, `lastVisit`, `desktopVisitors`, `mobileVisitors`, `dailyVisits`, `weeklyVisits` + 7-day series. **Engagement only, no amounts** |
| Financial summaries | `get_deals_amounts_summary`, `get_quotations_amounts_summary` | `date_from`/`date_to`, `status_id` (list the statuses first), `owner_id`, `customer_id` · `deal_id`. **Amounts only, no view counts** |
| Tenant settings | `update_company`, `update_numbering_setting` | `id` + `name`, `address`, `address2`, `city`, `post_code`, `country`, `currency`, `siren`, `company_size` · numbering `id` (found on the company via `get_company`) + `deal_format`, `quotation_format`, `deal_counter`, `quotation_counter`, `hide_quotation_numbering` |
| Webhooks | `list_webhooks`, `get_webhook`, `create_webhook`, `update_webhook` | `url` + `events` (array of event names, both required on create), `name` |
| Internal notes on a deal | `list_messages`, `create_message`, `update_message` | `deal_id`, `body` (HTML) · `id` + `body` |
| Pins / comment threads on a quotation | `list_quotation_pins`, `create_pin`, `add_pin_comment`, `list_pin_comments`, `update_comment`, `delete_comment` | `quotation_uuid` (from `get_quotation`), `content`, `route` (relative front path), `offset_x`/`offset_y`, `zone_id` · `pin_uuid` · `comment_uuid`. ⚠️ `create_pin` and `add_pin_comment` **send a notification email** to the deal contact/owner — ask before calling them |

## Not possible through the connector

| What | Why | Workaround |
|---|---|---|
| List the blocks of a quotation | No `list_quotation_blocks` tool; `get_quotation_block` already requires the `block_id` | `get_quotation` returns `blocks[]` with every id and type |
| Create a block already filled in | `add_quotation_block` only takes `quotation_id`, `type`, `position` — the server writes default content | Two steps: `add_quotation_block`, then `update_quotation_block` with the complete `data` (or `replace_quotation_block_text` for large content) |
| Patch a single key inside `data` | `update_quotation_block` merges **shallow at root**: a partial `data` overwrites the whole object (same trap as `customFields` on `PUT /quotations`) | `get_quotation_block` → edit in memory → send the **complete** `data` |
| Rewrite a large text field through `update_quotation_block` | Resending tens of KB of html `code` or a long wysiwyg column is slow and can fail | `replace_quotation_block_text` with `search`+`replace`, or `from`/`to` anchors |
| Change a block's `type` | `id` and `type` are immutable and ignored by `update_quotation_block` | `delete_quotation_block` + `add_quotation_block` of the right type + `reorder_quotation_blocks` to put it back |
| Duplicate a block, or copy one from another quotation | No clone tool for blocks | `get_quotation_block` on the source, `add_quotation_block` of the same type on the target, `update_quotation_block` with the read `data` (watch internal ids, e.g. `faq.items`) |
| Manage price-table rows from the pricing block | Rows are **not** in `block.data` (pricing `data` = `discountEnabled`, `discount`, `discountType`, `columns`) | Line tools (`add_quotation_lines`, `create_quotation_line`, `update_quotation_line`, `delete_quotation_line`, `list_quotation_lines`) with `blockId` to attach them to the right table |
| Delete a pricing block **and** its lines | `delete_quotation_block` does not cascade, there is no flag | Delete the lines explicitly with `delete_quotation_line` |
| Move ONE block to position N | `reorder_quotation_blocks` only takes the full `order` array; a partial order silently pushes the omitted blocks to the **end** of the page | Read the current order (`get_quotation`), recompute the whole list, send it |
| Undo a block change | No history, version or rollback tool (`version` is read-only, not an argument) | Save the `data` you read before any write, to re-post it |
| Fine-grained edit of a non-text structure (one `faq.items` entry, one `gallery.images` image) | `replace_quotation_block_text` targets **text** fields by dot-path | `update_quotation_block` with the complete `data` |
| Control multiple occurrences of a replacement | Neither `replace_quotation_block_text` nor `replace_quotation_custom_field` exposes `replace_all`, regex, occurrence index or dry-run | Read the content first, then pick **short and unique** `from`/`to` anchors |
| Create a field that does not exist yet with `replace_*` | The dot-path must already exist | Create the value first (`update_quotation_block` / `update_quotation` `customFields`) |
| Set a quotation as the **primary** one of a deal | No `primary`/`main` argument on `create_quotation` or `update_quotation`, no dedicated tool | Do it in app.duodeal.com; through the connector, deliver the link of the quotation you built |
| Mark a quotation (or a deal) as a **template** | No `template` argument anywhere, and no template tool at all (no `list_templates`, no `ensure_template`) | Create / flag the template in the app, then read it back with `get_quotation` |
| Set a deal's **language** or **currency** | `create_deal`/`update_deal` accept only `name`, `customer_id`, `date`, `validUntil`, `introduction`, `customFields`, `status_id`; currency exists only company-wide (`update_company.currency`) | Set the company currency, or adjust the deal in the app |
| **Clone** a deal or a quotation | No `clone_deal` / `clone_quotation` tool on the connector | Rebuild: `create_deal` → `create_quotation` → `add_quotation_lines` → `add_quotation_block` + `update_quotation_block` per block; or clone in the app and read the result back |
| Choose or change `builderVersion` (V1 ↔ V2) | Not exposed by any argument | Check the **`builderVersion` field** in `get_quotation` (`== 2`) — **not** the presence of `blocks[]`, which can exist on a V1 quote that still opens in the old editor. Any conversion is done in the app |
| Attach a media to a **line** or a **product** | Line tools have no media/image argument; `create_product` / `update_product` have none either (`url` is an external link, not an image) | `create_media` then reference the url/id in a block (`gallery.images`, `attachments`, `header.cover`/`logo`, `pdfviewer`) via `update_quotation_block` with the complete `data`, or bind it in the app |
| Delete, rename, move or replace a media | No `delete_media`, `update_media` or `move_media` | Do it in app.duodeal.com, or create a new media and re-point the blocks at it |
| List the media folders | `list_medias` filters on `folder` but nothing returns the existing folders | List without a filter and deduce the folders, or use the known conventions (`products`, `quotations`) |
| Upload a local file (path on the Mac) | `create_media` accepts only `file` in base64 or `from_url` (public URL) — no multipart, no path | Base64-encode it and send `file`; ⚠️ not `from_url`, which 500s on most CDNs |
| Auto-attach a media to a quotation / block / product | `create_media` only stores the file and returns `id` + `url` | Take the url/id, then `update_quotation_block` with the complete `data` of the target block |
| Create taxes, unities, deal/quotation statuses, templates or users | The connector only exposes `list_taxes`, `list_unities`, `list_deal_statuses`, `list_quotation_statuses`, `list_users` / `get_user` — no create/update/delete on any of them | Create them in app.duodeal.com (Settings), then re-list to pick up the new ids |
| Hard-delete a deal, a quotation, a customer or a product | No delete tool; only `archived: true` on quotations, customers, customer companies and products. **A deal has no `archived` argument at all** | Archive what supports it; delete in the app for the rest. Hard deletes exist only for lines, blocks, product prices and comments |
| Delete a webhook | `list_webhooks`, `get_webhook`, `create_webhook`, `update_webhook` only | Repoint or disable it via `update_webhook`, or delete it in the app |
| Call an arbitrary API endpoint | No generic `api_call` / raw-HTTP tool — off-spec endpoints are unreachable from the connector | Direct REST call with `X-API-KEY` if one is configured, otherwise the Duodeal interface |
| Send the quotation by email, or create a share link | No sending tool; `shareLinks` comes back read-only inside `get_quotation` | Send from the app; through the connector, hand over the links built below (`create_pin`/`add_pin_comment` do send an email, but they are annotations, not a delivery channel) |
| Check the visual rendering | No tool returns the rendered selling page or a block preview | Open the customer link or the edit link in the browser |

## Building the delivery links

There is **no `get_links` tool** on the connector. Build both links by hand:

1. `get_deal(id)` → keep the deal `uid` (public UUID) and the deal `id`.
2. `get_quotation(id)` (or `list_quotations(deal_id=…)`) → keep the quotation `id`, and its `uuid` if you need the pin tools.

| Link | Pattern | Built from |
|---|---|---|
| **Customer link / selling page** (the one to send) | `https://duodeal.app/quotations/deal/{deal.uid}` | the `uid` returned by `get_deal` — nothing to generate |
| **Edit link** (internal, V2 editor) | `https://duodeal.app/app/quotations/{dealId}/{quotationId}` | deal `id` + quotation `id`, both integers — and the deal `id` must be the **real parent**, checked on `get_quotation` → `deal.id` |
| Share link (optional) | `https://duodeal.app/quotations/share/{shareUuid}` | only if `get_quotation` already returns a `shareLinks` entry — the connector cannot create one |

⚠️ `https://duodeal.app/app/deals/{dealId}/{quotationId}` is the **V1** editor: never deliver it. When a quote is delivered, **always give both links** (customer + edit).

## Naming traps

**Ids are snake_case, business fields stay camelCase — in the same call.**

- snake_case (references, filters): `quotation_id`, `deal_id`, `block_id`, `customer_id`, `customer_company_id`, `product_id`, `price_category_id`, `tax_id`, `unity_id`, `status_id`, `owner_id`, `user_id`, `from_url`, `date_from`, `date_to`, `sort_by`, `sort_order`.
- camelCase (kept from the REST API): `customFields`, `productTitle`, `unitPrice`, `lineType`, `discountType`, `blockId`, `validUntil`, `showTitle`, `enableAi`, `noCover`, `noLogo`, `opportunityAmountHt`, `createdAt`.
- **Same concept, two spellings depending on the level** — the classic mistake:
  - quotation-level discount → `discount_type`; **line-level** discount → `discountType`.
  - deal validity → `validUntil`; **quotation** validity → `valid_until`.
  - line → block link → `blockId` (camelCase) inside a line, but the block itself is targeted by `block_id` (snake_case).
- **Id types are not uniform**: integers for deals, quotations, lines, media, products, users, taxes; **UUID strings** for `block_id`, `quotation_uuid`, `pin_uuid`, `comment_uuid`. `get_media` takes an **integer** `id` — do not pass it a block UUID.
- `data` in `update_quotation_block` is a **JSON object**, never a JSON string.

**Tool names people expect but that do not exist on the connector** (do not call them, do not mention them to the user):
`api_call`, `get_links`, `clone_deal`, `clone_quotation`, `list_quotation_blocks`, `delete_deal`, `delete_quotation`, `delete_customer`, `delete_product`, `delete_media`, `update_media`, `delete_webhook`, `create_tax`, `create_unity`, `create_deal_status`, `create_quotation_status`, `list_templates`, `ensure_template`, `create_user`, `send_quotation`.

Two more that exist under **another name**: `upload_media` → **`create_media`** · `get_me` → **`get_current_user`**.
