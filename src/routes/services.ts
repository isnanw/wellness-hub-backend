import { Hono } from "hono";
import { db } from "../db";
import { services, type NewService } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { authMiddleware } from "../middleware/auth";

const servicesRouter = new Hono();

// Get all services (Protected: Dashboard List)
servicesRouter.get("/", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const isPuskesmas = user.role === "puskesmas" && user.puskesmasId;

    let query = db.select().from(services).$dynamic();

    if (isPuskesmas) {
      query = query.where(eq(services.puskesmasId, user.puskesmasId!));
    }

    const result = await query;
    return c.json({ data: result });
  } catch (error) {
    console.error("Error fetching services:", error);
    return c.json({ error: "Failed to fetch services" }, 500);
  }
});

// Get service by ID (Public)
servicesRouter.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const result = await db.select().from(services).where(eq(services.id, id));

    if (result.length === 0) {
      return c.json({ error: "Service not found" }, 404);
    }

    return c.json({ data: result[0] });
  } catch (error) {
    console.error("Error fetching service:", error);
    return c.json({ error: "Failed to fetch service" }, 500);
  }
});

// Get service by slug (Public)
servicesRouter.get("/slug/:slug", async (c) => {
  try {
    const slug = c.req.param("slug");
    const result = await db.select().from(services).where(eq(services.slug, slug));

    if (result.length === 0) {
      return c.json({ error: "Service not found" }, 404);
    }

    return c.json({ data: result[0] });
  } catch (error) {
    console.error("Error fetching service:", error);
    return c.json({ error: "Failed to fetch service" }, 500);
  }
});

// Create service (Protected)
servicesRouter.post("/", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const body = await c.req.json<NewService>();
    const id = crypto.randomUUID();

    // Generate slug from name if not provided
    const slug = body.slug || body.name
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .trim();

    // Handle puskesmasId
    let finalPuskesmasId = body.puskesmasId;
    if (user.role === "puskesmas" && user.puskesmasId) {
      finalPuskesmasId = user.puskesmasId;
    }

    const newService: NewService = {
      ...body,
      id,
      slug,
      puskesmasId: finalPuskesmasId
    };

    const result = await db.insert(services).values(newService).returning();
    return c.json({ data: result[0] }, 201);
  } catch (error) {
    console.error("Error creating service:", error);
    return c.json({ error: "Failed to create service" }, 500);
  }
});

// Update service (Protected)
servicesRouter.put("/:id", authMiddleware, async (c) => {
  try {
    const id = c.req.param("id");
    const user = c.get("user");
    const isPuskesmas = user.role === "puskesmas" && user.puskesmasId;

    const body = await c.req.json<Partial<NewService>>();

    let query = db
      .update(services)
      .set({ ...body, updatedAt: new Date() });

    const conditions = [eq(services.id, id)];
    if (isPuskesmas) {
      conditions.push(eq(services.puskesmasId, user.puskesmasId!));
    }

    const result = await query.where(and(...conditions)).returning();

    if (result.length === 0) {
      return c.json({ error: "Service not found" }, 404);
    }

    return c.json({ data: result[0] });
  } catch (error) {
    console.error("Error updating service:", error);
    return c.json({ error: "Failed to update service" }, 500);
  }
});

// Delete service (Protected)
servicesRouter.delete("/:id", authMiddleware, async (c) => {
  try {
    const id = c.req.param("id");
    const user = c.get("user");
    const isPuskesmas = user.role === "puskesmas" && user.puskesmasId;

    let query = db.delete(services);

    const conditions = [eq(services.id, id)];
    if (isPuskesmas) {
      conditions.push(eq(services.puskesmasId, user.puskesmasId!));
    }

    const result = await query.where(and(...conditions)).returning();

    if (result.length === 0) {
      return c.json({ error: "Service not found" }, 404);
    }

    return c.json({ message: "Service deleted successfully" });
  } catch (error) {
    console.error("Error deleting service:", error);
    return c.json({ error: "Failed to delete service" }, 500);
  }
});

export { servicesRouter };
