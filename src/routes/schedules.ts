import { Hono } from "hono";
import { db } from "../db";
import { schedules, type NewSchedule } from "../db/schema";
import { eq, desc, gte, and } from "drizzle-orm";
import { authMiddleware } from "../middleware/auth";
import { getCookie } from "hono/cookie";
import { verify } from "hono/jwt";

const schedulesRouter = new Hono();

// Helper: check if user is unit_kerja role
const isUnitKerjaRole = (role: string) => role === "unit_kerja";

// Get all schedules with optional filters (Public + Optional Auth for Filtering)
schedulesRouter.get("/", async (c) => {
  try {
    const district = c.req.query("district");

    // Check for auth token to apply unit_kerja filter
    let isUnitKerja = false;
    let unitKerjaId = "";

    const token = getCookie(c, "auth_token");
    if (token) {
      try {
        const secret = process.env.JWT_SECRET || "super-secret-key-wellness-hub-2024";
        const payload = await verify(token, secret, "HS256");
        // @ts-ignore
        if (isUnitKerjaRole(payload.role) && payload.unitKerjaId) {
          isUnitKerja = true;
          // @ts-ignore
          unitKerjaId = payload.unitKerjaId as string;
        }
      } catch (e) {
        // Invalid token, proceed as public
      }
    }

    const conditions: any[] = [];

    if (district && district !== "all") {
      conditions.push(eq(schedules.district, district));
    }

    if (isUnitKerja && unitKerjaId) {
      conditions.push(eq(schedules.unitKerjaId, unitKerjaId));
    }

    let query = db.select().from(schedules).$dynamic();
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const result = await query.orderBy(desc(schedules.date));
    return c.json({ data: result });
  } catch (error) {
    console.error("Error fetching schedules:", error);
    return c.json({ error: "Failed to fetch schedules" }, 500);
  }
});

// Get upcoming schedules (date >= today) - Public
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

// Create schedule (Protected)
schedulesRouter.post("/", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const body = await c.req.json<NewSchedule>();
    const id = crypto.randomUUID();

    // If unit_kerja role, always use their own unitKerjaId
    let finalUnitKerjaId = body.unitKerjaId;
    if (isUnitKerjaRole(user.role) && user.unitKerjaId) {
      finalUnitKerjaId = user.unitKerjaId;
    }

    // Convert date string to Date object (PostgreSQL requires Date, not string)
    const date = body.date
      ? new Date(body.date as unknown as string)
      : null;

    if (!date || isNaN(date.getTime())) {
      return c.json({ error: "date is required and must be a valid date" }, 400);
    }

    const newSchedule: NewSchedule = {
      ...body,
      id,
      date,
      unitKerjaId: finalUnitKerjaId ?? null,
    };

    const result = await db.insert(schedules).values(newSchedule).returning();
    return c.json({ data: result[0] }, 201);
  } catch (error) {
    console.error("Error creating schedule:", JSON.stringify(error, null, 2));
    return c.json({ error: "Failed to create schedule" }, 500);
  }
});


// Update schedule (Protected)
schedulesRouter.put("/:id", authMiddleware, async (c) => {
  try {
    const id = c.req.param("id");
    const user = c.get("user");
    const isUnitKerja = isUnitKerjaRole(user.role) && user.unitKerjaId;

    const body = await c.req.json<Partial<NewSchedule>>();

    // Convert date string to Date object
    if (body.date && typeof body.date === "string") {
      body.date = new Date(body.date);
    }

    const conditions = [eq(schedules.id, id)];
    if (isUnitKerja) {
      conditions.push(eq(schedules.unitKerjaId, user.unitKerjaId!));
    }

    const result = await db
      .update(schedules)
      .set({ ...body, updatedAt: new Date() })
      .where(and(...conditions))
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

// Update schedule status (Protected)
schedulesRouter.patch("/:id/status", authMiddleware, async (c) => {
  try {
    const id = c.req.param("id");
    const user = c.get("user");
    const isUnitKerja = isUnitKerjaRole(user.role) && user.unitKerjaId;
    const { status } = await c.req.json<{ status: "upcoming" | "ongoing" | "completed" | "cancelled" }>();

    const conditions = [eq(schedules.id, id)];
    if (isUnitKerja) {
      conditions.push(eq(schedules.unitKerjaId, user.unitKerjaId!));
    }

    const result = await db
      .update(schedules)
      .set({ status, updatedAt: new Date() })
      .where(and(...conditions))
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

// Delete schedule (Protected)
schedulesRouter.delete("/:id", authMiddleware, async (c) => {
  try {
    const id = c.req.param("id");
    const user = c.get("user");
    const isUnitKerja = isUnitKerjaRole(user.role) && user.unitKerjaId;

    const conditions = [eq(schedules.id, id)];
    if (isUnitKerja) {
      conditions.push(eq(schedules.unitKerjaId, user.unitKerjaId!));
    }

    const result = await db.delete(schedules).where(and(...conditions)).returning();

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
