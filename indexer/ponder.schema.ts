import { index, onchainTable } from "ponder";

/** One row per pool event, newest first in the API. */
export const activity = onchainTable(
  "activity",
  (t) => ({
    id: t.text().primaryKey(), // `${txHash}-${logIndex}`
    chainId: t.integer().notNull(),
    kind: t.text().notNull(), // supply | withdraw | borrow | repay | liquidation | collateral | badDebt
    user: t.hex().notNull(),
    asset: t.hex().notNull(),
    amount: t.bigint().notNull(),
    counterparty: t.hex(), // liquidator for liquidations, payer/caller when different from user
    txHash: t.hex().notNull(),
    blockNumber: t.bigint().notNull(),
    timestamp: t.bigint().notNull(),
  }),
  (table) => ({
    userIdx: index().on(table.user),
    timeIdx: index().on(table.timestamp),
  }),
);

/** Every address that has ever borrowed: the keeper's watch list. */
export const borrower = onchainTable("borrower", (t) => ({
  address: t.hex().primaryKey(),
  firstBorrowBlock: t.bigint().notNull(),
  lastActivity: t.bigint().notNull(),
  borrowCount: t.integer().notNull(),
  liquidationCount: t.integer().notNull(),
}));
