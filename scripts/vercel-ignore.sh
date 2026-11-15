#!/usr/bin/env bash
#
# Vercel "Ignored Build Step" for this monorepo.
#
#   exit 0 → skip the build      exit 1 → build
#
# Usage (paths are relative to the project's Root Directory, which is where
# Vercel runs this):
#
#   Invitation (root dir "."):          bash scripts/vercel-ignore.sh . ':!apps'
#   Scanner    (root dir apps/scanner): bash ../../scripts/vercel-ignore.sh .
#
# Why not just `git diff HEAD^ HEAD`: that only looks at the newest commit, so
# pushing three commits at once ignores the first two. Instead this compares
# against the commit of the last successful deployment
# (VERCEL_GIT_PREVIOUS_SHA). Vercel clones with --depth=10, so if that commit
# is not in the clone we build rather than guess.

set -u

paths=("$@")
[ ${#paths[@]} -eq 0 ] && paths=(.)

head="${VERCEL_GIT_COMMIT_SHA:-HEAD}"
base="${VERCEL_GIT_PREVIOUS_SHA:-}"

echo "[ignore] project dir: $(pwd)"
echo "[ignore] watching:    ${paths[*]}"

if [ -z "$base" ]; then
  # First deployment of this project, or a redeploy without history.
  base="$(git rev-parse "$head^" 2>/dev/null || true)"
  echo "[ignore] no previous deployment sha; comparing with parent commit"
fi

if [ -z "$base" ] || ! git cat-file -e "$base^{commit}" 2>/dev/null; then
  echo "[ignore] base commit ${base:-<none>} not in the shallow clone → building"
  exit 1
fi

echo "[ignore] comparing $base..$head"
changed="$(git diff --name-only "$base" "$head" -- "${paths[@]}")"

if [ -z "$changed" ]; then
  echo "[ignore] no relevant changes → skipping build"
  exit 0
fi

echo "[ignore] changed files:"
echo "$changed" | sed 's/^/  - /'
echo "[ignore] → building"
exit 1
