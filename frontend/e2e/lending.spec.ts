import { expect, test, type Page } from "@playwright/test";

async function connectDevWallet(page: Page) {
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Use Anvil dev account" }).click();
  await expect(page.getByText("Health factor").first()).toBeVisible();
}

async function confirm(page: Page, title: RegExp) {
  await expect(page.getByRole("status").filter({ hasText: title }).filter({ hasText: "Confirmed" })).toBeVisible({ timeout: 30_000 });
}

/** Talk to Anvil directly, e.g. to skip the faucet's 1-day cooldown between test runs. */
async function anvil(method: string, params: unknown[] = []) {
  await fetch("http://127.0.0.1:8545", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
}

/** Click "Approve" if the modal asks for it (allowance may be left over from an earlier run). */
async function approveIfNeeded(page: Page, symbol: string) {
  const approve = page.getByRole("dialog").getByRole("button", { name: `Approve ${symbol}` });
  if (await approve.isVisible()) {
    await approve.click();
    await confirm(page, new RegExp(`Approve ${symbol}`));
  }
}

test.beforeAll(async () => {
  await anvil("evm_increaseTime", [86_401]);
  await anvil("evm_mine");
});

test("supply WETH, borrow USDC, then repay it all", async ({ page }) => {
  await connectDevWallet(page);

  // Faucet WETH (the dev account also holds seed tokens from the deploy script).
  // Navigate inside the app: the dev wallet connection lives in memory, a full reload would drop it.
  await page.getByRole("link", { name: "Faucet & demo" }).first().click();
  await page.getByRole("button", { name: "Get WETH" }).click();
  await confirm(page, /Get test WETH/);
  await page.getByRole("link", { name: "Dashboard" }).first().click();

  // Supply 2 WETH: approve, then supply.
  const wethRow = page.getByRole("row").filter({ hasText: "Wrapped Ether" });
  await wethRow.getByRole("button", { name: "Supply" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Amount").fill("2");
  await approveIfNeeded(page, "WETH");
  await dialog.getByRole("button", { name: /^Supply$/ }).click();
  await confirm(page, /Supply 2 WETH/);

  // Borrow 1,000 USDC and check the health factor preview is shown.
  const usdcRow = page.getByRole("row").filter({ hasText: "USD Coin" });
  await usdcRow.getByRole("button", { name: "Borrow" }).click();
  await dialog.getByLabel("Amount").fill("1000");
  await expect(dialog.getByText("Health factor")).toBeVisible();
  await dialog.getByRole("button", { name: /^Borrow$/ }).click();
  await confirm(page, /Borrow 1,000 USDC/);
  await expect(page.getByRole("heading", { name: "Your borrows" })).toBeVisible();
  await expect(page.getByText(/1,000(\.\d+)? USDC/).first()).toBeVisible();

  // A borrow far above the limit is blocked in the UI before any wallet prompt.
  await usdcRow.getByRole("button", { name: "Borrow" }).click();
  await dialog.getByLabel("Amount").fill("100000000");
  await expect(dialog.getByRole("button", { name: "Exceeds borrow limit" })).toBeDisabled();
  await dialog.getByRole("button", { name: "Close" }).click();

  // Interest accrues every second, so top up USDC from the faucet before repaying in full.
  await page.getByRole("link", { name: "Faucet & demo" }).first().click();
  await page.getByRole("button", { name: "Get USDC" }).click();
  await confirm(page, /Get test USDC/);
  await page.getByRole("link", { name: "Dashboard" }).first().click();

  // Repay everything.
  await page.getByRole("button", { name: "Repay" }).first().click();
  await dialog.getByRole("button", { name: "MAX" }).click();
  await approveIfNeeded(page, "USDC");
  await dialog.getByRole("button", { name: /^Repay$/ }).click();
  await confirm(page, /Repay/);
  await expect(page.getByText("No open loans.")).toBeVisible();
});
