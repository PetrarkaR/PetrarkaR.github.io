import { OPS } from "./cpu-isa.mjs";
export const SOURCE =
  "https://github.com/PetrarkaR/Projektovanje-VLSI/tree/17b0385ccd2a95c651c14b3190fbfc2d8d01ff23/z4";
export const ENTRY = 0x04;
export const RAM = Object.freeze({
  REGA_H: 0x10,
  REGA_M: 0x11,
  REGA_L: 0x12,
  REGB: 0x13,
  REGX_H: 0x14,
  REGX_L: 0x15,
  REGY_H: 0x16,
  REGY_L: 0x17,
  REGZ_H: 0x18,
  REGZ_L: 0x19,
  TEMP1: 0x1a,
  TEMP2: 0x1b,
  counter: 0x1c,
  zeroRef: 0x1d,
  INPUT_H: 0x1e,
  INPUT_L: 0x1f,
  one: 0x3b,
});

// Corrected ROM translation of square.c, using only the original processor ISA.
// Working input: REGA_M:L; extracted remainder: REGX_H:L; root: REGB.
const rows = [];
const labels = {};
let address = 0x40;
let phase = "Setup";
const emit = (op, operand = 0, note = "") =>
  rows.push({ address: address++, op, operand, note, phase });
const label = (name) => {
  labels[name] = address;
};
const rotateLeft = (registers) => {
  emit("CLRF");
  for (const register of registers) {
    emit("LOAD", register);
    emit("ROLC");
    emit("STORE", register);
  }
};
emit("LOADL", 0, "Clear the working registers");
for (const register of ["REGB", "REGX_H", "REGX_L", "REGY_H", "REGY_L"])
  emit("STORE", register);
emit("LOAD", "INPUT_H");
emit("STORE", "REGA_M");
emit("LOAD", "INPUT_L");
emit("STORE", "REGA_L");
emit("LOADL", 8);
emit("STORE", "counter", "Eight pairs of input bits");
label("loop");
phase = "Bring down two bits";
emit("LOADL", 2);
emit("STORE", "TEMP2");
label("shift");
rotateLeft(["REGA_L", "REGA_M", "REGX_L", "REGX_H"]);
emit("LOAD", "TEMP2");
emit("SUB", "one");
emit("STORE", "TEMP2");
emit("JNZ", "shift");
phase = "Build the trial divisor";
emit("LOADL", 0);
emit("STORE", "REGY_H");
emit("LOAD", "REGB");
emit("STORE", "REGY_L");
rotateLeft(["REGY_L", "REGY_H"]);
rotateLeft(["REGY_L", "REGY_H"]);
emit("LOAD", "REGY_L");
emit("OR", "one", "trial = (root << 2) | 1");
emit("STORE", "REGY_L");
phase = "Try the subtraction";
emit("LOAD", "REGX_L");
emit("SUB", "REGY_L");
emit("STORE", "REGZ_L");
emit("LOAD", "REGX_H");
emit("SUBC", "REGY_H", "Subtract the high byte and low-byte borrow");
emit("STORE", "REGZ_H");
emit("JF", "reject", "Borrow means the trial is too large");
phase = "Keep the subtraction";
emit("LOAD", "REGZ_L");
emit("STORE", "REGX_L");
emit("LOAD", "REGZ_H");
emit("STORE", "REGX_H");
phase = "Append a one";
rotateLeft(["REGB"]);
emit("LOAD", "REGB");
emit("OR", "one");
emit("STORE", "REGB");
emit("JMP", "next");
label("reject");
phase = "Append a zero";
rotateLeft(["REGB"]);
label("next");
phase = "Next pair";
emit("LOAD", "counter");
emit("SUB", "one");
emit("STORE", "counter");
emit("JNZ", "loop");
phase = "Display the result";
emit("LOAD", "INPUT_L");
emit("WRITE", 0, "Previous display byte");
emit("LOAD", "REGB");
emit("WRITE", 0, "Write the integer square root to the display");
emit("JMP", 0x20, "Return to the idle loop");

export const PROGRAM = [
  {
    address: 0x04,
    op: "JMP",
    operand: 0x40,
    note: "Calculation interrupt vector",
    phase: "Start",
  },
  ...rows,
].map((row) => {
  const operand =
    typeof row.operand === "number"
      ? row.operand
      : (RAM[row.operand] ?? labels[row.operand]);
  if (operand === undefined || row.address > 255)
    throw new Error("Invalid ROM assembly");
  return { ...row, argument: operand, word: (OPS[row.op] << 11) | operand };
});
export const PROGRAM_BY_ADDRESS = new Map(
  PROGRAM.map((row) => [row.address, row]),
);
export function makeMemory(input) {
  const memory = new Uint16Array(256).fill(OPS.NOP << 11);
  memory[0] = (OPS.JMP << 11) | 0x20;
  memory[0x20] = OPS.NOP << 11;
  memory[0x21] = (OPS.JMP << 11) | 0x20;
  for (const row of PROGRAM) memory[row.address] = row.word;
  memory[RAM.one] = (OPS.NOP << 11) | 1;
  memory[RAM.INPUT_H] = (OPS.NOP << 11) | (input >> 8);
  memory[RAM.INPUT_L] = (OPS.NOP << 11) | (input & 255);
  return memory;
}
