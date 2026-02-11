import { Hono } from "hono";
import { db } from "../db";
import { schedules, type NewSchedule } from "../db/schema";
import { eq, desc, gte } from "drizzle-orm";

const schedulesRouter = new Hono();

// Get all schedules
schedulesRouter.get("/", async (c) => {
  try {
    const result = await db.select().from(schedules).orderBy(desc(schedules.date));
    return c.json({ data: result });
  } catch (error) {
    console.error("Error fetching schedules:", error);
    return c.json({ error: "Failed to fetch schedules" }, 500);
  }
});

// Get upcoming schedules (date >= today)
schedulesRouter.get("/upcoming", async (c) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await db
      .select()
      .from(schedules)
      .where(gte(schedules.date, today))
      .orderBy(schedules.date);
    return c.json({ data: result });
  } catch (error) {
    console.error("Error fetching upcoming schedules:", error);
    return c.json({ error: "Failed to fetch upcoming schedules" }, 500);
  }
});

// Get schedules by type
schedulesRouter.get("/type/:type", async (c) => {
  try {
    const type = c.req.param("type") as "posyandu" | "imunisasi" | "penyuluhan" | "pemeriksaan" | "vaksinasi" | "lainnya";
    const result = await db
      .select()
      .from(schedules)
      .where(eq(schedules.type, type))
      .orderBy(desc(schedules.date));
    return c.json({ data: result });
  } catch (error) {
    console.error("Error fetching schedules:", error);
    return c.json({ error: "Failed to fetch schedules" }, 500);
  }
});

// Get schedules by status
schedulesRouter.get("/status/:status", async (c) => {
  try {
    const status = c.req.param("status") as "upcoming" | "ongoing" | "completed" | "cancelled";
    const result = await db
      .select()
      .from(schedules)
      .where(eq(schedules.status, status))
      .orderBy(desc(schedules.date));
    return c.json({ data: result });
  } catch (error) {
    console.error("Error fetching schedules:", error);
    return c.json({ error: "Failed to fetch schedules" }, 500);
  }
});

// Get schedule by ID
schedulesRouter.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const result = await db.select().from(schedules).where(eq(schedules.id, id));

    if (result.length === 0) {
      return c.json({ error: "Schedule not found" }, 404);
    }

    return c.json({ data: result[0] });
  } catch (error) {
    console.error("Error fetching schedule:", error);
    return c.json({ error: "Failed to fetch schedule" }, 500);
  }
});

// Create schedule
schedulesRouter.post("/", async (c) => {
  try {
    const body = await c.req.json<NewSchedule>();
    const id = crypto.randomUUID();

    const newSchedule: NewSchedule = {
      ...body,
      id,
    };

    const result = await db.insert(schedules).values(newSchedule).returning();
    return c.json({ data: result[0] }, 201);
  } catch (error) {
    console.error("Error creating schedule:", error);
    return c.json({ error: "Failed to create schedule" }, 500);
  }
});

// Update schedule
schedulesRouter.put("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json<Partial<NewSchedule>>();

    // Convert date string to Date object
    if (body.date && typeof body.date === "string") {
      body.date = new Date(body.date);
    }

    const result = await db
      .update(schedules)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(schedules.id, id))
      .returning();

    if (result.length === 0) {
      return c.json({ error: "Schedule not found" }, 404);
    }

    return c.json({ data: result[0] });
  } catch (error) {
    console.error("Error updating schedule:", error);
    return c.json({ error: "Failed to update schedule" }, 500);
  }
});

// Update schedule status
schedulesRouter.patch("/:id/status", async (c) => {
  try {
    const id = c.req.param("id");
    const { status } = await c.req.json<{ status: "upcoming" | "ongoing" | "completed" | "cancelled" }>();

    const result = await db
      .update(schedules)
      .set({ status, updatedAt: new Date() })
      .where(eq(schedules.id, id))
      .returning();

    if (result.length === 0) {
      return c.json({ error: "Schedule not found" }, 404);
    }

    return c.json({ data: result[0] });
  } catch (error) {
    console.error("Error updating schedule status:", error);
    return c.json({ error: "Failed to update schedule status" }, 500);
  }
});

// Register to schedule (increment registered count)
schedulesRouter.patch("/:id/register", async (c) => {
  try {
    const id = c.req.param("id");

    // Get current schedule
    const current = await db.select().from(schedules).where(eq(schedules.id, id));
    if (current.length === 0) {
      return c.json({ error: "Schedule not found" }, 404);
    }

    const schedule = current[0];
    if (schedule.registered >= schedule.capacity) {
      return c.json({ error: "Schedule is full" }, 400);
    }

    const result = await db
      .update(schedules)
      .set({ registered: schedule.registered + 1, updatedAt: new Date() })
      .where(eq(schedules.id, id))
      .returning();

    return c.json({ data: result[0] });
  } catch (error) {
    console.error("Error registering to schedule:", error);
    return c.json({ error: "Failed to register to schedule" }, 500);
  }
});

// Delete schedule
schedulesRouter.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const result = await db.delete(schedules).where(eq(schedules.id, id)).returning();

    if (result.length === 0) {
      return c.json({ error: "Schedule not found" }, 404);
    }

    return c.json({ message: "Schedule deleted successfully" });
  } catch (error) {
    console.error("Error deleting schedule:", error);
    return c.json({ error: "Failed to delete schedule" }, 500);
  }
});

export { schedulesRouter };
