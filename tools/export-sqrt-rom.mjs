// Regenerate the downloadable ROM from the same assembled program the browser runs.
import { writeFileSync } from "node:fs";
import { PROGRAM, RAM } from "../assets/js/sqrt-program.mjs";
const hex = (n) => n.toString(16).toUpperCase().padStart(2, "0");
const names = {
  SUB: "sub_op",
  ROL: "rol_op",
  ROR: "ror_op",
  AND: "and_op",
  OR: "or_op",
  XOR: "xor_op",
  NOT: "not_op",
};
const rows = [
  { address: 0, op: "JMP", argument: 0x20, note: "Boot to idle" },
  { address: 1, op: "JMP", argument: 0x30, note: "Read high input byte" },
  { address: 2, op: "JMP", argument: 0x33, note: "Read low input byte" },
  { address: 3, op: "JMP", argument: 0x36, note: "Display input" },
  { address: 0x20, op: "NOP", argument: 0 },
  { address: 0x21, op: "JMP", argument: 0x20 },
  { address: 0x30, op: "READ", argument: 0 },
  { address: 0x31, op: "STORE", argument: RAM.INPUT_H },
  { address: 0x32, op: "JMP", argument: 0x20 },
  { address: 0x33, op: "READ", argument: 0 },
  { address: 0x34, op: "STORE", argument: RAM.INPUT_L },
  { address: 0x35, op: "JMP", argument: 0x20 },
  { address: 0x36, op: "LOAD", argument: RAM.INPUT_H },
  { address: 0x37, op: "WRITE", argument: 0 },
  { address: 0x38, op: "LOAD", argument: RAM.INPUT_L },
  { address: 0x39, op: "WRITE", argument: 0 },
  { address: 0x3a, op: "JMP", argument: 0x20 },
  {
    address: RAM.one,
    op: "NOP",
    argument: 1,
    note: "Constant one in the low byte",
  },
  ...PROGRAM,
].sort((a, b) => a.address - b.address);
writeFileSync(
  new URL("../assets/lab/ROM_squareroot_demo.vhd", import.meta.url),
  `-- Browser lab adaptation of square.c for the z4 processor.
-- Original project: PetrarkaR/Projektovanje-VLSI @ 17b0385ccd2a95c651c14b3190fbfc2d8d01ff23
-- Corrected program, not a verbatim copy of ROM_squareroot.vhd.
-- Generated with node tools/export-sqrt-rom.mjs; browser tests cover all 65536 inputs.
-- FPGA compilation/timing have not been validated for this adapted ROM.
library IEEE;
use IEEE.STD_LOGIC_1164.all;
use work.DEFS.all;
entity ROM256X16 is
  port(address_rom: in std_logic_vector(7 downto 0);
       data_rom: out std_logic_vector(15 downto 0); oe_rom: in std_logic);
end entity;
architecture ROM_arch of ROM256X16 is
  signal bus1: std_logic_vector(15 downto 0);
begin
  process(address_rom) is
  begin
    case address_rom is
${rows.map((row) => `      when x"${hex(row.address)}" => bus1 <= ${names[row.op] || row.op.toLowerCase()} & "000" & x"${hex(row.argument)}";${row.note ? " -- " + row.note : ""}`).join("\n")}
      when others => bus1 <= nop & "000" & x"00";
    end case;
  end process;
  data_rom <= bus1 when oe_rom = '1' else (others => 'Z');
end architecture;
`,
);
