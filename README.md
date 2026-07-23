# Plugin Duodeal pour Claude

**Pilotez Duodeal en langage naturel.** Ce plugin connecte Claude à votre compte
Duodeal : créez des deals et des devis, personnalisez-les jusqu'au design de la
selling page, récupérez les liens à envoyer à vos prospects — en une conversation.

Il réunit deux choses :

- **Un serveur MCP** : 57 outils branchés sur l'API Duodeal (deals, devis, lignes,
  blocs V2, clients, catalogue, médias, modèles, webhooks…), avec garde-fous
  intégrés — impossible d'écraser par accident le travail fait dans l'éditeur.
- **5 skills** : le savoir-faire Duodeal que Claude charge au bon moment — référence
  complète de l'API, méthode de création d'un devis de A à Z, **création de devis
  design en HTML** (qualité selling page), système de blocs V2, configuration de la
  connexion.

## Exemples de ce que vous pouvez demander

> « Crée un devis pour Acme à partir de mon template Site vitrine, mets Jeanne
> Dupont en contact, et donne-moi le lien à lui envoyer. »

> « Transforme le devis Q-2026-0042 en proposition design : intro avec nos deux
> logos, points de valeur, FAQ, et un récap avec l'abonnement mensuel. »

> « Liste mes devis signés ce mois-ci. »

> « Ajoute une remise de 10 % sur la ligne Maintenance du devis 4512. »

> « Sur quel compte Duodeal suis-je connecté ? »

## Installation

> ℹ️ Ce dépôt est **privé** : votre compte GitHub doit avoir été invité par
> l'équipe Duodeal, et git doit être connecté à ce compte sur votre machine.

Deux commandes, dans un terminal (ou collées telles quelles à Claude Code) :

```bash
claude plugin marketplace add DuodealTeam/duodeal-plugin
claude plugin install duodeal@duodeal-marketplace
```

**Prérequis** : [Claude Code](https://claude.com/claude-code) (CLI ou app de bureau)
et Node.js ≥ 18. Le serveur MCP est **sans aucune dépendance** : rien d'autre à
installer.

## Première connexion

Le plugin démarre sans clé et vous guide. Le plus simple : demandez à Claude

> « Configure ma connexion Duodeal. »

Il créera pour vous `~/.duodeal/config.json`, avec votre clé API stockée dans un
**fichier local** — jamais dans la conversation, jamais dans une config en clair :

```json
{
  "activeProfile": "production",
  "profiles": {
    "production": { "apiKeyFile": "/chemin/vers/votre/fichier_cle_api" }
  }
}
```

Plusieurs comptes (production, test…) ? Déclarez un profil par compte et changez à
la volée : « passe sur le profil test » (`use_profile`). Vérifiez à tout moment le
compte actif : « sur quel compte suis-je ? » (`connection_status`).

## Ce qu'il y a dedans

### Les 5 skills

| Skill | Ce que Claude sait faire grâce à lui |
|---|---|
| `duodeal-api-reference` | Toute l'API Duodeal : ~80 opérations, conventions, filtres, erreurs connues et leurs corrections |
| `duodeal-quote-building` | La méthode complète d'un devis : client → deal → lignes → branding → CGV → les 2 liens à livrer |
| `duodeal-quote-design` | Les devis **design** : design system à vos couleurs, structure narrative (accroche → problème → solution → preuve → prix → action), squelettes HTML éprouvés, check-list de livraison |
| `duodeal-v2-blocks` | Le système de blocs V2 des selling pages, et sa manipulation sans risque |
| `duodeal-mcp-reference` | La configuration de la connexion, les profils multi-comptes, le dépannage |

### Les 57 outils du serveur MCP

| Domaine | Outils |
|---|---|
| Connexion | `connection_status` · `list_profiles` · `use_profile` |
| Deals | lister, lire, créer, modifier, cloner (templates), supprimer |
| Devis | lister, lire, modifier, cloner, supprimer + `get_links` (lien client + lien édition) |
| Lignes | lister, créer, modifier, supprimer (sections, remises, options, images) |
| Blocs V2 | lire (résumé ou complet), ajouter, modifier, réordonner, éditer un texte ciblé, supprimer |
| Clients | contacts et entreprises clientes : lister, créer, modifier |
| Catalogue | produits, prix, catégories de prix, taxes, unités (créations **idempotentes** : jamais de doublon) |
| Médias | upload d'images sécurisé (logo, cover, images de lignes) |
| Modèles | CGV, mentions légales, emails (`ensure_template`) |
| Champs personnalisés | définitions + visibilité dans les vues |
| Équipe | profil du compte, utilisateurs, création d'utilisateur |
| Webhooks | lister, créer, modifier, supprimer |
| Passe-partout | `api_call` : n'importe quel endpoint de l'API, avec les mêmes protections |

## Sécurité et garde-fous

- **Votre clé API ne circule jamais** : lue depuis un fichier local, masquée dans
  toutes les réponses, jamais écrite dans les logs ni la conversation.
- **Mode lecture seule** disponible par profil (`"readOnly": true`) : toutes les
  écritures sont alors refusées — utile pour explorer sans risque.
- **Anti-écrasement** : les champs personnalisés et les blocs V2 sont toujours
  relus puis **fusionnés** avant écriture. Le travail fait en parallèle dans
  l'éditeur Duodeal est préservé.
- **Robustesse** : nouvelles tentatives automatiques en cas d'erreur réseau ou de
  saturation (backoff progressif), limitation du débit côté client (~4 requêtes/s),
  délai d'attente de 30 s, messages d'erreur avec le diagnostic et la correction (💡).

## Mise à jour

```bash
claude plugin marketplace update duodeal-marketplace
```

## Dépannage express

| Symptôme | Que faire |
|---|---|
| « Aucune clé API Duodeal configurée » | Demander à Claude : « configure ma connexion Duodeal » |
| Erreur 401 | La clé est l'UUID brut, sans préfixe. Vérifier avec « sur quel compte suis-je ? » |
| « Mode lecture seule actif » | Voulu : retirer `"readOnly": true` du profil pour écrire |
| Le serveur n'apparaît pas | Vérifier `node --version` (≥ 18), puis relancer la session |

Le skill `duodeal-mcp-reference` contient le guide complet — demandez simplement à
Claude ce qui ne va pas.

## Sous le capot (pour les développeurs)

```
duodeal-plugin/
├── .claude-plugin/          # manifeste + marketplace
├── .mcp.json                # déclaration du serveur MCP
├── mcp-server/
│   ├── index.mjs            # entrée stdio JSON-RPC (zéro dépendance, Node ≥ 18)
│   ├── lib/                 # transport, config multi-profils, client HTTP
│   │                        #   (retries, rate limiting), validation, utilitaires
│   ├── tools/               # 57 outils, groupés par domaine métier
│   └── test/                # tests unitaires + intégration stdio
└── skills/                  # 5 skills (SKILL.md + références détaillées)
```

Lancer les tests (aucun réseau, aucune clé nécessaires) :

```bash
node --test mcp-server/test/run-tests.mjs
```

## Support

Une question, un souci d'installation ? Contactez votre interlocuteur Duodeal
habituel.
