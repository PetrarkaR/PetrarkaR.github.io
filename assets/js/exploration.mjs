// Shared, DOM-free helpers for discovery and the sampling playground.
export function pickOlderPost(
  posts,
  currentUrl,
  currentDate,
  random = Math.random(),
) {
  const dated = posts.filter((post) => Number.isFinite(Date.parse(post.date)));
  const cutoff = currentDate
    ? Date.parse(currentDate)
    : Math.max(...dated.map((post) => Date.parse(post.date)));
  const candidates = dated.filter(
    (post) => post.url !== currentUrl && Date.parse(post.date) < cutoff,
  );
  return candidates.length
    ? candidates[
        Math.min(
          candidates.length - 1,
          Math.max(0, Math.floor(random * candidates.length)),
        )
      ]
    : null;
}

function validate(frequency, rate) {
  if (
    !Number.isFinite(frequency) ||
    frequency < 0 ||
    !Number.isFinite(rate) ||
    rate <= 0 ||
    rate > 1000
  ) {
    throw new RangeError(
      "Use a nonnegative frequency and a sampling rate between 0 and 1000.",
    );
  }
}
export function sampleSignal(frequency, rate) {
  validate(frequency, rate);
  return Array.from({ length: Math.floor(rate) + 1 }, (_, i) => ({
    t: i / rate,
    value: Math.sin((2 * Math.PI * frequency * i) / rate),
  }));
}
export function aliasFrequency(frequency, rate) {
  validate(frequency, rate);
  const folded = frequency % rate;
  return Math.min(folded, rate - folded);
}
