import { Hono } from "hono";
import { db } from "../db";
import { newsCategories } from "../db/schema";
import { eq, asc } from "drizzle-orm";
import { authMiddleware } from "../middleware/auth";

const app = new Hono();

const generateId = () => crypto.randomUUID();

// GET all news categories (Public - for dropdown in forms)
app.get("/", async (c) => {
    try {
        const data = await db
            .select()
            .from(newsCategories)
            .where(eq(newsCategories.status, "active"))
            .orderBy(asc(newsCategories.sortOrder), asc(newsCategories.name));
        return c.json({ success: true, data });
    } catch (error) {
        console.error("Error fetching news categories:", error);
        return c.json({ success: false, error: "Failed to fetch news categories" }, 500);
    }
});

// GET single news category by ID (Public)
app.get("/:id", async (c) => {
    try {
        const id = c.req.param("id");
        const [data] = await db.select().from(newsCategories).where(eq(newsCategories.id, id));

        if (!data) {
            return c.json({ success: false, error: "News category not found" }, 404);
        }

        return c.json({ success: true, data });
    } catch (error) {
        console.error("Error fetching news category:", error);
        return c.json({ success: false, error: "Failed to fetch news category" }, 500);
    }
});

// POST create new news category (Admin only)
app.post("/", authMiddleware, async (c) => {
    try {
        const user = c.get("user");
        if (user.role !== "admin") {
            return c.json({ success: false, error: "Unauthorized: Admin only" }, 403);
        }

        const body = await c.req.json();
        const { name, slug, description, sortOrder, status } = body;

        if (!name || !slug) {
            return c.json({ success: false, error: "Name and slug are required" }, 400);
        }

        const [data] = await db
            .insert(newsCategories)
            .values({
                id: generateId(),
                name,
                slug,
                description: description || null,
                sortOrder: sortOrder || 0,
                status: status || "active",
            })
            .returning();

        return c.json({ success: true, data }, 201);
    } catch (error) {
        console.error("Error creating news category:", error);
        return c.json({ success: false, error: "Failed to create news category" }, 500);
    }
});

// PUT update news category (Admin only)
app.put("/:id", authMiddleware, async (c) => {
    try {
        const user = c.get("user");
        if (user.role !== "admin") {
            return c.json({ success: false, error: "Unauthorized: Admin only" }, 403);
        }

        const id = c.req.param("id");
        const body = await c.req.json();
        const { name, slug, description, sortOrder, status } = body;

        const [existing] = await db.select().from(newsCategories).where(eq(newsCategories.id, id));
        if (!existing) {
            return c.json({ success: false, error: "News category not found" }, 404);
        }

        const [data] = await db
            .update(newsCategories)
            .set({
                name: name ?? existing.name,
                slug: slug ?? existing.slug,
                description: description !== undefined ? description : existing.description,
                sortOrder: sortOrder ?? existing.sortOrder,
                status: status ?? existing.status,
                updatedAt: new Date(),
            })
            .where(eq(newsCategories.id, id))
            .returning();

        return c.json({ success: true, data });
    } catch (error) {
        console.error("Error updating news category:", error);
        return c.json({ success: false, error: "Failed to update news category" }, 500);
    }
});

// DELETE news category (Admin only)
app.delete("/:id", authMiddleware, async (c) => {
    try {
        const user = c.get("user");
        if (user.role !== "admin") {
            return c.json({ success: false, error: "Unauthorized: Admin only" }, 403);
        }

        const id = c.req.param("id");

        const [existing] = await db.select().from(newsCategories).where(eq(newsCategories.id, id));
        if (!existing) {
            return c.json({ success: false, error: "News category not found" }, 404);
        }

        await db.delete(newsCategories).where(eq(newsCategories.id, id));
        return c.json({ success: true, message: "News category deleted successfully" });
    } catch (error) {
        console.error("Error deleting news category:", error);
        return c.json({ success: false, error: "Failed to delete news category" }, 500);
    }
});

export default app;
