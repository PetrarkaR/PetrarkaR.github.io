import { OPS } from "./cpu-isa.mjs";
import { ENTRY, RAM, PROGRAM_BY_ADDRESS, makeMemory } from "./sqrt-program.mjs";
export { OPS };

// Return the complete 9-bit accumulator, including flag F in bit 8.
export function alu(op, acc, data) {
  const a = acc & 255,
    f = (acc >> 8) & 1,
    d = data & 255;
  switch (op) {
    case OPS.LOAD:
    case OPS.LOADL:
    case OPS.READ:
      return (f << 8) | d;
    case OPS.SETF:
      return a | 256;
    case OPS.CLRF:
      return a;
    case OPS.ADD:
      return (a + d) & 511;
    case OPS.ADDC:
      return (a + d + f) & 511;
    case OPS.SUB:
      return (a - d) & 511;
    case OPS.SUBC:
      return (a - d - f) & 511;
    case OPS.ROL:
      return (f << 8) | (((a << 1) | (a >> 7)) & 255);
    case OPS.ROLC:
      return ((a << 1) | f) & 511;
    case OPS.ROR:
      return (f << 8) | (a >> 1) | ((a & 1) << 7);
    case OPS.RORC:
      return (acc >> 1) | ((a & 1) << 8);
    case OPS.AND:
      return (f << 8) | (a & d);
    case OPS.OR:
      return (f << 8) | (a | d);
    case OPS.XOR:
      return (f << 8) | (a ^ d);
    case OPS.NOT:
      return (f << 8) | (a ^ 255);
    default:
      throw new Error(`Unsupported ALU opcode ${op}`);
  }
}
export const CONTROL = {
  I1: {
    name: "Address",
    path: "PC drives MAR",
    signals: ["pc_data", "data_mar"],
    active: ["pc", "mar"],
  },
  I2: {
    name: "Fetch",
    path: "RAM loads IR and MAR",
    signals: ["oe_ram", "wr_ir", "en_ram", "data_mar"],
    active: ["ram", "ir", "mar"],
  },
  I3: {
    name: "Decode",
    path: "Controller reads IR and flags",
    signals: [],
    active: ["ir", "controller", "alu"],
  },
  I4: {
    name: "Output",
    path: "ACC loads the output register",
    signals: ["acc_bus", "wr_reg", "ready"],
    active: ["alu", "out"],
  },
  I5: {
    name: "Store",
    path: "ACC writes RAM at MAR",
    signals: ["acc_bus", "wr_ram", "en_ram", "ready"],
    active: ["alu", "ram", "mar"],
  },
  I6: {
    name: "Branch",
    path: "MAR loads PC",
    signals: ["mar_data", "data_pc", "ready"],
    active: ["mar", "pc"],
  },
  I7: {
    name: "Continue",
    path: "PC advances by one",
    signals: ["ready"],
    active: ["pc"],
  },
  I8: {
    name: "Read input",
    path: "Input port loads ACC",
    signals: ["oe_reg", "load_acc", "ready"],
    active: ["alu"],
  },
  I9: {
    name: "Literal",
    path: "MAR loads ACC",
    signals: ["mar_data", "load_acc", "ready"],
    active: ["mar", "alu"],
  },
  I10: {
    name: "Execute",
    path: "ALU uses RAM at MAR and updates ACC",
    signals: ["oe_ram", "load_acc", "en_ram", "ready"],
    active: ["ram", "mar", "alu"],
  },
};
export class CPU {
  constructor(input) {
    if (!Number.isInteger(input) || input < 0 || input > 65535)
      throw new RangeError("Enter a whole number from 0 to 65535.");
    this.input = input;
    this.memory = makeMemory(input);
    this.pc = ENTRY;
    this.ir = 0;
    this.mar = 0;
    this.acc = 0;
    this.state = "I1";
    this.lastState = null;
    this.cycles = 0;
    this.instructions = 0;
    this.halted = false;
    this.instructionAddress = ENTRY;
    this.output = [0, 0];
    this.iterations = [];
    this.bus = null;
  }
  get flag() {
    return this.acc >> 8;
  }
  get zero() {
    return (this.acc & 255) === 0 ? 1 : 0;
  }
  get current() {
    return PROGRAM_BY_ADDRESS.get(this.instructionAddress);
  }
  byte(address) {
    return this.memory[address] & 255;
  }
  word(high, low) {
    return (this.byte(high) << 8) | this.byte(low);
  }
  step() {
    if (this.halted) return;
    const op = this.ir >> 3;
    this.lastState = this.state;
    this.bus = null;
    this.cycles++;
    switch (this.state) {
      case "I1":
        this.instructionAddress = this.pc;
        this.bus = this.pc;
        this.mar = this.pc;
        this.state = "I2";
        break;
      case "I2": {
        const word = this.memory[this.mar];
        this.bus = word;
        this.ir = word >> 8;
        this.mar = word & 255;
        this.state = "I3";
        break;
      }
      case "I3": {
        const taken =
          op === OPS.JMP ||
          (op === OPS.JNF && !this.flag) ||
          (op === OPS.JF && this.flag) ||
          (op === OPS.JNZ && !this.zero) ||
          (op === OPS.JZ && this.zero);
        this.state =
          op === OPS.WRITE
            ? "I4"
            : op === OPS.STORE
              ? "I5"
              : op >= OPS.JNF && op <= OPS.JMP
                ? taken
                  ? "I6"
                  : "I7"
                : op === OPS.NOP
                  ? "I7"
                  : op === OPS.READ
                    ? "I8"
                    : op === OPS.LOADL
                      ? "I9"
                      : "I10";
        break;
      }
      default: {
        let next = (this.pc + 1) & 255;
        switch (this.state) {
          case "I4":
            this.bus = this.acc & 255;
            this.output = [this.bus, this.output[0]];
            break;
          case "I5":
            this.bus = this.acc & 255;
            this.memory[this.mar] = (this.memory[this.mar] & 0xff00) | this.bus;
            if (
              this.mar === RAM.counter &&
              this.current?.phase === "Next pair"
            ) {
              const iteration = 8 - this.bus;
              this.iterations.push({
                iteration,
                pair: (this.input >> ((8 - iteration) * 2)) & 3,
                root: this.byte(RAM.REGB),
                remainder: this.word(RAM.REGX_H, RAM.REGX_L),
                trial: this.word(RAM.REGY_H, RAM.REGY_L),
              });
            }
            break;
          case "I6":
            this.bus = this.mar;
            next = this.mar;
            break;
          case "I7":
            break;
          case "I8":
            this.bus = this.input & 255;
            this.acc = alu(op, this.acc, this.bus);
            break;
          case "I9":
            this.bus = this.mar;
            this.acc = alu(op, this.acc, this.bus);
            break;
          case "I10":
            this.bus = this.byte(this.mar);
            this.acc = alu(op, this.acc, this.bus);
            break;
          default:
            throw new Error(`Unknown controller state ${this.state}`);
        }
        this.pc = next;
        this.instructions++;
        this.state = "I1";
        if (this.lastState === "I6" && next === 0x20) this.halted = true;
      }
    }
  }
  instruction() {
    do {
      this.step();
    } while (!this.halted && this.state !== "I1");
  }
  runToEnd(limit = 10000) {
    for (let i = 0; i < limit && !this.halted; i++) this.step();
    if (!this.halted) throw new Error("Execution limit reached");
    return this;
  }
}
