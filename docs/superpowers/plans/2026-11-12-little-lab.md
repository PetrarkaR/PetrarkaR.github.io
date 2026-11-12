# Little electronics lab

User request: replace generic playground with a simple, personal electronics lab,
using their GitHub work and writing style. Prior publication authorization applies.

Decision: one carry-adder experiment based on public Projektovanje-VLSI z1,
and two ordinary project links (ApocaCore and diploma). No gallery or dashboard.
Use existing typography/palette with a smaller heading and plain explanatory text.

- [x] Test the ripple and Kogge–Stone carry traces, including exhaustive eight-bit sums.
- [x] Implement bit toggles, manual step, run/pause, reset, and truthful logical-stage labels.
- [x] Add /lab/, preserve /playground/ with redirect, replace sidebar/home teaser.
- [ ] Verify mobile, keyboard, no-JS, reset during playback, links and build; review and push.

The tree visualization displays group generate bits at distances 1, 2, 4.
These are logical carry-combination stages, not physical timing or full CPU cycles.
The old sampling include remains usable in existing posts; it is removed from the lab.
No claimed personal achievements beyond the reviewed public source.

Verification: eight Node tests passed, including all 65,536 input pairs.
Browser checks passed across nine routes at 390/820/1440px, including keyboard,
play/pause/reset and no-JS. HTML-Proofer passed on 67 files. Reflection regression
test passed. Independent code review found no important issues. Ready to publish.
