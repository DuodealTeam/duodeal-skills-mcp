---
name: duodeal-quote-building
description: End-to-end flow for building a Duodeal quote from A to Z with the duodeal MCP tools — tenant setup, customer, deal + quotation, lines (sections, discounts, options), branding, T&Cs / legal notice, links to deliver. Use whenever you need to create, duplicate or deliver a Duodeal quote or selling page, start from a template, clone a deal, add a second quotation, or set up a product catalog.
---

# Build a Duodeal quote from A to Z

Proven sequence, written as **what to obtain**, with the tool in parentheses when one
exists. Tool names are authoritative in **duodeal-api-reference → `references/connector-tools.md`**:
if a step needs something the connector does not expose, it says so and gives the way out
(REST with `X-API-KEY` **only if a key is already configured**, otherwise the Duodeal
interface — and tell the user it is pending).
Two starting points: **from scratch** (§1) or **from an existing reference quote** (§2 —
prefer this when one exists). For a visually premium quote (design selling page, polished
HTML blocks), chain the **duodeal-quote-design** skill after the creation step.

## 0. Before anything

1. Know which tenant you are writing to, and say it out loud (`get_current_user`, then `get_company` for the details). Writes: test/demo account only.
2. Collect the ids **of THIS tenant** before any line: taxes and units (`list_taxes`, `list_unities`), price categories if there is a catalog (`list_price_categories`). Never reuse the ids of another account (cause #1 of 400s). Rates come back as decimals (0.20 = 20 %).

## 1. Full from-scratch flow

```
1. Know the tenant                  (get_current_user)
2. Hold this tenant's ids           (list_taxes, list_unities)
3. Have the client organization     (create_customer_company {name})
4. Have the contact                 (create_customer {customer_company_id,
                                     first_name, last_name, email})
5. Have the deal                    (create_deal {name, customer_id})
6. Have ONE quotation on that deal  (list_quotations {deal_id} to see what exists,
                                     create_quotation {deal_id, title, valid_until}
                                     if there is none — never assume one was
                                     auto-created)
7. Refine the quotation             (update_quotation {id, title, valid_until,
                                     customFields} — primary flag: see §5)
8. Fill the price table             (add_quotation_lines {quotation_id, lines[]} as
                                     soon as there are 2+ lines, create_quotation_line
                                     for a single one)
9. Attach T&Cs + legal notice       (no template tool on the connector — see the last
                                     section)
10. Hold the 2 delivery links       (rebuild them from get_deal + get_quotation — §5)
```

There is **no `get_links` tool** and no `links` field to rely on in the `create_deal`
result: both links are rebuilt by hand from the deal `uid` / `id` and the quotation `id` (§5).

### Lines — rules

- `weight` is mandatory and increasing (= display order).
- Typical structure: a `title` line (section separator, inline HTML accepted:
  `<p><span style="font-size:18px;">Included in our offer</span></p>`), then `normal`
  lines (`productTitle`, `unitPrice`, `quantity`, `unity_id`, HTML `description` —
  **required** on `lineType: "normal"`), then `subtotal`.
- **Every** line carries a `tax_id`, including the `title` and `subtotal` ones (otherwise 400).
- **Discounts**: a `normal` line with a negative `unitPrice`, OR `discount` + `discountType`
  (`percentage`/`amount`) on the line — `lineType: "discount"` does not exist.
- `option: true` → "Option not included" badge (French deals: « Option non incluse »), excluded from the total.
- **An image on EVERY product line** (blocking checklist item of **duodeal-quote-design**), on
  the media of the LINE, square and centered on the subject. ⚠️ **No media argument exists on
  the line tools, nor on the product tools** (`url` on a product is an external link, not an
  image). Store the file (⚠️ prefer an upload in the Duodeal media library (interface) and reuse `list_medias`; base64 is a fallback that causes known bugs on Duodeal — when you use it, say so (see **duodeal-mcp-best-practices** → getting an image into the library); `create_media {name, folder, file}`, **never `from_url`**, it 500s on most CDNs), then bind it to the line by REST `POST|PUT /quotation-lines
  {medias: [{id}]}` if a key is already configured, otherwise attach it in the Duodeal
  interface and say the images are still pending. Failing that, an image can only be shown in a
  V2 block (`gallery.images`, `attachments`, `header.cover`) via `update_quotation_block`.
  Say which route you took.
- V2 quotes (blocks): pass the pricing block's `blockId` (camelCase, inside the line) so the
  line lands in the right table — see the **duodeal-v2-blocks** skill.

### Quotation branding

- Get the logo / cover **stored** (⚠️ prefer an upload in the Duodeal media library (interface) and reuse `list_medias`; base64 is a fallback that causes known bugs on Duodeal — when you use it, say so (see **duodeal-mcp-best-practices** → getting an image into the library); `create_media {name, folder, file}`, never `from_url`) and then **shown**:
  `update_quotation` has **no `logo` / `cover` argument** on the connector → put the media in
  the native `header` block (`update_quotation_block` with the **complete** `data`), or set it
  via REST / the interface.
- `noLogo` / `noCover: true` only if there is NOTHING to show (otherwise conflict) — they are
  `header` block fields, sent inside its `data`, not quotation arguments.

## 2. Start from an existing reference quote (recommended when one exists)

```
1. Identify the reference deal      (list_deals {search: "..."} — there is NO template
                                     flag or template tool on the connector: confirm
                                     with the user which deal is the reference, and
                                     re-check what you got)
2. Read the source completely       (get_deal, get_quotation → blocks[] with every id
                                     and type, list_quotation_lines)
3. Rebuild on a NEW deal            (no clone_deal / clone_quotation on the connector:
                                     create_deal → create_quotation →
                                     add_quotation_lines → per block
                                     add_quotation_block {type, position} then
                                     update_quotation_block with the read data.
                                     Alternative: duplicate in the Duodeal interface
                                     and read the copy back with get_quotation)
4. Customize                        (update_deal {id, name, customer_id},
                                     update_quotation, block tools —
                                     replace_quotation_block_text for large html/wysiwyg)
5. Deliver                          (rebuild the 2 links — §5)
```

**2nd quotation on an existing deal**: there is no `clone_quotation`. Create it
(`create_quotation {deal_id}` — `deal_id` is required, a REST `POST /quotations` without a
deal fails 500), then copy the content block by block and re-run `add_quotation_lines`, then
`update_quotation` on the new one (`title`…). The **primary** flag is not settable through the
connector — see §5.

## 3. Product catalog (if requested)

```
Have the price tiers      (create_price_category {name, by_default} — 1 category per
                           volume tier; list_price_categories first, do not recreate)
Have the product record   (create_product {name, reference, description, ...})
Have its price            (create_product_price {product_id, price_category_id,
                           tax_id, price} — the four are required, only 1 price per
                           product × category pair; delete_product_price is a HARD delete)
```

Then bind them to the lines: `product_id` on the line. The `productPrice{id}` reference
exists on `POST|PUT /quotation-lines` (REST) but **is not a connector argument** — through the
connector the amount charged is the line's own `unitPrice`, so read the catalogue price
(`list_product_prices`) and carry it over yourself.

## 4. Custom fields (structured data)

1. Have the **definition** (`list_custom_fields` first, then `create_custom_field {name, type, scope}` — the three are required on create, `label` recommended; scope = deal / customer / product / quotation).
2. Have the **value** on the quotation (`update_quotation {id, customFields: {key: value}}`, key = the field **name**). Read the current dict first and resend it merged: a partial `customFields` can overwrite the rest. For a large text value use `replace_quotation_custom_field {quotation_id, field, search+replace}` instead of rewriting everything.
3. Display it in the quote: via the V2 **`customfields`** block (list of CF names) — see **duodeal-v2-blocks**.

## 5. Delivery — always the 2 links

**Primary quotation — check it in the §2 case.** A deal's first quotation is primary by default, so §1 needs nothing. But the customer dashboard table lists primary quotes only: a **second** quotation on a deal, or a quote rebuilt as a new quotation (§2), may not appear there. Say so to the user in that case — the flag is switched in the Duodeal interface (no connector argument exposes it).

No `get_links` tool exists: read the ids (`get_deal {id}` → deal `uid` + `id`,
`get_quotation {id}` or `list_quotations {deal_id}` → quotation `id`) and build both links:

- **client link** `https://duodeal.app/quotations/deal/{deal.uid}` — the selling page sent to
  the prospect (default link, nothing to generate)
- **edit link** `https://duodeal.app/app/quotations/{dealId}/{quotationId}` — the internal V2
  editor (⚠️ never `/app/deals/…`, that is the V1 editor)

⚠️ The `{dealId}` in that URL must be the **real parent deal** of the quotation: read it back on
`get_quotation {id}` → `deal.id`, and never paste a deal id from memory or from another quote.
A wrong `dealId` opens someone else's deal or a blank editor.

Alternative sharing: V2 share link `https://duodeal.app/quotations/share/{shareUuid}`
(filtered view of the blocks) — usable **only** if `get_quotation` already returns a
`shareLinks` entry; the connector cannot create one, and it cannot send the quote by email
either (do it from the app).

## 6. Final check

- Re-read the quote from the server (`get_quotation {id}` — carries `blocks[]` and `shareLinks`).
- Check order (`weight`), totals and options on the price table (`list_quotation_lines {quotation_id}`).
- A quote is only "done" after a real visual check of the selling page (open the client link
  in a browser). **No connector tool renders the page or a block preview** — if you cannot
  open it yourself, say so and ask the user to look. Never claim a render you have not seen.

## T&Cs / legal notice / email templates

**No template tool on the connector** (no `ensure_template`, no `list_templates`): reusable
T&Cs, legal notices and email templates are created in the Duodeal interface (Settings), then
read back on the quotation. On the quote itself, the legal text goes in the native
`legalnotice` block (`add_quotation_block {type: "legalnotice"}` then
`update_quotation_block` with the **complete** `data`) — `update_quotation` has no
`legalNoticeText` argument. Variables resolved by the app templates:
`{{quotation.reference}}`, `{{customer.firstName}}`, `{{company.name}}`… Email templates carry
`subject` + `byDefaultSendDeal` and are set up in the interface only. If a REST key is already
configured, that write can go through `X-API-KEY`; otherwise hand the step to the user and
flag it as pending. Never invent a T&C or a legal notice the client did not provide.
