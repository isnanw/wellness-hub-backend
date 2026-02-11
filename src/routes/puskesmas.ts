import { Hono } from "hono";
import { db } from "../db";
import { puskesmas } from "../db/schema";
import { eq, asc, desc } from "drizzle-orm";

const app = new Hono();

const generateId = () => crypto.randomUUID();

// GET all puskesmas
app.get("/", async (c) => {
  try {
    const data = await db
      .select()
      .from(puskesmas)
      .orderBy(asc(puskesmas.sortOrder), asc(puskesmas.districtName), asc(puskesmas.name));
    return c.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching puskesmas:", error);
    return c.json({ success: false, error: "Failed to fetch puskesmas" }, 500);
  }
});

// GET active puskesmas only (for public dropdown)
app.get("/active", async (c) => {
  try {
    const data = await db
      .select()
      .from(puskesmas)
      .where(eq(puskesmas.status, "active"))
      .orderBy(asc(puskesmas.sortOrder), asc(puskesmas.districtName), asc(puskesmas.name));
    return c.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching active puskesmas:", error);
    return c.json({ success: false, error: "Failed to fetch puskesmas" }, 500);
  }
});

// GET single puskesmas by ID
app.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const [data] = await db.select().from(puskesmas).where(eq(puskesmas.id, id));

    if (!data) {
      return c.json({ success: false, error: "Puskesmas not found" }, 404);
    }

    return c.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching puskesmas:", error);
    return c.json({ success: false, error: "Failed to fetch puskesmas" }, 500);
  }
});

// POST create new puskesmas
app.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const { districtName, name, code, address, phone, sortOrder, status } = body;

    if (!districtName || !name || !code) {
      return c.json({ success: false, error: "District name, name, and code are required" }, 400);
    }

    const [data] = await db
      .insert(puskesmas)
      .values({
        id: generateId(),
        districtName,
        name,
        code,
        address: address || null,
        phone: phone || null,
        sortOrder: sortOrder || 0,
        status: status || "active",
      })
      .returning();

    return c.json({ success: true, data }, 201);
  } catch (error) {
    console.error("Error creating puskesmas:", error);
    return c.json({ success: false, error: "Failed to create puskesmas" }, 500);
  }
});

// PUT update puskesmas
app.put("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const { districtName, name, code, address, phone, sortOrder, status } = body;

    const [existing] = await db.select().from(puskesmas).where(eq(puskesmas.id, id));
    if (!existing) {
      return c.json({ success: false, error: "Puskesmas not found" }, 404);
    }

    const [data] = await db
      .update(puskesmas)
      .set({
        districtName: districtName ?? existing.districtName,
        name: name ?? existing.name,
        code: code ?? existing.code,
        address: address !== undefined ? address : existing.address,
        phone: phone !== undefined ? phone : existing.phone,
        sortOrder: sortOrder ?? existing.sortOrder,
        status: status ?? existing.status,
        updatedAt: new Date(),
      })
      .where(eq(puskesmas.id, id))
      .returning();

    return c.json({ success: true, data });
  } catch (error) {
    console.error("Error updating puskesmas:", error);
    return c.json({ success: false, error: "Failed to update puskesmas" }, 500);
  }
});

// DELETE puskesmas
app.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");

    const [existing] = await db.select().from(puskesmas).where(eq(puskesmas.id, id));
    if (!existing) {
      return c.json({ success: false, error: "Puskesmas not found" }, 404);
    }

    await db.delete(puskesmas).where(eq(puskesmas.id, id));
    return c.json({ success: true, message: "Puskesmas deleted successfully" });
  } catch (error) {
    console.error("Error deleting puskesmas:", error);
    return c.json({ success: false, error: "Failed to delete puskesmas" }, 500);
  }
});

export default app;
