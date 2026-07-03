// Folio smoke tests — every page must load from file:// with zero console
// errors, and the core flows (edit → preview, add income → dashboard,
// persistence round-trip) must work.
const { test, expect } = require("@playwright/test");
const path = require("path");

const fileUrl = (f) => "file://" + path.resolve(__dirname, "..", f);

/* Fail the test on any console error or uncaught page error. */
function trackErrors(page) {
    const errors = [];
    page.on("console", (msg) => {
        if (msg.type() === "error") errors.push(msg.text());
    });
    page.on("pageerror", (err) => errors.push(String(err)));
    return errors;
}

test.describe("landing page", () => {
    test("loads clean and links both tools", async ({ page }) => {
        const errors = trackErrors(page);
        await page.goto(fileUrl("index.html"));
        await expect(page).toHaveTitle(/Folio/);
        await expect(page.locator('a[href="app.html"]').first()).toBeVisible();
        await expect(
            page.locator('a[href="budget.html"]').first(),
        ).toBeVisible();
        expect(errors).toEqual([]);
    });
});

test.describe("Resume Studio", () => {
    test("loads clean, edits reflect in preview", async ({ page }) => {
        const errors = trackErrors(page);
        await page.goto(fileUrl("app.html"));
        await expect(page).toHaveTitle(/Resume Studio/);

        await page.fill("#r-name", "Taylor Quinn");
        await expect(page.locator("#rp .rp-name")).toHaveText("Taylor Quinn");

        // nav pill uses the standardized product name
        await expect(page.locator(".pill-link")).toHaveText("Flow");
        expect(errors).toEqual([]);
    });

    test("autosaves and restores across reload", async ({ page }) => {
        await page.goto(fileUrl("app.html"));
        await page.fill("#r-name", "Persisted Person");
        // wait out the 600ms save debounce
        await page.waitForFunction(() => {
            const raw = localStorage.getItem("resume_builder_save");
            return raw && raw.includes("Persisted Person");
        });
        await page.reload();
        await expect(page.locator("#r-name")).toHaveValue("Persisted Person");
    });

    test("print layer is populated for PDF export", async ({ page }) => {
        await page.goto(fileUrl("app.html"));
        await expect(page.locator("#print-rp .rp-name")).toHaveCount(1);
        await expect(page.locator("#print-cl .cl-sig")).toHaveCount(1);
    });

    test("profiles: legacy save becomes profile #1; new blank profile switches cleanly", async ({
        page,
    }) => {
        await page.goto(fileUrl("app.html"));
        // seed a legacy flat save (pre-slots shape)
        await page.evaluate(() => {
            localStorage.clear();
            const legacy = {
                version: 2,
                info: { name: "Legacy Louise" },
            };
            localStorage.setItem("resume_builder_save", JSON.stringify(legacy));
        });
        await page.reload();

        // migrated into slot #1 and applied
        await expect(page.locator("#r-name")).toHaveValue("Legacy Louise");
        const env = await page.evaluate(() =>
            JSON.parse(localStorage.getItem("resume_builder_save")),
        );
        expect(env.slotsVersion).toBe(1);
        expect(env.slots[0].data.info.name).toBe("Legacy Louise");

        // create a blank second profile via the ⋯ menu
        page.once("dialog", (d) => d.accept("Ops résumé"));
        await page.click("#profile-switcher .slot-menu-btn");
        await page.click('#profile-switcher .slot-menu button:text("New profile")');
        await expect(page.locator("#r-name")).toHaveValue("");

        // switch back — original content restored
        const firstId = await page
            .locator("#profile-switcher .slot-select option")
            .first()
            .getAttribute("value");
        await page.selectOption("#profile-switcher .slot-select", firstId);
        await expect(page.locator("#r-name")).toHaveValue("Legacy Louise");
    });
});

