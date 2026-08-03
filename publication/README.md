# Public Roadmap Publication Contract

This directory contains only deliberately public roadmap data and its validation contract.

## Current State

The public-data layer is scaffolded but inactive. No `public-roadmap.json` has been approved or
generated, and the live `site/` remains unchanged.

## Files

- `public-roadmap.schema.json`: machine-readable contract for sanitized publication data.
- `public-roadmap.json`: intentionally absent until the public initiative subset has been reviewed.

## Lifecycle

1. Receive a reviewed, sanitized roadmap dataset.
2. Validate it against `public-roadmap.schema.json` and the public-content checks.
3. Review the dataset diff for intended public fields and initiative IDs.
4. Build the site from the committed public dataset.
5. Publish through a pull request after validation succeeds.

The public repository does not contain internal selection notes, source-repository provenance,
rejected candidates, decision history, or private synchronization logic.

Run `python scripts/validate_public_content.py` from the repository root to validate the public
content boundary and current publication files.
