import { Hono } from "hono";
import { db } from "../db";
import { registrations, type NewRegistration } from "../db/schema";
import { eq, desc, and, sql, gte, lt } from "drizzle-orm";

const registrationsRouter = new Hono();

// Helper function to generate queue number
async function generateQueueNumber(puskesmas: string, service: string, appointmentDate: Date): Promise<string> {
  // Format date as YYYYMMDD
  const dateStr = appointmentDate.toISOString().split("T")[0].replace(/-/g, "");

  // Get service code (first 3 letters uppercase)
  const serviceCode = service.substring(0, 3).toUpperCase();

  // Get puskesmas code (extract from name, e.g., "Puskesmas Ilaga" -> "ILG")
  const pkmName = puskesmas.replace(/Puskesmas\s*/i, "").trim();
  const pkmCode = pkmName.substring(0, 3).toUpperCase();

  // Get start and end of the appointment date
  const startOfDay = new Date(appointmentDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(appointmentDate);
  endOfDay.setHours(23, 59, 59, 999);

  // Count existing registrations for same puskesmas, service, and date
  const existingCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(registrations)
    .where(
      and(
        eq(registrations.puskesmas, puskesmas),
        eq(registrations.service, service),
        gte(registrations.appointmentDate, startOfDay),
        lt(registrations.appointmentDate, endOfDay)
      )
    );

  const queueNum = (Number(existingCount[0]?.count) || 0) + 1;
  const paddedNum = queueNum.toString().padStart(3, "0");

  return `${pkmCode}/${serviceCode}/${dateStr}/${paddedNum}`;
}

// Get all registrations
registrationsRouter.get("/", async (c) => {
  try {
    const result = await db.select().from(registrations).orderBy(desc(registrations.createdAt));
    return c.json({ data: result });
  } catch (error) {
    console.error("Error fetching registrations:", error);
    return c.json({ error: "Failed to fetch registrations" }, 500);
  }
});

// Get registrations by status
registrationsRouter.get("/status/:status", async (c) => {
  try {
    const status = c.req.param("status") as "pending" | "confirmed" | "completed" | "cancelled";
    const result = await db
      .select()
      .from(registrations)
      .where(eq(registrations.status, status))
      .orderBy(desc(registrations.createdAt));
    return c.json({ data: result });
  } catch (error) {
    console.error("Error fetching registrations:", error);
    return c.json({ error: "Failed to fetch registrations" }, 500);
  }
});

// Get registration by ID
registrationsRouter.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const result = await db.select().from(registrations).where(eq(registrations.id, id));

    if (result.length === 0) {
      return c.json({ error: "Registration not found" }, 404);
    }

    return c.json({ data: result[0] });
  } catch (error) {
    console.error("Error fetching registration:", error);
    return c.json({ error: "Failed to fetch registration" }, 500);
  }
});

// Check registration status by NIK
registrationsRouter.get("/check/:nik", async (c) => {
  try {
    const nik = c.req.param("nik");
    const result = await db
      .select()
      .from(registrations)
      .where(eq(registrations.nik, nik))
      .orderBy(desc(registrations.createdAt));

    return c.json({ data: result });
  } catch (error) {
    console.error("Error checking registration:", error);
    return c.json({ error: "Failed to check registration" }, 500);
  }
});

// Create registration
registrationsRouter.post("/", async (c) => {
  try {
    const body = await c.req.json<Omit<NewRegistration, "id" | "queueNumber">>();
    const id = crypto.randomUUID();

    // Parse appointment date
    const appointmentDate = new Date(body.appointmentDate);

    // Generate queue number
    const queueNumber = await generateQueueNumber(
      body.puskesmas,
      body.service,
      appointmentDate
    );

    const newRegistration: NewRegistration = {
      ...body,
      id,
      queueNumber,
      appointmentDate,
    };

    const result = await db.insert(registrations).values(newRegistration).returning();
    return c.json({ data: result[0] }, 201);
  } catch (error) {
    console.error("Error creating registration:", error);
    return c.json({ error: "Failed to create registration" }, 500);
  }
});

// Update registration
registrationsRouter.put("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json<Partial<NewRegistration>>();

    const result = await db
      .update(registrations)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(registrations.id, id))
      .returning();

    if (result.length === 0) {
      return c.json({ error: "Registration not found" }, 404);
    }

    return c.json({ data: result[0] });
  } catch (error) {
    console.error("Error updating registration:", error);
    return c.json({ error: "Failed to update registration" }, 500);
  }
});

// Update registration status
registrationsRouter.patch("/:id/status", async (c) => {
  try {
    const id = c.req.param("id");
    const { status } = await c.req.json<{ status: "pending" | "confirmed" | "completed" | "cancelled" }>();

    const result = await db
      .update(registrations)
      .set({ status, updatedAt: new Date() })
      .where(eq(registrations.id, id))
      .returning();

    if (result.length === 0) {
      return c.json({ error: "Registration not found" }, 404);
    }

    return c.json({ data: result[0] });
  } catch (error) {
    console.error("Error updating registration status:", error);
    return c.json({ error: "Failed to update registration status" }, 500);
  }
});

// Delete registration
registrationsRouter.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const result = await db.delete(registrations).where(eq(registrations.id, id)).returning();

    if (result.length === 0) {
      return c.json({ error: "Registration not found" }, 404);
    }

    return c.json({ message: "Registration deleted successfully" });
  } catch (error) {
    console.error("Error deleting registration:", error);
    return c.json({ error: "Failed to delete registration" }, 500);
  }
});

export { registrationsRouter };
