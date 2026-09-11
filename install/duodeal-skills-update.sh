#!/usr/bin/env bash
# Duodeal skills — keep the local copy fresh.
#
# Run by a SessionStart hook in <project>/.claude/settings.json. The skills are a COPY of
# the public repo with no git remote behind them, so nothing refreshes them on its own.
# This script re-copies them whenever they are more than MAX_AGE_DAYS old — the stamp is
# rewritten at each refresh, so the check recurs every week, it is not a one-shot — and it
# shouts when it cannot. A silent staleness is what let a client work five weeks on rules
# we had already fixed.
#
# It never fails a session: every path exits 0. The worst case is a warning.
#
# The project folder is not known in advance: the hook is installed with this script's
# ABSOLUTE path, and the script derives the project root from its own location.

set -uo pipefail

# $1 = the hook event this runs under. Passed as an argument rather than read from the
# stdin payload: a script that reads stdin hangs when someone runs it by hand.
EVENT="${1:-SessionStart}"

MAX_AGE_DAYS=7
REPO="https://github.com/DuodealTeam/duodeal-skills-mcp"

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"   # <project>/.claude
ROOT="$(dirname "$HERE")"                               # <project>
SKILLS="$HERE/skills"
STAMP="$HERE/.duodeal-skills-stamp"
CONTEXT="$ROOT/DUODEAL-CONTEXT.md"

JSON='import json,sys; print(json.dumps({"systemMessage":sys.argv[1],"hookSpecificOutput":{"hookEventName":sys.argv[3],"additionalContext":sys.argv[2]}},ensure_ascii=False))'

say() {  # $1 = message shown to the user, $2 = context injected for Claude
  python3 -c "$JSON" "$1" "$2" "$EVENT" 2>/dev/null || printf '%s\n' "$1"
  exit 0
}

stamp_get() { [ -f "$STAMP" ] && sed -n "s/^$1=//p" "$STAMP" | head -1; }

stamp_set() {  # rewrite one key, keep the others
  tmp=$(mktemp 2>/dev/null) || return 0
  { [ -f "$STAMP" ] && grep -v "^$1=" "$STAMP"; printf '%s=%s\n' "$1" "$2"; } > "$tmp" 2>/dev/null
  mv "$tmp" "$STAMP" 2>/dev/null || rm -f "$tmp"
}

# Under UserPromptSubmit this runs at EVERY message, so a failure must not shout at every
# message: warn once a day, then stay quiet until tomorrow. The date is never advanced on
# failure, so the warning does come back.
warn() {
  [ "$(stamp_get warned)" = "$today" ] && exit 0
  stamp_set warned "$today"
  say "$1" "$2"
}

# Refuse to run inside the repository itself: it would mistake it for a client project and
# overwrite its own source with the published version. (Learned the hard way.)
[ -d "$ROOT/.git" ] && [ -f "$ROOT/.claude-plugin/plugin.json" ] && exit 0

today=$(date +%Y-%m-%d)
today_s=$(date +%s)

# --- how old is the current copy? --------------------------------------------
stamp_date=$(stamp_get date)

if [ -n "$stamp_date" ]; then
  stamp_s=$(date -j -f %Y-%m-%d "$stamp_date" +%s 2>/dev/null \
         || date -d "$stamp_date" +%s 2>/dev/null || echo 0)
  age=$(( (today_s - stamp_s) / 86400 ))
else
  age=9999   # no stamp = never refreshed since the day it was installed
fi

[ "$age" -lt "$MAX_AGE_DAYS" ] && exit 0   # fresh: silent, costs milliseconds

# --- refresh ------------------------------------------------------------------
old_version=$(stamp_get version)
shown_date=${stamp_date:-inconnue}
stale="⚠️ Vos skills Duodeal datent du $shown_date ($age jours) et n'ont PAS pu être mises à jour"
ctx="The Duodeal skills in this project are stale (last refreshed: ${stamp_date:-unknown}). Say so to the user in one line, then work with what is installed."

command -v git >/dev/null 2>&1 || warn "$stale : git n'est pas installé sur ce poste." "$ctx"

TMP=$(mktemp -d 2>/dev/null) || warn "$stale : dossier temporaire impossible à créer." "$ctx"
trap 'rm -rf "$TMP"' EXIT

git clone --quiet --depth 1 "$REPO" "$TMP/repo" 2>/dev/null \
  || warn "$stale : le téléchargement a échoué (réseau ?). Demandez à Claude « mets à jour mes skills Duodeal »." "$ctx"

# Nothing is deleted before the replacement is proven to exist.
ls -d "$TMP"/repo/skills/duodeal-* >/dev/null 2>&1 \
  || warn "$stale : le dépôt téléchargé ne contient pas les skills attendues." "$ctx"

mkdir -p "$SKILLS" || warn "$stale : le dossier .claude/skills n'est pas accessible en écriture." "$ctx"

# Only our own folders: anything else under .claude/skills belongs to the user.
rm -rf "$SKILLS"/duodeal-* 2>/dev/null
cp -R "$TMP"/repo/skills/duodeal-* "$SKILLS"/ 2>/dev/null || warn "$stale : la copie a échoué." "$ctx"

# The script replaces itself too, so a fix made here reaches every client on its own.
# ⚠️ Via a temp file + mv, NEVER a cp straight over itself: bash reads a script in chunks
# and keeps reading at the same byte offset, so overwriting the running file makes it
# resume inside the NEW content — mid-function, mid-string. `mv` in the same directory is
# a rename: it swaps the directory entry while the running shell keeps the old inode.
if cp "$TMP/repo/install/duodeal-skills-update.sh" "$HERE/.dd-update.new" 2>/dev/null; then
  chmod +x "$HERE/.dd-update.new" 2>/dev/null
  mv -f "$HERE/.dd-update.new" "$HERE/duodeal-skills-update.sh" 2>/dev/null \
    || rm -f "$HERE/.dd-update.new" 2>/dev/null
fi

new_version=$(sed -n 's/.*"version": "\([^"]*\)".*/\1/p' "$TMP/repo/.claude-plugin/plugin.json" 2>/dev/null | head -1)
new_version=${new_version:-inconnue}

printf 'date=%s\nversion=%s\n' "$today" "$new_version" > "$STAMP"   # also clears 'warned'

# Keep the human-readable line in sync — it is the one the skills themselves read.
if [ -f "$CONTEXT" ] && grep -q '^Skills Duodeal : mises à jour le' "$CONTEXT" 2>/dev/null; then
  sed -i.ddbak "s|^Skills Duodeal : mises à jour le .*$|Skills Duodeal : mises à jour le $today (v$new_version)|" \
    "$CONTEXT" 2>/dev/null && rm -f "$CONTEXT.ddbak"
fi

# ⚠️ Skills load when the session starts: the new ones apply from the NEXT session.
if [ -n "$old_version" ] && [ "$old_version" != "$new_version" ]; then
  say "🔄 Skills Duodeal mises à jour (v$old_version → v$new_version). Elles seront chargées au prochain démarrage de Claude." \
      "The Duodeal skills were just refreshed to v$new_version, but THIS session still has the previous ones (v$old_version) loaded. Mention it in one line if the user hits something the skills should already cover."
else
  say "🔄 Skills Duodeal rafraîchies (v$new_version, à jour au $today)." \
      "The Duodeal skills were just refreshed from the public repo (v$new_version)."
fi
