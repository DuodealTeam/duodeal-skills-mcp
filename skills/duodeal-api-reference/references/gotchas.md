# Gotchas, recurring errors and business rules

## Recurring errors and fixes

| Symptom | Cause | Fix |
|---|---|---|
| 401 Unauthorized | `X-API-KEY` empty or prefixed (`Bearer …`) | Send the bare UUID, then confirm which account is acting (connector: `get_current_user`, returns the user and its company) |
| 400 on a quotation line | the `tax_id` / `unity_id` does not exist on THIS tenant | Read the tenant's own ids and use those (connector: `list_taxes`, `list_unities`); never copy ids from another account |
| 400 on a discount line | `lineType:"discount"` does not exist | Book the discount as `lineType:"normal"` with a negative `unitPrice`, **or** as `discount` + `discountType` on the line |
| 400 on a tax | `rate` outside [0,1] | Express the rate as a decimal (0.20, not 20) |
| 409 when deleting a tax | the tax is still used by lines or products | Keep it and reassign what uses it. Not available to the connector anyway (only `list_taxes`, no create/delete): change taxes in the Duodeal interface (Settings), then re-read with `list_taxes` |
| 500 creating a media from a URL | the source CDN refused the server-side fetch (Cloudinary, Shopify, S3…) | Do not retry `from_url`. Prefer an upload in the Duodeal interface; base64 `file` only as a fallback |
| 500 creating a media from base64 | file over ~4 MB | Supply a lighter image — nothing resizes it for you |
| The AI call itself fails, stalls or truncates while uploading an image | the **base64** string passes through the tool arguments: one image = hundreds of thousands of tokens | Do not send the file through the conversation at all: have it uploaded from the Duodeal interface, or reuse an existing media |
| Media created but broken, blank or not rendering | known weakness of the **base64** upload route | Do not loop on it: have the file dropped into the media library from the Duodeal interface, then re-point the block to the new url. Tell the user why |
| 500 creating a quotation on its own | a quotation cannot exist without a deal | Create the deal first, then the quotation on it (connector: `create_deal` → `create_quotation(deal_id=…)`). No `clone_deal` / `clone_quotation` on the connector: rebuild the content, or duplicate in the interface and read it back with `get_quotation` |
| Tenant logo ignored | a data URI was sent instead of RAW base64 PNG | Send RAW base64 PNG in `setLogo`. Not available to the connector (`update_company` has no `setLogo`): REST `PUT /companies/{id}` if a key is already configured, otherwise do it in the Duodeal interface and tell the user |
| Empty list from a read | the `{data:[]}` envelope was not unwrapped | Connector tools already normalize it (`data/items/results/records/rows`); only raw REST calls need unwrapping |
| A filter has no effect | filter written in the wrong form for the transport | On the connector, pass the tool's own named arguments (`status_id`, `owner_id`, `date_from`, `search`…); over REST, `filters[field][op]=value` |

## Deletion rules / dependencies

The connector hard-deletes only lines, blocks, product prices and comments (`delete_quotation_line`, `delete_quotation_block`, `delete_product_price`, `delete_comment`); everything else is archive-only (`archived: true`, and a deal has not even that). Any other deletion goes through REST with an already configured key, or through the Duodeal interface — say which one you are using. The dependency rules below hold whatever the transport.

- `isDeletable`: a customer-company is deletable **if no customer is linked**; a customer **if no deal is linked**.
- A user cannot be deleted if they **own a deal** (reassign / `active:false`).
- A tax cannot be deleted if it is **in use** (409).
- Cascades: price-category → its product-prices; product → its product-prices; the last comment of a pin → deletes the pin.
- A deal **with no quotation** = invisible in the list.
- Deleting a media breaks the references that point at it (products, quotes) — and there is no `delete_media` on the connector: interface or REST only.

## Media — image upload

1. **Get the image into the library**, in this order: **(a)** reuse an existing media (`list_medias`, `search`); **(b)** have it uploaded in the **Duodeal interface** (media library, drag and drop) and reference the url — the preferred route; **(c)** `create_media` with `file` in base64 — it works, but it is a **fallback** that breaks at both ends: known bugs on Duodeal (media that ends up broken or does not render), **and** a failure of the AI call itself, since the base64 string travels through the tool arguments (one image = hundreds of thousands of tokens, context saturated, call truncated). When you take it, tell the user and check the render before delivering. **Download the file yourself** (browser UA), check the MIME type and the size, base64-encode it and send it as `file` — nothing does those steps for you (`name` + `folder` both required, no local path, no multipart, no `upload_media` tool). ⚠️ **(d) Never the URL import**, even though the connector's own description says `from_url` is preferred: `from_url` / `fromUrl` returns a 500 on most CDNs (Cloudinary, Shopify, S3…).
2. Limit ~**4 MB**; beyond that the API returns 500. No automatic resizing anywhere: supply a lighter image.
3. Accepted MIME types: png, jpeg, gif, webp, svg+xml, pdf.

## Logo / Cover — 2 distinct paths

- **Per-quotation** (what shows on the selling page): upload the image (connector: `create_media`), then bind it as the quotation `logo` — same for `cover`. The binding is **not available to the connector** (`update_quotation` has no `logo` / `cover`): REST `PUT /quotations/{id}` with `{logo: {id}}` if a key is already configured, otherwise set it in the Duodeal interface and say so. `noLogo`/`noCover` rule: set them to `true` only if there is NOTHING to show, otherwise conflict (neither logo nor cover displayed).
- **Tenant** (Settings → Company): the image must be **RAW base64 PNG** in `setLogo`/`setCover` (a data URI is silently ignored), and `"setLogo": "remove"` deletes it. **No connector tool for this** (`update_company` has no `setLogo`/`setCover`): REST `PUT /companies/{id}` with an already configured key, or the Duodeal interface. **Never overwrite existing branding**: check first, set only if absent.

## Custom fields (data)

- Custom fields carry structured **data**; in V2 they are displayed through the `customfields` block (a list of CF names), not through the legacy view. Read the definitions before writing values, and create the missing ones first (connector: `list_custom_fields`, `get_custom_field`, `create_custom_field` — `name`, `type` and `scope` all required on create).
- Patch the values on a quotation with the CF **name** as key, never the id (connector: `customFields` on `update_quotation`). ⚠️ **Nothing re-reads or merges for you**: read the current dict (`get_quotation`), merge in memory, send it **complete** — a partial `customFields` wipes the rest. For a long text value, edit it in place instead of resending the whole field (connector: `replace_quotation_custom_field`, dot-path such as `"html.html"`, short unique anchors). ⚠️ Over raw REST, `PUT /quotations` `customFields` **replaces the whole dict** — read, merge, then write.

## Security / hygiene

- API keys: read from files (`<tenant>_api_key`, `.secrets/`), never displayed, never logged, never in another project's `.env`.
- Writes: test/demo account only — never a real client tenant without an explicit request.
- Never overwrite existing tenant settings (logo, banner…): set them only if absent.
- Mass actions (all templates, all deals…): never without explicit validation of the scope.
