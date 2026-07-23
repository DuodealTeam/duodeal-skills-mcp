---
name: duodeal-v2-blocks
description: Système de blocs V2 des quotations Duodeal (builderVersion 2) — modèle de données, types de blocs (wysiwyg, html, pricing, header, faq…), contrat REST hors spec, outils MCP de manipulation sûre, API JS DuoDeal des blocs html, check-list anti-écrasement. Utiliser dès qu'on lit/écrit des blocs, convertit un devis en V2, construit une micro-app html dans un devis, ou débogue un rendu V2.
---

# Blocs V2 des quotations Duodeal

En V2, une quotation n'est plus rendue via deal-view + customFields mais comme une
**liste ordonnée de `blocks`** (`builderVersion: 2`), éditée dans l'éditeur par blocs.
Contrat vérifié empiriquement — **rien n'est dans openapi.yaml** (spec antérieure à la V2).

## Modèle de données

Sur la quotation : `builderVersion: 2`, `blocks: [...]` (+ `groupId`/`versionNumber`
pour le versioning). Chaque bloc :

```json
{"id": "<UUID>", "type": "wysiwyg", "version": 1, "visible": true,
 "title": "", "showTitle": true, "layout": {"columns": 1, "rows": 1}, "data": {...}}
```

`data` par type — principaux :

| Type | data | Notes |
|---|---|---|
| `wysiwyg` | `{columns: [html]}` | Rendu inline — équivalent V2 d'un CF HtmlSimple |
| `html` | `{code, state}` | **iframe sandboxée**, API JS `window.DuoDeal` injectée — **finir par `DuoDeal.autoResize()`** |
| `header` | `{cover, noCover, logo, noLogo}` | |
| `pricing` | `{discountEnabled, discount, discountType, columns}` | Les lignes s'y rattachent via `blockId` |
| `customfields` | `{fields: [noms]}` | |
| `legalnotice` | `{companyName, legalText, other…}` | |
| `faq` | `{items: [{id, question, answer}]}` | **Texte BRUT** (interpolation `{{ }}`, pas de v-html) — le HTML s'affiche littéralement |
| `contacts` | `[]` | |

Types connus : header, contacts, wysiwyg, html, pricing, customfields, attachments,
legalnotice, paymentschedule, pdfviewer, youtube, faq, pptx, googleslides, canva,
gallery, accept, signstamp, pagebreak.

## Contrat REST (hors spec) et outils MCP

- **Lecture** : `GET /quotations/{id}` → clé `blocks`. Outils : `get_quotation_blocks`
  (résumés par défaut, `full: true` pour tout), `get_quotation_block` (un bloc complet).
- **Écriture** : `PUT /quotations/{id}` avec `{builderVersion: 2, blocks: [...]}` —
  ⚠️ **le tableau envoyé REMPLACE tout** (même piège que customFields). L'éditeur V2 est
  utilisé en parallèle par l'équipe : un PUT aveugle écrase leur travail. **Toujours
  passer par les outils MCP**, qui relisent puis fusionnent :
  - `add_quotation_block` {quotationId, type, data, title?, position?} — génère l'id UUID
  - `update_quotation_block` {quotationId, blockId, data (fusionné clé à clé), …}
  - `replace_quotation_block_text` {quotationId, blockId, path, find?, replace} — édition
    ciblée par chemin pointé (`code`, `columns.0`, `items.2.answer`) dans les gros blocs
  - `delete_quotation_block`, `reorder_quotation_blocks` (liste COMPLÈTE des ids)
- Les `id` de blocs sont des **UUID générés côté client**, persistés tels quels
  (`clone_deal` les préserve).
- **Lignes ↔ pricing** : chaque quotation-line se rattache au bloc pricing via `blockId`
  (payload de `create/update_quotation_line`). Sans `blockId`, les lignes retombent sur le
  **premier** bloc pricing — indispensable seulement avec plusieurs blocs pricing. Si on
  remplace le bloc pricing, re-rattacher les lignes.
- Un devis créé par l'API naît `builderVersion: 1, blocks: null` ; le premier écrit de
  bloc le bascule en V2. Passer en V2 ne casse pas le rendu V1 (coexistence).
- `quotation.shareLinks` = remplaçant des DealView/DealViewLink en V2 (vue filtrée des blocs).

## API JS des blocs `html` (micro-apps)

Le `code` tourne dans une iframe sandboxée avec `window.DuoDeal` :

- `DuoDeal.deal / .quotation / .lines / .customFields` — lecture des données du devis
- `DuoDeal.onUpdate(cb)` — re-render sur édition du pricing en live
- `DuoDeal.get/set/update/getData/setData` — état persisté par bloc (`data.state`)
- `DuoDeal.formatCurrency(n)` / `formatDate(d)` / `autoResize()`

**Toujours finir par `autoResize()`** — sinon l'iframe garde sa hauteur par défaut
(espace blanc ou contenu coupé). Les outils MCP émettent un ⚠️ si l'appel manque.

## Check-list avant d'écrire des blocs

1. Tenant de test/démo uniquement ; étiqueter « à supprimer » ce qui est jetable.
2. `get_quotation_blocks` d'abord — comprendre l'existant avant de toucher.
3. Ne JAMAIS pousser un tableau `blocks` partiel via `api_call` — les outils blocs fusionnent.
4. Sections riches → `wysiwyg` ; code interactif/logos → `html` (+ `autoResize()`).
5. Ne pas embarquer de spacers (`<div style="height:71px">…`) : chaque bloc gère son
   espacement — le spacer devient une bande blanche en haut de carte.
6. `faq` : texte brut uniquement.
7. Vérifier le rendu dans l'éditeur V2 (lien `editionLink` de `get_links`).

## Structure de référence (validée — Onboarding Agent)

Ordre canonique d'un devis V2 généré : 1) `header` (cover native, `noLogo: true`) ·
2) bloc `html` logos émetteur + client côte à côte · 3) 1 bloc `wysiwyg` par section
(couverture, votre projet, qui sommes-nous, gamme, vidéo, galerie, investissement) ·
4) `pricing` (lignes rattachées par `blockId`) · 5) wysiwyg post-tableau (modalités,
témoignages, FAQ, contact) · 6) `contacts` puis `legalnotice`. Ne pas modifier cette
structure de référence sans accord explicite.
