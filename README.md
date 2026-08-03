# NeuroLab Public Roadmap

Registry-driven GitHub Pages publication for the NeuroLab development roadmap.

- Live URL: <https://neurolab-ai.github.io/roadmap/>
- Publication version: `0.3.0`
- Current state: Draft for Review
- Public selection: 15 initiatives across 7 categories and 4 relative stages

## Experience

The page presents a single-direction vertical roadmap from current foundation to future direction.
Each initiative keeps its technical registry ID visible as a stable reference, but the public title
and category lead the visual hierarchy. Selecting an initiative opens an accessible detail dialog
with its outcome, maturity, confidence, horizon, validation gate, dependencies, and claim boundary.

The sequence is a curated development narrative, not an ID sort and not a calendar commitment.

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
