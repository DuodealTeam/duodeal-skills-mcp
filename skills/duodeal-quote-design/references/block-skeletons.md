# Block skeletons — inline-first HTML, ready to adapt

Replace the tokens `{{ACCENT}}`, `{{INK}}`, `{{MUTED}}`, `{{PAPER}}`, `{{LINE}}`,
`{{DARK}}`, `{{FONT}}` with the values of the approved DS, and the `{{contents}}` with
the real context. Everything is inline `style="…"` (no `<style>`: the editor strips
them). Every html block ends with the autoResize script and opens/closes with a 71 px
spacer (unless stated otherwise).

Mandatory block ending:

```html
<script>try{if(window.DuoDeal&&DuoDeal.autoResize){DuoDeal.autoResize()}}catch(e){}</script>
```

---

## 1. INTRO (logo lockup + hook + problem card) — `showTitle:false`, title "Introduction"

```html
<div style="height:64px" aria-hidden="true"></div>
<div style="display:flex;align-items:center;justify-content:center;gap:38px;max-width:840px;margin:0 auto;padding:0 18px">
  <img src="{{ISSUER_LOGO_S3}}" alt="{{Issuer}}" style="width:96px;height:96px;border-radius:20px;display:block"/>
  <span style="width:1px;height:64px;background:{{LINE}};display:block"></span>
  <img src="{{PROSPECT_LOGO_S3}}" alt="{{Prospect}}" style="height:34px;width:auto;display:block"/>
</div>
<div style="height:104px" aria-hidden="true"></div>
<div style="font-family:{{FONT}};color:{{INK}};max-width:820px;margin:0 auto;padding:0 18px">
  <p style="color:{{ACCENT}};font-weight:800;font-size:12px;letter-spacing:.16em;text-transform:uppercase;margin:0 0 12px">{{PROSPECT}} × {{ISSUER}}</p>
  <h2 style="font-weight:800;font-size:27px;line-height:1.2;margin:0 0 16px">{{Ink title with <span style="color:{{ACCENT}}">one accent word</span>}}</h2>
  <p style="color:{{MUTED}};font-size:15px;line-height:1.75;margin:0 0 14px">{{Personalized hook: contact's first name, their context, the promise.}}</p>
  <div style="background:{{DARK}};border-radius:16px;padding:26px 28px;margin:26px 0 0;break-inside:avoid;page-break-inside:avoid">
    <h3 style="color:#fff;font-weight:800;font-size:17px;margin:0 0 14px">{{What the current situation is costing you}}</h3>
    <div style="color:rgba(255,255,255,.82);font-size:14.5px;line-height:1.55;padding:9px 0 9px 26px;position:relative"><span style="position:absolute;left:2px;top:16px;width:9px;height:9px;border-radius:50%;background:{{PAPER}}"></span>{{point 1}}</div>
    <div style="color:rgba(255,255,255,.82);font-size:14.5px;line-height:1.55;padding:9px 0 9px 26px;position:relative;border-top:1px solid rgba(255,255,255,.10)"><span style="position:absolute;left:2px;top:16px;width:9px;height:9px;border-radius:50%;background:{{PAPER}}"></span>{{point 2}}</div>
    <div style="color:rgba(255,255,255,.82);font-size:14.5px;line-height:1.55;padding:9px 0 9px 26px;position:relative;border-top:1px solid rgba(255,255,255,.10)"><span style="position:absolute;left:2px;top:16px;width:9px;height:9px;border-radius:50%;background:{{PAPER}}"></span>{{point 3, with a figure}}</div>
  </div>
</div>
<div style="height:71px" aria-hidden="true"></div>
```

If the issuer has an intro video, add it before the final spacer:

