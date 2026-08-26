# Duodeal — skills pour Claude

Ce dépôt fournit **6 skills** qui donnent à Claude le savoir-faire Duodeal : embarquer un
nouveau compte, créer un devis, le rendre **design** (qualité selling page), manipuler les
**blocs V2**, et se repérer dans l'API.

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

Si le clone échoue, dis-le-moi clairement et arrête-toi — ne contourne pas.
```

<details>
<summary>English version of the same prompt</summary>

```
Install the Duodeal skills in this project. Do everything yourself, step by step:

1. Clone https://github.com/DuodealTeam/duodeal-skills-mcp into a temporary folder.
2. Copy the "skills/" folder from the clone into ".claude/skills/" at the root of
   my project (create the folder if it does not exist).
3. Copy the "CLAUDE.md" file from the clone to the root of my project. If I already
   have a CLAUDE.md, append the content at the end instead of overwriting it.
4. Delete the temporary folder.
5. List the skills you installed, and tell me whether the Duodeal MCP connector is
   properly connected to my Claude.

If the clone fails, tell me clearly and stop — do not work around it.
```

</details>

Puis redémarre Claude Code pour que les skills soient chargés.

Deux consignes du prompt sont là pour une raison, à garder si tu le reformules :
**« ajoute à la fin au lieu de l'écraser »** protège le `CLAUDE.md` que le client a déjà, et
**« dis-le-moi clairement et arrête-toi »** évite que Claude bricole une demi-installation
que le client croit réussie.

### En ligne de commande

```bash
claude plugin marketplace add DuodealTeam/duodeal-skills-mcp
```

```bash
claude plugin install duodeal@duodeal-marketplace
```

Mise à jour : `claude plugin marketplace update duodeal-marketplace`

> ℹ️ Dépôt **public** : aucun accès GitHub particulier n'est nécessaire.

## Les 6 skills

| Skill | Rôle |
| --- | --- |
| `duodeal-onboarding` | Premier lancement : connexion, questions de contexte, paramétrage du compte, écriture du `DUODEAL-CONTEXT.md`, premier template |
| `duodeal-mcp-best-practices` | Règles d'or et check-list de rendu : garder header + contacts natifs, blocs qui survivent à l'éditeur & au PDF, prix/devises, garde-fous d'écriture |
| `duodeal-quote-building` | Créer un devis de A à Z : client → deal → lignes → branding → CGV → les 2 liens à livrer |
| `duodeal-quote-design` | Devis **design** en HTML : design system, structure narrative, squelettes de blocs, reprise d'un devis existant, check-list de livraison (+ `references/`) |
| `duodeal-v2-blocks` | Le système de blocs V2 des selling pages et sa manipulation sans risque |
| `duodeal-api-reference` | Référence de l'API Duodeal : opérations, conventions, filtres, erreurs connues, et carte de ce que le connecteur sait vraiment faire (+ `references/`) |

Ils s'enchaînent : *quote-building* (créer) → *quote-design* (mettre en forme) →
*v2-blocks* (écrire) → *mcp-best-practices* (vérifier avant de livrer).

Le `CLAUDE.md` du dépôt est à **copier à la racine du projet du client** pour rendre les
garde-fous permanents : un `CLAUDE.md` livré dans un plugin n'est pas chargé
automatiquement (un plugin ne charge que des skills). Le skill `duodeal-onboarding` porte
la règle d'entrée de toute façon et se déclenche seul.

## Les outils (connecteur MCP officiel)

Le savoir-faire de ces skills s'appuie sur les outils du **connecteur MCP officiel
Duodeal** (serveur distant, OAuth). Il s'ajoute dans Claude via **Personnaliser →
Connecteurs** (voir la doc interne « Installer l'extension Duodeal dans Claude »). Une
fois le connecteur autorisé, ces skills disent à Claude comment l'utiliser
correctement.

Sans le connecteur, Claude a le savoir-faire mais aucune main sur le compte : c'est la
cause n°1 d'un premier essai qui ne produit rien.

## Statut

Ce paquet est passé de « serveur MCP local + skills » à **skills seuls**, pour s'appuyer
sur le connecteur officiel OAuth (aucune clé à gérer côté client). Les mentions d'outils
dans les skills sont alignées sur les noms exacts du connecteur officiel. Un serveur MCP
local (à clé) reste disponible hors dépôt comme repli pour Claude Code en ligne de
commande.

Les skills couvrent **uniquement la V2** (éditeur à blocs, selling pages) ; l'ancien
rendu V1 (deal-views, customFields d'affichage) a été retiré.
