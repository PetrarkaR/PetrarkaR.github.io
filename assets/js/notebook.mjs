import { pickOlderPost, sampleSignal, aliasFrequency } from "./exploration.mjs";

const index = document.getElementById("post-index");
if (index) {
  const posts = JSON.parse(index.textContent);
  document.querySelectorAll("[data-time-machine]").forEach((link) => {
    const { current, date } = link.dataset;
    const destination = pickOlderPost(posts, current, date);
    if (destination) {
      link.href = destination.url;
      link.addEventListener("click", () => {
        link.href = pickOlderPost(posts, current, date).url;
      });
    } else {
      link.textContent = "↶ Explore the archive";
      const hint = document.querySelector(".time-hint");
      if (hint)
        hint.textContent = "You’re at the beginning. See the whole story.";
    }
  });
}

const svgNS = "http://www.w3.org/2000/svg";
for (const experiment of document.querySelectorAll("[data-sampling]")) {
  const frequency = experiment.querySelector("[data-frequency]");
  const rate = experiment.querySelector("[data-rate]");
  const point = (t, value) =>
    `${(40 + t * 640).toFixed(2)},${(120 - value * 80).toFixed(2)}`;
  function draw() {
    const f = Number(frequency.value);
    const r = Number(rate.value);
    experiment.querySelector("[data-frequency-output]").textContent = `${f} Hz`;
    experiment.querySelector("[data-rate-output]").textContent = `${r} Hz`;
    const wave = Array.from({ length: 641 }, (_, i) =>
      point(i / 640, Math.sin((2 * Math.PI * f * i) / 640)),
    );
    experiment
      .querySelector("[data-wave]")
      .setAttribute("d", `M${wave.join(" L")}`);
    const samples = sampleSignal(f, r);
    experiment
      .querySelector("[data-sample-line]")
      .setAttribute(
        "d",
        `M${samples.map((sample) => point(sample.t, sample.value)).join(" L")}`,
      );
    const dots = experiment.querySelector("[data-dots]");
    dots.replaceChildren(
      ...samples.map((sample) => {
        const dot = document.createElementNS(svgNS, "circle");
        dot.setAttribute("cx", 40 + sample.t * 640);
        dot.setAttribute("cy", 120 - sample.value * 80);
        dot.setAttribute("r", "3.5");
        return dot;
      }),
    );
    const status = experiment.querySelector("[data-sampling-status]");
    status.classList.toggle("is-aliased", r <= 2 * f);
    status.textContent =
      r > 2 * f
        ? `Enough snapshots. ${r} samples/second is above twice the ${f} Hz signal frequency.`
        : r === 2 * f
          ? "Right on the boundary. Every sample hits a zero crossing here: the wave disappears."
          : `Aliasing. A ${f} Hz signal can masquerade as ${aliasFrequency(f, r)} Hz (possibly with a different phase). Try adding more samples.`;
    experiment
      .querySelector("svg")
      .setAttribute(
        "aria-label",
        `${f} hertz sine wave with ${r} samples per second. ${status.textContent}`,
      );
  }
  frequency.disabled = false;
  rate.disabled = false;
  frequency.addEventListener("input", draw);
  rate.addEventListener("input", draw);
  draw();
}