```html
<div style="max-width:820px;margin:30px auto 0;padding:0 18px">
  <div style="position:relative;width:100%;padding-top:56.25%;overflow:hidden;border-radius:16px;background:{{DARK}};break-inside:avoid;page-break-inside:avoid">
    <iframe id="dd-vid" style="position:absolute;inset:0;width:100%;height:100%;border:0" src="https://www.youtube.com/embed/{{VIDEO_ID}}?enablejsapi=1&amp;playsinline=1&amp;rel=0" allow="autoplay;encrypted-media;picture-in-picture;web-share" allowfullscreen></iframe>
    <div style="position:absolute;inset:0;cursor:pointer;background:linear-gradient(135deg,{{DARK}} 0%,{{ACCENT}} 160%);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center" onclick="this.style.display='none';document.getElementById('dd-vid').contentWindow.postMessage('{&quot;event&quot;:&quot;command&quot;,&quot;func&quot;:&quot;playVideo&quot;,&quot;args&quot;:&quot;&quot;}','*');">
      <div style="width:66px;height:66px;border-radius:50%;background:{{PAPER}};display:flex;align-items:center;justify-content:center;margin:0 0 16px"><div style="border-style:solid;border-width:12px 0 12px 20px;border-color:transparent transparent transparent {{DARK}};margin-left:5px"></div></div>
      <div style="color:#fff;font-weight:700;font-size:16px">{{Video title}}</div>
      <div style="color:rgba(255,255,255,.72);font-size:13px;margin-top:6px">{{Duration · 1 click to play}}</div>
    </div>
  </div>
</div>
```

(Check that the video is playable as an embed before integrating it.)

---

## 2. SOLUTION (value cards + KPI strip) — title "The solution"

```html
<div style="height:71px" aria-hidden="true"></div>
<div style="font-family:{{FONT}};max-width:860px;margin:0 auto;padding:0 18px">
  <div style="margin:0 0 22px;break-inside:avoid">
    <p style="color:{{ACCENT}};font-weight:800;font-size:12px;letter-spacing:.16em;text-transform:uppercase;margin:0 0 10px">{{Our answer}}</p>
    <h2 style="color:{{INK}};font-weight:800;font-size:24px;line-height:1.25;margin:0">{{Solution title, in the prospect's vocabulary}}</h2>
  </div>
  <div style="display:flex;flex-wrap:wrap;gap:14px">
    <div style="flex:1 1 340px;background:#fff;border:1px solid {{LINE}};border-radius:16px;padding:22px 24px;break-inside:avoid;page-break-inside:avoid">
      <h3 style="color:{{INK}};font-weight:800;font-size:15.5px;margin:0 0 8px">{{Value 1}}</h3>
      <p style="color:{{MUTED}};font-size:13.5px;line-height:1.65;margin:0">{{Concrete proof, in the prospect's words.}}</p>
    </div>
    <!-- repeat: 3-4 cards -->
  </div>
  <div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:14px">
    <div style="flex:1 1 150px;min-width:140px;background:{{PAPER}};border:1px solid {{LINE}};border-radius:14px;padding:16px 10px;text-align:center;break-inside:avoid">
      <b style="display:block;color:{{ACCENT}};font-size:22px;font-weight:800">{{97%}}</b>
      <span style="color:{{MUTED}};font-size:11.5px;line-height:1.4;display:block;margin-top:4px">{{metric}}</span>
    </div>
    <!-- repeat: 4 KPIs -->
  </div>
</div>
<div style="height:71px" aria-hidden="true"></div>
```

---

## 3. ORDER RECAP (after the `pricing` block) — title "Your order"

**Recurring amounts live here** (the native table only has one total). No hairline
between the amount rows: only the strong rule before the Total incl. tax.

```html
<div style="height:71px" aria-hidden="true"></div>
<div style="font-family:{{FONT}};max-width:780px;margin:0 auto;padding:0 18px">
  <div style="background:#fff;border:1px solid {{LINE}};border-radius:16px;padding:26px 28px;break-inside:avoid;page-break-inside:avoid">
    <p style="color:{{ACCENT}};font-weight:800;font-size:12px;letter-spacing:.16em;text-transform:uppercase;margin:0 0 8px">{{Your order at a glance}}</p>
    <h3 style="color:{{INK}};font-weight:800;font-size:19px;margin:0 0 16px">{{Everything you need to get started, in one package.}}</h3>
    <div style="display:flex;justify-content:space-between;gap:14px;color:{{MUTED}};font-size:14px;padding:9px 0"><span>{{One-off item}}</span><b style="color:{{INK}};white-space:nowrap">{{X XXX.XX €}}</b></div>
    <div style="display:flex;justify-content:space-between;gap:14px;color:{{MUTED}};font-size:14px;padding:9px 0"><span>{{VAT (20%)}}</span><b style="color:{{INK}};white-space:nowrap">{{XXX.XX €}}</b></div>
    <div style="display:flex;justify-content:space-between;gap:14px;font-size:16px;font-weight:800;color:{{INK}};padding:13px 0 3px;border-top:2px solid {{INK}};margin-top:4px"><span>Total incl. tax</span><b>{{X XXX.XX €}}</b></div>
    <div style="display:flex;justify-content:space-between;gap:14px;color:{{ACCENT}};font-weight:800;font-size:14.5px;padding-top:10px"><span>{{Then, monthly subscription}}</span><b>{{XXX.XX € / month}}</b></div>
  </div>
  <p style="color:{{MUTED}};font-size:12.5px;line-height:1.6;margin:14px 4px 0">{{Terms: XX% deposit on order · lead time · cancellation. Options are presented separately and excluded from the total.}}</p>
</div>
<div style="height:71px" aria-hidden="true"></div>
```

