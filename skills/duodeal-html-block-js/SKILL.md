---
name: duodeal-html-block-js
description: The window.DuoDeal JavaScript API available inside an html block of a Duodeal V2 quote — read the deal, quotation, lines and custom fields, keep your own state persisted per block, collect answers from the client (forms, choices), let the client attach files, format currency and dates, react to live edits with onUpdate. Use whenever a block has to READ live quote data, COLLECT or STORE data from the client, hold a form, a questionnaire, an onboarding journey, a configurator or a file upload, whenever the user asks to "get data from the client", "recover data", "save the answers", "a form in the quote", "upload a document", or when a block's saved answers, their encryption, or where the sales rep reads them comes up.
---

# `window.DuoDeal` — the JS API of html blocks

> 🔄 **Are these skills current?** They are a **copy** taken from the public repo — there is
> no git remote behind them and nothing refreshes them on its own, so an install silently
> stays on the version of the day it was made. Read the line `Skills Duodeal : mises à jour
> le …` in `DUODEAL-CONTEXT.md` (project root): **absent, or more than 7 days old → offer
> the refresh in one sentence before working**. Procedure: [../duodeal-onboarding/references/updating-skills.md](../duodeal-onboarding/references/updating-skills.md). Ask **once per session**;
> if the user declines, work with what is installed and drop it.



An `html` block runs inside a **sandboxed iframe**, and Duodeal injects one global into it:
**`window.DuoDeal`** (or plain `DuoDeal`). Nothing to import, nothing to initialise — it is
there as soon as the block loads. It is the single entry point for **reading the quote**,
**storing your own data**, and **receiving files from the client**.

```html
<div id="app"></div>
<script>
  console.log(DuoDeal.quotation.amountHt);
</script>
```

Source: internal reference `app/components/quotation-v2/html/duodealBridge.js`, documented
in the Notion page "Duodeal JavaScript API — HTML Block" (last updated 2026-09-07).

**Sandbox:** `allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox
allow-downloads`. Scripts, forms, `target="_blank"` and downloads work. There is **no
access to the parent page, no cookies, no `localStorage`** — `localStorage` is not merely
discouraged here, it is unavailable. To keep anything, use the state API (§3). The frame also
carries **no `allow` attribute**: the async clipboard API is refused, see §6 for copy buttons.

For everything else about blocks (types, ordering, writing them through the connector, the
shallow-merge trap), see **duodeal-v2-blocks**. For the look of a block, see
**duodeal-quote-design** — its inline-first rule still applies: styling stays in
`style="…"`, and **the script goes at the END of the block, after the markup**, never
before the first element (the visual editor deletes everything that precedes it).

## 1. The four contexts — the one thing that breaks blocks

The same block is rendered in four places and they do **not** behave alike.

| Context | Quote data | State writes | File uploads | `onUpdate` |
|---|---|---|---|---|
| Builder, **edit** mode | yes | yes → the block's **template** | no | yes |
| Builder, **client preview** | yes | **no** (nothing is saved) | **no** | yes |
| **Client page** (the real one) | yes | yes → the **client's** record | yes | yes |
| **PDF render** | yes | **no** (no-ops) | **no** | **never fires** |

Two consequences to design for, not to discover later:

1. **The block must render correctly from `state` alone.** In the PDF there is no
   interaction and no `onUpdate`: what you draw at load is what gets printed. Call
   `render()` once at startup, not only from event handlers. A block that only paints
   itself inside a `change` handler prints **empty**.
2. **Test a file field from the client link**, never from the builder preview — there,
   `uploadFile()` rejects by design ("files cannot be attached from this view").

## 2. Reading the quote (read-only)