test.describe("Flow", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(fileUrl("budget.html"));
        await page.evaluate(() => localStorage.clear());
        await page.reload();
    });

    test("loads clean under the Flow name with tax-year note", async ({
        page,
    }) => {
        const errors = trackErrors(page);
        await page.goto(fileUrl("budget.html"));
        await expect(page).toHaveTitle(/Flow/);
        await expect(page.locator(".logo")).toContainText("Flow");
        await expect(page.locator("#taxNote")).toContainText("tax data");
        expect(errors).toEqual([]);
    });

    test("salary income drives the dashboard, CPP+EI in tax pill", async ({
        page,
    }) => {
        await page.selectOption("#srcType", "salary");
        await page.fill("#srcSalary", "60000");
        await page.click("text=+ Add Source");

        await expect(page.locator("#cf-loaded")).toBeVisible();
        await expect(page.locator("#wGross")).not.toHaveText("—");
        await expect(page.locator("#taxPill")).toContainText("CPP + EI");
    });

    test("data persists in versioned blob and survives reload", async ({
        page,
    }) => {
        await page.selectOption("#srcType", "salary");
        await page.fill("#srcSalary", "60000");
        await page.click("text=+ Add Source");

        const env = await page.evaluate(() =>
            JSON.parse(localStorage.getItem("flow_save")),
        );
        expect(env.slotsVersion).toBe(1);
        expect(env.slots).toHaveLength(1);
        expect(env.slots[0].data.version).toBe(1);
        expect(env.slots[0].data.incomes).toHaveLength(1);

        await page.reload();
        await expect(page.locator("#srcList")).toContainText("Source 1");
    });

    test("pre-slots flat blob is wrapped as scenario #1", async ({ page }) => {
        await page.evaluate(() => {
            localStorage.clear();
            localStorage.setItem(
                "flow_save",
                JSON.stringify({
                    version: 1,
                    incomes: [
                        {
                            id: 1,
                            name: "Flat Blob Job",
                            type: "salary",
                            wage: 0,
                            hours: 0,
                            annualGross: 70000,
                        },
                    ],
                    taxCfg: { country: "CA", region: "ON" },
                    housing: { type: "none" },
                    expenses: [],
                    accounts: [],
                    investments: [],
                }),
            );
        });
        await page.reload();

        await expect(page.locator("#srcList")).toContainText("Flat Blob Job");
        const env = await page.evaluate(() =>
            JSON.parse(localStorage.getItem("flow_save")),
        );
        expect(env.slots).toHaveLength(1);
        expect(env.slots[0].data.incomes[0].name).toBe("Flat Blob Job");
    });

    test("scenarios: create blank, switch back, data intact", async ({
        page,
    }) => {
        // scenario 1 gets an income
        await page.selectOption("#srcType", "salary");
        await page.fill("#srcSalary", "60000");
        await page.click("text=+ Add Source");
        await expect(page.locator("#srcList")).toContainText("Source 1");

        // create a blank second scenario via the ⋯ menu
        page.once("dialog", (d) => d.accept("With raise"));
        await page.click("#scenario-switcher .slot-menu-btn");
        await page.click('#scenario-switcher .slot-menu button:text("New scenario")');

        await expect(page.locator("#scenario-switcher .slot-select")).toHaveValue(
            await page
                .locator("#scenario-switcher .slot-select option:has-text('With raise')")
                .getAttribute("value"),
        );
        await expect(page.locator("#srcList")).toContainText("No income added yet");

        // switch back to scenario 1 — original data restored
        const firstId = await page
            .locator("#scenario-switcher .slot-select option")
            .first()
            .getAttribute("value");
        await page.selectOption("#scenario-switcher .slot-select", firstId);
        await expect(page.locator("#srcList")).toContainText("Source 1");
    });

    test("legacy six-key data migrates to flow_save", async ({ page }) => {
        await page.evaluate(() => {
            localStorage.clear();
            localStorage.setItem(
                "flow_incomes",
                JSON.stringify([
                    {
                        id: 1,
                        name: "Old Job",
                        type: "salary",
                        wage: 0,
                        hours: 0,
                        annualGross: 50000,
                    },
                ]),
            );
            localStorage.setItem(
                "flow_exp",
                JSON.stringify([
                    { id: 2, name: "Rent", amount: 1200, freq: "monthly" },
                ]),
            );
        });
        await page.reload();

        await expect(page.locator("#srcList")).toContainText("Old Job");
        const migrated = await page.evaluate(() => ({
            blob: JSON.parse(localStorage.getItem("flow_save")),
            oldKey: localStorage.getItem("flow_incomes"),
        }));
        expect(migrated.blob.slots[0].data.version).toBe(1);
        expect(migrated.blob.slots[0].data.expenses).toHaveLength(1);
        expect(migrated.oldKey).toBeNull();
    });

    test("removing an expense offers working Undo", async ({ page }) => {
        await page.click('.section-tab[data-tab="spending"]');
        await page.fill("#expName", "Groceries");
        await page.fill("#expAmt", "400");
        await page.click("text=+ Add Expense");
        await expect(page.locator("#eList")).toContainText("Groceries");

        await page.click("#eList .btn-del");
        await expect(page.locator("#eList")).not.toContainText("Groceries");

        await page.click(".toast-action"); // Undo
        await expect(page.locator("#eList")).toContainText("Groceries");
    });
});

test("no page makes any network request beyond its own files", async ({
    page,
}) => {
    const external = [];
    page.on("request", (req) => {
        if (!req.url().startsWith("file://")) external.push(req.url());
    });
    for (const f of ["index.html", "app.html", "budget.html"]) {
        await page.goto(fileUrl(f));
        await page.waitForTimeout(400);
    }
    expect(external).toEqual([]);
});
