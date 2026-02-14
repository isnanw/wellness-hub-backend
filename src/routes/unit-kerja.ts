import { Hono } from "hono";
import { db } from "../db";
import { unitKerja } from "../db/schema";
import { eq, asc, desc } from "drizzle-orm";
import { authMiddleware } from "../middleware/auth";

const app = new Hono();

const generateId = () => crypto.randomUUID();
// Simple code generator: UNIT-XXXXXX
const generateCode = () => {
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `UNIT-${random}`;
};

// GET all puskesmas (Protected: Admin Only or Internal Use)
app.get("/", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    // Optional: Check if admin
    // if (user.role !== "admin") return c.json({ error: "Forbidden" }, 403);

    const data = await db
      .select()
      .from(unitKerja)
      .orderBy(asc(unitKerja.sortOrder), asc(unitKerja.districtName), asc(unitKerja.name));
    return c.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching puskesmas:", error);
    return c.json({ success: false, error: "Failed to fetch puskesmas" }, 500);
  }
});

// GET active puskesmas only (Public)
app.get("/active", async (c) => {
  try {
    const data = await db
      .select()
      .from(unitKerja)
      .where(eq(unitKerja.status, "active"))
      .orderBy(asc(unitKerja.sortOrder), asc(unitKerja.districtName), asc(unitKerja.name));
    return c.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching active puskesmas:", error);
    return c.json({ success: false, error: "Failed to fetch puskesmas" }, 500);
  }
});

// GET single puskesmas by ID (Public/Protected depending on use case. Let's make it Protected with Auth)
app.get("/:id", authMiddleware, async (c) => {
  try {
    const id = c.req.param("id");
    const [data] = await db.select().from(unitKerja).where(eq(unitKerja.id, id));

    if (!data) {
      return c.json({ success: false, error: "Puskesmas not found" }, 404);
    }

    return c.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching puskesmas:", error);
    return c.json({ success: false, error: "Failed to fetch puskesmas" }, 500);
  }
});

// POST create new puskesmas (Protected: Admin Only)
app.post("/", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    if (user.role !== "admin") {
      return c.json({ success: false, error: "Unauthorized: Admin only" }, 403);
    }

    const body = await c.req.json();
    const { districtId, districtName, name, address, phone, sortOrder, status } = body;

    if (!districtName || !name) {
      return c.json({ success: false, error: "District name and name are required" }, 400);
    }

    const [data] = await db
      .insert(unitKerja)
      .values({
        id: generateId(),
        districtId: districtId || null,
        districtName,
        name,
        code: generateCode(), // Auto-generate code
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

// PUT update puskesmas (Protected: Admin Only)
app.put("/:id", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    if (user.role !== "admin") {
      return c.json({ success: false, error: "Unauthorized: Admin only" }, 403);
    }

    const id = c.req.param("id");
    const body = await c.req.json();
    const { districtId, districtName, name, code, address, phone, sortOrder, status } = body;

    const [existing] = await db.select().from(unitKerja).where(eq(unitKerja.id, id));
    if (!existing) {
      return c.json({ success: false, error: "Puskesmas not found" }, 404);
    }

    const [data] = await db
      .update(unitKerja)
      .set({
        districtId: districtId !== undefined ? districtId : existing.districtId,
        districtName: districtName ?? existing.districtName,
        name: name ?? existing.name,
        code: code ?? existing.code,
        address: address !== undefined ? address : existing.address,
        phone: phone !== undefined ? phone : existing.phone,
        sortOrder: sortOrder ?? existing.sortOrder,
        status: status ?? existing.status,
        updatedAt: new Date(),
      })
      .where(eq(unitKerja.id, id))
      .returning();

    return c.json({ success: true, data });
  } catch (error) {
    console.error("Error updating puskesmas:", error);
    return c.json({ success: false, error: "Failed to update puskesmas" }, 500);
  }
});

// DELETE puskesmas (Protected: Admin Only)
app.delete("/:id", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    if (user.role !== "admin") {
      return c.json({ success: false, error: "Unauthorized: Admin only" }, 403);
    }

    const id = c.req.param("id");

    const [existing] = await db.select().from(unitKerja).where(eq(unitKerja.id, id));
    if (!existing) {
      return c.json({ success: false, error: "Puskesmas not found" }, 404);
    }

    await db.delete(unitKerja).where(eq(unitKerja.id, id));
    return c.json({ success: true, message: "Puskesmas deleted successfully" });
  } catch (error) {
    console.error("Error deleting puskesmas:", error);
    return c.json({ success: false, error: "Failed to delete puskesmas" }, 500);
  }
});

export default app;
