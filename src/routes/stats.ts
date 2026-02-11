import { Hono } from "hono";
import { db } from "../db";
import { healthStatistics } from "../db/schema";
import { asc } from "drizzle-orm";

const app = new Hono();

app.get("/", async (c) => {
  try {
    const data = await db
      .select()
      .from(healthStatistics)
      .orderBy(asc(healthStatistics.sortOrder));

    return c.json({ success: true, data });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

export default app;
