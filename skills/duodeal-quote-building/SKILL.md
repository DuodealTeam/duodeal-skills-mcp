---
name: duodeal-quote-building
description: End-to-end flow for building a Duodeal quote from A to Z with the duodeal MCP tools — tenant setup, customer, deal + quotation, lines (sections, discounts, options), branding, T&Cs / legal notice, links to deliver. Use whenever you need to create, duplicate or deliver a Duodeal quote or selling page, start from a template, clone a deal, add a second quotation, or set up a product catalog.
---

# Build a Duodeal quote from A to Z

Proven sequence, with the MCP tools of the `duodeal` server. Two starting points:
**from scratch** (§1) or **from a template** (§2 — prefer this when a template exists).
For a visually premium quote (design selling page, polished HTML blocks), chain
the **duodeal-quote-design** skill after the creation step.

## 0. Before anything

1. `connection_status` — check the active tenant (company). Writes: test/demo account only.
2. `list_taxes` + `list_unities` (+ `list_price_categories` if catalog) — fetch the **ids of THIS tenant**. Never reuse the ids of another account (cause #1 of 400s).

## 1. Full from-scratch flow

```
1. connection_status                    → tenant OK ?
2. list_taxes / list_unities            → required ids
3. create_customer_company {name}       → client company
4. create_customer {customerCompanyId, firstName, lastName, email}
5. create_deal {name, customerId}       → deal + empty quotation (createQuotation by default)
6. update_quotation                     → title, validUntil, customFields (+ primary: see §5)
7. create_quotation_line (×N)           → lines: title / normal / subtotal, increasing weight
8. ensure_template (cgv, notice)        → reusable T&Cs + legal notice
9. get_links {dealId}                   → the 2 links to deliver
```

The `create_deal` result already contains `links` (edition + client).

### Lines — rules

- `weight` is mandatory and increasing (= display order).
- Typical structure: a `title` line (section separator, inline HTML accepted:
  `<p><span style="font-size:18px;">Included in our offer</span></p>`), then `normal`
  lines (productTitle, unitPrice, quantity, unity, HTML description), then `subtotal`.
- **Discounts**: a `normal` line with a negative `unitPrice`, OR `discount` + `discountType`
  (`percentage`/`amount`) on the line — `lineType: "discount"` does not exist.
- `option: true` → "Option not included" badge (French deals: « Option non incluse »), excluded from the total.
- Line image: `upload_media` first, then `medias: [{id}]` in the payload.
- V2 quotes (blocks): pass the pricing block's `blockId` in the payload — see the
  **duodeal-v2-blocks** skill.

### Quotation branding

- `upload_media {url}` → `update_quotation {payload: {logo: {id}}}` (same for `cover`).
- `noLogo`/`noCover: true` only if there is NOTHING to show (otherwise conflict).

## 2. Start from a template (recommended when one exists)

```
1. list_deals {template: true, search: "..."}   → find the template (re-check the template
                                                  flag on each result, the API filter is
                                                  sometimes ignored)
2. clone_deal {dealId}                          → full copy (quotations, lines, V2 blocks)
3. update_deal {name, customerId}               → rename, set the customer, template: false
4. update_quotation / block tools               → customization
5. get_links                                    → delivery
```

**2nd quotation on an existing deal**: `clone_quotation` from a quotation of the deal,
then `update_quotation` on the clone (`title`, `primaryQuotation`…). A bare `POST /quotations`
fails (500).

## 3. Product catalog (if requested)

```
create_price_category {name}            → idempotent (volume tiers: 1 category per tier)
create_product {name, payload}          → product record
create_product_price {productId, priceCategoryId, price}   → only 1 price per pair
```

Then reference them in the lines: `product {id}`, `productPrice {id}`.

## 4. Custom fields (structured data)

1. `create_custom_field {name, label, type, scope}` — data field on deal / customer / product / quotation.
2. Values: `update_quotation {payload: {customFields: {key: value}}}` — automatic merge.
3. Display in the quote: via the V2 **`customfields`** block (list of CF names) — see **duodeal-v2-blocks**.

## 5. Delivery — always the 2 links

⚠️ **Before delivering, mark the quotation as primary.** Otherwise it does NOT appear in the customer dashboard (the table only lists primary quotes) — recurring bug. On a rework, switch the primary flag to the new quotation. **Not settable through the official connector** → `PUT /quotations/{id} {primaryQuotation: true}` on the REST API when a key is configured, otherwise hand the step to the user in the Duodeal interface and flag it as pending.

`get_links {dealId}` returns:

- **clientLink** `…/quotations/deal/{uid}` — the selling page sent to the prospect (default link)
- **editionLink** `…/app/quotations/{dealId}/{quotationId}` — the internal V2 editor
  (⚠️ never `/app/deals/…`)

Alternative sharing: V2 share link `…/quotations/share/{shareUuid}` (filtered view of the blocks).

## 6. Final check

- `get_quotation {quotationId}` — re-read the quote (blocks summarized by default).
- `list_quotation_lines {quotationId}` — check order (weight), totals, options.
- A quote is only "done" after a real visual check of the selling page
  (open the clientLink), not from reading the API alone.

## T&Cs / legal notice / email templates

`ensure_template {title, type: cgv|notice|email, content}` — idempotent (matched by title,
PUT if the content differs). Variables: `{{quotation.reference}}`, `{{customer.firstName}}`,
`{{company.name}}`… Emails carry `subject` + `byDefaultSendDeal`.
