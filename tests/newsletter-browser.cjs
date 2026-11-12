const { chromium } = require("playwright");
const assert = require("node:assert/strict");
(async () => {
  const b = await chromium.launch({
    executablePath: "/usr/bin/chromium-browser",
    args: ["--no-sandbox"],
  });
  const p = await b.newPage();
  const errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  // Intercept every subscription request: this test never creates contacts or sends mail.
  let submitted;
  await p.route("https://2292a8c2.sibforms.com/serve/**", async (route) => {
    if (route.request().method() === "POST") {
      submitted = route.request().postData();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: { "access-control-allow-origin": "*" },
        body: JSON.stringify({
          success: true,
          message: "Test confirmation. No email sent.",
        }),
      });
    } else await route.abort();
  });
  for (const route of ["/newsletter/", "/", "/lab/"]) {
    submitted = undefined;
    await p.goto((process.env.BLOG_URL || "http://127.0.0.1:4173") + route);
    assert.equal(await p.locator("#sib-form").count(), 1);
    assert.equal(
      await p
        .locator('script[src*="sibforms.com/forms/end-form/build/main.js"]')
        .count(),
      1,
    );
    if (route !== "/newsletter/")
      assert.equal(await p.locator(".sidebar #sib-form").count(), 1);
    await p.waitForLoadState("networkidle");
    for (const width of [390, 820, 1440]) {
      await p.setViewportSize({ width, height: 1000 });
      assert.ok(await p.locator("#EMAIL").isVisible());
      assert.ok(
        await p.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      if (process.env.BLOG_SCREENSHOTS)
        await p.screenshot({
          path:
            process.env.BLOG_SCREENSHOTS +
            "/signup-" +
            (route === "/" ? "home" : route.split("/")[1]) +
            "-" +
            width +
            ".png",
          fullPage: true,
        });
    }
    await p.getByRole("button", { name: "Subscribe", exact: true }).click();
    assert.equal(submitted, undefined);
    assert.ok(await p.locator(".entry__error").isVisible());
    await p.locator("#EMAIL").fill("form-check@example.com");
    await p.getByRole("button", { name: "Subscribe", exact: true }).click();
    await p.waitForFunction(() =>
      document
        .querySelector("#success-message")
        .classList.contains("sib-form-message-panel--active"),
    );
    assert.ok(submitted.includes("EMAIL"));
    assert.ok(
      submitted.includes("form-check%40example.com") ||
        submitted.includes("form-check@example.com"),
    );
  }
  assert.deepEqual(errors, []);
  console.log(
    "Form layout and validation pass; intercepted POST and success UI pass. No real subscription submitted.",
  );
  await b.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
