# Complete operations reference (by tag)

Format: `METHOD /path` — summary. **Req** = required fields; **Opt** = notable optional fields;
**Resp** = key response fields; **Note** = rules/enums/pitfalls.

## Companies

- `GET /companies/{id}` — Resp: `id, name, logo, cover, country, siren, address, address2, postCode, city, companySize, currency, currencyFormat, archive, showUnboarding, dealSettings, numberingSetting`.
- `PUT /companies/{id}` — Opt: `name, country, siren, address, address2, postCode, city, companySize, currency, currencyFormat, showUnboarding, dealSettings, setLogo, setCover`. **Note**: `setLogo`/`setCover` = base64 to set/replace, or the literal `"remove"` to delete; omit = unchanged. ⚠️ in practice: send **RAW base64 PNG** (a data URI is silently ignored — 200 OK with nothing persisted). `companySize` ∈ `1|2-10|11-50|51-200|201-500|500+`. **Never overwrite an existing logo/banner: only set it if absent.**

## Custom Fields

- `GET /custom-fields` — Opt query: `page, limit, order, direction` + filters. Resp: `id, name, label, type, scope, required, formula, options, weight, size, editable, public, activate, enableAi, hubspotMap, isMappedToHubspot`.
- `POST /custom-fields` — **Req**: `name, label, type, scope, required`. Opt: `formula (required if type Formula), options {items:[{label}]}, weight, size (w-full/w-1/2…), editable(def true), public, activate(def true), enableAi, hubspotMap`. **Note**: `name` = key without spaces. A `Select` takes `options {items:[{label}]}`; the value stored, and read in a block as `DuoDeal.customFields[name]`, is the option's **label**. Send the full body (`required:false, editable:true, activate:true, size:"w-full"`): a sparse one answered 500 (03/11/2026).
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