`DuoDeal.deal` · `DuoDeal.quotation` · `DuoDeal.lines` (= `quotation.quotationLines`) ·
`DuoDeal.customFields` (the quotation's, key → value).

These are **JSON clones**. Assigning to them (`DuoDeal.deal.name = "…"`) changes nothing on
the Duodeal side. To store, go through §3.

The full field maps (41 fields on the deal, 44 on the quotation, 27 on a line) are in
**[references/field-map.md](references/field-map.md)** — read it before naming a field.
The four that matter most often:

- `DuoDeal.quotation.amountHt` — **total excl. tax, already computed.** Prefer it to
  summing lines: it already accounts for hidden lines, unselected options, per-line and
  global discounts.
- `DuoDeal.deal.customer` — the contact (`fullName`, `email`, `billingAddress`…).
- `line.productTitle` — the **plain** product name. `line.title` and `line.description`
  hold **HTML markup**: in `textContent` the client sees the tags, in `innerHTML` you
  execute whatever they contain. Either strip them, or insert them knowingly.
- `line.lineType` — `"normal"`, `"title"` or `"subtotal"`. Only `normal` lines are priced.

### The rule for which lines count

Apply the server's own rule, or your block will display a total that contradicts the quote:

```javascript
function counts(line) {
  if (line.hide) return false;                 // hidden line
  if (line.option) return line.optionSelected; // option: only if the client took it
  return true;
}
```

Sum lines **only** when you need a subset (one section, one category). For a plain total,
read `quotation.amountHt`.

### 🚫 Fields you must never show the client

`DuoDeal` exposes the **raw** entities, internal plumbing included, and the block renders on
the page your client reads. Hard rule:

- on a line: `coef`, `weight`, `product`, `productPrice` — purchase cost, margin
  coefficients, supplier data;
- on the deal: `opportunityAmountHt`, `hotDealScore1`, `hotdealScore2`, `autoSave`,
  `archived`, `dealViewLinks`, and any internal-only custom field;
- on the quotation: `blocks`, `config`, `groupId`, `hide`, `builderVersion`.

Render prices, quantities and the client's own information. When in doubt, leave it out.
Never loop over `Object.keys(...)` to print "everything" — that is exactly how a margin
coefficient reaches a buyer.

### `onUpdate` — following live edits

While the quote is being edited (a line added, a price changed), Duodeal **pushes the new
data into the iframe without reloading it**: `deal`, `quotation`, `lines`, `customFields`
are refreshed in place and your form fields are not lost.

```javascript
function render() { /* paint from DuoDeal.* and DuoDeal.get(...) */ }
render();                 // ← at load: this is the one the PDF gets
DuoDeal.onUpdate(render); // ← on every business-data update
```

The callback receives `DuoDeal` as its argument. It **never fires in the PDF**.

## 3. Your own data: the state

Besides the read-only quote, `DuoDeal` gives each block a **free-form storage space** for
your own values — form answers, a choice, a step counter — under whatever keys you like.

| Method | Purpose |
|---|---|
| `DuoDeal.get(key)` | Read one value. |
| `DuoDeal.set(key, value)` | Write one value **and persist immediately**. |
| `DuoDeal.update(obj)` | Merge several keys **and persist**. Also takes `state => ({…})`. |
| `DuoDeal.getData()` | A **copy** of the whole state (always an object, even when empty). |
| `DuoDeal.setData(obj)` | **Replace** the whole state and persist. |

```javascript
DuoDeal.set('color', 'blue');
DuoDeal.update({ name: 'Smith', accepts_terms: true });
var color = DuoDeal.get('color');
```

- **Persistence is automatic.** There is nothing to call: `set` / `update` / `setData`
  save to the quote on the spot, and the state is reloaded and re-injected when the quote
  is reopened, on the client page, and in the PDF.
- ⚠️ **Mutating `getData()` saves nothing** — it is a copy. Always go back through
  `set` / `update` / `setData`.
- Passing a string, an array or `null` to `update()` / `setData()` **stores nothing** and
  logs an explicit console error. It used to fail silently, which is how a form can look
  like it works while saving nothing.
- **JSON-serializable only.** Functions, `Map`, `Set` and DOM nodes are lost; a `Date`
  comes back as a **string** — store `date.toISOString()` and parse it back yourself.
- **64 KB per block, 1 MB for all the blocks of a quote.** Past that, the save is refused.
  Answers and small structures here; documents have their own channel (§4).
- Writes are **fire-and-forget**: no return value, no "saved" callback. Successive writes
  are coalesced, so calling `set()` on every keystroke is fine.

### One journey, one block

Each block's state is **isolated**, and there is **no supported way to read or write
another block's state**. A multi-step journey (details → choice → options → summary)
therefore belongs in **a single html block**, whose steps you show and hide yourself. It
also keeps the whole journey in one `state`, which is where the sales rep then reads it.

Splitting it across blocks means inventing your own bridge between iframes: nothing
supports it, it does not survive the PDF render, and each block saves its own partial
record.

### Who writes what, and where it lands

The same methods write to two different places; Duodeal routes it, you never choose:

- **In the builder** (the sales rep) → the block's **template**: the starting values shipped
  to every client.
- **On the client's page** → a record **of the client's own**, kept out of the quote
  document. Coming back, their answers are laid over the template (their values win), so
  they find the form filled in — and the PDF prints it filled in. Because the template stays
  underneath, you can add a field later without wiping what clients already answered.

In the builder, a block a client has answered gains a **Template / Client answers** toggle,
where the rep reviews, corrects or resets those answers without touching the template. Say
this to the user when you deliver a data-collecting block: it is where they read the replies.

### Encryption, and the `_` prefix

Client answers are **encrypted at rest by default**. That protects them and also makes them
unreadable to everything else: exports, automations, webhooks, the AI assistant can do
nothing with a ciphertext. A block can opt out in the builder: **block settings → "Encrypt
client answers"**.

| `encryptState` | Regular keys | Keys named `_something` |
|---|---|---|
| **on** (default) | encrypted | encrypted |
| **off** | **readable** | **encrypted** |

⚠️ **Only top-level keys are looked at.** `_iban` is protected; `client: { _iban }` is not —
`client` is an ordinary key, so the whole object goes readable, nested underscore included.
Keep anything sensitive at the **root** of the state:

```javascript
DuoDeal.set('_iban', value);              // encrypted
DuoDeal.set('client', { _iban: value });  // NOT encrypted when the setting is off
```

`DuoDeal.storage` is `'encrypted'` or `'plain'` and is **read-only** — the mode is a setting
of the block, never a runtime choice (a public page must not decide how somebody's data is
stored). Read it to word a privacy notice: `if (DuoDeal.storage === 'plain') …`.
`DuoDeal.locale` gives the client's language (`'fr'`, `'en'`…).

**Choosing the mode is the user's call, not yours.** If the answers must feed an export, an
automation or the AI, encryption has to be off — say so and let them decide, and tell them
what goes readable in the database.

## 4. Files the client attaches

| Method | Purpose |
|---|---|
| `DuoDeal.uploadFile(file)` | Uploads a `File` from an input. **Promise** → descriptor. |
| `DuoDeal.removeFile(descriptorOrId)` | Deletes an attachment. Promise. |
| `DuoDeal.isFile(value)` | Is this state value a file descriptor? |

```javascript
{ __ddfile: true, id: "5e3b94c6-…", name: "rib.pdf", size: 1244683,
  mime: "application/pdf", url: "https://…/block-file/5e3b94c6-…?exp=…&k=…&sig=…" }
```

- **Store the whole descriptor** with `set()`/`update()` — **never just its `url`.** That
  URL is a short-lived signature; Duodeal mints a fresh one on every page load, PDF
  included. A stored descriptor always carries a working link; a stored URL is dead by the
  time the client comes back.
- A file deleted since comes back **flagged** rather than vanishing: check `f.missing` and
  keep the field in your layout.
- **10 MB per file, 20 files per block, 50 MB per quote.**
- Accepted: images (JPEG, PNG, GIF, WebP, HEIC, TIFF, BMP), PDF, Office and OpenDocument
  documents, plain text, CSV, RTF, ZIP. **Refused: SVG and HTML** (both can carry scripts),
  and anything outside that list. ⚠️ Do not confuse this with the **media library**
  (`create_media`), which does accept `image/svg+xml` for your own logos: two different
  channels — the media library is what YOU upload, `uploadFile()` is what the CLIENT sends.
- `uploadFile()` **rejects** instead of returning something empty, with a message already
  translated into the client's language. Wrap every call in `try/catch` and display
  `e.message` — that is all the client needs.
- Bytes are **encrypted before storage** in every case (whatever the block's mode) and
  never sit readable in a bucket. But the **descriptor** you keep in your state follows the
  block's mode: store it under a `_` key when the filename itself is telling.
- Build the link with `createElement` and set `.textContent`, not by assembling a markup
  string — a filename is chosen by the client.

The rep sees the attachments in the block's **Client answers** tab, rendered by your own
code, and can attach a document on the client's behalf or reset the block (which deletes
its answers **and** its files).

Full working example in **[references/recipes.md](references/recipes.md)**.

## 5. Helpers

- `DuoDeal.formatCurrency(amount)` — the **company's** currency format (symbol, side,
  separators, precision): `1234.5` → `"1 234,50 €"` / `"$1,234.50"`. Use it instead of
  hand-rolling a format; it is what keeps the block consistent with the price table.
