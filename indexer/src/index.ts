import { ponder, type Context, type Event } from "ponder:registry";
import schema from "ponder:schema";

const { activity, borrower } = schema;

type AnyEvent = Event<"LendingPool:Supply">; // shape shared by every event: block, log, transaction

async function record(
  context: Context,
  event: Pick<AnyEvent, "block" | "log" | "transaction">,
  row: { kind: string; user: `0x${string}`; asset: `0x${string}`; amount: bigint; counterparty?: `0x${string}` },
) {
  await context.db.insert(activity).values({
    id: `${event.transaction.hash}-${event.log.logIndex}`,
    chainId: context.chain.id,
    txHash: event.transaction.hash,
    blockNumber: event.block.number,
    timestamp: event.block.timestamp,
    counterparty: row.counterparty ?? null,
    ...row,
  });
}

ponder.on("LendingPool:Supply", async ({ event, context }) => {
  const { asset, caller, onBehalfOf, assets } = event.args;
  await record(context, event, {
    kind: "supply",
    user: onBehalfOf,
    asset,
    amount: assets,
    counterparty: caller !== onBehalfOf ? caller : undefined,
  });
});

ponder.on("LendingPool:Withdraw", async ({ event, context }) => {
  const { asset, user, assets } = event.args;
  await record(context, event, { kind: "withdraw", user, asset, amount: assets });
});

ponder.on("LendingPool:Borrow", async ({ event, context }) => {
  const { asset, user, amount } = event.args;
  await record(context, event, { kind: "borrow", user, asset, amount });
  await context.db
    .insert(borrower)
    .values({
      address: user,
      firstBorrowBlock: event.block.number,
      lastActivity: event.block.timestamp,
      borrowCount: 1,
      liquidationCount: 0,
    })
    .onConflictDoUpdate((row) => ({ lastActivity: event.block.timestamp, borrowCount: row.borrowCount + 1 }));
});

ponder.on("LendingPool:Repay", async ({ event, context }) => {
  const { asset, payer, onBehalfOf, amount } = event.args;
  await record(context, event, {
    kind: "repay",
    user: onBehalfOf,
    asset,
    amount,
    counterparty: payer !== onBehalfOf ? payer : undefined,
  });
});

ponder.on("LendingPool:CollateralToggled", async ({ event, context }) => {
  const { user, asset, enabled } = event.args;
  await record(context, event, { kind: "collateral", user, asset, amount: enabled ? 1n : 0n });
});

ponder.on("LendingPool:Liquidation", async ({ event, context }) => {
  const { liquidator, borrower: user, debtAsset, debtRepaid } = event.args;
  await record(context, event, { kind: "liquidation", user, asset: debtAsset, amount: debtRepaid, counterparty: liquidator });
  await context.db
    .update(borrower, { address: user })
    .set((row) => ({ lastActivity: event.block.timestamp, liquidationCount: row.liquidationCount + 1 }));
});

ponder.on("LendingPool:BadDebtWrittenOff", async ({ event, context }) => {
  const { borrower: user, asset, amount } = event.args;
  await record(context, event, { kind: "badDebt", user, asset, amount });
});
