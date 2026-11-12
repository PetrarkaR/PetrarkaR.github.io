-- Browser lab adaptation of square.c for the z4 processor.
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
      when x"00" => bus1 <= jmp & "000" & x"20"; -- Boot to idle
      when x"01" => bus1 <= jmp & "000" & x"30"; -- Read high input byte
      when x"02" => bus1 <= jmp & "000" & x"33"; -- Read low input byte
      when x"03" => bus1 <= jmp & "000" & x"36"; -- Display input
      when x"04" => bus1 <= jmp & "000" & x"40"; -- Calculation interrupt vector
      when x"20" => bus1 <= nop & "000" & x"00";
      when x"21" => bus1 <= jmp & "000" & x"20";
      when x"30" => bus1 <= read & "000" & x"00";
      when x"31" => bus1 <= store & "000" & x"1E";
      when x"32" => bus1 <= jmp & "000" & x"20";
      when x"33" => bus1 <= read & "000" & x"00";
      when x"34" => bus1 <= store & "000" & x"1F";
      when x"35" => bus1 <= jmp & "000" & x"20";
      when x"36" => bus1 <= load & "000" & x"1E";
      when x"37" => bus1 <= write & "000" & x"00";
      when x"38" => bus1 <= load & "000" & x"1F";
      when x"39" => bus1 <= write & "000" & x"00";
      when x"3A" => bus1 <= jmp & "000" & x"20";
      when x"3B" => bus1 <= nop & "000" & x"01"; -- Constant one in the low byte
      when x"40" => bus1 <= loadl & "000" & x"00"; -- Clear the working registers
      when x"41" => bus1 <= store & "000" & x"13";
      when x"42" => bus1 <= store & "000" & x"14";
      when x"43" => bus1 <= store & "000" & x"15";
      when x"44" => bus1 <= store & "000" & x"16";
      when x"45" => bus1 <= store & "000" & x"17";
      when x"46" => bus1 <= load & "000" & x"1E";
      when x"47" => bus1 <= store & "000" & x"11";
      when x"48" => bus1 <= load & "000" & x"1F";
      when x"49" => bus1 <= store & "000" & x"12";
      when x"4A" => bus1 <= loadl & "000" & x"08";
      when x"4B" => bus1 <= store & "000" & x"1C"; -- Eight pairs of input bits
      when x"4C" => bus1 <= loadl & "000" & x"02";
      when x"4D" => bus1 <= store & "000" & x"1B";
      when x"4E" => bus1 <= clrf & "000" & x"00";
      when x"4F" => bus1 <= load & "000" & x"12";
      when x"50" => bus1 <= rolc & "000" & x"00";
      when x"51" => bus1 <= store & "000" & x"12";
      when x"52" => bus1 <= load & "000" & x"11";
      when x"53" => bus1 <= rolc & "000" & x"00";
      when x"54" => bus1 <= store & "000" & x"11";
      when x"55" => bus1 <= load & "000" & x"15";
      when x"56" => bus1 <= rolc & "000" & x"00";
      when x"57" => bus1 <= store & "000" & x"15";
      when x"58" => bus1 <= load & "000" & x"14";
      when x"59" => bus1 <= rolc & "000" & x"00";
      when x"5A" => bus1 <= store & "000" & x"14";
      when x"5B" => bus1 <= load & "000" & x"1B";
      when x"5C" => bus1 <= sub_op & "000" & x"3B";
      when x"5D" => bus1 <= store & "000" & x"1B";
      when x"5E" => bus1 <= jnz & "000" & x"4E";
      when x"5F" => bus1 <= loadl & "000" & x"00";
      when x"60" => bus1 <= store & "000" & x"16";
      when x"61" => bus1 <= load & "000" & x"13";
      when x"62" => bus1 <= store & "000" & x"17";
      when x"63" => bus1 <= clrf & "000" & x"00";
      when x"64" => bus1 <= load & "000" & x"17";
      when x"65" => bus1 <= rolc & "000" & x"00";
      when x"66" => bus1 <= store & "000" & x"17";
      when x"67" => bus1 <= load & "000" & x"16";
      when x"68" => bus1 <= rolc & "000" & x"00";
      when x"69" => bus1 <= store & "000" & x"16";
      when x"6A" => bus1 <= clrf & "000" & x"00";
      when x"6B" => bus1 <= load & "000" & x"17";
      when x"6C" => bus1 <= rolc & "000" & x"00";
      when x"6D" => bus1 <= store & "000" & x"17";
      when x"6E" => bus1 <= load & "000" & x"16";
      when x"6F" => bus1 <= rolc & "000" & x"00";
      when x"70" => bus1 <= store & "000" & x"16";
      when x"71" => bus1 <= load & "000" & x"17";
      when x"72" => bus1 <= or_op & "000" & x"3B"; -- trial = (root << 2) | 1
      when x"73" => bus1 <= store & "000" & x"17";
      when x"74" => bus1 <= load & "000" & x"15";
      when x"75" => bus1 <= sub_op & "000" & x"17";
      when x"76" => bus1 <= store & "000" & x"19";
      when x"77" => bus1 <= load & "000" & x"14";
      when x"78" => bus1 <= subc & "000" & x"16"; -- Subtract the high byte and low-byte borrow
      when x"79" => bus1 <= store & "000" & x"18";
      when x"7A" => bus1 <= jf & "000" & x"87"; -- Borrow means the trial is too large
      when x"7B" => bus1 <= load & "000" & x"19";
      when x"7C" => bus1 <= store & "000" & x"15";
      when x"7D" => bus1 <= load & "000" & x"18";
      when x"7E" => bus1 <= store & "000" & x"14";
      when x"7F" => bus1 <= clrf & "000" & x"00";
      when x"80" => bus1 <= load & "000" & x"13";
      when x"81" => bus1 <= rolc & "000" & x"00";
      when x"82" => bus1 <= store & "000" & x"13";
      when x"83" => bus1 <= load & "000" & x"13";
      when x"84" => bus1 <= or_op & "000" & x"3B";
      when x"85" => bus1 <= store & "000" & x"13";
      when x"86" => bus1 <= jmp & "000" & x"8B";
      when x"87" => bus1 <= clrf & "000" & x"00";
      when x"88" => bus1 <= load & "000" & x"13";
      when x"89" => bus1 <= rolc & "000" & x"00";
      when x"8A" => bus1 <= store & "000" & x"13";
      when x"8B" => bus1 <= load & "000" & x"1C";
      when x"8C" => bus1 <= sub_op & "000" & x"3B";
      when x"8D" => bus1 <= store & "000" & x"1C";
      when x"8E" => bus1 <= jnz & "000" & x"4C";
      when x"8F" => bus1 <= load & "000" & x"1F";
      when x"90" => bus1 <= write & "000" & x"00"; -- Previous display byte
      when x"91" => bus1 <= load & "000" & x"13";
      when x"92" => bus1 <= write & "000" & x"00"; -- Write the integer square root to the display
      when x"93" => bus1 <= jmp & "000" & x"20"; -- Return to the idle loop
      when others => bus1 <= nop & "000" & x"00";
    end case;
  end process;
  data_rom <= bus1 when oe_rom = '1' else (others => 'Z');
end architecture;