- `DuoDeal.formatDate(date, intlOptions?)` — via `Intl.DateTimeFormat` in the current
  language. Takes an ISO string, a timestamp or a `Date`. Returns `''` on an invalid date.
- `DuoDeal.autoResize()` — the iframe already resizes itself from a `MutationObserver`;
  call this after any **asynchronous** DOM change, and **always at the end of the block**
  (mandatory rule of the other skills):
  `<script>try{if(window.DuoDeal&&DuoDeal.autoResize){DuoDeal.autoResize()}}catch(e){}</script>`

## 6. Copy buttons and outside services

Measured in Chrome on a live client link, 2026-09-13. Safari and Firefox not measured.

**Copy to the clipboard.** `navigator.clipboard.write()` and `writeText()` are refused inside the
block (`NotAllowedError`, blocked by permissions policy): Duodeal grants `clipboard-write` to its
YouTube embeds, not to html blocks. The legacy copy event still works on a click, and puts exactly
your content on the clipboard, rich HTML included:

```javascript
function copy(html, text) {           // call it in the click handler, before any await
  let filled = false;
  const onCopy = e => {
    if (html) e.clipboardData.setData('text/html', html);
    e.clipboardData.setData('text/plain', text);
    e.preventDefault(); filled = true;
  };
  document.addEventListener('copy', onCopy);
  let ok = false; try { ok = document.execCommand('copy'); } catch (e) {}
  document.removeEventListener('copy', onCopy);
  return ok && filled;
}
```