- `GET /deals` — paginated: `page, itemsPerPage(def 10), archived, search` + filters. **Never returns templates** (nor does `GET /quotations`, except filtered on one deal with `filters[deal.id][eq]`): list them with `GET /deal-templates`.
- `GET /deal-templates` — the Template library, same query language (`filters[templateStatus][eq]=published`, `search`, `order`, `page`, `limit`). Each row: `id, name, template, templateStatus (draft|published), templateColor, templateWhenToUse, language, templateTranslatedFrom (set on an AI-translated draft until it is published), owner, createdBy, archived, createdAt, updatedAt, usedIn (deals created from it), primaryQuotation {id, builderVersion, amountHt}|null`. Without the template permissions: published templates out of the trash only.
- `POST /deal-templates` — **Req**: `name`. Creates a **draft** template with **one empty V2 quote**, already primary; owner and creator are the connected user, language is that user's (change it with `PUT /deals/{id} {language}`). Needs CREATE_DEAL_TEMPLATES. Resp **201**: the library row above (`primaryQuotation.id` is the quote to build on). The supported way to create a template; `POST /deals {template: true}` still answers but is the old path.
- `POST /deal-templates/from-deal/{dealId}` — turns a copy of an existing deal into a **draft** template, named after the deal (body `{name}` optional). Copied: blocks, quotes, lines, products, design, deal settings. **Not copied**: the client and its contacts (`customer`, contact and company names), the hot score, the sent flag; signatures, comments and activity never follow. Every signer of a `signature` block becomes « the deal's primary contact », so each deal created from the template is signed by its own client. The deal itself is left untouched. 400 if the deal is already a template (duplicate it instead). Needs CREATE_DEAL_TEMPLATES. Resp **201**: the library row.
- `PUT /deal-templates/{id}` — each field optional, only the ones sent change: `{templateStatus: draft|published}` (needs EDIT_DEAL_TEMPLATES; **only a published template is offered in « New deal »**), the Template settings `{name, owner{id}, templateColor (#RRGGBB|null), templateWhenToUse (≤255), templateAiBrief (≤10000)}` (EDIT_DEAL_TEMPLATES), and/or `{archived}` (the trash, needs DELETE_DEAL_TEMPLATES). `POST /deal-templates/{id}/duplicate` — a new **draft** template (needs CREATE_DEAL_TEMPLATES).
- `POST /deal-templates/{templateId}/add-to/{dealId}` — copies the template's main quote (primary, else the oldest) into an existing deal as a new draft quote. Needs to read the template and edit the deal. Resp **201**: the new quotation.
- `POST /deal-templates/{id}/translate {language}` — a draft copy translated by the AI, named « {name} (XX) ». **Streamed** (Server-Sent Events: `created`, `progress`, `done`), long-running, needs CREATE_DEAL_TEMPLATES and the AI assistant permission: an interface action, not a connector one.
- **Template permissions**: creating a template (`POST /deal-templates`, `/from-deal/{id}`, `/duplicate`, or `template: true` on `POST /deals`) needs CREATE_DEAL_TEMPLATES; any change to a template, its quotes or its lines needs EDIT_DEAL_TEMPLATES; the trash and `DELETE` need DELETE_DEAL_TEMPLATES. Administrator has the three by default; otherwise **403**. Reading and cloning a published template is open to every user.
- `POST /deals` — **Req**: `name`. Opt: `customer{id}, owner{id}, archived, template, autoSave(def true), language("fr"/"en"), displayCurrencyFormat`. **Query `?createquotation=1`** → creates an empty quotation at the same time. A deal **with no quotation does NOT appear** in the list.
- `POST /deals/clone/{id}` — clones deal + quotations + lines (+ V2 blocks, block ids preserved). From a template: the new deal is a plain deal, counted in the template's `usedIn`; a draft or trashed template cannot be cloned without the template permissions.
- `GET /deals/{id}` — Resp: `id, uid(UUID v7), number(D-YYYY-N), name, owner, customer, company, archived, template, language, contactFullName, opportunityAmountHt/Ttc, primaryQuotationId, primaryQuotationUuid, quotations[], presentations[]`.
- `PUT /deals/{id}` · `DELETE /deals/{id}` (soft delete). `PUT /deals/{id} {"template": true}` turns an existing deal into a template **in place**: same deal id, same quotations, `templateStatus` `published` straight away, listed by `GET /deal-templates` and no longer by `GET /deals`. Resend `owner` and `users` in the same PUT.
- **Owner and participants**: `PUT /deals/{id} {"owner": {"id": N}, "users": [{"id": N}]}` replaces both. A deal created through an API key or the connector gets that user as owner **and** as participant (`users`): on a deal or template built for someone else, hand both over and read them back (03/11/2026).
- **Templates, measured 03/11/2026**: `PUT /deals/{id}` ignores `templateStatus`, `templateWhenToUse` and `templateAiBrief` (send them to `PUT /deal-templates/{id}`); `GET /deal-templates/{id}` answers **405** (read one template in the list); a **draft** template's client link still opens for anyone who has it, while it stays out of « New deal » and of the deals list, which makes it the home of a page proposals only link to (terms of carriage, say); a deal created from a template in the app keeps the template's **block ids**.
- **What a deal created from a template inherits, measured 06/11/2026**: the template quotation's `customFields` values and its `validUntil` are copied into each new deal (a value set on a template was in all five deals made from it in the following days). A default (a fuel share, a « rates valid until » date) therefore goes on the template; changing the template later leaves the deals already created as they are. Reps do not see the quotation's `validUntil` in the editor: for a date a rep sets or changes per proposal, create a `Date` custom field (scope `quotation`) and show it in a block.
- **Hot Deal Score reset**: the « Reset score » button of the deal's Analytics (Overview tab) sets `hotDealScoreResetAt` on the deal and brings the score of the deal and its quotes to zero. The visits stay in Analytics and in the visit journal below; from then on the score counts only visits after `hotDealScoreResetAt`. Reset a deal only when none of its visits came from the client: a real visit dropped by a reset never comes back into the score.
- **Deal validity**: `POST /deals` gives the deal a `validUntil` of creation + 30 days. It does not close the client link, but the date is shown. For a link with no end date, `PUT /deals/{id} {"validUntil": null}` right after creation; the quotation's own `validUntil` is set separately on `PUT /quotations/{id}`.
- **Visit journal**: `GET /access-sessions/deals/{id}/sessions` → `items[]` with `startedAt`, `timeSpent` (ms), `deviceType`, plus `meta.total`. One session per opening of the client link, whoever opens it: your own check of the link counts as a visit, so date sessions before reading them as client engagement.
- **Public**: `GET /deals/uuid/{uuid}`, `GET /deals/custom-fields/{uuid}`, `GET /deals/pdf/{uuid}`.

