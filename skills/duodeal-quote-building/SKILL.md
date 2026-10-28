---
name: duodeal-quote-building
description: End-to-end flow for building a Duodeal quote from A to Z with the duodeal MCP tools — tenant setup, customer, deal + quotation, lines (sections, discounts, options), branding, T&Cs / legal notice, links to deliver. Use whenever you need to create, duplicate or deliver a Duodeal quote or selling page, start from a template, clone a deal, add a second quotation, or set up a product catalog.
---

# Build a Duodeal quote from A to Z

> 🔄 **Are these skills current?** Read through the Duodeal connector (`get_duodeal_skill`),
> they are: the server always serves the latest version, so skip this check. Only a **copy**
> installed locally can be stale (nothing refreshes it on its own): then read the line `Skills Duodeal : mises à jour
> le …` in `DUODEAL-CONTEXT.md` (project root): **absent, or more than 7 days old → offer
> the refresh in one sentence before working**. Procedure: [../duodeal-onboarding/references/updating-skills.md](../duodeal-onboarding/references/updating-skills.md). Ask **once per session**;
> if the user declines, work with what is installed and drop it.


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
2. Collect the ids **of THIS tenant** before any line: taxes and units (`list_taxes`, `list_unities`), the quotation statuses (`list_quotation_statuses` — you need the Draft id for step 7) and the price categories (`list_price_categories` — the default one for step 7, all of them if there is a catalog). Never reuse the ids of another account (cause #1 of 400s). Rates come back as decimals (0.20 = 20 %).

## 1. Full from-scratch flow

```
1. Know the tenant                  (get_current_user)
2. Hold this tenant's ids           (list_taxes, list_unities,
                                     list_quotation_statuses, list_price_categories)
3. Have the client organization     (create_customer_company {name})
4. Have the contact                 (create_customer {customer_company_id,
                                     first_name, last_name, email})
5. Have the deal                    (create_deal {name, customer_id})
6. Have ONE quotation on that deal  (list_quotations {deal_id} to see what exists,
                                     create_quotation {deal_id, title, valid_until}
                                     if there is none — never assume one was
                                     auto-created)
7. Refine the quotation             (update_quotation {id, title, valid_until,
                                     status_id, price_category_id, customFields}: a
                                     created quotation is born with NO status and no
                                     price category, and a null status reads as
                                     broken). The first quotation of a deal is made
                                     primary by the server: check it once (§5)
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
- **The FIRST `title` line also carries the print rule**, so the PDF exports in A4 with margins
  instead of US Letter: prepend the `<style>` from **duodeal-mcp-best-practices** → PDF export to
  that line's `title` when you create it, then check the export's page size before delivering.
- **Discounts**: a `normal` line with a negative `unitPrice`, OR `discount` + `discountType`
  (`percentage`/`amount`) on the line — `lineType: "discount"` does not exist.
- `option: true` → "Option not included" badge (French deals: « Option non incluse »), excluded from the total.
- **A price that follows the rest of the quote** (a deployment or setup fee equal to one month of
  the contract, a 10 % project-management fee): set `unitPriceFormula` on the line instead of
  computing `unitPrice` yourself — `"{total}"` or `"10% * {total}"`. The API recomputes the price
  on every change (quantities, discounts, lines added or removed, options the client takes);
  `{total}` = the other counted lines of the visible price tables, after line discounts and
  before the table discount, `{blockTotal}` = the same for the line's own table,
  `{quotation.<name>}` / `{line.<name>}` = a Number custom field of the quote / of the line
  (empty = 0), e.g. `"{line.seats} * 150"`. Formula lines never count in those bases. Read the
  result back in `unitPrice`; `""` returns to a fixed price. A **catalog product** can carry
  the formula itself (`unitPriceFormula` on `create_product` / `update_product`): a line added
  with its `product_id` and no `unitPrice` then gets the formula and is priced at once — prefer
  that when the same fee comes back on every deal (e.g. Trading Central's Deployment Fees).
- **When the sender's loudest promise is transparency** ("no hidden fees"), the price table IS the
  demonstration: quote in the unit THEY publish (43/week × 52 on one row, so the reader can divide),
  and give every included service a real row at **0.00** — a number can be audited, an adjective
  cannot. Confirm each zero line with the user: a 0.00 row is a deliberate gift, not an oversight.
- **An image on EVERY product line** (blocking checklist item of **duodeal-quote-design**), on
  the media of the LINE, square and centered on the subject. A line created with `product_id`
  **gets the catalog product's photos by itself** (unless you pass `media_ids`): check them with
  `list_quotation_lines`. For a line without a product, or to change the photos, pass
  `media_ids` (array of media ids, in order; `[]` clears them) on `create_quotation_line`,
  `update_quotation_line` or each line of `add_quotation_lines`. Store the file first if it is
  not in the library (⚠️ reuse an existing media first (`list_medias`); `file` in **base64 is the normal, supported route** for the upload itself. ⚠️ What is forbidden is base64 **inside the HTML**: reference the url the media returns, never a `data:` URI (see **duodeal-mcp-best-practices** → images); `create_media {name, folder, file}`, **never `from_url`**, it 500s on most CDNs).
  The product tools still take no media (`url` on a product is an external link, not an image).
  Say which route you took.
- V2 quotes (blocks): pass the pricing block's `blockId` (camelCase, inside the line) so the
  line lands in the right table — see the **duodeal-v2-blocks** skill.

### Quotation branding

- Get the logo / cover **stored** (⚠️ reuse an existing media first (`list_medias`); `file` in **base64 is the normal, supported route** for the upload itself. ⚠️ What is forbidden is base64 **inside the HTML**: reference the url the media returns, never a `data:` URI (see **duodeal-mcp-best-practices** → images); `create_media {name, folder, file}`, never `from_url`) and then **shown**:
  `update_quotation` has **no `logo` / `cover` argument** on the connector → put the media in
  the native `header` block (`update_quotation_block` with the **complete** `data`), or set it
  via REST / the interface.
- `noLogo` / `noCover: true` only if there is NOTHING to show (otherwise conflict) — they are
  `header` block fields, sent inside its `data`, not quotation arguments.

## 2. Start from an existing reference quote (recommended when one exists)

```
1. Identify the reference deal      (a template is NOT in list_deals — templates live in
                                     the Template library, /app/templates: ask the user
                                     which template or deal is the reference, and its
                                     id or URL; get_deal reads a published template.
                                     A plain reference deal: list_deals {search: "..."},
                                     confirm with the user and re-check what you got)
2. Read the source completely       (get_deal, get_quotation → blocks[] with every id
                                     and type, list_quotation_lines, then again with
                                     line_ids = every id: the plain listing gives
                                     long descriptions as a preview only)
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

**Templates are guarded.** Everyone sees and uses the published ones, but creating, editing or
deleting a template takes the template permissions of the user's role (Administrator by
default): without them every write on the template, its quotes or its lines answers **403**.
Never edit the template itself to build a client's quote: rebuild on a new deal (step 3).

