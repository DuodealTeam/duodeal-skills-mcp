# Pièges, erreurs récurrentes et règles métier

## Erreurs récurrentes et fixes

| Symptôme | Cause | Fix |
|---|---|---|
| 401 Unauthorized | `X-API-KEY` vide / préfixé | juste l'UUID ; vérifier `connection_status` |
| 400 quotation-line | `tax.id`/`unity.id` inexistant sur CE tenant | `list_taxes` / `list_unities` puis reprendre les vrais ids |
| 400 ligne remise | `lineType:"discount"` n'existe pas | `lineType:"normal"` + `unitPrice` négatif **ou** `discount`/`discountType` |
| 400 tax | `rate` hors [0,1] | décimal (0.20, pas 20) |
| 409 DELETE tax | tax utilisée | ne pas supprimer / réassigner |
| 500 `/medias` fromUrl | CDN refusé | base64 (outil `upload_media`) |
| 500 `/medias` base64 | fichier > 4 Mo | fournir une image plus légère |
| 500 `POST /quotations` | création nue non supportée | `create_deal` (createQuotation) ou `clone_quotation` |
| CF invisible dans l'UI | `options.display` manquant OU deal-view en dicts | `update_deal_view_fields` (STRINGS) + hard reload |
| Logo tenant ignoré | data URI au lieu de PNG brut | `PUT /companies/{id}` avec `setLogo` = PNG base64 BRUT |
| Liste vide d'un GET | réponse `{data:[]}` non déballée | les outils MCP normalisent (`data/items/results/records/rows`) |
| Filtre sans effet | syntaxe | `filters[champ][op]=valeur` |

## Règles de suppression / dépendances

- `isDeletable` : customer-company supprimable **sans customer lié** ; customer **sans deal lié**.
- User non supprimable s'il **possède un deal** (réassigner / `active:false`).
- Tax non supprimable si **utilisée** (409).
- Cascades : price-category → ses product-prices ; product → ses product-prices ; deal-view → ses links ; dernier commentaire d'un pin → supprime le pin.
- Deal **sans quotation** = invisible dans la liste.
- DELETE `/medias/{id}` casse les références existantes (produits/devis).

## Médias — upload d'images

1. **Jamais `fromUrl`** (500 sur Cloudinary, Shopify, S3…) — télécharger puis poster en base64 data URI (l'outil `upload_media` fait tout : téléchargement UA navigateur, détection MIME, contrôle 4 Mo).
2. Limite ~**4 Mo** ; au-delà l'API répond 500. Pas de redimensionnement automatique dans le plugin : fournir une image plus légère.
3. MIME acceptés : png, jpeg, gif, webp, svg+xml, pdf.

## Logo / Cover — 2 chemins distincts

- **Par-quotation** (affiché sur la selling page) : `upload_media` → `update_quotation {logo: {id}}` (idem `cover`). Règle `noLogo`/`noCover` : ne les mettre `true` que s'il n'y a RIEN à montrer, sinon conflit (ni logo ni cover affichés).
- **Tenant** (Settings → Compagnie) : `PUT /companies/{id}` avec `setLogo`/`setCover` en **PNG base64 BRUT** (un data URI est silencieusement ignoré). `"setLogo": "remove"` supprime. **Ne jamais écraser un branding existant** : vérifier avant, ne définir que si absent.

## Custom fields — affichage

- Un CF de quotation ne s'affiche sur la page publique que si sa **définition** existe sur le tenant.
- Ordre d'affichage V1 : le **poids des définitions**, dans deux zones (`options.display` : `quotation_informations` = avant le tableau, `quotation` = après).
- Patcher les valeurs sur une quotation : `update_quotation {customFields: {clé: valeur}}` — clé = **nom** du CF (pas l'id) ; fusion automatique par l'outil.

## Sécurité / hygiène

- Clés API : lues depuis des fichiers (`<tenant>_api_key`, `.secrets/`), jamais affichées, jamais loggées, jamais dans le `.env` d'un autre projet.
- Écritures : compte de test/démo uniquement — jamais un tenant client réel sans demande explicite.
- Ne jamais écraser des settings tenant existants (logo, bannière…) : ne les définir que s'ils sont absents.
- Actions de masse (tous les templates, tous les deals…) : jamais sans validation explicite du périmètre.
