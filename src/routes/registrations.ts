import { Hono } from "hono";
import { db } from "../db";
import { registrations, type NewRegistration, puskesmas } from "../db/schema";
import { eq, desc, and, sql, gte, lt } from "drizzle-orm";
import { authMiddleware } from "../middleware/auth";

const registrationsRouter = new Hono();

// Apply auth middleware
registrationsRouter.use("*", authMiddleware);

// Helper function to generate queue number
async function generateQueueNumber(puskesmasId: string, service: string, appointmentDate: Date): Promise<string> {
  // Format date as YYYYMMDD
  const dateStr = appointmentDate.toISOString().split("T")[0].replace(/-/g, "");

  // Get service code (first 3 letters uppercase)
  const serviceCode = service.substring(0, 3).toUpperCase();

  // Get puskesmas code (extract from name, e.g., "Puskesmas Ilaga" -> "ILG")
  const pkm = await db.select().from(puskesmas).where(eq(puskesmas.id, puskesmasId));
  const pkmName = pkm[0]?.name?.replace(/Puskesmas\s*/i, "").trim() || "PKM";
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
        eq(registrations.puskesmasId, puskesmasId),
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
    const user = c.get("user");
    const isPuskesmas = user.role === "puskesmas" && user.puskesmasId;

    let query = db
      .select({
        id: registrations.id,
        queueNumber: registrations.queueNumber,
        name: registrations.name,
        nik: registrations.nik,
        phone: registrations.phone,
        email: registrations.email,
        address: registrations.address,
        service: registrations.service,
        puskesmasId: registrations.puskesmasId,
        appointmentDate: registrations.appointmentDate,
        appointmentTime: registrations.appointmentTime,
        complaint: registrations.complaint,
        status: registrations.status,
        createdAt: registrations.createdAt,
        updatedAt: registrations.updatedAt,
        puskesmas: puskesmas.name, // Join result for frontend compatibility
      })
      .from(registrations)
      .leftJoin(puskesmas, eq(registrations.puskesmasId, puskesmas.id))
      .$dynamic();

    if (isPuskesmas) {
      query = query.where(eq(registrations.puskesmasId, user.puskesmasId!));
    }

    const result = await query.orderBy(desc(registrations.createdAt));
    return c.json({ data: result });
  } catch (error) {
    console.error("Error fetching registrations:", error);
    return c.json({ error: "Failed to fetch registrations" }, 500);
  }
});

