import test from "node:test";
import assert from "node:assert/strict";
import { CPU, alu, OPS } from "../assets/js/cpu.mjs";
import { PROGRAM, RAM, ENTRY, makeMemory } from "../assets/js/sqrt-program.mjs";

test("ALU follows nine-bit carry/borrow and rotation semantics", () => {
  assert.equal(alu(OPS.ADD, 255, 1), 256);
  assert.equal(alu(OPS.SUB, 0, 1), 511);
  assert.equal(alu(OPS.SUBC, 256, 0), 511);
  assert.equal(alu(OPS.ADDC, 256, 0), 1);
  assert.equal(alu(OPS.LOAD, 256, 42), 298);
  assert.equal(alu(OPS.ROLC, 128, 0), 256);
  assert.equal(alu(OPS.RORC, 1, 0), 256);
  assert.equal(alu(OPS.ROL, 384, 0), 257);
  assert.equal(alu(OPS.CLRF, 511, 0), 255);
  assert.equal(alu(OPS.OR, 256, 1), 257);
});
test("fetch, decode, branch, load literal, store and ALU use real controller states", () => {
  const cpu = new CPU(123);
  assert.equal(cpu.pc, ENTRY);
  cpu.step();
  assert.equal(cpu.lastState, "I1");
  assert.equal(cpu.mar, ENTRY);
  cpu.step();
  assert.equal(cpu.lastState, "I2");
  assert.equal(cpu.ir, OPS.JMP << 3);
  assert.equal(cpu.mar, 0x40);
  cpu.step();
  assert.equal(cpu.lastState, "I3");
  assert.equal(cpu.state, "I6");
  cpu.step();
  assert.equal(cpu.pc, 0x40);
  assert.equal(cpu.state, "I1");
  cpu.instruction();
  assert.equal(cpu.lastState, "I9");
  assert.equal(cpu.acc, 0);
  cpu.instruction();
  assert.equal(cpu.lastState, "I5");
  assert.equal(cpu.memory[RAM.REGB] & 255, 0);
});
test("instructions are the actual five-bit opcodes in 16-bit words", () => {
  const memory = makeMemory(65535);
  assert.equal(memory[ENTRY], 0xb840); // JMP 40
  assert.equal(memory[0x40], 0x7800); // LOADL 00
  assert.equal(memory[RAM.INPUT_H] & 255, 255);
  assert.equal(memory[RAM.INPUT_L] & 255, 255);
  assert.ok(PROGRAM.length < 192);
});
test("123 runs eight bit-pair iterations, writes 11 and preserves input", () => {
  const cpu = new CPU(123);
  cpu.runToEnd();
  assert.equal(cpu.output[0], 11);
  assert.equal(cpu.output[1], 123);
  assert.equal(cpu.iterations.length, 8);
  assert.equal(cpu.iterations.at(-1).remainder, 2);
  assert.equal(cpu.memory[RAM.INPUT_L] & 255, 123);
  assert.equal(cpu.pc, 0x20);
  const cycles = cpu.cycles;
  cpu.step();
  assert.equal(cpu.cycles, cycles);
});
test("ROM computes integer square roots over the full 16-bit input space", () => {
  for (let n = 0; n <= 65535; n++) {
    const cpu = new CPU(n);
    cpu.runToEnd();
    const root = cpu.output[0];
    assert.ok(
      root * root <= n && (root + 1) * (root + 1) > n,
      `input ${n}, result ${root}`,
    );
    assert.equal(cpu.iterations.length, 8);
    assert.equal(cpu.iterations.at(-1).remainder, n - root * root);
  }
});
test("reject invalid operands and bound execution", () => {
  for (const n of [-1, 65536, 1.2, NaN, Infinity, "123"])
    assert.throws(() => new CPU(n), RangeError);
  const cpu = new CPU(9);
  assert.throws(() => cpu.runToEnd(2), /limit/);
});
