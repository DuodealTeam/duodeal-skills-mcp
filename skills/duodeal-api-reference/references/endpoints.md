# Complete operations reference (by tag)

Format: `METHOD /path` — summary. **Req** = required fields; **Opt** = notable optional fields;
**Resp** = key response fields; **Note** = rules/enums/pitfalls.

## Companies

- `GET /companies/{id}` — Resp: `id, name, logo, cover, country, siren, address, address2, postCode, city, companySize, currency, currencyFormat, archive, showUnboarding, dealSettings, numberingSetting`.
- `PUT /companies/{id}` — Opt: `name, country, siren, address, address2, postCode, city, companySize, currency, currencyFormat, showUnboarding, dealSettings, setLogo, setCover`. **Note**: `setLogo`/`setCover` = base64 to set/replace, or the literal `"remove"` to delete; omit = unchanged. ⚠️ in practice: send **RAW base64 PNG** (a data URI is silently ignored — 200 OK with nothing persisted). `companySize` ∈ `1|2-10|11-50|51-200|201-500|500+`. **Never overwrite an existing logo/banner: only set it if absent.**

## Custom Fields

- `GET /custom-fields` — Opt query: `page, limit, order, direction` + filters. Resp: `id, name, label, type, scope, required, formula, options, weight, size, editable, public, activate, enableAi, hubspotMap, isMappedToHubspot`.
- `POST /custom-fields` — **Req**: `name, label, type, scope, required`. Opt: `formula (required if type Formula), options {items:[{label}]}, weight, size (w-full/w-1/2…), editable(def true), public, activate(def true), enableAi, hubspotMap`. **Note**: `name` = key without spaces.
- `GET|PUT|DELETE /custom-fields/{id}` — PUT opt: `label, required, weight` (+ others); changing `type`/`scope` can break existing data.
- **Types**: `Text, MultilineText, RichText, Number, Date, datetime, Select, MultiSelect, Image, User, Formula, Html, System` (+ `HtmlSimple` tolerated, rendered as HTML).
- **Scopes**: `deal, customer, customer-company, product, quotation, quotation-line`.
- **Values**: set via `update_quotation {customFields:{key:value}}`; displayed in a V2 quote by the `customfields` block (see duodeal-v2-blocks).

## Customer Companies

- `GET /customer-companies` — paginated + filters (`filters[name][contains]`, `filters[customFields.sector][eq]`). Resp: `id, name, siret, vatNumber, tradeName, address{country,address,state,postCode,city}, archived, isDeletable, customFields`.
- `POST /customer-companies` — **Req**: `name`. Opt: `siret, vatNumber, tradeName, address, customFields`.
- `GET|PUT|DELETE /customer-companies/{id}` — DELETE only if `isDeletable` (no linked customer), otherwise 400.

## Customers

- `GET /customers` — paginated + filters (`filters[email][endsWith]`, `filters[customerCompany.name][contains]`). Resp: `id, number, firstName, lastName, fullName, email, phone, civility, jobTitle, customerCompany, billingAddress, deliveryAddress, differentDeliveryAddress, customFields, archived, isDeletable`.
- `POST /customers` — everything optional: `firstName, lastName, email, civility, phone, jobTitle, billingAddress{country,address,postCode,city}, differentDeliveryAddress, deliveryAddress (required if different=true), customerCompany{id}, customFields`. `number` is auto-generated.
- `GET|PUT|DELETE /customers/{id}` — PUT: same + `archived`; `customerCompany` = `{id}` or `null` to unlink. DELETE only if no linked deal.

## Deals

- `GET /deals` — paginated: `page, itemsPerPage(def 10), archived, template, search` + filters. ⚠️ the `?template=1` filter is sometimes ignored by the API: re-check the `template` flag on every result.
- `POST /deals` — **Req**: `name`. Opt: `customer{id}, owner{id}, archived, template, autoSave(def true), language("fr"/"en"), displayCurrencyFormat`. **Query `?createquotation=1`** → creates an empty quotation at the same time. A deal **with no quotation does NOT appear** in the list.
- `POST /deals/clone/{id}` — clones deal + quotations + lines (+ V2 blocks, block ids preserved).
- `GET /deals/{id}` — Resp: `id, uid(UUID v7), number(D-YYYY-N), name, owner, customer, company, archived, template, language, contactFullName, opportunityAmountHt/Ttc, primaryQuotationId, primaryQuotationUuid, quotations[], presentations[]`.
- `PUT /deals/{id}` · `DELETE /deals/{id}` (soft delete).
- **Public**: `GET /deals/uuid/{uuid}`, `GET /deals/custom-fields/{uuid}`, `GET /deals/pdf/{uuid}`.

## Quotations

- `GET /quotations` — paginated + `search` + filters. Signature fields: `signed, signDate, signerFirstName/LastName/Email, signedPdfUrl`.
- `POST /quotations` — ⚠️ **bare → 500** (verified): create via `POST /deals?createquotation=1`; a deal's second quotation via `POST /quotations/{id}/clone` then PUT on the clone.
- `PUT /quotations/{id}` — **the main customization point**. Query `?bulk=1` → also updates the lines. Opt: `title, description, customFields, validUntil, sections, discount, discountType(percentage/amount), signed, signerFirstName/LastName/Email, primaryQuotation, noCover, noLogo, legalNoticeText, legalMentionText, logo{id}, cover{id}`. ⚠️ `customFields` and `blocks` replace the whole dict/array: read back + merge.
- **Public**: `GET /quotations/uuid/{quoteUuid}`, `GET /quotations/custom-fields/{quoteUuid}`, `GET /quotations/pdf/{dealUuid}/{quotationUuid}`.