## Quotations

- `GET /quotations` — paginated + `search` + filters. Signature fields: `signed, signDate, signerFirstName/LastName/Email, signedPdfUrl`.
- `POST /quotations` — ⚠️ **bare → 500** (verified): create via `POST /deals?createquotation=1`; a deal's second quotation via `POST /quotations/{id}/clone` then PUT on the clone.
- `PUT /quotations/{id}` — **the main customization point**. Query `?bulk=1` → also updates the lines. Opt: `title, description, customFields, validUntil, sections, discount, discountType(percentage/amount), signed, signerFirstName/LastName/Email, primaryQuotation, noCover, noLogo, legalNoticeText, legalMentionText, logo{id}, cover{id}, status{id}`. `status{id}` moves the quotation alone (resolve the id with `GET /quotation-status`, the one whose `onAction` is `deal-sent` to mark it sent): the deal keeps its own status, `send` stays as it was, nothing else on the quotation changes (checked field by field on 31 quotations, 02/11/2026). ⚠️ `customFields` and `blocks` replace the whole dict/array: read back + merge.
- `GET /quotations/{id}/block-submissions` — what clients entered in html blocks (form answers, files), by block id, decrypted for a key of the account. Each file URL is signed and expires: it changes at every read. `DELETE /quotations/{id}/block-submissions/{blockId}` wipes one block's answers and files.
- **Public**: `GET /quotations/uuid/{quoteUuid}`, `GET /quotations/custom-fields/{quoteUuid}`, `GET /quotations/pdf/{dealUuid}/{quotationUuid}`.

## Quotation Lines

- `GET /quotation-lines/quote/{id}` — all lines of a quotation sorted by `weight` (prefer it to `GET /quotation-lines`).
- `POST /quotation-lines` — **Req**: `quotation{id}, tax{id}, lineType, weight`. Opt: `title, productTitle, description(HTML), quantity(def 1), unitPrice(def 0), coef(def 1), discount(def 0), discountType(def percentage), unitPriceFormula(def null), option(def false), optionSelected(def false), hide, product{id}, productPrice{id}, unity{id}, parent{id}, medias[{id}], customFields, subTotalConfig, blockId (attachment to a V2 pricing block)`.
- **`lineType`** ∈ `normal | title | subtotal` — ❌ `discount`, `product`, `text` do not exist (400). Discounts: a `normal` line with a negative `unitPrice` OR `discount`+`discountType` on a normal line.
- Calculation: `baseTotal = unitPrice × quantity × coef`; `totalHt = baseTotal − discount` (or `× (1 − discount/100)`); `totalTtc = totalHt × (1 + taxRate)`. Totals are recalculated automatically on PUT. A line with `unitPriceFormula` (`{total}`, `{blockTotal}`, `{quotation.<name>}`, `{line.<name>}`, `+ - * / ( )`, `10%`) gets its `unitPrice` recomputed on every save of the quotation; formula lines never count in `{total}`.
- `option: true` → an optional line the client adds or removes from the client view; not selected by default (native "Option not included" badge; French deals: « Option non incluse »), it then stays out of the totals. `optionSelected: true` pre-selects it: counted in the totals, the payment schedule and the signed amount, the client can still untick it. Both are writable on `POST` and `PUT /quotation-lines`. Line image: `medias: [{id}]`; left out on a NEW line with `product{id}`, the product's medias are copied onto it (an explicit list, even `[]`, wins; an existing line is never touched). Inline HTML accepted in `title`.

