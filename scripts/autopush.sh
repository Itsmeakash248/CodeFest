#!/usr/bin/env bash
# Checkpoint pusher for the hackathon build.
# Commits only app/plan files, never .env.local or docs/.
set -u

cd /home/akash/Documents/CodeFest || exit 1

exec 9>"/tmp/opencode/viewpilot-autopush.lock"
flock -n 9 || { echo "autopush already running"; exit 0; }

PATHS=(.gitignore .env.example README.md BATTLEPLAN.md AGENT2-BRIEF.md package.json package-lock.json next.config.ts tsconfig.json eslint.config.mjs public src scripts)

echo "autopush started $(date -Is)" >> /tmp/opencode/autopush.log

while true; do
  sleep 240

  git add -A -- "${PATHS[@]}" 2>/dev/null || true

  if git diff --cached --quiet; then
    continue
  fi

  stamp=$(date +"%H:%M")
  if git commit -m "chore: checkpoint ${stamp}" >/dev/null 2>&1; then
    if git push origin main >/dev/null 2>&1; then
      echo "$(date -Is) pushed checkpoint ${stamp}" >> /tmp/opencode/autopush.log
    elif git pull --rebase --autostash origin main >/dev/null 2>&1 && git push origin main >/dev/null 2>&1; then
      echo "$(date -Is) rebased and pushed checkpoint ${stamp}" >> /tmp/opencode/autopush.log
    else
      echo "$(date -Is) commit ${stamp} created, push failed" >> /tmp/opencode/autopush.log
    fi
  fi
done
