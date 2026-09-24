# Recipes — html block micro-apps

Five patterns that cover most blocks. Each one **restores its state at load**, so it renders
identically on the client page and in the PDF. Written in ES5 style (`var`, `function`) on
purpose: an html block is served as-is to whatever browser the buyer uses.

Reminder from **duodeal-quote-design**: styling stays inline, the script goes **at the end
of the block, after the markup** (the visual editor deletes what precedes the first
element), and the block ends with `autoResize()`.

## 1. A persisted form

```html
<div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;padding:8px 0">
  <label style="display:block;margin-bottom:12px">Company
    <input id="company" style="display:block;width:100%;padding:10px;border:1px solid #d8d8d8;border-radius:8px;font:inherit"/>
  </label>
  <label style="display:block;margin-bottom:12px">SIRET
    <input id="siret" style="display:block;width:100%;padding:10px;border:1px solid #d8d8d8;border-radius:8px;font:inherit"/>
  </label>
</div>
<script>
var FIELDS = ['company', 'siret'];
FIELDS.forEach(function (name) {
  var input = document.getElementById(name);
  input.value = DuoDeal.get(name) || '';                  // restore
  input.addEventListener('input', function () {
    DuoDeal.set(name, input.value);                       // save (automatic persistence)
  });
});
try{if(window.DuoDeal&&DuoDeal.autoResize){DuoDeal.autoResize()}}catch(e){}
</script>
```

Sensitive answers go under a **top-level `_` key** (`DuoDeal.set('_iban', v)`) so they stay
encrypted even if the block's encryption setting is turned off.

## 2. A document the client sends

Markup: a `<input type="file" id="doc">` and an empty `<div id="out"></div>`.

```javascript
var input = document.getElementById('doc');
var out = document.getElementById('out');

input.addEventListener('change', function () {
  var file = input.files[0];
  if (!file) return;
  out.textContent = 'Sending…';
  DuoDeal.uploadFile(file).then(function (descriptor) {
    DuoDeal.set('doc', descriptor);      // the DESCRIPTOR, never descriptor.url
    render();
  }).catch(function (e) {
    out.textContent = e.message;         // already translated for the client
  });
});

function render() {
  var f = DuoDeal.get('doc');
  out.textContent = '';
  if (!DuoDeal.isFile(f)) return;

  // Deleted since (by the client, or by the rep from the quote): it comes back
  // flagged rather than vanishing, so the layout keeps its field.
  if (f.missing) {
    out.textContent = 'Document no longer available — please send it again.';
    return;
  }
  var link = document.createElement('a');
  link.href = f.url;
  link.target = '_blank';
  link.rel = 'noopener';
  link.textContent = f.name;             // textContent: the filename comes from the client
  out.appendChild(link);
  try{DuoDeal.autoResize()}catch(e){}
}

render();   // restore what was already sent
```

Test this **from the client link**: in the builder preview `uploadFile()` rejects by design.
An image can be previewed straight from `f.url` as an `<img src>`.

## 3. A price recap that follows the quote

```javascript
function render() {
  document.getElementById('total').textContent =
    DuoDeal.formatCurrency(DuoDeal.quotation.amountHt);

  var rows = DuoDeal.lines
    .filter(function (l) { return l.lineType === 'normal' && !l.hide; })
    .filter(function (l) { return !l.option || l.optionSelected; });

  var list = document.getElementById('lines');
  list.textContent = '';
  rows.forEach(function (l) {
    var li = document.createElement('li');
    li.textContent = (l.productTitle || 'Item') + ' : ' + DuoDeal.formatCurrency(l.totalHt);
    list.appendChild(li);
  });
}
render();
DuoDeal.onUpdate(render);   // follows live price edits in the builder
```

`productTitle`, not `title`: the latter holds HTML. And put a plain fallback value inside
the tag (`<strong id="total">12 500 €</strong>`) so the block still shows something if
`DuoDeal` is unavailable, instead of an empty slot.

## 4. An option the client picks

