#!/usr/bin/env python3
"""Validate the public-only roadmap contract and GitHub Pages application."""

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
SITE_DATA_PATH = ROOT / "site" / "data" / "public-roadmap.json"

REQUIRED_SITE_FILES = (
    "site/index.html",
    "site/styles.css",
    "site/app.js",
    "site/data/public-roadmap.json",
    "site/assets/neurolab-wordmark.png",
    "site/assets/neural-brain-hero.webp",
)

FORBIDDEN_PUBLIC_PATHS = (
    "docs/current-publication-baseline.md",
    "docs/current-publication-baseline.json",
    "docs/publication-architecture.md",
    "publication/selection.json",
    "publication/registry-snapshot.json",
    "publication/review-inventory.json",
    "publication/schemas/selection.schema.json",
    "publication/schemas/registry-snapshot.schema.json",
)

FORBIDDEN_KEYS = {
    "sourceRepository",
    "sourcePath",
    "sourceCommit",
    "sourceSha256",
    "sourceBlob",
    "registryHeading",
    "internalNotes",
    "decisionHistory",
    "intakeNotes",
    "rawRegistry",
    "privateRationale",
    "reviewNotes",
}

PUBLICATION_KEYS = {"title", "version", "status", "releasedOn"}
STAGE_KEYS = {"id", "title", "order", "description"}
CATEGORY_KEYS = {"id", "title", "abbreviation", "visualToken", "order"}
INITIATIVE_KEYS = {
    "id",
    "categoryId",
    "sequence",
    "stage",
    "visibility",
    "title",
    "outcome",
    "maturity",
    "confidence",
    "horizon",
    "details",
}
DETAIL_KEYS = {
    "currentFoundation",
    "primaryUserValue",
    "dependencies",
    "validationGate",
    "claimBoundary",
}
VISIBILITY_VALUES = {"primary", "supporting", "details-only"}
CANDIDATE_ID_RE = re.compile(r"^[A-Z]{2,4}-[0-9]{2}$")
SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
TARGET_WINDOW_ID_RE = re.compile(r"^q([1-4])-(20[0-9]{2})$")
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


def require_exact_keys(value: dict[str, Any], expected: set[str], label: str) -> None:
    actual = set(value)
    if actual != expected:
        raise ValueError(
            f"{label} fields do not match the public contract; "
            f"missing={sorted(expected - actual)}, extra={sorted(actual - expected)}"
        )


def require_text(value: Any, label: str, nullable: bool = False) -> None:
    if nullable and value is None:
        return
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"{label} must be non-empty text")


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

    index = (ROOT / "site" / "index.html").read_text(encoding="utf-8")
    script = (ROOT / "site" / "app.js").read_text(encoding="utf-8")
    if 'src="./app.js"' not in index:
        raise ValueError("site/index.html does not load the roadmap application")
    if '"./data/public-roadmap.json"' not in script:
        raise ValueError("site/app.js does not load the generated public roadmap data")
    visible_copy = (index + "\n" + script).lower()
    for phrase in ("current foundation", "near term", "mid term", "future direction", "development era"):
        if phrase in visible_copy:
            raise ValueError(f"Superseded relative-era copy remains in the public site: {phrase}")


