# Squelettes de blocs — HTML inline-first prêt à adapter

Remplacer les tokens `{{ACCENT}}`, `{{INK}}`, `{{MUTED}}`, `{{PAPER}}`, `{{LINE}}`,
`{{DARK}}`, `{{FONT}}` par les valeurs du DS validé, et les `{{contenus}}` par le
contexte réel. Tout est en `style="…"` inline (aucun `<style>` : l'éditeur les
supprime). Chaque bloc html se termine par le script autoResize et s'ouvre/se ferme
par un spacer 71 px (sauf mention contraire).

Fin de bloc obligatoire :

```html
<script>try{if(window.DuoDeal&&DuoDeal.autoResize){DuoDeal.autoResize()}}catch(e){}</script>
```

---

## 1. INTRO (lockup logos + hook + carte problème) — `showTitle:false`, title "Introduction"

```html
<div style="height:64px" aria-hidden="true"></div>
<div style="display:flex;align-items:center;justify-content:center;gap:38px;max-width:840px;margin:0 auto;padding:0 18px">
  <img src="{{LOGO_EMETTEUR_S3}}" alt="{{Émetteur}}" style="width:96px;height:96px;border-radius:20px;display:block"/>
  <span style="width:1px;height:64px;background:{{LINE}};display:block"></span>
  <img src="{{LOGO_PROSPECT_S3}}" alt="{{Prospect}}" style="height:34px;width:auto;display:block"/>
</div>
<div style="height:104px" aria-hidden="true"></div>
<div style="font-family:{{FONT}};color:{{INK}};max-width:820px;margin:0 auto;padding:0 18px">
  <p style="color:{{ACCENT}};font-weight:800;font-size:12px;letter-spacing:.16em;text-transform:uppercase;margin:0 0 12px">{{PROSPECT}} × {{ÉMETTEUR}}</p>
  <h2 style="font-weight:800;font-size:27px;line-height:1.2;margin:0 0 16px">{{Titre encre avec <span style="color:{{ACCENT}}">un mot accent</span>}}</h2>
  <p style="color:{{MUTED}};font-size:15px;line-height:1.75;margin:0 0 14px">{{Accroche personnalisée : prénom du contact, son contexte, la promesse.}}</p>
  <div style="background:{{DARK}};border-radius:16px;padding:26px 28px;margin:26px 0 0;break-inside:avoid;page-break-inside:avoid">
    <h3 style="color:#fff;font-weight:800;font-size:17px;margin:0 0 14px">{{Ce que la situation actuelle vous coûte}}</h3>
    <div style="color:rgba(255,255,255,.82);font-size:14.5px;line-height:1.55;padding:9px 0 9px 26px;position:relative"><span style="position:absolute;left:2px;top:16px;width:9px;height:9px;border-radius:50%;background:{{PAPER}}"></span>{{point 1}}</div>
    <div style="color:rgba(255,255,255,.82);font-size:14.5px;line-height:1.55;padding:9px 0 9px 26px;position:relative;border-top:1px solid rgba(255,255,255,.10)"><span style="position:absolute;left:2px;top:16px;width:9px;height:9px;border-radius:50%;background:{{PAPER}}"></span>{{point 2}}</div>
    <div style="color:rgba(255,255,255,.82);font-size:14.5px;line-height:1.55;padding:9px 0 9px 26px;position:relative;border-top:1px solid rgba(255,255,255,.10)"><span style="position:absolute;left:2px;top:16px;width:9px;height:9px;border-radius:50%;background:{{PAPER}}"></span>{{point 3, chiffré}}</div>
  </div>
</div>
<div style="height:71px" aria-hidden="true"></div>
```

Si l'émetteur a une vidéo de présentation, l'ajouter avant le spacer final :

