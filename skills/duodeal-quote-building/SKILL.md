---
name: duodeal-quote-building
description: Flow complet de création d'un devis Duodeal de A à Z avec les outils MCP duodeal — setup du tenant, client, deal + quotation, lignes (sections, remises, options), branding, CGV/mentions légales, liens à livrer. Utiliser dès qu'il faut créer, dupliquer ou livrer un devis / une selling page Duodeal, partir d'un template, ou monter un catalogue produits.
---

# Créer un devis Duodeal de A à Z

Séquence éprouvée, avec les outils MCP du serveur `duodeal`. Deux points de départ :
**de zéro** (§1) ou **depuis un template** (§2 — préférer quand un template existe).
Pour un devis visuellement premium (selling page design, blocs HTML soignés), enchaîner
avec le skill **duodeal-quote-design** après l'étape de création.

## 0. Avant tout

1. `connection_status` — vérifier le tenant actif (company). Écritures : compte de test/démo uniquement.
2. `list_taxes` + `list_unities` (+ `list_price_categories` si catalogue) — récupérer les **ids de CE tenant**. Ne jamais recycler les ids d'un autre compte (cause n°1 de 400).

## 1. Flow complet from scratch

```
1. connection_status                    → tenant OK ?
2. list_taxes / list_unities            → ids requis
3. create_customer_company {name}       → entreprise cliente
4. create_customer {customerCompanyId, firstName, lastName, email}
5. create_deal {name, customerId}       → deal + quotation vide (createQuotation par défaut)
6. update_quotation                     → title, validUntil, customFields, logo/cover, legalNoticeText…
7. create_quotation_line (×N)           → lignes : title / normal / subtotal, avec weight croissant
8. ensure_template (cgv, notice)        → CGV + mentions légales réutilisables
9. get_links {dealId}                   → les 2 liens à livrer
```

Le résultat de `create_deal` contient déjà `links` (édition + client).

### Lignes — règles

- `weight` obligatoire et croissant (= ordre d'affichage).
- Structure type : ligne `title` (séparateur de section, HTML inline accepté :
  `<p><span style="font-size:18px;">Inclus dans notre offre</span></p>`), puis lignes
  `normal` (productTitle, unitPrice, quantity, unity, description HTML), puis `subtotal`.
- **Remises** : ligne `normal` à `unitPrice` négatif, OU `discount` + `discountType`
  (`percentage`/`amount`) sur la ligne — `lineType: "discount"` n'existe pas.
- `option: true` → badge « Option non incluse », exclue du total.
- Image de ligne : `upload_media` d'abord, puis `medias: [{id}]` dans le payload.
- Devis V2 (blocs) : passer `blockId` du bloc pricing dans le payload — voir skill
  **duodeal-v2-blocks**.

### Branding de la quotation

- `upload_media {url}` → `update_quotation {payload: {logo: {id}}}` (idem `cover`).
- `noLogo`/`noCover: true` seulement s'il n'y a RIEN à montrer (sinon conflit).

## 2. Partir d'un template (recommandé quand il existe)

```
1. list_deals {template: true, search: "..."}   → trouver le template (revérifier le flag
                                                  template sur chaque résultat, le filtre
                                                  API est parfois ignoré)
2. clone_deal {dealId}                          → copie complète (quotations, lignes, blocs V2)
3. update_deal {name, customerId}               → renommer, poser le client, template: false
4. update_quotation / outils blocs              → personnalisation
5. get_links                                    → livraison
```

**2ᵉ quotation sur un deal existant** : `clone_quotation` d'une quotation du deal,
puis `update_quotation` sur le clone (`title`, `primaryQuotation`…). `POST /quotations`
nu échoue (500).

## 3. Catalogue produits (si demandé)

```
create_price_category {name}            → idempotent (paliers volume : 1 catégorie/palier)
create_product {name, payload}          → fiche produit
create_product_price {productId, priceCategoryId, price}   → 1 seul prix par couple
```

Puis référencer dans les lignes : `product {id}`, `productPrice {id}`.

## 4. Custom fields (rendu V1 / données structurées)

1. `create_custom_field {name, label, type, scope}` — pour un CF quotation visible :
   `payload.options.display` ∈ `quotation_informations` (haut) / `quotation` (corps) /
   `quotation_validation` (signature).
2. Valeurs : `update_quotation {payload: {customFields: {clé: valeur}}}` — fusion automatique.
3. Visibilité dans la vue : `update_deal_view_fields` — **strings uniquement**
   (`custom_fields_quotation_<name>`), l'ordre de la liste = ordre d'affichage.

## 5. Livraison — toujours les 2 liens

`get_links {dealId}` renvoie :

- **clientLink** `…/quotations/deal/{uid}` — la selling page envoyée au prospect (default link)
- **editionLink** `…/app/quotations/{dealId}/{quotationId}` — l'éditeur V2 interne
  (⚠️ jamais `/app/deals/…` : c'est l'éditeur V1)

Ne pas confondre avec le share link (`/quotations/share/{uuid}`) ni le view link
(`create_deal_view_link` → `/deals/{uuid}/{uuid}`) — trois choses différentes.

## 6. Vérification finale

- `get_quotation {quotationId}` — relire le devis (blocs résumés par défaut).
- `list_quotation_lines {quotationId}` — contrôler ordre (weight), totaux, options.
- Un devis n'est « terminé » qu'après vérification visuelle réelle de la selling page
  (ouvrir le clientLink), pas sur la seule lecture de l'API.

## Modèles CGV / mentions légales / email

`ensure_template {title, type: cgv|notice|email, content}` — idempotent (match par titre,
PUT si contenu différent). Variables : `{{quotation.reference}}`, `{{customer.firstName}}`,
`{{company.name}}`… Les emails portent `subject` + `byDefaultSendDeal`.