def validate_public_data(data: dict[str, Any]) -> None:
    if data.get("schemaVersion") != "2.0.0":
        raise ValueError("Unsupported public roadmap schemaVersion")
    if set(data) != {"$schema", "schemaVersion", "publication", "stages", "categories", "initiatives"}:
        raise ValueError("Public roadmap top-level fields do not match schema version 2.0.0")

    forbidden_key = find_forbidden_key(data)
    if forbidden_key:
        raise ValueError(f"Private-only key present in public roadmap data: {forbidden_key}")

    publication = data.get("publication")
    stages = data.get("stages")
    categories = data.get("categories")
    initiatives = data.get("initiatives")
    if not isinstance(publication, dict):
        raise ValueError("publication must be an object")
    require_exact_keys(publication, PUBLICATION_KEYS, "publication")
    require_text(publication["title"], "publication.title")
    require_text(publication["version"], "publication.version")
    if publication["status"] not in {"draft", "review", "published"}:
        raise ValueError("publication.status is invalid")
    if publication["releasedOn"] is not None:
        require_text(publication["releasedOn"], "publication.releasedOn")
    if not isinstance(stages, list) or not stages:
        raise ValueError("stages must be a non-empty array")
    if not isinstance(categories, list) or not categories:
        raise ValueError("categories must be a non-empty array")
    if not isinstance(initiatives, list) or not initiatives:
        raise ValueError("initiatives must be a non-empty array")

    stage_ids: set[str] = set()
    stage_orders: set[int] = set()
    target_window_order: list[tuple[int, int]] = []
    for stage in stages:
        if not isinstance(stage, dict):
            raise ValueError("Every stage must be an object")
        require_exact_keys(stage, STAGE_KEYS, "stage")
        if not isinstance(stage["id"], str) or not SLUG_RE.fullmatch(stage["id"]):
            raise ValueError(f"Invalid stage ID: {stage['id']}")
        if stage["id"] in stage_ids:
            raise ValueError(f"Duplicate stage ID: {stage['id']}")
        target_match = TARGET_WINDOW_ID_RE.fullmatch(stage["id"])
        if target_match is None:
            raise ValueError(f"Stage is not a calendar-quarter target window: {stage['id']}")
        quarter = int(target_match.group(1))
        year = int(target_match.group(2))
        if stage["title"] != f"Q{quarter} {year}":
            raise ValueError(f"Stage title does not match its calendar target ID: {stage['id']}")
        if not isinstance(stage["order"], int) or stage["order"] < 1 or stage["order"] in stage_orders:
            raise ValueError(f"Invalid or duplicate stage order: {stage['order']}")
        require_text(stage["title"], f"stage {stage['id']} title")
        require_text(stage["description"], f"stage {stage['id']} description")
        stage_ids.add(stage["id"])
        stage_orders.add(stage["order"])
        target_window_order.append((year, quarter))
    if stage_orders != set(range(1, len(stages) + 1)):
        raise ValueError("Stage orders must be contiguous from 1")
    if target_window_order != sorted(target_window_order):
        raise ValueError("Calendar target windows must be chronological")

    category_ids: set[str] = set()
    category_orders: set[int] = set()
    visual_tokens: set[str] = set()
    for category in categories:
        if not isinstance(category, dict):
            raise ValueError("Every category must be an object")
        require_exact_keys(category, CATEGORY_KEYS, "category")
        category_id = category["id"]
        if not isinstance(category_id, str) or not SLUG_RE.fullmatch(category_id):
            raise ValueError(f"Invalid category ID: {category_id}")
        if category_id in category_ids:
            raise ValueError(f"Duplicate category ID: {category_id}")
        if not isinstance(category["order"], int) or category["order"] < 1 or category["order"] in category_orders:
            raise ValueError(f"Invalid or duplicate category order: {category['order']}")
        if not isinstance(category["visualToken"], str) or not SLUG_RE.fullmatch(category["visualToken"]):
            raise ValueError(f"Invalid category visual token: {category['visualToken']}")
        if category["visualToken"] in visual_tokens:
            raise ValueError(f"Duplicate category visual token: {category['visualToken']}")
        require_text(category["title"], f"category {category_id} title")
        require_text(category["abbreviation"], f"category {category_id} abbreviation")
        category_ids.add(category_id)
        category_orders.add(category["order"])
        visual_tokens.add(category["visualToken"])
    if category_orders != set(range(1, len(categories) + 1)):
        raise ValueError("Category orders must be contiguous from 1")

    initiative_ids: set[str] = set()
    sequences: set[int] = set()
    for initiative in initiatives:
        if not isinstance(initiative, dict):
            raise ValueError("Every initiative must be an object")
        require_exact_keys(initiative, INITIATIVE_KEYS, "initiative")
        candidate_id = initiative["id"]
        if not isinstance(candidate_id, str) or not CANDIDATE_ID_RE.fullmatch(candidate_id):
            raise ValueError(f"Invalid initiative ID: {candidate_id}")
        if candidate_id in initiative_ids:
            raise ValueError(f"Duplicate initiative ID: {candidate_id}")
        if initiative["categoryId"] not in category_ids:
            raise ValueError(f"Unknown category on {candidate_id}: {initiative['categoryId']}")
        if initiative["stage"] not in stage_ids:
            raise ValueError(f"Unknown stage on {candidate_id}: {initiative['stage']}")
        if initiative["visibility"] not in VISIBILITY_VALUES:
            raise ValueError(f"Invalid visibility on {candidate_id}")
        sequence = initiative["sequence"]
        if not isinstance(sequence, int) or sequence < 1 or sequence in sequences:
            raise ValueError(f"Invalid or duplicate sequence on {candidate_id}: {sequence}")
        require_text(initiative["title"], f"{candidate_id} title")
        require_text(initiative["outcome"], f"{candidate_id} outcome")
        for field in ("maturity", "confidence", "horizon"):
            require_text(initiative[field], f"{candidate_id} {field}", nullable=True)
        details = initiative["details"]
        if not isinstance(details, dict) or not details or not set(details).issubset(DETAIL_KEYS):
            raise ValueError(f"Invalid details on {candidate_id}")
        for field, value in details.items():
            require_text(value, f"{candidate_id} details.{field}", nullable=True)
        initiative_ids.add(candidate_id)
        sequences.add(sequence)
    if sequences != set(range(1, len(initiatives) + 1)):
        raise ValueError("Initiative sequences must be contiguous from 1")


def main() -> int:
    try:
        schema = load_json(SCHEMA_PATH)
        if schema.get("title") != "NeuroLab Public Roadmap":
            raise ValueError("Unexpected public roadmap schema")
        validate_repository_boundary()
        validate_site()
        publication_data = load_json(DATA_PATH)
        site_data = load_json(SITE_DATA_PATH)
        if publication_data != site_data:
            raise ValueError("Publication contract and served site data are not identical")
        validate_public_data(publication_data)
    except (OSError, ValueError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1

    print(f"Sanitized public roadmap data is valid ({len(publication_data['initiatives'])} initiatives)")
    print("Publication contract and served site data are identical")
    print("Public repository boundary and required GitHub Pages files are valid")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
