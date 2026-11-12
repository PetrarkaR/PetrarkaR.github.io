import test from "node:test";
import assert from "node:assert/strict";
import {
  pickOlderPost,
  sampleSignal,
  aliasFrequency,
} from "../assets/js/exploration.mjs";

const posts = [
  { url: "/posts/new/", date: "2026-11-12T00:00:00Z" },
  { url: "/posts/middle/", date: "2025-01-01T00:00:00Z" },
  { url: "/posts/old/", date: "2024-01-01T00:00:00Z" },
];
test("time machine only visits older entries, never the current entry", () => {
  assert.equal(
    pickOlderPost(posts, "/posts/middle/", posts[1].date, 0).url,
    "/posts/old/",
  );
  assert.equal(
    pickOlderPost(posts, "/posts/new/", posts[0].date, 0.999).url,
    "/posts/old/",
  );
});
test("homepage selection skips the newest entry; empty or oldest pools return null", () => {
  assert.equal(pickOlderPost(posts, "/", null, 0).url, "/posts/middle/");
  assert.equal(pickOlderPost(posts, "/posts/old/", posts[2].date, 0), null);
  assert.equal(pickOlderPost([], "/", null, 0), null);
  assert.equal(pickOlderPost([posts[0]], "/", null, 0), null);
});
test("samples reflect the actual sine wave at each sample time", () => {
  const samples = sampleSignal(1, 4);
  assert.equal(samples.length, 5);
  assert.equal(samples[1].t, 0.25);
  assert.ok(Math.abs(samples[1].value - 1) < 1e-10);
  assert.ok(Math.abs(samples[3].value + 1) < 1e-10);
});
test("alias frequency folds above Nyquist and accepts the equality boundary", () => {
  assert.equal(aliasFrequency(3, 16), 3);
  assert.equal(aliasFrequency(7, 8), 1);
  assert.equal(aliasFrequency(4, 8), 4);
  assert.equal(aliasFrequency(8, 8), 0);
});
test("invalid frequencies and sampling rates are rejected", () => {
  for (const [f, r] of [
    [-1, 8],
    [3, 0],
    [NaN, 8],
    [3, Infinity],
  ]) {
    assert.throws(() => sampleSignal(f, r), RangeError);
    assert.throws(() => aliasFrequency(f, r), RangeError);
  }
});
