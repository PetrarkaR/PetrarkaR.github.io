// Run with a static server on :4173 and Playwright installed (locally or via NODE_PATH).
// Optional: BLOG_URL, CHROMIUM_PATH, BLOG_SCREENSHOTS (existing directory).
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium-browser",
    args: ["--no-sandbox"],
  });
  const base = process.env.BLOG_URL || "http://127.0.0.1:4173";
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const routes = [
    "/",
    "/trails/",
    "/shelf/",
    "/playground/",
    "/lab/",
    "/newsletter/",
    "/newsletter/archive/",
    "/newsletter/issues/sample/",
    "/archives/",
    "/about/",
    "/posts/Crossroads/",
    "/categories/thoughts/",
  ];
  for (const width of [390, 820, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of routes) {
      const response = await page.goto(base + route);
      assert.equal(response.status(), 200, route);
      await page.locator("h1").first().waitFor();
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        `${route} overflows at ${width}px`,
      );
      if (route === "/posts/Crossroads/" && width === 820) {
        const box = await page.locator(".journal-post").boundingBox();
        assert.ok(
          box.x < 80 && box.width > 650,
          "tablet article should use available width",
        );
      }
    }
    if (process.env.BLOG_SCREENSHOTS) {
      await page.goto(base + "/");
      await page.screenshot({
        path: `${process.env.BLOG_SCREENSHOTS}/home-${width}.png`,
        fullPage: true,
      });
    }
  }
  await page.goto(base + "/categories/thoughts/");
  assert.ok(
    (await page.locator(".archive-list a").count()) > 10,
    "category has entries",
  );
  await page.goto(base + "/trails/");
  assert.equal(await page.locator(".trail").count(), 3);
  assert.equal(await page.locator(".trail-stops a").count(), 10);
  for (const link of await page
    .locator(".trail-stops a")
    .evaluateAll((links) => links.map((a) => a.href))) {
    assert.equal((await page.request.get(link)).status(), 200, link);
  }
  await page.goto(base + "/posts/Crossroads/");
  await page.locator("[data-time-machine]").click();
  await page.waitForURL((url) => url.pathname !== "/posts/Crossroads/");
  const date = await page.locator(".post-meta time").getAttribute("datetime");
  assert.ok(Date.parse(date) < Date.parse("2026-11-08T00:19:00+01:00"));
  await page.goto(base + "/posts/Hello/");
  assert.equal(
    await page.locator("[data-time-machine]").getAttribute("href"),
    "/archives/",
  );
  await page.goto(base + "/playground/");
  await page.waitForURL("**/lab/");
  await page.locator("[data-state-step]:enabled").waitFor();
  assert.doesNotMatch(await page.locator(".sidebar").innerText(), /[←→↗↶]/);
  assert.doesNotMatch(await page.locator(".little-lab").innerText(), /[←→↗↶]/);
  await page.locator("[data-state-step]").focus();
  await page.keyboard.press("Enter");
  assert.equal(await page.locator("[data-reg-mar]").innerText(), "04");
  assert.match(await page.locator("[data-state-detail]").innerText(), /I1/);
  await page.locator("[data-state-step]").click();
  assert.equal(await page.locator("[data-reg-ir]").innerText(), "B8");
  assert.equal(await page.locator("[data-reg-mar]").innerText(), "40");
  await page.locator("[data-instruction-step]").click();
  assert.equal(await page.locator("[data-reg-pc]").innerText(), "40");
  assert.equal(await page.locator("[data-speed]").count(), 0);
  for (const [input, expected] of [
    [123, 11],
    [65535, 255],
    [0, 0],
    [2, 1],
  ]) {
    await page.locator("#cpu-input").fill(String(input));
    assert.equal(await page.locator("[data-run]").innerText(), "Run");
    await page.locator("[data-run]").click();
    await page.evaluate(() => {
      const step = document.querySelector("[data-instruction-step]");
      for (let n = 0; n < 1000 && !step.disabled; n++) step.click();
    });
    assert.equal(await page.locator("[data-run]").innerText(), "Run again");
    assert.ok(
      (await page.locator("[data-result]").innerText()).includes(
        `√${input} = ${expected} (integer part)`,
      ),
    );
    assert.equal(await page.locator("[data-pairs]").innerText(), "8");
    assert.equal(await page.locator("[data-iterations] tr").count(), 8);
    assert.ok(await page.locator("[data-state-step]").isDisabled());
  }
  await page.locator("[data-reset]").click();

  await page.locator("[data-run]").click();
  await page.waitForFunction(
    () => Number(document.querySelector("[data-cycles]").textContent) > 0,
  );
  await page.locator("[data-run]").click();
  const paused = await page.locator("[data-cycles]").innerText();
  await page.waitForTimeout(350);
  assert.equal(await page.locator("[data-cycles]").innerText(), paused);
  await page.locator("[data-run]").click();
  await page.locator("#cpu-input").fill("9");
  await page.waitForTimeout(350);
  assert.equal(await page.locator("[data-cycles]").innerText(), "0");
  assert.equal(await page.locator("[data-run]").innerText(), "Run");
  await page.locator("[data-run]").click();
  await page.locator("[data-reset]").click();
  await page.waitForTimeout(350);
  assert.equal(await page.locator("[data-cycles]").innerText(), "0");
  for (const invalid of ["", "-1", "65536", "1.5"]) {
    await page.locator("#cpu-input").fill(invalid);
    assert.ok(await page.locator("[data-run]").isDisabled());
    assert.ok(await page.locator("[data-instruction-step]").isDisabled());
  }
  await page.locator("#cpu-input").fill("123");
  assert.equal(await page.locator("[data-speed]").count(), 0);
  await page.locator("[data-run]").click();
  await page.evaluate(() => {
    const step = document.querySelector("[data-instruction-step]");
    for (let n = 0; n < 1000 && !step.disabled; n++) step.click();
  });
  assert.equal(await page.locator("[data-run]").innerText(), "Run again");
  if (process.env.BLOG_SCREENSHOTS) {
    for (const width of [390, 820, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.screenshot({
        path: `${process.env.BLOG_SCREENSHOTS}/lab-${width}.png`,
        fullPage: true,
      });
    }
  }
  // A cached pre-CPU script must never be requested by the new page.
  const cached = await browser.newPage();
  await cached.route("**/assets/js/lab.mjs", route => route.fulfill({
    contentType: "text/javascript", body: 'throw new Error("stale lab script")'
  }));
  await cached.goto(base + "/lab/");
  await cached.waitForFunction(() => !document.querySelector("#cpu-input").disabled);
  await cached.locator("#cpu-input").click();
  await cached.locator("#cpu-input").press("ControlOrMeta+A");
  await cached.locator("#cpu-input").press("Backspace");
  await cached.locator("#cpu-input").pressSequentially("144");
  assert.equal(await cached.locator("#cpu-input").inputValue(), "144");
  await cached.clock.install();
  await cached.locator("[data-run]").click();
  await cached.clock.runFor(1100);
  assert.equal(await cached.locator("[data-cycles]").innerText(), "4");
  await cached.close();
  const broken = await browser.newPage();
  await broken.route("**/assets/js/cpu.mjs", route => route.abort());
  await broken.goto(base + "/lab/");
  await broken.getByText(/The lab could not load/).waitFor();
  await broken.close();
  const noJS = await browser.newPage({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  await noJS.goto(base + "/");
  assert.equal(
    await noJS.locator("[data-time-machine]").getAttribute("href"),
    "/archives/",
  );
  await noJS.locator("[data-time-machine]").click();
  assert.ok((await noJS.locator(".archive-list a").count()) > 10);
  await noJS.goto(base + "/lab/");
  assert.ok(await noJS.locator("[data-run]").isDisabled());
  assert.match(
    await noJS.locator("[data-cpu-status]").innerText(),
    /Enable JavaScript/,
  );
  await noJS
    .getByText("The code, before the assembly", { exact: true })
    .click();
  assert.ok(await noJS.locator(".highlight").isVisible());
  assert.deepEqual(errors, []);
  await browser.close();
  console.log(
    "Browser checks passed: 12 routes × 3 widths, categories, trails, time machine, lab, keyboard, no-JS.",
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
