# NeuroLab Roadmap Site

Static GitHub Pages site for the NeuroLab public roadmap.

- **Intended URL:** <https://neurolab-ai.github.io/roadmap/>
- **Public publication contract:** a future sanitized `publication/public-roadmap.json` containing
  only reviewed, intentionally public roadmap data
- **Design system:** inherited from the whitepaper site. `site/styles.css` is the whitepaper
  stylesheet verbatim, with a `ROADMAP ADDITIONS` block appended at the end. Keeping it that way
  means a change to the whitepaper's look can be re-applied by replacing everything above that
  marker.

## Publishing

Pushing to `main` runs `.github/workflows/deploy-pages.yml`, which checks the required files are
present and that no unreplaced template tokens shipped, then deploys `site/` to GitHub Pages.

The current deployment still serves the original inline page. The public-data contract under
`publication/` is intentionally inactive until an approved roadmap dataset and new presentation
have been reviewed.

⚠ **The published page is currently labelled "Draft for Review".** The present-tense capability
claims in the hero and the two differentiator cards have not yet been verified against the live
application, which the internal registry's source-and-claim rules require before publication. Remove
the draft badge only once that check has been done.

## Local preview

```shell
python -m http.server 4321 --directory site
```

Then open <http://localhost:4321>.

Validate the public repository boundary and current publication files:

```shell
python scripts/validate_public_content.py
```

## Structure

```
publication/
  README.md                        public-data lifecycle and content boundary
  public-roadmap.schema.json       schema for future sanitized publication data
scripts/
  validate_public_content.py       public-only content and repository validation
site/
  index.html      single page; content is inline
  styles.css      whitepaper stylesheet + ROADMAP ADDITIONS
  assets/         wordmark + hero plate, copied from the whitepaper site
```

## The Overview / Detailed toggle

The roadmap document exists in two versions — a short one for general audiences and an expanded one
for readers who want the reasoning. Rather than shipping two pages, the site carries both: each
bullet may contain a `<span class="detail">` which is hidden by default and revealed by the
**Detailed** toggle. The choice persists in `localStorage`.

This means the page is the short version until a reader asks for more, and there is exactly one copy
of the content to keep in step with the source document.

## Checks performed

- Contrast measured from rendered pixels rather than declared colours: worst case **6.00:1** for
  secondary text against its real backdrop (WCAG AA for normal text is 4.5:1). The background
  gradient settles to flat black through the timeline for this reason — the whitepaper can afford a
  visible hero plate because its page is short; a long roadmap cannot.
- No horizontal overflow at 390px (`scrollWidth == clientWidth`).
- Toggle verified in both directions including `aria-pressed` state.

## Before publishing

1. Decide the repo name / URL (see above).
2. Confirm the present-tense capability claims in the hero and the two differentiator cards against
   the live application — the internal registry requires current-capability claims to be verified
   before publication.
3. Decide whether quarters stay as sequential phases or get anchored to calendar dates.
