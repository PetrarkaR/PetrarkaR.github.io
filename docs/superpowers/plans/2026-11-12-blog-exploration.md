# Blog exploration implementation plan

> **For agentic workers:** Use superpowers:executing-plans for this approved implementation.

**Goal:** Add the six user-selected discovery and personal notebook features and push to GitHub Pages for visual review.
**Architecture:** Preserve Jekyll and the neon palette. Share a responsive shell; use YAML for editable personal content and vanilla JS for progressive enhancement. Keep existing post URLs and prose intact.
**Tech stack:** Jekyll/Liquid, CSS, JavaScript, Node test runner, browser verification.
**Spec:** User's six-item request in this conversation, approved for implementation and push.

## Constraints and decisions
- Current checkout is clean and matches origin/main; work on feat/blog-exploration, integrate after verification.
- No new hosting service. No invented personal updates/reflections. Empty states are intentional until the author supplies them.
- Trails use existing published entries. Shelf can start with the existing Brave New World review and its own excerpt.
- Time machine selects older published entries, excludes the current URL, and has an archive fallback without JS.
- Then/now accepts dated Markdown notes in post front matter; show a clearly identified empty state and test populated notes with a temporary fixture.
- Signal playground is a static interactive sine-wave sampling experiment, embeddable in posts. No autoplay/audio.

## Review focus
- Phone/tablet overflow; keyboard and no-JS access.
- Empty/single-entry random pools; never return current or newer entry.
- Only published post links in trails and discovery.
- Multiple reflections, Markdown rendering and dates.
- Nyquist equality and invalid numerical input in the experiment.

## Tasks
- [x] 1. Write behavioral tests for random selection and sampled-wave math; observe failure. Implement pure helpers and verify.
- [x] 2. Replace duplicate layouts with shared shell, responsive styles, homepage discovery sections; repair category listing and add archives/about.
- [x] 3. Add data-driven Currently, Shelf, Trails, Then/now and embeddable sampling experiment; document editing examples.
- [x] 4. Build site, check links and browser behavior at 390/820/1440px, populated reflection fixture, keyboard/no-JS. Independent code review, fix findings.
- [ ] 5. Commit, fast-forward main and push; watch deployment and verify published routes.

## Progress / rulings
- Initial bundle installation is blocked by unused Chirpy dependency requiring Ruby 3.x on local Ruby 4. Resolve dependency compatibility before build; CI uses Ruby 3.3.

- Implemented on a temporary feature branch in the existing clean checkout; no worktree needed. User authorized publication in the request.
- Removed unused Chirpy gem and declared jekyll-archives directly; built in Ruby 3.3 Docker matching CI because host Ruby lacks development headers.
- Review corrected accidental baseurl replacement and the no-JS SVG geometry.
- Verified: five Node behavior tests; real Jekyll reflection render fixture; production build; htmlproofer on 66 HTML files; browser checks across eight routes at 390, 820 and 1440px plus keyboard, no-JS, random navigation and sampling.
- Existing remote Cybersynth Sass emits upstream deprecation warnings; build succeeds.
