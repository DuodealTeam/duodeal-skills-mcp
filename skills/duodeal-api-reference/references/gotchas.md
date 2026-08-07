# Gotchas, recurring errors and business rules

## Recurring errors and fixes

| Symptom | Cause | Fix |
|---|---|---|
| 401 Unauthorized | `X-API-KEY` empty / prefixed | the UUID only; check `connection_status` |
| 400 quotation-line | `tax.id`/`unity.id` does not exist on THIS tenant | `list_taxes` / `list_unities`, then use the real ids |
| 400 discount line | `lineType:"discount"` does not exist | `lineType:"normal"` + negative `unitPrice` **or** `discount`/`discountType` |
| 400 tax | `rate` outside [0,1] | decimal (0.20, not 20) |
| 409 DELETE tax | tax in use | do not delete / reassign |
| 500 `/medias` fromUrl | CDN rejected | base64 (`upload_media` tool) |
| 500 `/medias` base64 | file > 4 MB | supply a lighter image |
| 500 `POST /quotations` | bare creation not supported | `create_deal` (createQuotation) or `clone_quotation` |
| Tenant logo ignored | data URI instead of raw PNG | `PUT /companies/{id}` with `setLogo` = RAW base64 PNG |
| Empty list from a GET | `{data:[]}` response not unwrapped | the MCP tools normalize it (`data/items/results/records/rows`) |
| Filter has no effect | syntax | `filters[champ][op]=valeur` |

## Deletion rules / dependencies

- `isDeletable`: a customer-company is deletable **if no customer is linked**; a customer **if no deal is linked**.
- A user cannot be deleted if they **own a deal** (reassign / `active:false`).
- A tax cannot be deleted if it is **in use** (409).
- Cascades: price-category → its product-prices; product → its product-prices; the last comment of a pin → deletes the pin.
- A deal **with no quotation** = invisible in the list.
- DELETE `/medias/{id}` breaks existing references (products/quotes).

## Media — image upload

1. **Never `fromUrl`** (500 on Cloudinary, Shopify, S3…) — download the file, then post it as a base64 data URI (the `upload_media` tool does everything: download with a browser UA, MIME detection, 4 MB check).
2. Limit ~**4 MB**; beyond that the API returns 500. No automatic resizing in the plugin: supply a lighter image.
3. Accepted MIME types: png, jpeg, gif, webp, svg+xml, pdf.

## Logo / Cover — 2 distinct paths

- **Per-quotation** (displayed on the selling page): `upload_media` → `update_quotation {logo: {id}}` (same for `cover`). `noLogo`/`noCover` rule: set them to `true` only if there is NOTHING to show, otherwise conflict (neither logo nor cover displayed).
- **Tenant** (Settings → Company): `PUT /companies/{id}` with `setLogo`/`setCover` as **RAW base64 PNG** (a data URI is silently ignored). `"setLogo": "remove"` deletes it. **Never overwrite existing branding**: check first, set only if absent.

## Custom fields (data)

- Custom fields carry structured **data**; in V2 they are displayed through the `customfields` block (a list of CF names), not through the legacy view.
- Patch the values on a quotation: `update_quotation {customFields: {key: value}}` — the key is the CF **name** (not the id); the tool merges automatically.

## Security / hygiene

- API keys: read from files (`<tenant>_api_key`, `.secrets/`), never displayed, never logged, never in another project's `.env`.
- Writes: test/demo account only — never a real client tenant without an explicit request.
- Never overwrite existing tenant settings (logo, banner…): set them only if absent.
- Mass actions (all templates, all deals…): never without explicit validation of the scope.