// Get registrations by status
registrationsRouter.get("/status/:status", async (c) => {
  try {
    const user = c.get("user");
    const isPuskesmas = user.role === "puskesmas" && user.puskesmasId;
    const status = c.req.param("status") as "pending" | "confirmed" | "completed" | "cancelled";

    let query = db
      .select({
        id: registrations.id,
        queueNumber: registrations.queueNumber,
        name: registrations.name,
        nik: registrations.nik,
        phone: registrations.phone,
        email: registrations.email,
        address: registrations.address,
        service: registrations.service,
        puskesmasId: registrations.puskesmasId,
        appointmentDate: registrations.appointmentDate,
        appointmentTime: registrations.appointmentTime,
        complaint: registrations.complaint,
        status: registrations.status,
        createdAt: registrations.createdAt,
        updatedAt: registrations.updatedAt,
        puskesmas: puskesmas.name,
      })
      .from(registrations)
      .leftJoin(puskesmas, eq(registrations.puskesmasId, puskesmas.id))
      .$dynamic();

    const conditions = [eq(registrations.status, status)];
    if (isPuskesmas) {
      conditions.push(eq(registrations.puskesmasId, user.puskesmasId!));
    }

    query = query.where(and(...conditions));

    const result = await query.orderBy(desc(registrations.createdAt));
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
    const user = c.get("user");
    const isPuskesmas = user.role === "puskesmas" && user.puskesmasId;

    let query = db
      .select({
        id: registrations.id,
        queueNumber: registrations.queueNumber,
        name: registrations.name,
        nik: registrations.nik,
        phone: registrations.phone,
        email: registrations.email,
        address: registrations.address,
        service: registrations.service,
        puskesmasId: registrations.puskesmasId,
        appointmentDate: registrations.appointmentDate,
        appointmentTime: registrations.appointmentTime,
        complaint: registrations.complaint,
        status: registrations.status,
        createdAt: registrations.createdAt,
        updatedAt: registrations.updatedAt,
        puskesmas: puskesmas.name,
      })
      .from(registrations)
      .leftJoin(puskesmas, eq(registrations.puskesmasId, puskesmas.id))
      .$dynamic();

    const conditions = [eq(registrations.id, id)];
    if (isPuskesmas) {
      conditions.push(eq(registrations.puskesmasId, user.puskesmasId!));
    }

    const result = await query.where(and(...conditions));

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
    // Usually public route used by patients? If yes, should we auth?
    // If public, remove auth middleware usage or make it optional. 
    // Assuming this is used by admin system for now given the router structure.
    // If used by public, `user` might be undefined.
    // However, user said "lanjutkan semua", and `registrationsRouter` is under `/api/registrations`.
    // Let's assume it requires Auth for now. If public needs it, we should split or conditional auth.
    // For specific Puskesmas User, they can search by NIK but only see their own? Or global?
    // Usually NIK search is global for patients. But strictly speaking, puskesmas user checking NIK might want to see history in THEIR puskesmas.

    const result = await db
      .select({
        id: registrations.id,
        queueNumber: registrations.queueNumber,
        name: registrations.name,
        nik: registrations.nik,
        phone: registrations.phone,
        email: registrations.email,
        address: registrations.address,
        service: registrations.service,
        puskesmasId: registrations.puskesmasId,
        appointmentDate: registrations.appointmentDate,
        appointmentTime: registrations.appointmentTime,
        complaint: registrations.complaint,
        status: registrations.status,
        createdAt: registrations.createdAt,
        updatedAt: registrations.updatedAt,
        puskesmas: puskesmas.name,
      })
      .from(registrations)
      .leftJoin(puskesmas, eq(registrations.puskesmasId, puskesmas.id))
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
    const user = c.get("user");
    // Type definition needs to match request body. 
    // Frontend sends 'puskesmas' string? Or we expect 'puskesmasId'?
    // Frontend likely still sends old format. We need to handle 'puskesmasId' from body if updated, 
    // OR force overwrite from user session.

    const body = await c.req.json<any>(); // use any to be flexible with legacy body
    const id = crypto.randomUUID();

    // Determine Puskesmas ID
    let finalPuskesmasId = body.puskesmasId;

    if (user.role === "puskesmas" && user.puskesmasId) {
      finalPuskesmasId = user.puskesmasId;
    }

    if (!finalPuskesmasId) {
      return c.json({ error: "Puskesmas ID is required" }, 400);
    }

    // Parse appointment date
    const appointmentDate = new Date(body.appointmentDate);

    // Generate queue number
    const queueNumber = await generateQueueNumber(
      finalPuskesmasId,
      body.service,
      appointmentDate
    );

    const newRegistration: NewRegistration = {
      ...body,
      id,
      puskesmasId: finalPuskesmasId, // Overwrite/Ensure
      queueNumber,
      appointmentDate,
    };

    // Remove potential 'puskesmas' string field if it exists in body before inserting to strict schema
    // Drizzle ignores extra fields if not in schema usually, but better safe.
    // Actually NewRegistration type ensures we only put valid fields.
    // 'puskesmas' string property is NOT in NewRegistration anymore.

    const result = await db.insert(registrations).values({
      id: newRegistration.id,
      queueNumber: newRegistration.queueNumber,
      name: newRegistration.name,
      nik: newRegistration.nik,
      phone: newRegistration.phone,
      email: newRegistration.email,
      address: newRegistration.address,
      service: newRegistration.service,
      puskesmasId: newRegistration.puskesmasId,
      appointmentDate: newRegistration.appointmentDate,
      appointmentTime: newRegistration.appointmentTime,
      complaint: newRegistration.complaint,
      status: newRegistration.status || "pending",
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

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
    const user = c.get("user");
    const isPuskesmas = user.role === "puskesmas" && user.puskesmasId;

    const body = await c.req.json<Partial<NewRegistration>>();

    let query = db
      .update(registrations)
      .set({ ...body, updatedAt: new Date() });

    const conditions = [eq(registrations.id, id)];
    if (isPuskesmas) {
      conditions.push(eq(registrations.puskesmasId, user.puskesmasId!));
    }

    const result = await query.where(and(...conditions)).returning();

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
    const user = c.get("user");
    const isPuskesmas = user.role === "puskesmas" && user.puskesmasId;
    const { status } = await c.req.json<{ status: "pending" | "confirmed" | "completed" | "cancelled" }>();

    let query = db
      .update(registrations)
      .set({ status, updatedAt: new Date() });

    const conditions = [eq(registrations.id, id)];
    if (isPuskesmas) {
      conditions.push(eq(registrations.puskesmasId, user.puskesmasId!));
    }

    const result = await query.where(and(...conditions)).returning();

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
    const user = c.get("user");
    const isPuskesmas = user.role === "puskesmas" && user.puskesmasId;

    let query = db.delete(registrations);

    const conditions = [eq(registrations.id, id)];
    if (isPuskesmas) {
      conditions.push(eq(registrations.puskesmasId, user.puskesmasId!));
    }

    const result = await query.where(and(...conditions)).returning();

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

