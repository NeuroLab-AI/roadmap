# NeuroLab Public Roadmap

Registry-driven GitHub Pages publication for the NeuroLab development roadmap.

- Live URL: <https://neurolab-ai.github.io/roadmap/>
- Publication version: `0.5.0`
- Current state: Draft for Review
- Public selection: 19 initiatives across 7 categories and 5 calendar target windows

## Experience

The page presents a calendar-driven roadmap from Q3 2026 through Q3 2027. Visitors can switch
between the visual timeline and a chronological data table, search across the public initiative
content, and combine keyword search with one or more technical-domain filters. The contextual
controls remain available while the roadmap is in view without competing with the introductory
sections.

Each initiative keeps its technical registry ID visible as a stable reference, but the public title
and category lead the visual hierarchy. Selecting an initiative opens an accessible detail dialog
with its outcome, maturity, confidence, calendar target, validation gate, dependencies, and claim
boundary.

The sequence is a curated development narrative, not an ID sort. Calendar labels are target windows
for the draft roadmap rather than guaranteed release dates.

## Data Boundary

The private `neurolab-docs-and-brand` repository owns candidate review, selection rationale, and the
deterministic sanitizer. This public repository receives only the approved publication fields:

- `publication/public-roadmap.json` is the reviewable public contract;
- `site/data/public-roadmap.json` is the byte-equivalent served dataset; and
- `publication/public-roadmap.schema.json` defines the boundary.

No rejected candidates, private notes, source provenance, or synchronization logic are stored here.

## Local Preview

```shell
python -m http.server 4321 --directory site
```

Then open <http://localhost:4321>.

Validate the publication boundary and site inputs:

```shell
python scripts/validate_public_content.py
node --check site/app.js
```

## Deployment

Changes under `site/` on `main` run the existing GitHub Pages workflow. The workflow validates the
static application, uploads `site/`, and publishes it at the live URL above.

## Repository Structure

```text
publication/
  README.md
  public-roadmap.json
  public-roadmap.schema.json
scripts/
  validate_public_content.py
site/
  app.js
  data/public-roadmap.json
  index.html
  styles.css
  assets/
```