⚠️ The amounts above are written as `{{X XXX.XX €}}` placeholders. Two ways to fill them:

- **Bound to the price table (recommended)** — the block reads the live quote and follows
  every line edit on its own: see §9. Ask the user; it is good practice, not an obligation.
- **Written by hand** — legitimate for what the table does not hold (recurring, options
  presented separately, figures given by the client), and acceptable for the rest if the user
  prefers it. In that case the amounts MUST match the pricing block **and** be re-checked
  after any line edit: tell the user they are a manual copy.

Anything that already exists in the price table (total, subtotal, VAT, a line price) is bound
rather than retyped — a hand copy drifts silently the day a sales rep edits a line. SaaS variant with a setup fee: 2 cards side by side (`flex:1 1 340px`),
"Development / one-off" | "Monthly subscription", each with its own bullets.

---

## 4. SOCIAL PROOF — title "Trusted by"

REAL testimonials from the client; otherwise a logo wall. Stars as inline SVG:

```html
<svg viewBox="0 0 24 24" style="width:15px;height:15px;fill:{{ACCENT}};margin-right:2px"><path d="M12 2l2.9 6.1 6.7.6-5.1 4.4 1.6 6.6L12 16.9 5.9 20.3l1.6-6.6L2.4 9.3l6.7-.6z"/></svg>
```

```html
<div style="height:71px" aria-hidden="true"></div>
<div style="font-family:{{FONT}};max-width:860px;margin:0 auto;padding:0 18px">
  <div style="text-align:center;margin:0 0 20px;break-inside:avoid">
    <p style="color:{{ACCENT}};font-weight:800;font-size:12px;letter-spacing:.16em;text-transform:uppercase;margin:0 0 8px">{{Trusted by}}</p>
    <h2 style="color:{{INK}};font-weight:800;font-size:23px;margin:0">{{Social proof title}}</h2>
  </div>
  <div style="display:flex;flex-wrap:wrap;gap:14px">
    <div style="flex:1 1 340px;background:#fff;border:1px solid {{LINE}};border-radius:16px;padding:22px 24px;break-inside:avoid;page-break-inside:avoid">
      <div>{{5 SVG stars}}</div>
      <p style="color:{{MUTED}};font-size:13.5px;line-height:1.65;margin:10px 0 12px">“{{Real quote}}”</p>
      <b style="color:{{INK}};font-size:13px;display:block">{{First name Last name}}</b>
      <span style="color:{{MUTED}};font-size:12px">{{Job title, Company}}</span>
    </div>
    <!-- repeat -->
  </div>
</div>
<div style="height:71px" aria-hidden="true"></div>
```

Logo wall (real files, balanced rows, height tuned PER logo):

```html
<div style="background:#fff;border:1px solid {{LINE}};border-radius:16px;padding:38px 30px;break-inside:avoid;page-break-inside:avoid">
  <div style="display:flex;justify-content:center;align-items:center;gap:44px;flex-wrap:wrap;padding:16px 0">
    <img src="{{S3_LOGO_1}}" alt="{{Brand 1}}" style="height:40px;width:auto;display:block"/>
    <img src="{{S3_LOGO_2}}" alt="{{Brand 2}}" style="height:22px;width:auto;display:block"/>
  </div>
</div>
```

---

## 5. FAQ — title "Frequently asked questions", `showTitle:false`

