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

The landing hero also includes a keyboard- and touch-accessible product showcase. Its perspective
gallery is deliberately driven by `site/data/app-previews.json`, which orders and describes the
approved application screenshots independently of the interaction code. Each entry provides a compact
hero caption and a more detailed fullscreen description. Selecting the active preview
opens an individual near-fullscreen viewer with previous/next navigation, outside-click dismissal,
and focus return. Desktop pointer movement adds restrained depth and directional lighting, with flat
mobile and reduced-motion fallbacks. A display-style beta-release heading introduces the higher-contrast
gallery. Each slide foregrounds its concise feature description rather than an internal technical
title, with the index and expansion control framing that description in a single metadata row. A
small technical caption reconnects each feature statement to its application screenshot without
competing with the image. The feature statement sits lower in its metadata band, while the technical
caption rises into the space immediately beneath its screenshot and retains deliberate separation
from the illuminated pagination. Navigation remains attached to the image plane. A brighter
glass hairline and restrained warm edge glow separate the gallery from the dark hero without turning
it into a neon panel. The proportionally larger left-column typography and call to action use more of
the hero's available depth without changing the compact mobile flow. On wide screens, the gallery
extends into the previously unused right-side space without reducing the focused screenshot. Its
active image advances toward the viewer while brighter, sharply angled neighboring panels recede
behind it, creating a cinematic Cover Flow composition with stronger occlusion, rim lighting, and a
grounded depth shadow. Mobile and reduced-motion views retain their compact flat presentation.
Publication status and version
metadata live in the footer so the hero opens directly on its primary message. The gallery heading
publishes the Q3 2026 beta release commitment, while the fullscreen viewer uses a human-readable
feature label with centered navigation controls over the image.

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
  data/app-previews.json
  data/public-roadmap.json
  index.html
  styles.css
  assets/
```
