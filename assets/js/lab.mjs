import { carryTrace } from "./adder.mjs";

const lab = document.querySelector("[data-adder]");
if (lab) {
  let a = 255,
    b = 1,
    stage = 0,
    timer = null;
  let trace = carryTrace(a, b);
  const find = (name) => lab.querySelector(`[data-${name}]`);
  function stop() {
    clearInterval(timer);
    timer = null;
    find("run").textContent = stage === 8 ? "Run again" : "Run";
  }
  function render() {
    find("value-a").textContent = a;
    find("value-b").textContent = b;
    for (const button of lab.querySelectorAll("[data-operand]")) {
      const value =
        ((button.dataset.operand === "a" ? a : b) >>
          Number(button.dataset.bit)) &
        1;
      button.textContent = value;
      button.setAttribute("aria-pressed", String(Boolean(value)));
    }
    const treeStage = Math.min(stage, 3);
    for (const cell of find("ripple-row").children) {
      const bit = Number(cell.dataset.bit);
      const known = bit < stage;
      cell.textContent = known ? trace.ripple[bit] : "·";
      cell.classList.toggle("is-one", known && Boolean(trace.ripple[bit]));
      cell.classList.toggle("is-new", bit === stage - 1);
    }
    for (const cell of find("tree-row").children) {
      const bit = Number(cell.dataset.bit);
      cell.textContent = trace.tree[treeStage][bit];
      cell.classList.toggle("is-one", Boolean(trace.tree[treeStage][bit]));
    }
    find("ripple-row").setAttribute(
      "aria-label",
      `Ripple carry after ${stage} stages, bits 7 to 0: ${Array.from(find("ripple-row").children, (cell) => (cell.textContent === "·" ? "pending" : cell.textContent)).join(", ")}`,
    );
    find("tree-row").setAttribute(
      "aria-label",
      `Group generate bits after ${treeStage} combining stages, bits 7 to 0: ${trace.tree[treeStage].slice().reverse().join(", ")}`,
    );
    find("ripple-progress").textContent = `${stage} / 8 stages`;
    find("tree-progress").textContent = `${treeStage} / 3 stages`;
    const result = `${trace.carry}${trace.sum.toString(2).padStart(8, "0")} = ${a + b}`;
    find("ripple-result").textContent = stage === 8 ? result : "";
    find("tree-result").textContent = stage >= 3 ? result : "";
    find("step").disabled = stage === 8;
    find("adder-status").textContent =
      stage === 0
        ? `${a} + ${b}. Click Step to follow the carry.`
        : stage < 3
          ? `Combining groups of ${2 ** stage} bits. The ripple has reached bit ${stage - 1}.`
          : stage < 8
            ? `The tree has all its carries. The ripple is at bit ${stage - 1}.`
            : `Both get ${a + b}. Same addition, different paths.`;
  }
  function reset() {
    stage = 0;
    stop();
    trace = carryTrace(a, b);
    render();
  }
  function advance() {
    stage = Math.min(8, stage + 1);
    render();
    if (stage === 8) stop();
  }
  for (const button of lab.querySelectorAll("button")) button.disabled = false;
  for (const button of lab.querySelectorAll("[data-operand]")) {
    button.addEventListener("click", () => {
      if (button.dataset.operand === "a") a ^= 1 << Number(button.dataset.bit);
      else b ^= 1 << Number(button.dataset.bit);
      reset();
    });
  }
  find("step").addEventListener("click", () => {
    stop();
    advance();
  });
  find("reset").addEventListener("click", reset);
  find("run").addEventListener("click", () => {
    if (timer) {
      stop();
      return;
    }
    if (stage === 8) reset();
    timer = setInterval(advance, 550);
    find("run").textContent = "Pause";
  });
  // Playback is user-started only; stop it when leaving or hiding the page.
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
  });
  window.addEventListener("pagehide", stop);
  render();
}
