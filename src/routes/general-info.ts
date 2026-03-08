import { Hono } from "hono";
import { db } from "../db";
import { generalInfo } from "../db/schema";
import { eq } from "drizzle-orm";

const app = new Hono();

// GET all general info
app.get("/", async (c) => {
  try {
    const data = await db.select().from(generalInfo);

    // Convert array to object for easier frontend consumption
    // { "hotline": "...", "address": "..." }
    const formattedData = data.reduce((acc, item) => {
      acc[item.key] = item.value;
      return acc;
    }, {} as Record<string, string>);

    return c.json({ success: true, data: formattedData });
  } catch (error) {
    console.error("Error fetching general info:", error);
    return c.json({ success: false, error: "Failed to fetch general info" }, 500);
  }
});

// PUT update general info (bulk or single) — upsert
app.put("/", async (c) => {
  try {
    const body = await c.req.json();
    // body: { "hotline": "new number", "address": "new address", "hero_image": "/uploads/..." }

    const updates = Object.entries(body).map(async ([key, value]) => {
      const [existing] = await db.select().from(generalInfo).where(eq(generalInfo.key, key));

      if (existing) {
        return db.update(generalInfo)
          .set({ value: String(value), updatedAt: new Date() })
          .where(eq(generalInfo.key, key));
      } else {
        // Insert new key if it doesn't exist
        return db.insert(generalInfo).values({
          id: crypto.randomUUID(),
          key,
          value: String(value),
          label: key, // use key as label fallback
          category: key.startsWith("hero_") ? "appearance" : "general",
        });
      }
    });

    await Promise.all(updates);

    return c.json({ success: true, message: "General info updated successfully" });
  } catch (error) {
    console.error("Error updating general info:", error);
    return c.json({ success: false, error: "Failed to update general info" }, 500);
  }
});

export default app;