⚠️ **A clone inherits the identity of its source.** The owner avatar, the quotation title (the
YEAR!), gallery media and custom fields all travel with the copy. Audit them before showing a
clone-based build: a photo of someone else is worse than no photo, and a rep's verdict on an
inherited avatar was "the sales contact is completely wrong". Delivery test: *would this page
embarrass the client if they sent it tomorrow, unedited, to a real customer of theirs?* A demo
mailbox address or the wrong person's face fails it instantly.

**2nd quotation on an existing deal**: there is no `clone_quotation`. Create it
(`create_quotation {deal_id}` — `deal_id` is required, a REST `POST /quotations` without a
deal fails 500), then copy the content block by block and re-run `add_quotation_lines` with the lines read in full
(`list_quotation_lines` with `line_ids`: the plain listing only previews long descriptions), then
`update_quotation` on the new one (`title`…). The **primary** flag is not settable through the
connector, and every quotation you create is born without it — see §5 before delivering.

## 3. Product catalog (if requested)

```
Have the price tiers      (create_price_category {name, by_default} — 1 category per
                           volume tier; list_price_categories first, do not recreate)
Have the product record   (create_product {name, reference, description, ...})
Have its price            (create_product_price {product_id, price_category_id,
                           tax_id, price} — the four are required, only 1 price per
                           product × category pair; delete_product_price is a HARD delete)
```

Then bind them to the lines: `product_id` on the line, and leave out what the catalog should
fill. A new line created with `product_id` takes, for every field it does not send, the
product's name (`productTitle`), `description`, photos and unit, and the price of the
quotation's price category with that price's tax (linked as `productPrice`). Send a field only
to override it (a negotiated `unitPrice`, a shorter title). No price in the quotation's category
→ the price stays 0: check `list_product_prices` and set `unitPrice` yourself.

**Adding a product the user names** ("add a projector"): look it up in the catalog first, even
when the catalog is not mentioned — `list_products {search: "<key words>"}` (name, reference and
description; trashed products left out). One clear match → a catalog line as above. Several →
ask which one, listing the candidates. None → say so and ask before typing a free line, or
create the product first.

## 4. Custom fields (structured data)

