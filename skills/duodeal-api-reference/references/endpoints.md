# Référence complète des opérations (par tag)

Format : `MÉTHODE /path` — résumé. **Req** = champs requis ; **Opt** = optionnels notables ;
**Resp** = champs de réponse clés ; **Note** = règles/enums/pièges.

## Companies

- `GET /companies/{id}` — Resp: `id, name, logo, cover, country, siren, address, address2, postCode, city, companySize, currency, currencyFormat, archive, showUnboarding, dealSettings, numberingSetting`.
- `PUT /companies/{id}` — Opt: `name, country, siren, address, address2, postCode, city, companySize, currency, currencyFormat, showUnboarding, dealSettings, setLogo, setCover`. **Note**: `setLogo`/`setCover` = base64 pour poser/remplacer, ou littéral `"remove"` pour supprimer ; omettre = inchangé. ⚠️ en pratique : envoyer du **PNG base64 BRUT** (un data URI est silencieusement ignoré — 200 OK sans persistance). `companySize` ∈ `1|2-10|11-50|51-200|201-500|500+`. **Ne jamais écraser un logo/bannière existant : ne définir que si absent.**

## Custom Fields

- `GET /custom-fields` — Opt query: `page, limit, order, direction` + filtres. Resp: `id, name, label, type, scope, required, formula, options, weight, size, editable, public, activate, enableAi, hubspotMap, isMappedToHubspot`.
- `POST /custom-fields` — **Req**: `name, label, type, scope, required`. Opt: `formula (requis si type Formula), options {items:[{label}]}, weight, size (w-full/w-1/2…), editable(def true), public, activate(def true), enableAi, hubspotMap`. **Note**: `name` = clé sans espaces.
- `GET|PUT|DELETE /custom-fields/{id}` — PUT opt: `label, required, weight` (+ autres) ; changer `type`/`scope` peut casser des données.
- **Types** : `Text, MultilineText, RichText, Number, Date, datetime, Select, MultiSelect, Image, User, Formula, Html, System` (+ `HtmlSimple` toléré, rendu HTML).
- **Scopes** : `deal, customer, customer-company, product, quotation, quotation-line`.
- **Valeurs** : posées via `update_quotation {customFields:{clé:valeur}}` ; affichées dans un devis V2 par le bloc `customfields` (voir duodeal-v2-blocks).

## Customer Companies

- `GET /customer-companies` — paginé + filtres (`filters[name][contains]`, `filters[customFields.sector][eq]`). Resp: `id, name, siret, vatNumber, tradeName, address{country,address,state,postCode,city}, archived, isDeletable, customFields`.
- `POST /customer-companies` — **Req**: `name`. Opt: `siret, vatNumber, tradeName, address, customFields`.
- `GET|PUT|DELETE /customer-companies/{id}` — DELETE seulement si `isDeletable` (aucun customer lié) sinon 400.

## Customers

- `GET /customers` — paginé + filtres (`filters[email][endsWith]`, `filters[customerCompany.name][contains]`). Resp: `id, number, firstName, lastName, fullName, email, phone, civility, jobTitle, customerCompany, billingAddress, deliveryAddress, differentDeliveryAddress, customFields, archived, isDeletable`.
- `POST /customers` — tout optionnel : `firstName, lastName, email, civility, phone, jobTitle, billingAddress{country,address,postCode,city}, differentDeliveryAddress, deliveryAddress (requis si different=true), customerCompany{id}, customFields`. `number` auto-généré.
- `GET|PUT|DELETE /customers/{id}` — PUT : idem + `archived` ; `customerCompany` = `{id}` ou `null` pour délier. DELETE seulement si aucun deal lié.

## Deals

- `GET /deals` — paginé : `page, itemsPerPage(def 10), archived, template, search` + filtres. ⚠️ le filtre `?template=1` est parfois ignoré par l'API : revérifier le flag `template` sur chaque résultat.
- `POST /deals` — **Req**: `name`. Opt: `customer{id}, owner{id}, archived, template, autoSave(def true), language("fr"/"en"), displayCurrencyFormat`. **Query `?createquotation=1`** → crée une quotation vide en même temps. Un deal **sans quotation n'apparaît PAS** dans la liste.
- `POST /deals/clone/{id}` — clone deal + quotations + lignes (+ blocs V2, ids de blocs préservés).
- `GET /deals/{id}` — Resp: `id, uid(UUID v7), number(D-YYYY-N), name, owner, customer, company, archived, template, language, contactFullName, opportunityAmountHt/Ttc, primaryQuotationId, primaryQuotationUuid, quotations[], presentations[]`.
- `PUT /deals/{id}` · `DELETE /deals/{id}` (soft delete).
- **Publics** : `GET /deals/uuid/{uuid}`, `GET /deals/custom-fields/{uuid}`, `GET /deals/pdf/{uuid}`.

## Quotations

- `GET /quotations` — paginé + `search` + filtres. Champs signature : `signed, signDate, signerFirstName/LastName/Email, signedPdfUrl`.
- `POST /quotations` — ⚠️ **nu → 500** (vérifié) : créer via `POST /deals?createquotation=1` ; 2ᵉ quotation d'un deal via `POST /quotations/{id}/clone` puis PUT sur le clone.
- `PUT /quotations/{id}` — **principal point de personnalisation**. Query `?bulk=1` → met aussi à jour les lignes. Opt: `title, description, customFields, validUntil, sections, discount, discountType(percentage/amount), signed, signerFirstName/LastName/Email, primaryQuotation, noCover, noLogo, legalNoticeText, legalMentionText, logo{id}, cover{id}`. ⚠️ `customFields` et `blocks` remplacent tout le dict/tableau : relire + fusionner.
- **Publics** : `GET /quotations/uuid/{quoteUuid}`, `GET /quotations/custom-fields/{quoteUuid}`, `GET /quotations/pdf/{dealUuid}/{quotationUuid}`.

