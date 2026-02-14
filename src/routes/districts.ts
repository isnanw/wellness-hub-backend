import { Hono } from "hono";
import { db } from "../db";
import { districts } from "../db/schema";
import { eq, asc } from "drizzle-orm";
import { authMiddleware } from "../middleware/auth";

const app = new Hono();

const generateId = () => crypto.randomUUID();

// GET all districts
app.get("/", async (c) => {
    try {
        const data = await db
            .select()
            .from(districts)
            .orderBy(asc(districts.name));
        return c.json({ success: true, data });
    } catch (error) {
        console.error("Error fetching districts:", error);
        return c.json({ success: false, error: "Failed to fetch districts" }, 500);
    }
});

// GET district by ID
app.get("/:id", async (c) => {
    try {
        const id = c.req.param("id");
        const [data] = await db.select().from(districts).where(eq(districts.id, id));

        if (!data) {
            return c.json({ success: false, error: "District not found" }, 404);
        }

        return c.json({ success: true, data });
    } catch (error) {
        console.error("Error fetching district:", error);
        return c.json({ success: false, error: "Failed to fetch district" }, 500);
    }
});

// POST create district (Admin only)
app.post("/", authMiddleware, async (c) => {
    try {
        const user = c.get("user");
        if (user.role !== "admin") {
            return c.json({ success: false, error: "Unauthorized: Admin only" }, 403);
        }

        const body = await c.req.json();
        const { name, code, coordinator, contact } = body;

        if (!name) {
            return c.json({ success: false, error: "Name is required" }, 400);
        }

        const [data] = await db
            .insert(districts)
            .values({
                id: generateId(),
                name,
                code: code || null,
                coordinator: coordinator || null,
                contact: contact || null,
            })
            .returning();

        return c.json({ success: true, data }, 201);
    } catch (error) {
        console.error("Error creating district:", error);
        return c.json({ success: false, error: "Failed to create district" }, 500);
    }
});

// PUT update district (Admin only)
app.put("/:id", authMiddleware, async (c) => {
    try {
        const user = c.get("user");
        if (user.role !== "admin") {
            return c.json({ success: false, error: "Unauthorized: Admin only" }, 403);
        }

        const id = c.req.param("id");
        const body = await c.req.json();
        const { name, code, coordinator, contact } = body;

        const [existing] = await db.select().from(districts).where(eq(districts.id, id));
        if (!existing) {
            return c.json({ success: false, error: "District not found" }, 404);
        }

        const [data] = await db
            .update(districts)
            .set({
                name: name ?? existing.name,
                code: code !== undefined ? code : existing.code,
                coordinator: coordinator !== undefined ? coordinator : existing.coordinator,
                contact: contact !== undefined ? contact : existing.contact,
                updatedAt: new Date(),
            })
            .where(eq(districts.id, id))
            .returning();

        return c.json({ success: true, data });
    } catch (error) {
        console.error("Error updating district:", error);
        return c.json({ success: false, error: "Failed to update district" }, 500);
    }
});

// DELETE district (Admin only)
app.delete("/:id", authMiddleware, async (c) => {
    try {
        const user = c.get("user");
        if (user.role !== "admin") {
            return c.json({ success: false, error: "Unauthorized: Admin only" }, 403);
        }

        const id = c.req.param("id");

        const [existing] = await db.select().from(districts).where(eq(districts.id, id));
        if (!existing) {
            return c.json({ success: false, error: "District not found" }, 404);
        }

        await db.delete(districts).where(eq(districts.id, id));
        return c.json({ success: true, message: "District deleted successfully" });
    } catch (error) {
        console.error("Error deleting district:", error);
        return c.json({ success: false, error: "Failed to delete district" }, 500);
    }
});

export default app;
