---
description: Publish the public Duodeal skills — bump the version, commit, push, and hand back the team's update prompt
---

Ship the current state of the public skills to `DuodealTeam/duodeal-skills-mcp`, the repo behind
the `duodeal` plugin that the team and our clients install.

**The version bump is the reason this command exists.** Claude Code tracks this plugin by the
`version` string in `.claude-plugin/plugin.json`, not by the commit. Push without bumping it and
`claude plugin update` answers *"already at the latest version"* to every person who runs it:
they keep the old skills, and nothing anywhere tells them. Measured 12/09/2026 — the repo was
current, the whole team was still on 0.4.2. The internal repo does not have this failure mode
(it declares no `version`, so it is tracked by commit sha); this one does, and only this step
prevents it.

Steps:
1. `git status --short` and `git diff --stat` to see what changed since the last push. If
   nothing changed, say so and stop.
2. Show me a one-line summary of what will be published and which skills it touches.
3. **Bump `version` in `.claude-plugin/plugin.json`, in the same commit as the change.** Read
   the current value rather than assuming it, then:
   - a skill **added or removed** → minor (`0.4.2` → `0.5.0`)
   - anything else — a rule, a fix, a reference file, the README → patch (`0.4.2` → `0.4.3`)
   - never leave it untouched. A push with an unchanged version reaches nobody.
   Tell me old → new. (History to match: 0.2.0 and 0.3.0 and 0.4.0 each added a skill; 0.4.1
   and 0.4.2 were rule fixes. `fa85154` added a skill on a patch — that is the mistake, not
   the convention.)
4. Safety check before staging: `git status --short | grep -i secret` must be empty, and no API
   key, client name or account id may enter this repo — these skills install on client machines.
5. `git add -A`, then commit with a message describing what got BETTER for whoever uses the
   skills (not "update files"). End it with the Co-Authored-By trailer for the Claude model you
   are currently running as (e.g. `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`) —
   never hardcode an older model name.
6. `git push`.
7. Confirm the short hash and the new version, then hand me this, ready to paste to the team:

   > Update my Duodeal plugins to the latest published version.
   >
   > Run these in order (skip any that report the plugin isn't installed, and say which you skipped):
   >
   > `claude plugin marketplace update duodeal-marketplace`
   > `claude plugin update duodeal@duodeal-marketplace`
   > `claude plugin marketplace update duodeal-internal-marketplace`
   > `claude plugin update duodeal-internal@duodeal-internal-marketplace`
   >
   > Important: the plugin@marketplace form is required — the bare plugin name fails with "not found".
   >
   > Then tell me which plugins actually moved (old version → new version), and remind me to
   > restart Claude Code for it to take effect.

A client who installed the skills as a COPY (no git remote) does not update this way: that is
`install/PROCEDURE.md` and the `duodeal-skills-update.sh` hooks. This command is for the team.
