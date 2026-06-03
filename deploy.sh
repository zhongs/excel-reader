#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
DIST_DIR="$ROOT_DIR/dist"
DEPLOY_BRANCH="gh-pages"
REMOTE_NAME="origin"

echo "Building the project..."
npm run build

if [ ! -d "$DIST_DIR" ]; then
  echo "Build output directory '$DIST_DIR' not found. Did the build succeed?" >&2
  exit 1
fi

REMOTE_URL=$(git -C "$ROOT_DIR" config --get remote.$REMOTE_NAME.url || true)
if [ -z "$REMOTE_URL" ]; then
  echo "Git remote '$REMOTE_NAME' is not configured. Please set it before deploying." >&2
  exit 1
fi

TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

echo "Preparing deploy artifacts..."
cp -R "$DIST_DIR"/. "$TMP_DIR"/

pushd "$TMP_DIR" >/dev/null
git init
git checkout -b "$DEPLOY_BRANCH"
git add -A
git commit -m "Deploy to GitHub Pages"

echo "Pushing to $DEPLOY_BRANCH..."
git remote add "$REMOTE_NAME" "$REMOTE_URL"
git push -f "$REMOTE_NAME" "HEAD:$DEPLOY_BRANCH"
popd >/dev/null

echo "Deployment complete."