```html
<div style="max-width:820px;margin:30px auto 0;padding:0 18px">
  <div style="position:relative;width:100%;padding-top:56.25%;overflow:hidden;border-radius:16px;background:{{DARK}};break-inside:avoid;page-break-inside:avoid">
    <iframe id="dd-vid" style="position:absolute;inset:0;width:100%;height:100%;border:0" src="https://www.youtube.com/embed/{{VIDEO_ID}}?enablejsapi=1&amp;playsinline=1&amp;rel=0" allow="autoplay;encrypted-media;picture-in-picture;web-share" allowfullscreen></iframe>
    <div style="position:absolute;inset:0;cursor:pointer;background:linear-gradient(135deg,{{DARK}} 0%,{{ACCENT}} 160%);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center" onclick="this.style.display='none';document.getElementById('dd-vid').contentWindow.postMessage('{&quot;event&quot;:&quot;command&quot;,&quot;func&quot;:&quot;playVideo&quot;,&quot;args&quot;:&quot;&quot;}','*');">
      <div style="width:66px;height:66px;border-radius:50%;background:{{PAPER}};display:flex;align-items:center;justify-content:center;margin:0 0 16px"><div style="border-style:solid;border-width:12px 0 12px 20px;border-color:transparent transparent transparent {{DARK}};margin-left:5px"></div></div>
      <div style="color:#fff;font-weight:700;font-size:16px">{{Titre de la vidéo}}</div>
      <div style="color:rgba(255,255,255,.72);font-size:13px;margin-top:6px">{{Durée · 1 clic pour lancer}}</div>
    </div>
  </div>
</div>
```

