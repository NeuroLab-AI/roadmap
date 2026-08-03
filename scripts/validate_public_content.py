#!/usr/bin/env python3
"""Validate that the public roadmap repository contains public-only publication data."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
PUBLICATION_DIR = ROOT / "publication"
SCHEMA_PATH = PUBLICATION_DIR / "public-roadmap.schema.json"
DATA_PATH = PUBLICATION_DIR / "public-roadmap.json"

REQUIRED_SITE_FILES = (
    "site/index.html",
    "site/styles.css",
    "site/assets/neurolab-wordmark.png",
    "site/assets/neural-brain-hero.webp",
)

FORBIDDEN_PUBLIC_PATHS = (
    "docs/current-publication-baseline.md",
    "docs/current-publication-baseline.json",
    "docs/publication-architecture.md",
    "publication/selection.json",
    "publication/registry-snapshot.json",
    "publication/schemas/selection.schema.json",
    "publication/schemas/registry-snapshot.schema.json",
)

FORBIDDEN_KEYS = {
    "sourceRepository",
    "sourcePath",
    "sourceCommit",
    "sourceSha256",
    "sourceBlob",
    "internalNotes",
    "decisionHistory",
    "intakeNotes",
    "rawRegistry",
}

CANDIDATE_ID_RE = re.compile(r"^[A-Z]{2,4}-[0-9]{2}$")
TOKEN_RE = re.compile(r"\{\{[a-z_]*\}\}")


def load_json(path: Path) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise ValueError(f"Missing required JSON file: {path.relative_to(ROOT)}") from exc
    except json.JSONDecodeError as exc:
        raise ValueError(f"Invalid JSON in {path.relative_to(ROOT)}: {exc}") from exc
    if not isinstance(value, dict):
        raise ValueError(f"Expected a JSON object in {path.relative_to(ROOT)}")
    return value


def find_forbidden_key(value: Any, trail: str = "$") -> str | None:
    if isinstance(value, dict):
        for key, child in value.items():
            if key in FORBIDDEN_KEYS:
                return f"{trail}.{key}"
            found = find_forbidden_key(child, f"{trail}.{key}")
            if found:
                return found
    elif isinstance(value, list):
        for index, child in enumerate(value):
            found = find_forbidden_key(child, f"{trail}[{index}]")
            if found:
                return found
    return None


def validate_repository_boundary() -> None:
    for relative in FORBIDDEN_PUBLIC_PATHS:
        if (ROOT / relative).exists():
            raise ValueError(f"Internal publication file present in public repository: {relative}")

def validate_site() -> None:
    for relative in REQUIRED_SITE_FILES:
        path = ROOT / relative
        if not path.is_file() or path.stat().st_size == 0:
            raise ValueError(f"Missing or empty public site file: {relative}")

    for path in (ROOT / "site").rglob("*"):
        if not path.is_file() or path.suffix.lower() not in {".html", ".css", ".js", ".json"}:
            continue
        text = path.read_text(encoding="utf-8")
        if TOKEN_RE.search(text):
            raise ValueError(f"Unreplaced template token in {path.relative_to(ROOT)}")


def validate_public_data(data: dict[str, Any]) -> None:
    if data.get("schemaVersion") != "1.0.0":
        raise ValueError("Unsupported public roadmap schemaVersion")
    publication = data.get("publication")
    categories = data.get("categories")
    if not isinstance(publication, dict):
        raise ValueError("public roadmap publication must be an object")
    if not isinstance(categories, list) or not categories:
        raise ValueError("public roadmap categories must be a non-empty array")

    forbidden_key = find_forbidden_key(data)
    if forbidden_key:
        raise ValueError(f"Private-only key present in public roadmap data: {forbidden_key}")

    category_ids: set[str] = set()
    category_orders: set[int] = set()
    initiative_ids: set[str] = set()
    for category in categories:
        if not isinstance(category, dict):
            raise ValueError("Every public category must be an object")
        category_id = category.get("id")
        category_order = category.get("order")
        initiatives = category.get("initiatives")
        if not isinstance(category_id, str) or not category_id:
            raise ValueError("Every public category requires an ID")
        if category_id in category_ids:
            raise ValueError(f"Duplicate public category ID: {category_id}")
        if not isinstance(category_order, int) or category_order < 1 or category_order in category_orders:
            raise ValueError(f"Invalid or duplicate category order: {category_order}")
        if not isinstance(initiatives, list) or not initiatives:
            raise ValueError(f"Public category {category_id} requires initiatives")
        category_ids.add(category_id)
        category_orders.add(category_order)

        initiative_orders: set[int] = set()
        for initiative in initiatives:
            if not isinstance(initiative, dict):
                raise ValueError(f"Public category {category_id} has an invalid initiative")
            candidate_id = initiative.get("id")
            initiative_order = initiative.get("order")
            if not isinstance(candidate_id, str) or not CANDIDATE_ID_RE.fullmatch(candidate_id):
                raise ValueError(f"Invalid public initiative ID: {candidate_id}")
            if candidate_id in initiative_ids:
                raise ValueError(f"Public initiative selected more than once: {candidate_id}")
            if (
                not isinstance(initiative_order, int)
                or initiative_order < 1
                or initiative_order in initiative_orders
            ):
                raise ValueError(
                    f"Invalid or duplicate initiative order in {category_id}: {initiative_order}"
                )
            initiative_ids.add(candidate_id)
            initiative_orders.add(initiative_order)


def main() -> int:
    try:
        load_json(SCHEMA_PATH)
        validate_repository_boundary()
        validate_site()
        if DATA_PATH.exists():
            validate_public_data(load_json(DATA_PATH))
            print("Sanitized public roadmap data is present and valid")
        else:
            print("Public roadmap data is not activated; existing inline site remains authoritative")
    except (OSError, ValueError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1

    print("Public repository boundary is valid")
    print("Required GitHub Pages files are present")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
