import { Hono } from "hono";
import { db } from "../db";
import { programCategories } from "../db/schema";
import { eq, asc } from "drizzle-orm";
import { authMiddleware } from "../middleware/auth";

const app = new Hono();

const generateId = () => crypto.randomUUID();

// GET all program categories (Public - for dropdown in forms)
app.get("/", async (c) => {
    try {
        const data = await db
            .select()
            .from(programCategories)
            .where(eq(programCategories.status, "active"))
            .orderBy(asc(programCategories.sortOrder), asc(programCategories.name));
        return c.json({ success: true, data });
    } catch (error) {
        console.error("Error fetching program categories:", error);
        return c.json({ success: false, error: "Failed to fetch program categories" }, 500);
    }
});

// GET single program category by ID (Public)
app.get("/:id", async (c) => {
    try {
        const id = c.req.param("id");
        const [data] = await db.select().from(programCategories).where(eq(programCategories.id, id));

        if (!data) {
            return c.json({ success: false, error: "Program category not found" }, 404);
        }

        return c.json({ success: true, data });
    } catch (error) {
        console.error("Error fetching program category:", error);
        return c.json({ success: false, error: "Failed to fetch program category" }, 500);
    }
});

// POST create new program category (Admin only)
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
            .insert(programCategories)
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
        console.error("Error creating program category:", error);
        return c.json({ success: false, error: "Failed to create program category" }, 500);
    }
});

// PUT update program category (Admin only)
app.put("/:id", authMiddleware, async (c) => {
    try {
        const user = c.get("user");
        if (user.role !== "admin") {
            return c.json({ success: false, error: "Unauthorized: Admin only" }, 403);
        }

        const id = c.req.param("id");
        const body = await c.req.json();
        const { name, slug, description, icon, sortOrder, status } = body;

        const [existing] = await db.select().from(programCategories).where(eq(programCategories.id, id));
        if (!existing) {
            return c.json({ success: false, error: "Program category not found" }, 404);
        }

        const [data] = await db
            .update(programCategories)
            .set({
                name: name ?? existing.name,
                slug: slug ?? existing.slug,
                description: description !== undefined ? description : existing.description,
                icon: icon !== undefined ? icon : existing.icon,
                sortOrder: sortOrder ?? existing.sortOrder,
                status: status ?? existing.status,
                updatedAt: new Date(),
            })
            .where(eq(programCategories.id, id))
            .returning();

        return c.json({ success: true, data });
    } catch (error) {
        console.error("Error updating program category:", error);
        return c.json({ success: false, error: "Failed to update program category" }, 500);
    }
});

// DELETE program category (Admin only)
app.delete("/:id", authMiddleware, async (c) => {
    try {
        const user = c.get("user");
        if (user.role !== "admin") {
            return c.json({ success: false, error: "Unauthorized: Admin only" }, 403);
        }

        const id = c.req.param("id");

        const [existing] = await db.select().from(programCategories).where(eq(programCategories.id, id));
        if (!existing) {
            return c.json({ success: false, error: "Program category not found" }, 404);
        }

        await db.delete(programCategories).where(eq(programCategories.id, id));
        return c.json({ success: true, message: "Program category deleted successfully" });
    } catch (error) {
        console.error("Error deleting program category:", error);
        return c.json({ success: false, error: "Failed to delete program category" }, 500);
    }
});

export default app;
