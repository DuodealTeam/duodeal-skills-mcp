# Duodeal — skills pour Claude

Ce dépôt fournit **5 skills** qui donnent à Claude le savoir-faire Duodeal : créer un
devis, le rendre **design** (qualité selling page), manipuler les **blocs V2**, et se
repérer dans l'API.

> **Ce dépôt ne contient que les skills** (le savoir-faire). Les **outils** Duodeal
> (créer un deal, un devis, des lignes, des blocs…) sont fournis séparément par le
> **connecteur MCP officiel Duodeal** (OAuth). Les skills guident Claude pour bien
> l'utiliser.

## Installation

```bash
claude plugin marketplace add DuodealTeam/duodeal-plugin
```

```bash
claude plugin install duodeal@duodeal-marketplace
```

> ℹ️ Dépôt **privé** : ton compte GitHub doit avoir été invité par l'équipe Duodeal.

## Les 5 skills

| Skill | Rôle |
| --- | --- |
| `duodeal-api-reference` | Référence de l'API Duodeal : opérations, conventions, filtres, erreurs connues (+ `references/`) |
| `duodeal-quote-building` | Créer un devis de A à Z : client → deal → lignes → branding → CGV → les 2 liens à livrer |
| `duodeal-quote-design` | Devis **design** en HTML : design system, structure narrative, squelettes de blocs, check-list de livraison (+ `references/`) |
| `duodeal-v2-blocks` | Le système de blocs V2 des selling pages et sa manipulation sans risque |
| `duodeal-mcp-reference` | La connexion Duodeal et le dépannage |

## Les outils (connecteur MCP officiel)

Le savoir-faire de ces skills s'appuie sur les outils du **connecteur MCP officiel
Duodeal** (serveur distant, OAuth). Il s'ajoute dans Claude via **Personnaliser →
Connecteurs** (voir la doc interne « Installer l'extension Duodeal dans Claude »). Une
fois le connecteur autorisé, ces skills disent à Claude comment l'utiliser
correctement.

## Statut

Repositionnement en cours : ce paquet est passé de « serveur MCP local + skills » à
**skills seuls**, pour s'appuyer sur le connecteur officiel OAuth (aucune clé à gérer
côté client). Les mentions d'outils dans les skills seront alignées sur les noms exacts
du connecteur officiel. Un serveur MCP local (à clé) reste disponible hors dépôt comme
repli pour Claude Code en ligne de commande.