## Quotation Lines

- `GET /quotation-lines/quote/{id}` — all lines of a quotation sorted by `weight` (prefer it to `GET /quotation-lines`).
- `POST /quotation-lines` — **Req**: `quotation{id}, tax{id}, lineType, weight`. Opt: `title, productTitle, description(HTML), quantity(def 1), unitPrice(def 0), coef(def 1), discount(def 0), discountType(def percentage), option(def false), hide, product{id}, productPrice{id}, unity{id}, parent{id}, medias[{id}], customFields, subTotalConfig, blockId (attachment to a V2 pricing block)`.
- **`lineType`** ∈ `normal | title | subtotal` — ❌ `discount`, `product`, `text` do not exist (400). Discounts: a `normal` line with a negative `unitPrice` OR `discount`+`discountType` on a normal line.
- Calculation: `baseTotal = unitPrice × quantity × coef`; `totalHt = baseTotal − discount` (or `× (1 − discount/100)`); `totalTtc = totalHt × (1 + taxRate)`. Totals are recalculated automatically on PUT.
- `option: true` → the native "Option not included" badge (French deals: « Option non incluse »), excluded from the main total. Line image: `medias: [{id}]`. Inline HTML accepted in `title`.

## Quotation Status

- `GET /quotation-status` — Resp: `id, name, color, onAction`. POST/PUT: `name`(req), `color`, `onAction` ∈ `create | deal-sent | deal-signed | null` (**only one status per value** of onAction).

## Products / Product Prices / Price Categories

- `GET /products` — filters (`filters[active][eq]`, `filters[customFields.category][eq]`). Resp: `id, name, reference, description, active, archived, url, tips, customFields, unity, medias[], prices[]`.
- `POST /products` — **Req**: `name`. Opt: `reference, description, active(def true), archived, url, tips, customFields, unity{id}, medias[{id}]`.
- `PUT /products/{id}` — `prices:[{id, price, priceCategory{id}}]` updates by `id` only; new prices via `/product-prices`. DELETE a product → deletes its product-prices.
- `POST /product-prices` — **Req**: `priceCategory{id}, product{id}, price`. Opt: `tax{id}`. **Only one price per (product × category)**, otherwise 400.
- `POST /price-categories` — **Req**: `name`. Opt: `byDefault, tax{id}`. Volume tiers = one category named per tier ("0-100", "100-500", "500+"). DELETE → cascades to its product-prices.

## Taxes / Unities

- `GET /taxes` — Resp: `id, name, rate, byDefault`. POST **Req**: `name, rate` — **`rate` is a decimal 0–1**. DELETE → **409** if in use.
- `GET /unities` — Resp: `id, name, byDefault`. POST **Req**: `name` ("Unit", "Month", "Hour", "Kg", "m²"…).

## Templates

- `GET /templates` — query `type` + `filters[type][eq]`. Resp: `id, title, type, content, subject, byDefaultSendDeal`.
- `POST /templates` — **Req**: `title, type(email|notice|cgv), content(HTML)`. Opt: `subject (email), byDefaultSendDeal`. Variables: `{{quotation.reference}}`, `{{customer.firstName}}`, `{{customer.lastName}}`, `{{company.name}}`…

## Sharing (V2)

- Sharing a V2 quote goes through the default selling page (`/quotations/deal/{deal.uid}`) and through the quotation's `shareLinks` (filtered view of the blocks).

## Medias

- `POST /medias` — **Req**: `name, mime, folder` + `file` (base64 data URI) **or** `fromUrl`. MIME: `image/jpeg|png|gif|webp|svg+xml`, `application/pdf`. ⚠️ `fromUrl` is unstable (500 on many CDNs) → download the file yourself and send it base64 (connector: `create_media` with `file`; there is **no `upload_media`** tool — nothing base64-encodes for you). Limit ~4 MB.
- `GET|PUT|DELETE /medias/{id}` — DELETE breaks references.

## Users / User Groups / Filter Views / Pins

- `GET /users/me` — profile of the key + its `company` (`apiKey` is exposed here: **always mask it**). `GET /users`, `POST /users` (admin: `email, password` req), `PUT /users/{id}` (`language, firstName, lastName, jobTitle, active`…). DELETE user **400 if they own ≥ 1 deal** (reassign or `active:false`).
- `/user-groups` — `name`, `permissions[]`.
- `/filter-views` — saved views (scope `deals|customers|quotations|products`).
- `/pins` + `/comments/{uuid}` — pinned comments (offsetX/Y, zoneId). Public: `GET /pins/quotation/{quotationUuid}`. Deleting the **last** comment of a pin deletes the pin.

## Webhooks (not in openapi.yaml)

- `GET /webhooks` — verified live on 2026-07-23 (200, `{data, meta}`). POST/PUT/DELETE inferred from REST conventions (contract undocumented: on a 400, read the error message for the exact fields).