## Quotation Lines

- `GET /quotation-lines/quote/{id}` — toutes les lignes d'une quotation triées par `weight` (préférer à `GET /quotation-lines`).
- `POST /quotation-lines` — **Req**: `quotation{id}, tax{id}, lineType, weight`. Opt: `title, productTitle, description(HTML), quantity(def 1), unitPrice(def 0), coef(def 1), discount(def 0), discountType(def percentage), option(def false), hide, product{id}, productPrice{id}, unity{id}, parent{id}, medias[{id}], customFields, subTotalConfig, blockId (rattachement bloc pricing V2)`.
- **`lineType`** ∈ `normal | title | subtotal` — ❌ `discount`, `product`, `text` n'existent pas (400). Remises : ligne `normal` à `unitPrice` négatif OU `discount`+`discountType` sur une ligne normale.
- Calcul : `baseTotal = unitPrice × quantity × coef` ; `totalHt = baseTotal − discount` (ou `× (1 − discount/100)`) ; `totalTtc = totalHt × (1 + taxRate)`. Totaux recalculés auto au PUT.
- `option: true` → badge « Option non incluse » (exclue du total principal). Image de ligne : `medias: [{id}]`. HTML inline accepté dans `title`.

## Quotation Status

- `GET /quotation-status` — Resp: `id, name, color, onAction`. POST/PUT : `name`(req), `color`, `onAction` ∈ `create | deal-sent | deal-signed | null` (**un seul statut par valeur** d'onAction).

## Products / Product Prices / Price Categories

- `GET /products` — filtres (`filters[active][eq]`, `filters[customFields.category][eq]`). Resp: `id, name, reference, description, active, archived, url, tips, customFields, unity, medias[], prices[]`.
- `POST /products` — **Req**: `name`. Opt: `reference, description, active(def true), archived, url, tips, customFields, unity{id}, medias[{id}]`.
- `PUT /products/{id}` — `prices:[{id, price, priceCategory{id}}]` met à jour par `id` seulement ; nouveaux prix via `/product-prices`. DELETE produit → supprime ses product-prices.
- `POST /product-prices` — **Req**: `priceCategory{id}, product{id}, price`. Opt: `tax{id}`. **1 seul prix par (produit × catégorie)** sinon 400.
- `POST /price-categories` — **Req**: `name`. Opt: `byDefault, tax{id}`. Paliers de volume = 1 catégorie nommée par palier (« 0-100 », « 100-500 », « 500+ »). DELETE → cascade sur ses product-prices.

## Taxes / Unities

- `GET /taxes` — Resp: `id, name, rate, byDefault`. POST **Req**: `name, rate` — **`rate` décimal 0–1**. DELETE → **409** si utilisée.
- `GET /unities` — Resp: `id, name, byDefault`. POST **Req**: `name` (« Unité », « Mois », « Heure », « Kg », « m² »…).

## Templates (modèles)

- `GET /templates` — query `type` + `filters[type][eq]`. Resp: `id, title, type, content, subject, byDefaultSendDeal`.
- `POST /templates` — **Req**: `title, type(email|notice|cgv), content(HTML)`. Opt: `subject (email), byDefaultSendDeal`. Variables : `{{quotation.reference}}`, `{{customer.firstName}}`, `{{customer.lastName}}`, `{{company.name}}`…

## Partage (V2)

- Le partage d'un devis V2 passe par la selling page par défaut (`/quotations/deal/{deal.uid}`) et par les `shareLinks` de la quotation (vue filtrée des blocs).

## Medias

- `POST /medias` — **Req**: `name, mime, folder` + `file` (base64 data URI) **ou** `fromUrl`. MIME : `image/jpeg|png|gif|webp|svg+xml`, `application/pdf`. ⚠️ `fromUrl` instable (500 sur beaucoup de CDN) → toujours passer par base64 (l'outil `upload_media` le fait). Limite ~4 Mo.
- `GET|PUT|DELETE /medias/{id}` — DELETE casse les références.

## Users / User Groups / Filter Views / Pins

- `GET /users/me` — profil de la clé + sa `company` (`apiKey` exposé ici : **toujours masquer**). `GET /users`, `POST /users` (admin : `email, password` req), `PUT /users/{id}` (`language, firstName, lastName, jobTitle, active`…). DELETE user **400 s'il possède ≥ 1 deal** (réassigner ou `active:false`).
- `/user-groups` — `name`, `permissions[]`.
- `/filter-views` — vues sauvegardées (scope `deals|customers|quotations|products`).
- `/pins` + `/comments/{uuid}` — commentaires épinglés (offsetX/Y, zoneId). Public : `GET /pins/quotation/{quotationUuid}`. Supprimer le **dernier** commentaire d'un pin supprime le pin.

## Webhooks (hors openapi.yaml)

- `GET /webhooks` — vérifié en réel le 23/07/2026 (200, `{data, meta}`). POST/PUT/DELETE déduits des conventions REST (contrat non documenté : en cas de 400, lire le message d'erreur pour les champs exacts).
