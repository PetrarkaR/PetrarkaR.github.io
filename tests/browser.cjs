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
  await page.locator("[data-step]:enabled").waitFor();
  for (let step = 0; step < 3; step++)
    await page.locator("[data-step]").click();
  assert.match(
    await page.locator("[data-tree-result]").innerText(),
    /100000000 = 256/,
  );
  assert.equal(await page.locator("[data-ripple-result]").innerText(), "");
  for (let step = 3; step < 8; step++)
    await page.locator("[data-step]").click();
  assert.match(
    await page.locator("[data-ripple-result]").innerText(),
    /100000000 = 256/,
  );
  assert.ok(await page.locator("[data-step]").isDisabled());
  await page.locator("[data-reset]").click();
  assert.equal(await page.locator("[data-run]").innerText(), "Run");
  const bit = page.locator('[data-operand="a"][data-bit="0"]');
  await bit.focus();
  await page.keyboard.press("Space");
  assert.equal(await page.locator("[data-value-a]").innerText(), "254");
  assert.equal(await bit.getAttribute("aria-pressed"), "false");
  await page.locator("[data-run]").click();
  await page.waitForFunction(
    () =>
      document.querySelector("[data-ripple-progress]").textContent !==
      "0 / 8 stages",
  );
  await page.locator("[data-run]").click();
  const paused = await page.locator("[data-ripple-progress]").innerText();
  await page.waitForTimeout(650);
  assert.equal(
    await page.locator("[data-ripple-progress]").innerText(),
    paused,
  );
  await page.locator("[data-run]").click();
  await bit.click();
  await page.waitForTimeout(650);
  assert.equal(
    await page.locator("[data-ripple-progress]").innerText(),
    "0 / 8 stages",
  );
  assert.equal(await page.locator("[data-run]").innerText(), "Run");
  if (process.env.BLOG_SCREENSHOTS) {
    for (const width of [390, 820, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.screenshot({
        path: `${process.env.BLOG_SCREENSHOTS}/lab-${width}.png`,
        fullPage: true,
      });
    }
  }
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
  assert.ok(await noJS.locator("[data-step]").isDisabled());
  assert.match(await noJS.locator("noscript").innerText(), /answer is 256/);
  await noJS.locator("summary").click();
  assert.ok((await noJS.locator("details").getAttribute("open")) !== null);
  assert.deepEqual(errors, []);
  await browser.close();
  console.log(
    "Browser checks passed: 9 routes × 3 widths, categories, trails, time machine, lab, keyboard, no-JS.",
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
