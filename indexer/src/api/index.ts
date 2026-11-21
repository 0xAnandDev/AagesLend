import { Hono } from "hono";
import { cors } from "hono/cors";
import { db } from "ponder:api";
import schema from "ponder:schema";
import { and, desc, eq, graphql, replaceBigInts } from "ponder";

const { activity, borrower } = schema;

const app = new Hono();

app.use("*", cors());

// Full GraphQL API (with a playground at /graphql).
app.use("/graphql", graphql({ db, schema }));

/** GET /activity?user=0x..&chainId=31337&limit=50 : newest pool events first. */
app.get("/activity", async (c) => {
  const user = c.req.query("user")?.toLowerCase() as `0x${string}` | undefined;
  const chainId = c.req.query("chainId");
  const limit = Math.min(Number(c.req.query("limit") ?? 50), 200);
  const filters = [user ? eq(activity.user, user) : undefined, chainId ? eq(activity.chainId, Number(chainId)) : undefined].filter(
    (f) => f !== undefined,
  );
  const rows = await db
    .select()
    .from(activity)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(activity.blockNumber), desc(activity.id))
    .limit(limit);
  return c.json(replaceBigInts(rows, (v) => v.toString()));
});

/** GET /borrowers : every address that has borrowed (the keeper re-checks each on-chain). */
app.get("/borrowers", async (c) => {
  const rows = await db.select().from(borrower).orderBy(desc(borrower.lastActivity));
  return c.json(replaceBigInts(rows, (v) => v.toString()));
});

export default app;
