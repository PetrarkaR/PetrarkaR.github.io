// Eight-bit carry networks, least significant bit first. Carry-in is zero.
// Prefix composition follows the distance-1/2/4 stages of the VHDL adder.
export function carryTrace(a, b) {
  if (![a, b].every((n) => Number.isInteger(n) && n >= 0 && n <= 255)) {
    throw new RangeError("Use integers from 0 to 255.");
  }
  const p = Array.from({ length: 8 }, (_, i) => ((a ^ b) >> i) & 1);
  let g = Array.from({ length: 8 }, (_, i) => ((a & b) >> i) & 1);
  const ripple = [];
  let carry = 0;
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    sum |= (p[i] ^ carry) << i;
    carry = g[i] | (p[i] & carry);
    ripple.push(carry);
  }
  const tree = [g.slice()];
  let propagate = p.slice();
  for (const distance of [1, 2, 4]) {
    const previousG = g;
    const previousP = propagate;
    g = previousG.map((value, i) =>
      i < distance ? value : value | (previousP[i] & previousG[i - distance]),
    );
    propagate = previousP.map((value, i) =>
      i < distance ? value : value & previousP[i - distance],
    );
    tree.push(g.slice());
  }
  return { ripple, tree, sum, carry };
}
