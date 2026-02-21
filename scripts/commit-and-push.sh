#!/usr/bin/env bash
set -euo pipefail
MSG=${1:-"chore: snapshot commit - update workspace"}
git add -A
git commit -m "$MSG"
git push origin main
