# Keeping the Duodeal skills up to date

These skills are **copied** out of the public repo, not cloned: the install prompt clones
into a temporary folder, copies `skills/`, then deletes the clone. There is therefore **no
git remote on the client's machine and nothing to `git pull`** — refreshing means redoing
that copy. Left alone, an install silently stays on the version of the day it was made
(one client ran for two weeks on skills frozen at 2026-08-26).

Two mechanisms cover this, and the second exists because the first can fail.

## 1. The automatic refresh (installed with the skills)

`.claude/duodeal-skills-update.sh`, run by **two** hooks in `.claude/settings.json`:
`SessionStart` and `UserPromptSubmit`. Both are needed — `SessionStart` only fires when a
session starts, so a session someone keeps open for weeks would never be refreshed;
`UserPromptSubmit` fires on every message. A failed refresh warns **once a day**, not at
every message. Past **7 days** it re-downloads the skills, rewrites the date —
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
`.claude/`, make it executable, and add BOTH hooks to `.claude/settings.json` with the
**absolute** path, each passing its own event name as the argument (merge, never overwrite;
and never `"once": true`, which would delete the hook after a single run).

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

**The procedure lives in one place: [`install/PROCEDURE.md`](https://github.com/DuodealTeam/duodeal-skills-mcp/blob/main/install/PROCEDURE.md)
in the public repo.** Follow it as written — it covers the skills, the `CLAUDE.md`, the two
hooks, the stamp and the context line, and it is the same procedure a fresh install uses,
so the two can never drift apart.

Do not improvise a shorter version from memory: the step everyone skips is installing the
auto-update hooks, and skipping it is exactly what leaves a client frozen for weeks.

**Never touched by a refresh**: `DUODEAL-CONTEXT.md` (apart from its stamp line) and
anything the user wrote themselves. If the clone fails, say so plainly and stop — working
around it leaves a half-installed set that looks fine.
