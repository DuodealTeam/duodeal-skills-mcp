---
name: duodeal-mcp-reference
description: Configuration et dépannage du serveur MCP Duodeal du plugin — connexion par profils multi-tenant (~/.duodeal/config.json), variables d'environnement (DUODEAL_API_KEY_FILE, DUODEAL_PROFILE, DUODEAL_READ_ONLY), sécurité des clés, résolution des pannes (serveur absent, 401, clé non configurée, rate limit). Utiliser quand l'utilisateur parle de « connecter Duodeal », « changer de tenant/compte », « le MCP Duodeal ne répond pas », « configurer la clé », ou pour toute question sur le fonctionnement du serveur.
---

# Serveur MCP Duodeal — configuration et dépannage

Le plugin embarque un serveur MCP stdio **zéro dépendance** (Node ≥ 18) qui expose ~57
outils sur `https://api.duodeal.app/api`. Auth par header `X-API-KEY` ; la clé est lue
depuis un fichier — **jamais en clair dans une config, jamais affichée dans le chat**.

## Résolution de la clé (ordre de priorité)

1. env `DUODEAL_API_KEY` — clé inline (déconseillé)
2. env `DUODEAL_API_KEY_FILE` — chemin d'un fichier contenant la clé
3. **profil actif** de `~/.duodeal/config.json` (recommandé, multi-tenant)

Sans clé, le serveur démarre quand même : chaque appel d'outil renvoie la marche à
suivre. `initialize` et `tools/list` fonctionnent toujours.

## Configuration recommandée — profils multi-tenant

Créer `~/.duodeal/config.json` :

```json
{
  "activeProfile": "demo",
  "profiles": {
    "demo": {
      "apiKeyFile": "/Users/felix/Documents/Duodeal/demo-kit-automated-v3/.secrets/duodeal_api_key",
      "note": "Duodeal Demo (company 231) — écritures de test OK"
    },
    "stagein": {
      "apiKeyFile": "/Users/felix/Documents/Duodeal/stagein_api_key",
      "readOnly": true,
      "note": "STAGE'IN Ltd (company 8) — compte client : lecture seule"
    },
    "noura": {
      "apiKeyFile": "/Users/felix/Documents/Duodeal/noura_api_key",
      "readOnly": true,
      "note": "Noura — compte client : lecture seule"
    },
    "hubspot": {
      "apiKeyFile": "/Users/felix/Documents/Duodeal/hubspot_tenant_api_key",
      "readOnly": true,
      "note": "Duodeal (company 6) — connecté HubSpot : lecture seule"
    }
  }
}
```

Champs par profil : `apiKeyFile` (ou `apiKey` inline, déconseillé), `readOnly`,
`baseUrl` (défaut `https://api.duodeal.app/api`), `appUrl` (défaut
`https://duodeal.app`), `note`.

**Bonne pratique** : `readOnly: true` sur tous les tenants clients réels ; les écritures
restent réservées aux comptes de test/démo.

## Changer de tenant

- `list_profiles` — voir les profils et l'actif
- `use_profile {name}` — bascule immédiate (sans redémarrage), puis `connection_status`
  pour confirmer la company
- Une clé collée dans le chat → l'écrire immédiatement dans son fichier
  `<tenant>_api_key` et référencer ce fichier dans un profil ; ne jamais la laisser
  dans la conversation ni la mettre dans le `.env` d'un autre projet.

## Variables d'environnement (config MCP du plugin)

| Variable | Rôle |
|---|---|
| `DUODEAL_API_KEY_FILE` | Chemin du fichier de clé (prioritaire sur les profils) |
| `DUODEAL_API_KEY` | Clé inline (déconseillé) |
| `DUODEAL_PROFILE` | Force un profil (verrouille `use_profile`) |
| `DUODEAL_READ_ONLY` | `1` = toutes les écritures refusées |
| `DUODEAL_BASE_URL` | Autre API (défaut `https://api.duodeal.app/api`) |
| `DUODEAL_APP_URL` | Autre front pour les liens (défaut `https://duodeal.app`) |
| `DUODEAL_MIN_INTERVAL_MS` | Intervalle min entre requêtes (défaut 250 ms) |

## Robustesse intégrée

- **Retries** : 3 tentatives supplémentaires sur erreur réseau, 429, 502/503/504
  (backoff exponentiel + jitter, `Retry-After` respecté) ; jamais de retry sur 4xx.
- **Rate limiting** client : requêtes sérialisées, ≥ 250 ms d'intervalle (~4 req/s).
- **Timeout** : 30 s par requête.
- **Pagination** : `all: true` sur les outils de liste — suit `meta.pages`, borné à 50 pages.
- **Garde-fous** : fusion `customFields`/`blocks` avant PUT, `fields` de deal-view en
  strings, validation des enums (lineType, discountType, taux TVA 0–1), clés masquées
  dans toutes les réponses (`apiKey` → `•••masquée•••`).

## Dépannage

| Symptôme | Cause probable | Fix |
|---|---|---|
| Serveur absent de la liste MCP | Node introuvable, ou plugin pas rechargé | `node --version` (≥ 18) ; recharger la session |
| « Aucune clé API Duodeal configurée » | Ni env ni profil | Créer `~/.duodeal/config.json` (modèle ci-dessus) |
| « Fichier de clé introuvable » | Chemin faux dans le profil | Corriger `apiKeyFile` (chemin absolu) |
| 401 | Mauvaise clé / préfixe | La clé est l'UUID brut ; `connection_status` pour identifier le compte |
| « Mode lecture seule actif » | `readOnly` du profil ou `DUODEAL_READ_ONLY=1` | Voulu pour les tenants clients ; basculer sur le profil démo pour écrire |
| « Profil verrouillé » | `DUODEAL_PROFILE` posé en env | Retirer la variable de la config MCP |
| Lenteur sur grosses listes | Rate limit client (4 req/s) | Normal ; réduire avec `itemsPerPage` + filtres plutôt que `all` |
| Tester le serveur à la main | — | `node <plugin>/mcp-server/index.mjs` puis coller une ligne JSON-RPC `initialize` ; tests auto : `node --test <plugin>/mcp-server/test/run-tests.mjs` |

## Ce que le serveur ne fait pas

- Pas de redimensionnement d'images (limite API 4 Mo : fournir une image légère).
- Pas d'envoi d'emails — l'envoi du devis se fait dans l'app Duodeal ou via Make.
- Les webhooks (`/webhooks`) sont hors spec officielle : `GET` vérifié en réel,
  POST/PUT déduits des conventions (le serveur le signale dans ses réponses).
