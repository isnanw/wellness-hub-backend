import { Hono } from "hono";
import { db } from "../db";
import { serviceCategories } from "../db/schema";
import { eq, asc } from "drizzle-orm";
import { authMiddleware } from "../middleware/auth";

const app = new Hono();

const generateId = () => crypto.randomUUID();

// GET all service categories (Public - for dropdown in forms)
app.get("/", async (c) => {
    try {
        const data = await db
            .select()
            .from(serviceCategories)
            .where(eq(serviceCategories.status, "active"))
            .orderBy(asc(serviceCategories.sortOrder), asc(serviceCategories.name));
        return c.json({ success: true, data });
    } catch (error) {
        console.error("Error fetching service categories:", error);
        return c.json({ success: false, error: "Failed to fetch service categories" }, 500);
    }
});

// GET single service category by ID (Public)
app.get("/:id", async (c) => {
    try {
        const id = c.req.param("id");
        const [data] = await db.select().from(serviceCategories).where(eq(serviceCategories.id, id));

        if (!data) {
            return c.json({ success: false, error: "Service category not found" }, 404);
        }

        return c.json({ success: true, data });
    } catch (error) {
        console.error("Error fetching service category:", error);
        return c.json({ success: false, error: "Failed to fetch service category" }, 500);
    }
});

// POST create new service category (Admin only)
app.post("/", authMiddleware, async (c) => {
    try {
        const user = c.get("user");
        if (user.role !== "admin") {
            return c.json({ success: false, error: "Unauthorized: Admin only" }, 403);
        }

        const body = await c.req.json();
        const { name, slug, description, icon, sortOrder, status } = body;

        if (!name || !slug) {
            return c.json({ success: false, error: "Name and slug are required" }, 400);
        }

        const [data] = await db
            .insert(serviceCategories)
            .values({
                id: generateId(),
                name,
                slug,
                description: description || null,
                icon: icon || null,
                sortOrder: sortOrder || 0,
                status: status || "active",
            })
            .returning();

        return c.json({ success: true, data }, 201);
    } catch (error) {
        console.error("Error creating service category:", error);
        return c.json({ success: false, error: "Failed to create service category" }, 500);
    }
});

// PUT update service category (Admin only)
app.put("/:id", authMiddleware, async (c) => {
    try {
        const user = c.get("user");
        if (user.role !== "admin") {
            return c.json({ success: false, error: "Unauthorized: Admin only" }, 403);
        }

        const id = c.req.param("id");
        const body = await c.req.json();
        const { name, slug, description, icon, sortOrder, status } = body;

        const [existing] = await db.select().from(serviceCategories).where(eq(serviceCategories.id, id));
        if (!existing) {
            return c.json({ success: false, error: "Service category not found" }, 404);
        }

        const [data] = await db
            .update(serviceCategories)
            .set({
                name: name ?? existing.name,
                slug: slug ?? existing.slug,
                description: description !== undefined ? description : existing.description,
                icon: icon !== undefined ? icon : existing.icon,
                sortOrder: sortOrder ?? existing.sortOrder,
                status: status ?? existing.status,
                updatedAt: new Date(),
            })
            .where(eq(serviceCategories.id, id))
            .returning();

        return c.json({ success: true, data });
    } catch (error) {
        console.error("Error updating service category:", error);
        return c.json({ success: false, error: "Failed to update service category" }, 500);
    }
});

// DELETE service category (Admin only)
app.delete("/:id", authMiddleware, async (c) => {
    try {
        const user = c.get("user");
        if (user.role !== "admin") {
            return c.json({ success: false, error: "Unauthorized: Admin only" }, 403);
        }

        const id = c.req.param("id");

        const [existing] = await db.select().from(serviceCategories).where(eq(serviceCategories.id, id));
        if (!existing) {
            return c.json({ success: false, error: "Service category not found" }, 404);
        }

        await db.delete(serviceCategories).where(eq(serviceCategories.id, id));
        return c.json({ success: true, message: "Service category deleted successfully" });
    } catch (error) {
        console.error("Error deleting service category:", error);
        return c.json({ success: false, error: "Failed to delete service category" }, 500);
    }
});

export default app;