html block, **never the native `faq` block**. 5-8 real objections from the deal:

```html
<div style="height:71px" aria-hidden="true"></div>
<div style="font-family:{{FONT}};max-width:780px;margin:0 auto;padding:0 18px">
  <div style="text-align:center;break-inside:avoid;margin:0 0 22px">
    <p style="color:{{ACCENT}};font-weight:700;font-size:12px;letter-spacing:.2em;text-transform:uppercase;margin:0 0 10px">Frequently asked questions</p>
    <h2 style="color:{{INK}};font-weight:700;font-size:26px;margin:0">{{Title}}</h2>
  </div>
  <div style="background:#fff;border:1px solid {{LINE}};border-radius:14px;padding:18px 22px;margin:0 0 10px;break-inside:avoid;page-break-inside:avoid">
    <p style="color:{{INK}};font-weight:600;font-size:14.5px;margin:0 0 7px;position:relative;padding-left:18px"><span style="position:absolute;left:0;top:6px;width:8px;height:8px;border-radius:50%;background:{{ACCENT}}"></span>{{Real objection?}}</p>
    <p style="color:{{MUTED}};font-size:13.5px;line-height:1.7;margin:0;padding-left:18px">{{Concrete answer.}}</p>
  </div>
  <!-- repeat 5-8 items -->
  <div style="background:{{PAPER}};border:1px solid {{LINE}};border-radius:14px;padding:20px 24px;margin-top:16px;text-align:center;break-inside:avoid">
    <p style="color:{{INK}};font-weight:600;font-size:16.5px;margin:0 0 6px">Another question?</p>
    <p style="color:{{INK}};font-size:13.5px;line-height:1.7;margin:0">The <b style="color:{{ACCENT}}">comment</b> button, at the top right of this page, lets you ask {{First name}} your question directly on the proposal.</p>
  </div>
</div>
<div style="height:71px" aria-hidden="true"></div>
```

---

## 6. NEXT STEPS + CTA + issuer card — title "Next steps"

```html
<div style="height:71px" aria-hidden="true"></div>
<div style="font-family:{{FONT}};max-width:780px;margin:0 auto;padding:0 18px">
  <div style="margin:0 0 30px;break-inside:avoid;page-break-inside:avoid">
    <div style="display:flex;gap:16px;align-items:flex-start;padding:12px 0">
      <div style="flex:0 0 auto;width:34px;height:34px;border-radius:50%;background:{{ACCENT}};color:#fff;font-weight:800;font-size:15px;display:flex;align-items:center;justify-content:center">1</div>
      <div><b style="color:{{INK}};font-size:15px;display:block">{{Approval}}</b><span style="color:{{MUTED}};font-size:13px">{{one line}}</span></div>
    </div>
    <!-- steps 2, 3 (, 4) -->
  </div>
  <div style="background:linear-gradient(135deg,{{DARK}} 0%,{{ACCENT}} 190%);border-radius:20px;padding:38px 36px;text-align:center;break-inside:avoid;page-break-inside:avoid">
    <h2 style="color:#fff;font-weight:800;font-size:25px;margin:0 0 12px;line-height:1.22">{{Ready to get started?}}</h2>
    <p style="color:rgba(255,255,255,.82);font-size:14.5px;line-height:1.7;max-width:560px;margin:0 auto">{{One sentence of momentum.}} The <b>“Accept &amp; sign”</b> button approves the proposal directly from this page.</p>
    <span style="display:inline-block;margin-top:20px;color:{{DARK}};background:{{PAPER}};font-weight:800;font-size:14px;border-radius:999px;padding:12px 26px">Accept &amp; sign: at the top right of this page</span>
  </div>
  <div style="display:flex;align-items:center;gap:24px;justify-content:center;margin:30px auto 0;background:#fff;border:1px solid {{LINE}};border-radius:18px;padding:30px 34px;max-width:560px;break-inside:avoid;page-break-inside:avoid">
    <img src="{{S3_SALES_REP_PHOTO}}" alt="{{First name Last name}}" style="width:96px;height:96px;border-radius:50%;object-fit:cover;display:block;flex:0 0 auto;box-shadow:0 0 0 4px {{PAPER}}"/>
    <div><b style="color:{{INK}};font-size:20px;display:block;text-align:left;margin:0 0 4px">{{First name Last name}}</b><span style="color:{{MUTED}};font-size:13.5px;line-height:1.65;display:block;text-align:left">{{Job title · Company}}<br/>{{phone · email}}</span></div>
  </div>
</div>
<div style="height:71px" aria-hidden="true"></div>
```

