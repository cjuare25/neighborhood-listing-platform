#!/usr/bin/env bash

set -euo pipefail

if [[ -z "${VERCEL_TOKEN:-}" ]]; then
  echo "ROLLBACK_FAILED: VERCEL_TOKEN is required." >&2
  exit 1
fi

if [[ -z "${VERCEL_ORG_ID:-}" ]]; then
  echo "ROLLBACK_FAILED: VERCEL_ORG_ID is required." >&2
  exit 1
fi

if [[ -z "${VERCEL_PROJECT_ID:-}" ]]; then
  echo "ROLLBACK_FAILED: VERCEL_PROJECT_ID is required." >&2
  exit 1
fi

if [[ ! -f ".vercel/project.json" ]]; then
  echo "ROLLBACK_FAILED: the Vercel project must be linked before rollback." >&2
  exit 1
fi

echo "ROLLBACK_STARTED: restoring the previous production deployment."

npx --yes vercel@65.12.1 rollback \
  --token "$VERCEL_TOKEN" \
  --scope "$VERCEL_ORG_ID" \
  --no-color

npx --yes vercel@65.12.1 rollback status \
  --token "$VERCEL_TOKEN" \
  --scope "$VERCEL_ORG_ID" \
  --no-color

echo "ROLLBACK_COMPLETED: Vercel reported the rollback status successfully."