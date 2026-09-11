# `DuoDeal` field map

What is actually inside `DuoDeal.deal`, `.quotation` and `.lines[]`. These are the **real
entities** (41 / 44 / 27 fields), not a curated view: what is listed below is what is worth
using. Anything not listed exists but is internal plumbing or unstable — read
`Object.keys(DuoDeal.deal)` in the builder preview to explore, never to display.

## `DuoDeal.deal`

| Field | Type | Notes |
|---|---|---|
| `name` | string | The deal's title. ⚠️ see the warning below |
| `number` | string | Human-readable reference |
| `date` | ISO string | Deal date |
| `language` | string | `"fr"`, `"en"`… the client's language |
| `customer` | object or null | The contact: `civility`, `firstName`, `lastName`, `fullName`, `email`, `jobTitle`, `customFields`, and `billingAddress` = `address`, `postCode`, `city`, `state`, `country` |
| `customerCompanyName` | string or null | Client company name |
| `contactFullName` | string or null | Ready-made display name |
| `customFields` | object | Deal custom fields, keyed by field name |
| `company` | object | **Your own** company (name, logo, legal info) — not the client's |

> ⚠️ **`name` or `title`?** The reference documentation lists the field as `name` but its own
> first example reads `DuoDeal.deal?.title`. Not arbitrated. Write
> `DuoDeal.deal.name || DuoDeal.deal.title || ''` when the deal's title matters, or check
> `Object.keys(DuoDeal.deal)` in the builder preview on the actual quote.

## `DuoDeal.quotation`

| Field | Type | Notes |
|---|---|---|
| `title` | string or null | The quote's title |
| `number` | string | Quote reference, e.g. `"DEVIS-2026-0206"` |
| `amountHt` | number | **Total excl. tax, already computed** — prefer it to summing lines |
| `amountTtc` / `taxAmount` | number | Total incl. tax, and the tax total |
| `discount` / `discountType` | number / string | Global discount, `"percentage"` or `"amount"` |
| `validUntil` | ISO string or null | Quote expiry |
| `signed` / `signDate` | boolean / ISO string | Whether the client signed, and when |
| `signerFirstName` / `signerLastName` / `signerEmail` | string or null | Who signed |
| `status` | object | `id`, `name`, `color` |
| `customFields` | object | Quotation custom fields (same as `DuoDeal.customFields`) |

## `DuoDeal.lines[]` (= `quotation.quotationLines`)

| Field | Type | Notes |
|---|---|---|
| `lineType` | string | **`"normal"`, `"title"` or `"subtotal"`** — only `normal` lines are priced items |
| `title` | string or null | ⚠️ **contains HTML markup**, not plain text |
| `productTitle` | string or null | Plain product name; often null on free-form lines |
| `description` | string or null | ⚠️ also HTML markup |
| `quantity` / `unitPrice` | number | Unit price is excl. tax |
| `totalHt` / `totalTtc` | number | Line totals; `0` on `title` and `subtotal` lines |
| `discount` / `discountType` | number / string | Per-line discount |
| `option` / `optionSelected` | boolean | An option the client may take, and whether they took it |
| `hide` | boolean | Hidden line — **never display it** |
| `tax` | object | `id`, `name`, `rate` — the rate is a **ratio** (`0.2` = 20 %) |
| `unity` | object or null | `id`, `name`, e.g. "Days" |
| `customFields` | object | Per-line custom fields |

## Never displayed

| Entity | Fields |
|---|---|
| line | `coef`, `weight`, `product`, `productPrice` (purchase cost, margins, supplier) |
| deal | `opportunityAmountHt`, `hotDealScore1`, `hotdealScore2`, `autoSave`, `archived`, `dealViewLinks`, internal-only custom fields |
| quotation | `blocks`, `config`, `groupId`, `hide`, `builderVersion` |

A block renders on the page the client reads. Print what they are meant to see — prices,
quantities, their own information — and nothing else.