## Quotation Status

- `GET /quotation-status` — Resp: `id, name, color, onAction`. POST/PUT: `name`(req), `color`, `onAction` ∈ `create | deal-sent | deal-signed | null` (**only one status per value** of onAction).
- **The app shows the quotation status**, on the file page (the pill next to the signature button, with its dropdown) and in the deals list, never the deal status: a house status (« Traité », « À facturer »…) is a **quotation status** (`POST /quotation-status {name, color}`), set on the primary quotation with `PUT /quotations/{id} {status:{id}}`. A deal status created for the same purpose stays invisible in the app (measured 05/11/2026).
- **Writing the deal status resets the primary quotation's status** to the matching one: `PUT /deals/{id} {status:{id: <Signé>}}` wiped a custom status from the quotation (05/11/2026). Keep a custom status on the quotation and leave the deal status alone.
- **`color`**: a Tailwind background class (`bg-sky-200`, `bg-sky-600`, `bg-emerald-400`, `bg-rose-400`) is rendered by the app as a pastel fill with dark text; an unknown class renders no colour; a hex (`#86efac`) is applied as is. The app paints only the badge background: no text or border colour setting.

## Products / Product Prices / Price Categories

- `GET /products` — filters (`filters[active][eq]`, `filters[customFields.category][eq]`). Resp: `id, name, reference, description, unitPriceFormula, active, archived, url, tips, customFields, unity, medias[], prices[]`.
- `POST /products` — **Req**: `name`. Opt: `reference, description, unitPriceFormula(def null; same syntax as a line's, checked on save, copied onto every line created from the product that sends no unitPrice), active(def true), archived, url, tips, customFields, unity{id}, medias[{id}]`.
- `PUT /products/{id}` — `prices:[{id, price, priceCategory{id}}]` updates by `id` only; new prices via `/product-prices`. DELETE a product → deletes its product-prices.
- `POST /product-prices` — **Req**: `priceCategory{id}, product{id}, price`. Opt: `tax{id}`. **Only one price per (product × category)**, otherwise 400.
- `POST /price-categories` — **Req**: `name`. Opt: `byDefault, tax{id}`. Volume tiers = one category named per tier ("0-100", "100-500", "500+"). DELETE → cascades to its product-prices.

## Taxes / Unities

- `GET /taxes` — Resp: `id, name, rate, byDefault`. POST **Req**: `name, rate` — **`rate` is a decimal 0–1**. DELETE → **409** if in use.
- `GET /unities` — Resp: `id, name, byDefault`. POST **Req**: `name` ("Unit", "Month", "Hour", "Kg", "m²"…).

## Templates

- `GET /templates` — query `type` + `filters[type][eq]`. Resp: `id, title, type, content, subject, byDefaultSendDeal`.
- `POST /templates` — **Req**: `title, type(email|notice|cgv), content(HTML)`. Opt: `subject (email), byDefaultSendDeal`. Email variables, in **square brackets**: `[client.firstName]`, `[client.fullName]`, `[client.lastName]`, `[deal.link]` (the link to the page, to place explicitly, on its own line), `[sales.firstName]`, `[sales.fullName]`, `[sales.jobTitle]`, `[company.name]`. The `{{…}}` form of the OpenAPI spec is not substituted.
- `PUT /templates/{id}` — same fields. ⚠️ `byDefaultSendDeal: true` **toggles** the flag (sent on the current default, it clears it); `false` sets false; the flag is exclusive across email templates; and a `POST /templates` clears it on the template that had it. Write contents with `false`, then one flag-only PUT on the default, last, only when it reads false.
- Signature confirmations: `PUT /companies/{id} {dealSettings}` with the whole object — `{confirm_mail_owner, confirm_mail_client (bool), confirm_mail_owner_template, confirm_mail_client_template (email template id | false), add_attachment_owner, add_attachment_client (bool), enableCalendarView, calendar_start_field, calendar_end_field}`. Read, merge, write; not exposed on the connector's `update_company`.

