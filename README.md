# Duodeal — skills pour Claude

Ce dépôt fournit **5 skills** qui donnent à Claude le savoir-faire Duodeal : créer un
devis, le rendre **design** (qualité selling page), manipuler les **blocs V2**, et se
repérer dans l'API.

> **Ce dépôt ne contient que les skills** (le savoir-faire). Les **outils** Duodeal
> (créer un deal, un devis, des lignes, des blocs…) sont fournis séparément par le
> **connecteur MCP officiel Duodeal** (OAuth). Les skills guident Claude pour bien
> l'utiliser.

## Installation

Le plus simple, sans rien taper dans un terminal : ouvre Claude Code dans le dossier de
ton projet et colle ce message.

```
Installe les skills Duodeal dans ce projet. Fais tout toi-même, étape par étape :

1. Clone https://github.com/DuodealTeam/duodeal-skills-mcp dans un dossier temporaire.
2. Copie le dossier "skills/" du clone vers ".claude/skills/" à la racine de mon
   projet (crée le dossier s'il n'existe pas).
3. Copie le fichier "CLAUDE.md" du clone à la racine de mon projet. S'il y a déjà
   un CLAUDE.md, ajoute le contenu à la fin au lieu de l'écraser.
4. Supprime le dossier temporaire.
5. Liste-moi les skills installés, et dis-moi si le connecteur MCP Duodeal est
   bien connecté à mon Claude.
```

Puis redémarre Claude Code pour que les skills soient chargés.

### En ligne de commande

```bash
claude plugin marketplace add DuodealTeam/duodeal-skills-mcp
```

```bash
claude plugin install duodeal@duodeal-marketplace
```

Mise à jour : `claude plugin marketplace update duodeal-marketplace`

> ℹ️ Dépôt **public** : aucun accès GitHub particulier n'est nécessaire.

## Les 5 skills

| Skill | Rôle |
| --- | --- |
| `duodeal-api-reference` | Référence de l'API Duodeal : opérations, conventions, filtres, erreurs connues (+ `references/`) |
| `duodeal-quote-building` | Créer un devis de A à Z : client → deal → lignes → branding → CGV → les 2 liens à livrer |
| `duodeal-quote-design` | Devis **design** en HTML : design system, structure narrative, squelettes de blocs, check-list de livraison (+ `references/`) |
| `duodeal-v2-blocks` | Le système de blocs V2 des selling pages et sa manipulation sans risque |
| `duodeal-mcp-best-practices` | Règles d'or et check-list de rendu : garder header + contacts natifs, blocs qui survivent à l'éditeur & au PDF, prix/devises, garde-fous d'écriture |

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

Les skills couvrent **uniquement la V2** (éditeur à blocs, selling pages) ; l'ancien
rendu V1 (deal-views, customFields d'affichage) a été retiré.
