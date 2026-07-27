---
name: duodeal-api-reference
description: Référence de l'API REST Duodeal (api.duodeal.app) — auth X-API-KEY, conventions de payload, inventaire des ~80 opérations, filtres, pagination, erreurs récurrentes. Utiliser ce skill dès qu'on touche à l'API Duodeal ou aux outils MCP duodeal (POST/PUT/GET, debug 4xx/5xx, custom fields, médias, logos, templates, filtres), qu'on parle de deals, quotations, devis, selling pages ou Hot Deal Score côté API.
---

# API Duodeal — référence

Référence opérationnelle de l'API REST Duodeal, compilée depuis l'OpenAPI officiel
(~80 opérations) + les règles apprises sur le terrain. Le serveur MCP `duodeal` de ce
plugin expose les opérations courantes en outils prêts à l'emploi ; pour le reste,
l'outil `api_call` couvre tout endpoint.

## Fondamentaux

- **Base URL** : `https://api.duodeal.app/api` (override : env `DUODEAL_BASE_URL`)
- **Auth** : header `X-API-KEY: <uuid>` — l'UUID BRUT, **jamais** de préfixe `Bearer`
- **Content-Type** : `application/json` pour tous les POST/PUT
- **IDs** : entiers pour les ressources ; **UUID v7** pour les liens publics (deal `uid`, quotation `uuid`, pins)
- **Connexion** : gérée par le serveur MCP (profils multi-tenant) — vérifier avec l'outil `connection_status`, jamais afficher une clé

## Conventions de payload (valables partout)

- Réfs imbriquées : `{"entity": {"id": N}}` — jamais `entity_id`
- Dates ISO `YYYY-MM-DD` ; booléens JSON ; prix en nombre brut
- **Taux de TVA = décimal 0–1** (0.20 = 20 %, 0.055 = 5,5 %) — hors borne → 400
- HTML accepté dans `description`, `title`, custom fields `HtmlSimple`/`RichText` (sanitizé serveur)
- ⚠️ `PUT /quotations/{id}` avec `customFields` **remplace tout le dict** ; même piège avec `blocks` (V2). Les outils MCP `update_quotation` et `*_quotation_block` relisent et fusionnent — ne pas les contourner par un `api_call` PUT direct.

## Inventaire (vue d'ensemble)

| Catégorie | Endpoints | Outils MCP |
|---|---|---|
| Setup / lecture | `/taxes`, `/unities`, `/price-categories`, `/quotation-status`, `/users/me` | `list_taxes`, `list_unities`, `list_price_categories`, `get_me` |
| Deals | `/deals` (+`/deals/clone/{id}`) | `list_deals`, `get_deal`, `create_deal`, `update_deal`, `clone_deal`, `delete_deal` |
| Quotations | `/quotations` (+`/{id}/clone`) | `list_quotations`, `get_quotation`, `update_quotation`, `clone_quotation`, `get_links` |
| Lignes | `/quotation-lines` (+`/quote/{id}`) | `list_quotation_lines`, `create/update/delete_quotation_line` |
| Blocs V2 | via `PUT /quotations/{id}` (hors spec) | `get/add/update/delete_quotation_block`, `reorder_quotation_blocks`, `replace_quotation_block_text` — voir skill **duodeal-v2-blocks** |
| Clients | `/customer-companies`, `/customers` | `list/create_customer_company`, `list/create/update_customer` |
| Catalogue | `/products`, `/product-prices`, `/price-categories` | `list/create_product`, `create_product_price`, `create_price_category` |
| Custom fields | `/custom-fields` | `list/create_custom_field` |
| Médias | `/medias` | `upload_media` |
| Modèles | `/templates` (types `cgv`/`notice`/`email`) | `list_templates`, `ensure_template` |
| Org | `/users`, `/user-groups`, `/filter-views` | `get_me`, `list_users`, `create_user` |
| Webhooks | `/webhooks` (hors spec, vérifié 23/07/2026) | `list/get/create/update/delete_webhook` |
| Collab | `/pins`, `/comments/{uuid}` | via `api_call` |

Détail champ par champ (Req/Opt/Resp/pièges par endpoint) : lire
[references/endpoints.md](references/endpoints.md).
Erreurs récurrentes, règles de suppression, médias, logos : lire
[references/gotchas.md](references/gotchas.md).

## Filtres et recherche

- Filtres : `filters[<champ>][<op>]=<valeur>` — op ∈ `eq|neq|contains|startsWith|endsWith|gt|gte|lt|lte|like|in`. Champs relationnels (`customerCompany.name`) et custom fields (`customFields.<clé>`) supportés. Les outils MCP prennent un objet `filters: {"champ": {"op": valeur}}`.
- Recherche plein texte `?search=` sur Deals & Quotations (PostgreSQL FR/EN pondéré : name/number en haut, puis contact/client).
- Pagination : `page` + `itemsPerPage` (défaut 10). Réponses tantôt `[...]`, tantôt `{data: [...], meta: {currentPage, perPage, pages, total}}` — les outils MCP normalisent ; option `all: true` pour tout récupérer.

## Endpoints publics (sans clé)

`GET /deals/uuid/{uuid}`, `GET /deals/custom-fields/{uuid}`, `GET /deals/pdf/{uuid}`,
`GET /quotations/uuid/{quoteUuid}`, `GET /quotations/custom-fields/{quoteUuid}`,
`GET /pins/quotation/{quotationUuid}`.

## Vocabulaire des liens (à ne jamais confondre)

| Lien | URL | Usage |
|---|---|---|
| **Édition** (interne) | `https://duodeal.app/app/quotations/{dealId}/{quotationId}` | Éditeur **V2** (⚠️ pas `/app/deals/…`) |
| **Client / selling page** (défaut) | `https://duodeal.app/quotations/deal/{deal.uid}` | Envoyé au prospect ; le `deal.uid` suffit |
| Share link (V2) | `https://duodeal.app/quotations/share/{shareUuid}` | Partage alternatif (vue filtrée des blocs) |

Quand un devis est livré : **toujours donner les 2 liens** (client + édition) — l'outil
`get_links` les construit.

## Réflexes

1. Avant tout POST de ligne : `list_taxes` / `list_unities` du tenant ACTIF (les ids varient par tenant — ne jamais recycler ceux d'un autre compte).
2. Créations idempotentes : `create_tax`/`create_unity`/`create_price_category`/`ensure_template` réutilisent l'existant par défaut (pattern list → match → create).
3. Un deal **sans quotation n'apparaît pas** dans la liste → `create_deal` garde `createQuotation: true`.
4. `POST /quotations` nu → 500 : les devis naissent via `create_deal` ; une 2ᵉ quotation via `clone_quotation`.
5. Écritures : compte de test/démo uniquement, jamais un tenant client réel sans demande explicite.
6. En cas d'erreur inexpliquée : les messages du serveur MCP embarquent le diagnostic (💡) ; sinon consulter [references/gotchas.md](references/gotchas.md).
