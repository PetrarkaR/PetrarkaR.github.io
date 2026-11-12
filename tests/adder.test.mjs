import test from "node:test";
import assert from "node:assert/strict";
import { carryTrace } from "../assets/js/adder.mjs";

test("255 + 1 propagates across all eight bits, with three prefix stages", () => {
  const trace = carryTrace(255, 1);
  assert.deepEqual(trace.ripple, [1, 1, 1, 1, 1, 1, 1, 1]);
  assert.deepEqual(trace.tree, [
    [1, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 1, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 1, 1],
  ]);
  assert.equal(trace.sum, 0);
  assert.equal(trace.carry, 1);
});
test("both carry networks agree with integer addition for every eight-bit input pair", () => {
  for (let a = 0; a < 256; a++)
    for (let b = 0; b < 256; b++) {
      const trace = carryTrace(a, b);
      assert.deepEqual(trace.tree.at(-1), trace.ripple);
      assert.equal(trace.sum + trace.carry * 256, a + b);
    }
});
test("only eight-bit unsigned integers are accepted", () => {
  for (const n of [-1, 256, 1.5, NaN, Infinity])
    assert.throws(() => carryTrace(n, 1), RangeError);
});
