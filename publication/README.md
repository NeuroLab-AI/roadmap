# Public Roadmap Publication Contract

This directory contains only the deliberately public, sanitized roadmap contract.

## Active Publication

- Version: `0.4.0`
- Status: Draft for Review
- Public initiatives: 15
- Development stages: 4
- Categories: 7

`public-roadmap.json` is generated from an owner-approved selection in the private
`neurolab-docs-and-brand` repository. The same generated document is committed at
`site/data/public-roadmap.json` so GitHub Pages can serve it directly.

## Files

- `public-roadmap.schema.json`: machine-readable public contract.
- `public-roadmap.json`: sanitized publication data reviewed in repository diffs.

The two repositories intentionally have different responsibilities. Private selection rationale,
unselected candidates, source provenance, and synchronization logic stay in the private repository.
Only approved presentation fields cross into this public repository.

## Publishing Checks

Run `python scripts/validate_public_content.py` from the repository root. The validator confirms:

- the public and served JSON documents are identical;
- stages, categories, initiative IDs, and global sequence are internally consistent;
- no private-only fields or files crossed the repository boundary; and
- the GitHub Pages application loads the generated dataset.