## Sharing (V2)

- Sharing a V2 quote goes through the default selling page (`/quotations/deal/{deal.uid}`) and through the quotation's `shareLinks` (filtered view of the blocks).

## Medias

- `POST /medias` — **Req**: `name, mime, folder` + `file` (base64 data URI) **or** `fromUrl`. MIME: `image/jpeg|png|gif|webp|svg+xml`, `application/pdf`. `fromUrl`: public http(s) URL only (private, loopback and link-local addresses refused, redirects included), at most 20 MB; a failed download answers **400** `Could not import fromUrl: <reason>` → download the file yourself and send it base64 as `file` (connector: `create_media`; there is **no `upload_media`** tool, nothing base64-encodes for you). Limit ~4 MB. 🚫 The base64 stops there: the quote's HTML references the media **url**, never a `data:` URI.
- `GET|PUT|DELETE /medias/{id}` — DELETE breaks references.

## Users / User Groups / Filter Views / Pins

- `GET /users/me` — profile of the key + its `company` (`apiKey` is exposed here: **always mask it**; the connector's `get_current_user` replaces it with a placeholder). `GET /users`, `POST /users` (admin: `email, password` req), `PUT /users/{id}` (`language, firstName, lastName, jobTitle, active`…). DELETE user **400 if they own ≥ 1 deal** (reassign or `active:false`).
- `/user-groups` — `name`, `permissions[]`.
- `/filter-views` — saved views (scope `deals|customers|quotations|products`).
- `/pins` + `/comments/{uuid}` — pinned comments (offsetX/Y, zoneId). Public: `GET /pins/quotation/{quotationUuid}`. Deleting the **last** comment of a pin deletes the pin.

## Company skill (Settings › AI)

- `GET /company-skills` · `POST /company-skills {name, description, content}` · `PUT /company-skills/{id}` (the same three fields; `content` is Markdown). The account's own skill: how this company builds a proposal. The in-app AI reads it, and so does every AI on the connector, where it is listed beside the public skills as `skill://company/<name>/SKILL.md` (Claude and ChatGPT, checked 03/11/2026). Read it back after a write.

## Block library

- `GET /block-library` — the library: its « Blocks » template (deal and quotation), its categories and blocks. `POST /block-library/categories {name}`. `POST /block-library/from-quotation/{quotationId} {blockId, name, categoryId}` saves a block of a quotation to the library; a **pricing** block is refused (03/11/2026).

## Webhooks (not in openapi.yaml)

- `GET /webhooks` — verified live on 2026-07-23 (200, `{data, meta}`). POST/PUT/DELETE inferred from REST conventions (contract undocumented: on a 400, read the error message for the exact fields).
- In the app: Settings › Tool Integrations, which also shows the account's **API token**. Each webhook has a name, a URL and its events: Deal Created / Updated / Deleted / Signed / Status Changed, Quotation Created / Updated / Deleted / Signed / Status Changed, Customer Company Created / Updated / Deleted, Customer Created / Updated / Deleted, Product Created / Updated / Deleted, Access Session Created. In the API the events read `quotation.signed`, `quotation.status_changed`, `accesssession.created` (live on 03/11/2026).
- **Someone must know when a client signs** (finance, operations): Duodeal emails the deal owner only. « Quotation Signed » to an automation tool (Make, Zapier, Power Automate), which reads the deal and the quotation through the API and emails whoever needs it, is the route.
