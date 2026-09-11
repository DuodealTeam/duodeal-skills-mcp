# Installer ou mettre à jour les skills Duodeal

**Pour Claude.** Ce fichier est la procédure unique : une première installation et une mise
à jour suivent les mêmes étapes. Applique-les dans le projet où l'utilisateur travaille —
c'est le dossier courant. Si tu n'as pas de dossier de projet, demande-le plutôt que d'en
choisir un en silence, et redonne toujours le **chemin absolu** utilisé.

Dépôt **public**, aucun accès GitHub particulier n'est nécessaire :
`https://github.com/DuodealTeam/duodeal-skills-mcp`

---

## 1. Récupérer la dernière version

Clone le dépôt dans un dossier temporaire.

**Si le clone échoue, dis-le clairement et arrête-toi.** Ne contourne pas : une
demi-installation ressemble à une installation réussie, et l'utilisateur croira travailler
avec des règles à jour.

## 2. Les skills

- Dans `.claude/skills/`, supprime **uniquement** les dossiers commençant par `duodeal-`
  (sinon une skill renommée ou retirée en amont survit en double).
- ⚠️ **Ne touche à aucune autre skill de ce dossier** : elle appartient à l'utilisateur.
- Copie `skills/*` du clone vers `.claude/skills/` (crée le dossier s'il n'existe pas).

## 3. Le `CLAUDE.md`

Copie le `CLAUDE.md` du clone à la racine du projet. **S'il en existe déjà un, ajoute à la
fin — ne l'écrase jamais** : il peut porter les règles propres de l'utilisateur. Si une
section Duodeal y figure déjà, remplace cette section-là seulement.

## 4. La mise à jour automatique

Sans elle, l'installation se fige au jour où elle a été faite : les skills sont une
**copie**, sans dépôt git derrière, donc rien ne les rafraîchit tout seul.

a. Copie `install/duodeal-skills-update.sh` du clone vers `.claude/` et rends-le
   exécutable.

b. Dans `.claude/settings.json` (crée-le s'il n'existe pas ; **s'il existe, fusionne sans
   rien supprimer** de ce qui s'y trouve), ajoute ces **deux** hooks, en remplaçant
   `<RACINE>` par le chemin **absolu** du projet :

```json
{
  "hooks": {
    "SessionStart": [
      { "hooks": [ { "type": "command", "timeout": 60,
        "command": "<RACINE>/.claude/duodeal-skills-update.sh SessionStart" } ] }
    ],
    "UserPromptSubmit": [
      { "hooks": [ { "type": "command", "timeout": 60,
        "command": "<RACINE>/.claude/duodeal-skills-update.sh UserPromptSubmit" } ] }
    ]
  }
}
```

Les deux sont nécessaires : `SessionStart` ne se déclenche qu'au démarrage, donc une session
gardée ouverte plusieurs semaines ne serait jamais rafraîchie ; `UserPromptSubmit` se
déclenche à chaque message. Le script sort en ~15 ms quand les skills sont fraîches, il ne
coûte donc rien.

🚫 **Ne mets jamais `"once": true`** : cette option supprime le hook après un seul passage.

c. Écris `.claude/.duodeal-skills-stamp` avec exactement deux lignes — c'est ce fichier qui
   porte le compteur des 7 jours :

```
date=<la date du jour, AAAA-MM-JJ>
version=<la valeur "version" lue dans .claude-plugin/plugin.json du clone>
```

## 5. Le fichier de contexte

Si `DUODEAL-CONTEXT.md` existe à la racine, mets à jour (ou ajoute juste après la première
ligne) :

```
Skills Duodeal : mises à jour le <date du jour> (v<version>)
```

**Ne touche à rien d'autre dans ce fichier** : il contient le contexte client, écrit au fil
des sessions.

## 6. Ranger, puis rendre compte

Supprime le dossier temporaire, puis dis à l'utilisateur :

1. la liste des skills installées ;
2. que la mise à jour automatique est en place (elle repassera au maximum tous les 7 jours,
   et l'avertira si elle échoue) ;
3. **qu'il doit redémarrer Claude Code** pour que les skills soient chargées ;
4. si le **connecteur MCP Duodeal** est bien connecté à son Claude — sans lui, les skills
   donnent le savoir-faire mais aucune main sur le compte, et c'est la cause n°1 d'un
   premier essai qui ne produit rien.