(Vérifier que la vidéo est lisible en embed avant de l'intégrer.)

---

## 2. SOLUTION (cartes de valeur + bande KPIs) — title "La solution"

```html
<div style="height:71px" aria-hidden="true"></div>
<div style="font-family:{{FONT}};max-width:860px;margin:0 auto;padding:0 18px">
  <div style="margin:0 0 22px;break-inside:avoid">
    <p style="color:{{ACCENT}};font-weight:800;font-size:12px;letter-spacing:.16em;text-transform:uppercase;margin:0 0 10px">{{Notre réponse}}</p>
    <h2 style="color:{{INK}};font-weight:800;font-size:24px;line-height:1.25;margin:0">{{Titre solution, vocabulaire du prospect}}</h2>
  </div>
  <div style="display:flex;flex-wrap:wrap;gap:14px">
    <div style="flex:1 1 340px;background:#fff;border:1px solid {{LINE}};border-radius:16px;padding:22px 24px;break-inside:avoid;page-break-inside:avoid">
      <h3 style="color:{{INK}};font-weight:800;font-size:15.5px;margin:0 0 8px">{{Valeur 1}}</h3>
      <p style="color:{{MUTED}};font-size:13.5px;line-height:1.65;margin:0">{{Preuve concrète, mots du prospect.}}</p>
    </div>
    <!-- répéter : 3-4 cartes -->
  </div>
  <div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:14px">
    <div style="flex:1 1 150px;min-width:140px;background:{{PAPER}};border:1px solid {{LINE}};border-radius:14px;padding:16px 10px;text-align:center;break-inside:avoid">
      <b style="display:block;color:{{ACCENT}};font-size:22px;font-weight:800">{{97%}}</b>
      <span style="color:{{MUTED}};font-size:11.5px;line-height:1.4;display:block;margin-top:4px">{{métrique}}</span>
    </div>
    <!-- répéter : 4 KPIs -->
  </div>
</div>
<div style="height:71px" aria-hidden="true"></div>
```

---

## 3. RÉCAP COMMANDE (après le bloc `pricing`) — title "Votre commande"

Le **récurrent vit ici** (la table native n'a qu'un total). Pas de filet entre les
lignes de montants : seule la règle forte avant le Total TTC.

```html
<div style="height:71px" aria-hidden="true"></div>
<div style="font-family:{{FONT}};max-width:780px;margin:0 auto;padding:0 18px">
  <div style="background:#fff;border:1px solid {{LINE}};border-radius:16px;padding:26px 28px;break-inside:avoid;page-break-inside:avoid">
    <p style="color:{{ACCENT}};font-weight:800;font-size:12px;letter-spacing:.16em;text-transform:uppercase;margin:0 0 8px">{{Votre commande en un coup d'œil}}</p>
    <h3 style="color:{{INK}};font-weight:800;font-size:19px;margin:0 0 16px">{{Tout ce qu'il faut pour démarrer, en un package.}}</h3>
    <div style="display:flex;justify-content:space-between;gap:14px;color:{{MUTED}};font-size:14px;padding:9px 0"><span>{{Poste one-off}}</span><b style="color:{{INK}};white-space:nowrap">{{X XXX,XX €}}</b></div>
    <div style="display:flex;justify-content:space-between;gap:14px;color:{{MUTED}};font-size:14px;padding:9px 0"><span>{{TVA (20 %)}}</span><b style="color:{{INK}};white-space:nowrap">{{XXX,XX €}}</b></div>
    <div style="display:flex;justify-content:space-between;gap:14px;font-size:16px;font-weight:800;color:{{INK}};padding:13px 0 3px;border-top:2px solid {{INK}};margin-top:4px"><span>Total TTC</span><b>{{X XXX,XX €}}</b></div>
    <div style="display:flex;justify-content:space-between;gap:14px;color:{{ACCENT}};font-weight:800;font-size:14.5px;padding-top:10px"><span>{{Puis, abonnement mensuel}}</span><b>{{XXX,XX € / mois}}</b></div>
  </div>
  <p style="color:{{MUTED}};font-size:12.5px;line-height:1.6;margin:14px 4px 0">{{Conditions : acompte XX % à la commande · délai · résiliation. Les options sont présentées à part et exclues du total.}}</p>
</div>
<div style="height:71px" aria-hidden="true"></div>
```

Les montants en dur DOIVENT égaler ceux du pricing (revérifier après toute édition de
ligne). Variante SaaS avec mise en route : 2 cartes côte à côte (`flex:1 1 340px`),
« Développement / one-off » | « Abonnement mensuel », chacune avec ses bullets.

---

## 4. PREUVE SOCIALE — title "Ils nous font confiance"

De VRAIS témoignages du client ; sinon mur de logos. Étoiles en SVG inline :

```html
<svg viewBox="0 0 24 24" style="width:15px;height:15px;fill:{{ACCENT}};margin-right:2px"><path d="M12 2l2.9 6.1 6.7.6-5.1 4.4 1.6 6.6L12 16.9 5.9 20.3l1.6-6.6L2.4 9.3l6.7-.6z"/></svg>
```

```html
<div style="height:71px" aria-hidden="true"></div>
<div style="font-family:{{FONT}};max-width:860px;margin:0 auto;padding:0 18px">
  <div style="text-align:center;margin:0 0 20px;break-inside:avoid">
    <p style="color:{{ACCENT}};font-weight:800;font-size:12px;letter-spacing:.16em;text-transform:uppercase;margin:0 0 8px">{{Ils nous font confiance}}</p>
    <h2 style="color:{{INK}};font-weight:800;font-size:23px;margin:0">{{Titre preuve sociale}}</h2>
  </div>
  <div style="display:flex;flex-wrap:wrap;gap:14px">
    <div style="flex:1 1 340px;background:#fff;border:1px solid {{LINE}};border-radius:16px;padding:22px 24px;break-inside:avoid;page-break-inside:avoid">
      <div>{{5 étoiles SVG}}</div>
      <p style="color:{{MUTED}};font-size:13.5px;line-height:1.65;margin:10px 0 12px">« {{Citation réelle}} »</p>
      <b style="color:{{INK}};font-size:13px;display:block">{{Prénom Nom}}</b>
      <span style="color:{{MUTED}};font-size:12px">{{Fonction, Société}}</span>
    </div>
    <!-- répéter -->
  </div>
</div>
<div style="height:71px" aria-hidden="true"></div>
```

Mur de logos (vrais fichiers, rangées équilibrées, hauteur réglée PAR logo) :

```html
<div style="background:#fff;border:1px solid {{LINE}};border-radius:16px;padding:38px 30px;break-inside:avoid;page-break-inside:avoid">
  <div style="display:flex;justify-content:center;align-items:center;gap:44px;flex-wrap:wrap;padding:16px 0">
    <img src="{{S3_LOGO_1}}" alt="{{Marque 1}}" style="height:40px;width:auto;display:block"/>
    <img src="{{S3_LOGO_2}}" alt="{{Marque 2}}" style="height:22px;width:auto;display:block"/>
  </div>
</div>
```

---

## 5. FAQ — title "Questions fréquentes", `showTitle:false`

Bloc html, **jamais le bloc `faq` natif**. 5-8 vraies objections du deal :

```html
<div style="height:71px" aria-hidden="true"></div>
<div style="font-family:{{FONT}};max-width:780px;margin:0 auto;padding:0 18px">
  <div style="text-align:center;break-inside:avoid;margin:0 0 22px">
    <p style="color:{{ACCENT}};font-weight:700;font-size:12px;letter-spacing:.2em;text-transform:uppercase;margin:0 0 10px">Questions fréquentes</p>
    <h2 style="color:{{INK}};font-weight:700;font-size:26px;margin:0">{{Titre}}</h2>
  </div>
  <div style="background:#fff;border:1px solid {{LINE}};border-radius:14px;padding:18px 22px;margin:0 0 10px;break-inside:avoid;page-break-inside:avoid">
    <p style="color:{{INK}};font-weight:600;font-size:14.5px;margin:0 0 7px;position:relative;padding-left:18px"><span style="position:absolute;left:0;top:6px;width:8px;height:8px;border-radius:50%;background:{{ACCENT}}"></span>{{Vraie objection ?}}</p>
    <p style="color:{{MUTED}};font-size:13.5px;line-height:1.7;margin:0;padding-left:18px">{{Réponse concrète.}}</p>
  </div>
  <!-- répéter 5-8 items -->
  <div style="background:{{PAPER}};border:1px solid {{LINE}};border-radius:14px;padding:20px 24px;margin-top:16px;text-align:center;break-inside:avoid">
    <p style="color:{{INK}};font-weight:600;font-size:16.5px;margin:0 0 6px">Une autre question&nbsp;?</p>
    <p style="color:{{INK}};font-size:13.5px;line-height:1.7;margin:0">Le bouton <b style="color:{{ACCENT}}">commentaire</b>, en haut à droite de cette page, permet de poser votre question à {{Prénom}} directement sur la proposition.</p>
  </div>
</div>
<div style="height:71px" aria-hidden="true"></div>
```

---

## 6. PROCHAINES ÉTAPES + CTA + carte émetteur — title "Prochaines étapes"

```html
<div style="height:71px" aria-hidden="true"></div>
<div style="font-family:{{FONT}};max-width:780px;margin:0 auto;padding:0 18px">
  <div style="margin:0 0 30px;break-inside:avoid;page-break-inside:avoid">
    <div style="display:flex;gap:16px;align-items:flex-start;padding:12px 0">
      <div style="flex:0 0 auto;width:34px;height:34px;border-radius:50%;background:{{ACCENT}};color:#fff;font-weight:800;font-size:15px;display:flex;align-items:center;justify-content:center">1</div>
      <div><b style="color:{{INK}};font-size:15px;display:block">{{Validation}}</b><span style="color:{{MUTED}};font-size:13px">{{une ligne}}</span></div>
    </div>
    <!-- étapes 2, 3 (, 4) -->
  </div>
  <div style="background:linear-gradient(135deg,{{DARK}} 0%,{{ACCENT}} 190%);border-radius:20px;padding:38px 36px;text-align:center;break-inside:avoid;page-break-inside:avoid">
    <h2 style="color:#fff;font-weight:800;font-size:25px;margin:0 0 12px;line-height:1.22">{{Prêt à démarrer ?}}</h2>
    <p style="color:rgba(255,255,255,.82);font-size:14.5px;line-height:1.7;max-width:560px;margin:0 auto">{{Une phrase d'élan.}} Le bouton <b>« Accepter et signer »</b> valide la proposition directement depuis cette page.</p>
    <span style="display:inline-block;margin-top:20px;color:{{DARK}};background:{{PAPER}};font-weight:800;font-size:14px;border-radius:999px;padding:12px 26px">Accepter et signer : en haut à droite de cette page</span>
  </div>
  <div style="display:flex;align-items:center;gap:24px;justify-content:center;margin:30px auto 0;background:#fff;border:1px solid {{LINE}};border-radius:18px;padding:30px 34px;max-width:560px;break-inside:avoid;page-break-inside:avoid">
    <img src="{{S3_PHOTO_COMMERCIAL}}" alt="{{Prénom Nom}}" style="width:96px;height:96px;border-radius:50%;object-fit:cover;display:block;flex:0 0 auto;box-shadow:0 0 0 4px {{PAPER}}"/>
    <div><b style="color:{{INK}};font-size:20px;display:block;text-align:left;margin:0 0 4px">{{Prénom Nom}}</b><span style="color:{{MUTED}};font-size:13.5px;line-height:1.65;display:block;text-align:left">{{Fonction · Société}}<br/>{{téléphone · email}}</span></div>
  </div>
</div>
<div style="height:71px" aria-hidden="true"></div>
```

Vraie photo du commercial (recadrée carrée, visage centré). Pas de rappel des mentions
légales dans ce bloc.

---

## 7. Bloc `legalnotice` — liasse légale

Champs structurés du `data` : `title: " "` (UN espace), `companyName: "<nom émetteur>"`,
tous les autres champs `""`, `logo: null` — un champ laissé vide (`""`) fait apparaître
les données du COMPTE ; l'espace neutralise. **Tout le design vit dans `legalText`**
(HTML riche) : logo centré + raison sociale + pastilles (site · SIRET · TVA intra) →
titre « Conditions générales de vente » centré + petit trait accent (48×3 px) → carte
blanche avec les articles en 2 colonnes (`flex:1 1 340px`), chaque article :
titre 12.5 px ACCENT + corps 11.5 px MUTED. Spacer de tête ~12 px seulement (la zone
native occupe déjà de la hauteur), spacer final **≤ 16 px** (un grand spacer crée une
page PDF quasi vide). Certification officielle (Qualiopi, ISO…) : fichier officiel en
couleurs d'origine, ~80 px, centré, avec sa mention réglementaire exacte en petit texte.

---

## 8. Bloc `header` natif — `data`

```json
{"cover": {{objet media COMPLET (paysage, hero de l'émetteur)}}, "noCover": false,
 "logo": {{objet media COMPLET du logo émetteur}}, "noLogo": false}
```

Toujours rempli (logo + cover) — jamais masqué, jamais recodé en bloc html.
Uploader via `upload_media`, puis référencer l'objet media complet renvoyé.

---

## 9. Bloc dynamique (avancé) — lire les données du devis en live

Dans un bloc html, `window.DuoDeal` expose `deal`, `quotation`, `lines`,
`customFields`, `formatCurrency(n)`, `formatDate(d)`, `onUpdate(cb)`,
`getData()/setData()` (état persisté par bloc). Exemple : un récap qui reste juste si
le commercial modifie une ligne :

```html
<script>
try{
  function ddRender(){var q=DuoDeal.quotation||{};var el=document.getElementById('dd-total');if(el){el.textContent=DuoDeal.formatCurrency(q.amountTtc||0)}}
  ddRender();if(DuoDeal.onUpdate){DuoDeal.onUpdate(ddRender)}
}catch(e){}
try{if(window.DuoDeal&&DuoDeal.autoResize){DuoDeal.autoResize()}}catch(e){}
</script>
```

(Exception à « pas de script » : la logique DuoDeal se met dans LE script final, avec
l'autoResize.)