Try it first and keep `navigator.clipboard` only as a fallback, for the day the frame gains the
permission. Selecting the text and copying it with the keyboard always works too.

**Calling an outside service.** `fetch` to an HTTPS endpoint works. The request leaves with
`Origin: null` and no cookies, so the service must answer `Access-Control-Allow-Origin: *`. Send
the body as a JSON string with `Content-Type: text/plain;charset=utf-8`: it stays a simple
request, with no preflight. Two rules:

- **Never put an API key in a block.** Its code ships in the client page, readable by anyone
  with the link. A key belongs in a small relay you host, which the block calls.
- **Make writes idempotent.** Send an id with each request and let the block look the result up
  when a reply is unreadable. Google Apps Script web apps, a common free relay, sometimes lose a
  POST reply on their redirect (an HTML 404 reaches the block although the script ran).

**A permanent public image is not a client upload.** `uploadFile()` links expire (§4). An image
that must stay reachable outside Duodeal, such as a photo inside an email signature, goes to the
media library through the relay.

## 7. API summary

**Quote data (read-only)** — `deal` · `quotation` · `lines` · `customFields`
**State (read/write, auto-persisted)** — `get(k)` · `set(k,v)` · `update(obj|fn)` · `getData()` · `setData(obj)`
**Files** — `uploadFile(file)` → descriptor · `removeFile(x)` · `isFile(v)`
**Context (read-only)** — `storage` (`'encrypted'`|`'plain'`) · `locale`
**Reactivity** — `onUpdate(cb)`
**Helpers** — `formatCurrency(n)` · `formatDate(d, opts?)` · `autoResize()`

## 8. Before shipping a block (blocking)

1. It renders correctly **from `state` alone**, with no interaction — otherwise the PDF
   comes out empty.
2. `render()` is called **at load**, not only from event handlers.
3. No internal field displayed: no `coef`, `weight`, `product`, `opportunityAmountHt`, no
   internal custom field.
4. `title` / `description` treated as **HTML**, not as plain text.
5. Totals use `quotation.amountHt`, or filter on `lineType === 'normal'`, `!hide` and
   `(!option || optionSelected)`.
6. Every `uploadFile()` wrapped in `try/catch`, showing `e.message`.
7. Anything sensitive under a **top-level `_` key**.
8. `DuoDeal.autoResize()` after every asynchronous DOM change, and at the end of the block.
9. The state stays well under 64 KB.
10. A file field was tested **from the client link**, not from the builder preview.
11. The user knows **where the answers land** (Client answers tab) and **whether they are
    encrypted**.
12. A copy button uses the copy event first (§6), and no API key appears anywhere in the block.