```javascript
var box = document.getElementById('warranty');
box.checked = !!DuoDeal.get('warranty');
box.addEventListener('change', function () {
  DuoDeal.set('warranty', box.checked);
  render();
});
```

⚠️ This records a choice **inside the block**. To make an option actually count in the
quote's total, it must be an **option line of the pricing block** — a different mechanism,
driven by the quote, not by your code. Say which one you built.

## 5. A multi-step journey (one block)

There is no way to read another block's state, so all the steps live in one block and you
show/hide them yourself. The step number belongs in the state, so a client who comes back
lands where they left off — and the PDF prints the step they reached.

```javascript
var STEPS = ['details', 'choice', 'summary'];

function show() {
  var i = parseInt(DuoDeal.get('step') || 0, 10);
  STEPS.forEach(function (id, n) {
    document.getElementById(id).style.display = (n === i) ? 'block' : 'none';
  });
  try{DuoDeal.autoResize()}catch(e){}   // the height changes with the step
}

function go(delta) {
  var i = parseInt(DuoDeal.get('step') || 0, 10) + delta;
  DuoDeal.set('step', Math.max(0, Math.min(STEPS.length - 1, i)));
  show();
}

show();   // at load: restores the step reached
```

Navigation buttons use inline `onclick="go(1)"` / `onclick="go(-1)"`.

## 6. A document that fills itself from custom fields

A contract or an order form written once, where the rep never edits the text: they fill
**quotation custom fields** (and the price table), and each zone of the document prints its
field. Built for a Solutions Order in September 2026.

```html
<p>Client legal name: <span data-f="so_client_legal_name" style="background:#fff3b0;padding:0 4px">[Client legal name]</span></p>
<p>Billing: <span data-f="so_billing" style="background:#fff3b0;padding:0 4px">[annually / quarterly]</span></p>
<script>
function fill() {
  var cf = DuoDeal.customFields || {};
  document.querySelectorAll("[data-f]").forEach(function (e) {
    if (!e.getAttribute("data-ph")) e.setAttribute("data-ph", e.textContent);
    var v = cf[e.getAttribute("data-f")];
    var empty = v === undefined || v === null || v === "" || (Array.isArray(v) && !v.length);
    e.textContent = empty ? e.getAttribute("data-ph") : (Array.isArray(v) ? v.join(", ") : String(v));
    e.style.background = empty ? "#fff3b0" : "transparent";   // yellow = still to fill
    e.style.padding = empty ? "0 4px" : "0";
  });
  if (DuoDeal.autoResize) DuoDeal.autoResize();
}
fill();                  // at load: this is what the PDF prints
DuoDeal.onUpdate(fill);
</script>
```

- **The fields live in a native `customfields` block, set hidden** (eye off): the rep fills
  them there, the client never sees them. Name them with one prefix (`so_…`) and list them in
  the block in the document's reading order.
- **Yellow = empty** is the rep's checklist: a zone turns into plain text once its field is
  filled, so a client only sees yellow if something was forgotten.
- **A fallback beats an empty zone** where one exists: the deal's contact
  (`DuoDeal.deal.customer`), the total (`DuoDeal.quotation.amountHt` with `formatCurrency`), a
  standard wording (« Date of last signature ») shown without yellow.
- **Product ticks follow the price table**: a tick is on when the product is a counted line
  (`DuoDeal.lines`), so the rep adds or removes products in the table, never in the text.
- ⚠️ **Nothing inside the block can be clicked by the rep in the visual editor.** Visual
  editing delivers no click to an html block's controls (a checkbox, a `<details>`, an
  `onclick` all stay inert), and clicking an element there can **duplicate** it, which the
  save keeps. Every choice the rep makes goes through a custom field or the price table.
- The editor shows the block's static placeholders; check the result in the **client
  preview** or on the client link.

## The trap behind all six

Every `render()` / `show()` above is **called at load**, not only from a handler. In the PDF
there is no interaction and `onUpdate` never fires: a block that paints itself only inside
an event handler prints blank. That single line is the difference between a working block
and an empty page in the PDF the client keeps.
