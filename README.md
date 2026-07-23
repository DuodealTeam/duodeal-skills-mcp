# Plugin Duodeal pour Claude

Duodeal dans Claude, sur le modèle du plugin Make : **5 skills** de connaissance +
**1 serveur MCP** (57 outils) branché sur `https://api.duodeal.app/api`.

## Contenu

| Composant | Rôle |
|---|---|
| Skill `duodeal-api-reference` | Toute l'API : conventions, ~80 opérations, filtres, erreurs (+ `references/`) |
| Skill `duodeal-quote-building` | Créer un devis de A à Z : tenant → client → deal → lignes → liens |
| Skill `duodeal-quote-design` | Devis design en HTML (qualité selling page) : design system, structure narrative, squelettes de blocs inline-first, check-list de livraison |
| Skill `duodeal-v2-blocks` | Le système de blocs V2 (builderVersion 2) et sa manipulation sûre |
| Skill `duodeal-mcp-reference` | Configurer la connexion (profils multi-tenant) et dépanner |
| Serveur MCP `duodeal` | 57 outils : deals, quotations, lignes, blocs V2, clients, catalogue, médias, templates, custom fields, deal views, users, webhooks + `api_call` libre |

## Installation

Dans un terminal (ou en collant ces commandes à Claude Code) :

```bash
claude plugin marketplace add DuodealTeam/duodeal-plugin
claude plugin install duodeal@duodeal-marketplace
```

Mise à jour vers la dernière version :

```bash
claude plugin marketplace update duodeal-marketplace
```

## Prérequis

- Node ≥ 18 (serveur **zéro dépendance** — rien à installer).

## Configuration de la clé (première utilisation)

Le serveur démarre sans clé et explique quoi faire. Recommandé : créer
`~/.duodeal/config.json` avec un profil par tenant — modèle complet dans le skill
`duodeal-mcp-reference`. La clé vit dans un **fichier** (ex.
`…/demo-kit-automated-v3/.secrets/duodeal_api_key`), jamais en clair dans une config.

```json
{
  "activeProfile": "demo",
  "profiles": {
    "demo": { "apiKeyFile": "/chemin/vers/duodeal_api_key" }
  }
}
```

Changer de tenant : outil `use_profile`, vérification : `connection_status`.

## Sécurité

- Clés lues depuis des fichiers, masquées dans toutes les réponses, jamais loggées.
- `readOnly: true` par profil (ou `DUODEAL_READ_ONLY=1`) : écritures refusées —
  recommandé pour tout tenant client réel.
- Garde-fous d'écriture : `customFields` et blocs V2 fusionnés avec l'existant
  (jamais d'écrasement aveugle), `fields` de deal-view forcés en strings.

## Robustesse

Retries (réseau/429/5xx, backoff + jitter), rate limiting client (~4 req/s),
timeout 30 s, pagination automatique (`all: true`), erreurs enrichies de diagnostics
éprouvés (💡).

## Tests

```bash
node --test mcp-server/test/run-tests.mjs
```

16 tests (unitaires + intégration stdio réelle), sans réseau ni clé.

## Architecture

```
duodeal-plugin/
├── .claude-plugin/plugin.json      # manifeste
├── .mcp.json                       # déclaration du serveur (node …/mcp-server/index.mjs)
├── mcp-server/
│   ├── index.mjs                   # entrée stdio JSON-RPC
│   ├── lib/                        # rpc, config (profils), http (retries/rate limit), validate, util
│   ├── tools/                      # outils par domaine (deals, quotations, blocks, …)
│   └── test/run-tests.mjs
└── skills/                         # 4 skills (SKILL.md + references/)
```