1. Have the **definition** (`list_custom_fields` first, then `create_custom_field {name, type, scope}` — the three are required on create, `label` recommended; scope = deal / customer / product / quotation).
2. Have the **value** on the quotation (`update_quotation {id, customFields: {key: value}}`, key = the field **name**). Read the current dict first and resend it merged: a partial `customFields` can overwrite the rest. For a large text value use `replace_quotation_custom_field {quotation_id, field, search+replace}` instead of rewriting everything.
3. Display it in the quote: via the V2 **`customfields`** block (list of CF names) — see **duodeal-v2-blocks**.

## 5. Delivery — always the 2 links

**Primary quotation — check it once before delivering (§1 and §2 alike).** Since 17 Sep 2026
the server keeps one primary quotation per deal: the first quotation created on a deal, through the connector, REST, a clone or the app, is made primary automatically, and an additional one is not. The app's deals table lists deals **through their primary
quotation** (status, amount, Hot Deal Score and number all come from it), so a deal without one
would be **missing from the table**.

1. Read `get_deal {id}` → `quotations[].primaryQuotation`: exactly one quotation of the deal says `true`.
   (`primaryQuotationId` alone proves nothing: read the flags.)
2. None says `true`: that is now a server bug. Tell the user before delivering and report it to Duodeal;
   with a REST key already configured, `PUT /quotations/{id} {"primaryQuotation": true}` unblocks the deal.
3. A deal with several quotations (§2) where ANOTHER one must be primary: ask the user first. The
   connector has no argument for it: REST `PUT /quotations/{id} {"primaryQuotation": true}` if a key is
   already configured (the server then demotes the previous one), otherwise in the Duodeal interface.

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

## 5bis. Take the deal out of `Draft` when you hand it over

A deal created through the API is born `Draft` and stays there. `Draft` should mean **not yet sent
out**: when it also holds everything already delivered, the rep's pile stops meaning anything.
So at handoff — whether the rep sends the quote as is or edits it first — move **the deal AND its
quotation** to the `deal-sent` status:

- Status ids are **per company**: resolve them (`list_deal_statuses`, `list_quotation_statuses`,
  take the one whose `onAction == "deal-sent"`), never hard-code an id seen on another account.
- Deal and quotation: `update_deal {id, status_id}` / `update_quotation {id, status_id}`.
  ⚠️ If you go through REST on the deal instead, **resend `users`** (see
  **duodeal-mcp-best-practices** → sender identity).
- ⚠️ The quotation also carries a **`send: true`** boolean, and the status alone leaves it in the
  "to be sent" view. **`send` is not a connector argument**: set it by REST
  (`PUT /quotations/{id} {"send": true}`) only if a key is already configured, otherwise hand that
  step to the user in the interface and say it is pending.
- Deliberately left in `Draft`: internal templates, technical drafts, test fixtures, and any quote
  nobody could send as it stands.

## 6. Final check

- Re-read the quote from the server (`get_quotation {id}` — carries `blocks[]` and `shareLinks`).
- Check order (`weight`), totals and options on the price table (`list_quotation_lines {quotation_id}`).
- A quote is only "done" after a real visual check. **No connector tool renders the page or a
  block preview** — if you cannot look yourself, say so and ask the user to look. Never claim a
  render you have not seen.
- ⚠️ **Opening the client link is recorded as a prospect visit.** The client view posts a `visit`
  on load and a `heartbeat` every 15 s to `/api/access-sessions` (browser `fetch`; a plain
  server-side GET counts nothing). Your own check then reads as a highly engaged buyer and inflates
  the Hot Deal Score of the very deal whose re-opens drive the follow-up. There is no internal-view
  opt-out today. Verify on the **edit link** and the **PDF export** wherever they can show it, and
  **ask the user before opening the client view**; if you open it, say so in your delivery.

## T&Cs / legal notice / email templates

**No template tool on the connector** (no `ensure_template`, no `list_templates`): reusable
T&Cs, legal notices and email templates are created in the Duodeal interface (Settings), then
read back on the quotation. On the quote itself, the legal text goes in the native
`legalnotice` block (`add_quotation_block {type: "legalnotice"}` then
`update_quotation_block` with the **complete** `data`) — `update_quotation` has no
`legalNoticeText` argument. Variables in email templates are written in **square brackets**:
`[client.firstName]`, `[client.fullName]`, `[client.lastName]`, `[deal.link]`,
`[sales.firstName]`, `[sales.fullName]`, `[sales.jobTitle]`, `[company.name]` (measured on the
platform's own default template; the `{{…}}` form found in older docs is **not** substituted).
The link to the page is not added by itself: place `[deal.link]` on its own line. Email templates
carry `subject` + `byDefaultSendDeal` and are set up in the interface only. If a REST key is already
configured, that write can go through `X-API-KEY`; otherwise hand the step to the user and
flag it as pending. Never invent a T&C or a legal notice the client did not provide.