Real photo of the sales rep (square crop, face centered). No reminder of the legal
notices in this block. The label above is the native "Accept & sign" button, which
renders in the deal language (French deals: « Accepter et signer »).

---

## 7. `legalnotice` block — legal bundle

Structured fields of `data`: `title: " "` (ONE space), `companyName: "<issuer name>"`,
all other fields `""`, `logo: null` — a field left empty (`""`) surfaces the ACCOUNT
data; the space neutralizes it. **All the design lives in `legalText`**
(rich HTML): centered logo + legal entity name + pills (website · company number · VAT
number) → centered "Terms and conditions of sale" title + small accent rule (48×3 px) →
white card with the articles in 2 columns (`flex:1 1 340px`), each article:
12.5 px ACCENT title + 11.5 px MUTED body. Leading spacer ~12 px only (the native zone
already takes up height), final spacer **≤ 16 px** (a large spacer creates a nearly
empty PDF page). Official certification (Qualiopi, ISO…): official file in its original
colors, ~80 px, centered, with its exact regulatory wording in small text.

---

## 8. Native `header` block — `data`

```json
{"cover": {{COMPLETE media object (landscape, issuer hero)}}, "noCover": false,
 "logo": {{COMPLETE media object of the issuer logo}}, "noLogo": false}
```

Always filled in (logo + cover) — never hidden, never re-coded as an html block.
Upload: ⚠️ reuse an existing media first (`list_medias`); `file` in **base64 is the normal, supported route** for the upload itself. ⚠️ What is forbidden is base64 **inside the HTML**: reference the url the media returns, never a `data:` URI (see **duodeal-mcp-best-practices** → images). Via `create_media` (`name` + `folder` required, `file` in base64 — ⚠️ **never
`from_url`**, the URL import 500s on most CDNs) — there is **no `upload_media`** tool on the
connector — then reference the complete media object returned inside the block's `data`
(`update_quotation_block`).

---

## 9. Binding a block to the price table — read the quote data live

**This is possible on any html block, and it is the right way to show an amount that comes
from Duodeal.** Good practice, not an obligation: ask the user. But a figure that already
exists in the price table is bound, not retyped — a hand copy drifts silently the day a
sales rep edits a line.

Inside an html block, `window.DuoDeal` exposes `deal`, `quotation`, `lines`,
`customFields`, `formatCurrency(n)`, `formatDate(d)`, `onUpdate(cb)`,
`getData()/setData()` (per-block persisted state).

Mark every dynamic figure with an id in the HTML (`<b id="dd-total">…</b>`), fill them in a
single `ddRender()`, and re-run it on `onUpdate` so the block follows live pricing edits:

```html
<script>
try{
  function ddRender(){
    var q=DuoDeal.quotation||{}, L=DuoDeal.lines||[], f=DuoDeal.formatCurrency;
    function put(id,v){var el=document.getElementById(id);if(el){el.textContent=v}}
    put('dd-total', f(q.amountTtc||0));
    put('dd-ht', f(q.amountHt||0));
    put('dd-vat', f((q.amountTtc||0)-(q.amountHt||0)));
    // one line by title, options excluded from the total
    var setup=L.filter(function(l){return l.lineType==='normal'&&!l.option});
    put('dd-setup', f(setup.reduce(function(a,l){return a+(l.totalHt||0)},0)));
  }
  ddRender();if(DuoDeal.onUpdate){DuoDeal.onUpdate(ddRender)}
}catch(e){}
try{if(window.DuoDeal&&DuoDeal.autoResize){DuoDeal.autoResize()}}catch(e){}
</script>
```

Always keep a plain readable value inside the tag as a fallback (`<b id="dd-total">1 200.00
€</b>`): if `DuoDeal` is unavailable, the block still shows something instead of an empty
slot. Field names come from the quotation you actually read (`get_quotation`,
`list_quotation_lines`) — check them there rather than assuming.

(Exception to "no script": the DuoDeal logic goes into THE final script, together with
the autoResize.)
