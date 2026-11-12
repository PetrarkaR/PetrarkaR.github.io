import { CPU, CONTROL } from "./cpu.mjs";
import { PROGRAM, RAM } from "./sqrt-program.mjs";

const lab = document.querySelector("[data-cpu]");
if (lab) {
  const find = (name) => lab.querySelector(`[data-${name}]`);
  const hex = (value, width = 2) =>
    value.toString(16).toUpperCase().padStart(width, "0");
  const input = lab.querySelector("#cpu-input");
  const form = find("input-form");
  let cpu = new CPU(123),
    running = false,
    frame = 0,
    previousTime = 0,
    credit = 0;
  let renderedIterations = -1;
  let highlighted = null;
  const lines = new Map();
  for (const instruction of PROGRAM) {
    const line = document.createElement("li");
    const address = document.createElement("span");
    address.className = "instruction-address";
    address.textContent = hex(instruction.address);
    const code = document.createElement("code");
    code.textContent = `${instruction.op.padEnd(6)} ${typeof instruction.operand === "string" ? instruction.operand : hex(instruction.argument)}`;
    line.append(address, code);
    line.title = `${hex(instruction.word, 4)}${instruction.note ? " · " + instruction.note : ""}`;
    lines.set(instruction.address, line);
    find("program-list").append(line);
  }
  function status(message) {
    find("cpu-status").textContent = message;
  }
  function stop() {
    running = false;
    cancelAnimationFrame(frame);
    frame = 0;
    find("run").textContent = cpu.halted ? "Run again" : "Run";
  }
  function render() {
    find("run").textContent = running
      ? "Pause"
      : cpu.halted
        ? "Run again"
        : "Run";
    const state = cpu.lastState;
    const control = state ? CONTROL[state] : null;
    for (const stage of lab.querySelectorAll("[data-stage]")) {
      const active =
        state &&
        (stage.dataset.stage === state ||
          (stage.dataset.stage === "execute" && Number(state.slice(1)) >= 4));
      stage.classList.toggle("is-active", Boolean(active));
      if (active) stage.setAttribute("aria-current", "step");
      else stage.removeAttribute("aria-current");
    }
    find("execute-state").textContent =
      state && Number(state.slice(1)) >= 4 ? state : "I4–I10";
    find("state-detail").textContent = control
      ? `${state} · ${control.name}. ${control.path}. Next state: ${cpu.halted ? "idle" : cpu.state}.`
      : "Ready at the calculation interrupt vector, address 04.";
    for (const part of lab.querySelectorAll("[data-part]"))
      part.classList.toggle(
        "is-active",
        control?.active.includes(part.dataset.part) || false,
      );
    for (const wire of lab.querySelectorAll("[data-wire]"))
      wire.classList.toggle(
        "is-active",
        Boolean(state && wire.dataset.wire.split(" ").includes(state)),
      );
    const registers = {
      pc: hex(cpu.pc),
      mar: hex(cpu.mar),
      ir: hex(cpu.ir),
      acc: hex(cpu.acc & 255),
      flag: cpu.flag,
      zero: cpu.zero,
    };
    for (const [name, value] of Object.entries(registers)) {
      const node = find(`reg-${name}`);
      node.classList.toggle("changed", node.textContent !== String(value));
      node.textContent = value;
    }
    for (const name of ["pc", "mar", "ir"])
      find(`diagram-${name}`).textContent = registers[name];
    find("diagram-controller").textContent = cpu.halted
      ? "Idle"
      : state || "Ready";
    find("diagram-alu").textContent =
      `${registers.acc} · F=${cpu.flag} Z=${cpu.zero}`;
    find("diagram-out").textContent = cpu.output
      .slice()
      .reverse()
      .map((n) => hex(n))
      .join(" ");
    find("cycles").textContent = cpu.cycles;
    find("instructions").textContent = cpu.instructions;
    find("pairs").textContent = cpu.iterations.length;
    find("working-input").textContent = cpu.word(RAM.REGA_M, RAM.REGA_L);
    find("working-remainder").textContent = cpu.word(RAM.REGX_H, RAM.REGX_L);
    find("working-trial").textContent = cpu.word(RAM.REGY_H, RAM.REGY_L);
    find("working-root").textContent = cpu.byte(RAM.REGB);
    find("signals").textContent = control
      ? control.signals.join(", ") ||
        "No data-path enables asserted during decode."
      : "Not started.";
    find("bus").textContent =
      cpu.bus === null
        ? "Data bus: idle."
        : `Data bus: ${hex(cpu.bus, state === "I2" ? 4 : 2)} (hex).`;
    find("program-phase").textContent = cpu.current?.phase || "Idle";
    const line = lines.get(cpu.instructionAddress);
    if (line !== highlighted) {
      if (highlighted) {
        highlighted.classList.remove("current");
        highlighted.removeAttribute("aria-current");
      }
      if (line) {
        line.classList.add("current");
        line.setAttribute("aria-current", "step");
        const container = lab.querySelector(".cpu-program");
        const top = line.offsetTop;
        if (
          top < container.scrollTop ||
          top + line.offsetHeight > container.scrollTop + container.clientHeight
        )
          container.scrollTop = Math.max(0, top - container.clientHeight / 2);
      }
      highlighted = line;
    }
    if (renderedIterations !== cpu.iterations.length) {
      const rows = cpu.iterations.map((iteration) => {
        const row = document.createElement("tr");
        for (const value of [
          iteration.iteration,
          iteration.pair.toString(2).padStart(2, "0"),
          iteration.trial,
          iteration.remainder,
          iteration.root,
        ]) {
          const cell = document.createElement("td");
          cell.textContent = value;
          row.append(cell);
        }
        return row;
      });
      find("iterations").replaceChildren(...rows);
      find("iterations-empty").hidden = rows.length > 0;
      renderedIterations = rows.length;
    }
    find("state-step").disabled = cpu.halted;
    find("instruction-step").disabled = cpu.halted;
    const result = cpu.halted
      ? `√${cpu.input} = ${cpu.output[0]} (integer part). Remainder: ${cpu.word(RAM.REGX_H, RAM.REGX_L)}.`
      : cpu.cycles
        ? "Result: still working."
        : "Result: not run yet.";
    if (find("result").textContent !== result)
      find("result").textContent = result;
  }
  function reset() {
    stop();
    cpu = new CPU(cpu.input);
    renderedIterations = -1;
    find("run").textContent = "Run";
    render();
    status(`Loaded ${cpu.input}. Ready to run.`);
  }
  function tick(time) {
    if (!running) return;
    if (!previousTime) previousTime = time;
    credit +=
      (Math.min(time - previousTime, 100) * Number(find("speed").value)) / 1000;
    previousTime = time;
    let steps = Math.floor(credit);
    credit -= steps;
    while (steps-- > 0 && !cpu.halted) cpu.step();
    if (cpu.cycles > 10000) {
      stop();
      status("Stopped: the execution limit was reached.");
      render();
      return;
    }
    render();
    if (cpu.halted) {
      stop();
      status(
        "Finished. The result was written to the display; the processor returned to its idle loop.",
      );
    } else frame = requestAnimationFrame(tick);
  }
  for (const control of lab.querySelectorAll("button,input,select"))
    control.disabled = false;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    stop();
    cpu = new CPU(input.valueAsNumber);
    renderedIterations = -1;
    render();
    status(`Loaded ${cpu.input}. Ready to run.`);
  });
  // Editing an operand stops execution and clears stale results immediately.
  input.addEventListener("input", () => {
    stop();
    if (input.validity.valid) {
      cpu = new CPU(input.valueAsNumber);
      renderedIterations = -1;
      render();
      status(`Loaded ${cpu.input}. Ready to run.`);
    } else {
      find("run").disabled = true;
      find("state-step").disabled = true;
      find("instruction-step").disabled = true;
      find("result").textContent = "Result: enter a valid number.";
      status("Enter a whole number from 0 to 65535.");
    }
    find("run").disabled = !input.validity.valid;
  });
  find("run").addEventListener("click", () => {
    if (running) {
      stop();
      status("Paused. You can step through the next state or instruction.");
      return;
    }
    if (cpu.halted) reset();
    running = true;
    credit = 0;
    previousTime = 0;
    find("run").textContent = "Pause";
    status("Running.");
    frame = requestAnimationFrame(tick);
  });
  find("state-step").addEventListener("click", () => {
    stop();
    cpu.step();
    render();
    status(cpu.halted ? "Finished." : "Paused after one controller state.");
  });
  find("instruction-step").addEventListener("click", () => {
    stop();
    cpu.instruction();
    render();
    status(
      cpu.halted ? "Finished." : "Paused at the next instruction boundary.",
    );
  });
  find("reset").addEventListener("click", () => {
    input.value = cpu.input;
    find("run").disabled = false;
    reset();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && running) {
      stop();
      status("Paused while the page is hidden.");
    }
  });
  window.addEventListener("pagehide", stop);
  render();
  status("Loaded 123, the input from the VHDL testbench. Ready to run.");
}
