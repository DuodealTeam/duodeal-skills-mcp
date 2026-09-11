# Keeping the Duodeal skills up to date

These skills are **copied** out of the public repo, not cloned: the install prompt clones
into a temporary folder, copies `skills/`, then deletes the clone. There is therefore **no
git remote on the client's machine and nothing to `git pull`** — refreshing means redoing
that copy. Left alone, an install silently stays on the version of the day it was made
(one client ran for two weeks on skills frozen at 2026-08-26).

Two mechanisms cover this, and the second exists because the first can fail.

## 1. The automatic refresh (installed with the skills)

`.claude/duodeal-skills-update.sh`, run by a `SessionStart` hook in
`.claude/settings.json`. Past **7 days** it re-downloads the skills, rewrites the date —
so the counter restarts and the check **recurs every week**, it is not a one-shot — and
prints one line. Under 7 days it says nothing and costs ~15 ms.

It only ever deletes the `duodeal-*` folders, never another skill of the user's, and
nothing is deleted before the replacement is proven to exist. It always exits 0: a failed
update never breaks the session. It also replaces itself, so a fix reaches every client.

**If it fails** (no network, no `git`, folder not writable) it says so instead of staying
silent, and does not advance the date — the warning comes back every session until it is
fixed.

⚠️ Skills are loaded when a session starts, so a refresh applies from the **next** session.

**If the hook is absent** — an install made before this mechanism existed, or one where the
user removed it — put it back: copy `install/duodeal-skills-update.sh` from the repo into
`.claude/`, make it executable, and add the hook to `.claude/settings.json` with the
**absolute** path (merge, never overwrite; and never `"once": true`, which would delete the
hook after a single run).

## 2. The rule carried by the skills themselves

The safety net, and the only thing that reaches a client installed before the hook.

## The stamp

`DUODEAL-CONTEXT.md`, at the root of the user's project, carries one line:

```
Skills Duodeal : mises à jour le 2026-09-11 (v0.4.0)
```

- Written by **duodeal-onboarding** when it creates the file.
- **Rewritten after every refresh** — with the day the refresh actually ran, never a
  guessed date.
- Missing line → treat it as "never refreshed" and offer the update.

## The rule

At the **start of a session** where a Duodeal skill fires, read that line. **More than 7
days old, or absent → offer the refresh in one sentence before working.**

- Ask **once per session**. If the user says no, work with what is installed and do not
  bring it up again that session.
- Never refresh silently: it rewrites files inside the user's project.
- The user is often not a developer — say what it does in plain words ("I re-download the
  latest version of your Duodeal skills"), not in git vocabulary.

## The refresh

1. Clone `https://github.com/DuodealTeam/duodeal-skills-mcp` into a temporary folder.
2. **Delete only the `duodeal-*` folders** under `.claude/skills/` — so a skill renamed or
   removed upstream does not survive as a stale copy. ⚠️ Never touch any other skill in
   that folder: it belongs to the user, not to us.
3. Copy `skills/*` from the clone into `.claude/skills/`.
4. `CLAUDE.md` of the clone → the project root. If the user already has one, **append** —
   never overwrite. If a previous Duodeal section is already there, replace that section
   only.
5. Delete the temporary folder.
6. Update the stamp line in `DUODEAL-CONTEXT.md` with today's date and the version read
   from the clone's `.claude-plugin/plugin.json`.
7. Tell the user what changed, and that Claude Code must be restarted for the skills to
   reload.

**Never touched by a refresh**: `DUODEAL-CONTEXT.md` (apart from the stamp line) and
anything the user wrote themselves. If the clone fails, say so plainly and stop — working
around it leaves a half-installed set that looks fine.
