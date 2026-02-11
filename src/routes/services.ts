import { Hono } from "hono";
import { db } from "../db";
import { services, type NewService } from "../db/schema";
import { eq } from "drizzle-orm";

const servicesRouter = new Hono();

// Get all services
servicesRouter.get("/", async (c) => {
  try {
    const result = await db.select().from(services);
    return c.json({ data: result });
  } catch (error) {
    console.error("Error fetching services:", error);
    return c.json({ error: "Failed to fetch services" }, 500);
  }
});

// Get service by ID
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

// Get service by slug
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

// Create service
servicesRouter.post("/", async (c) => {
  try {
    const body = await c.req.json<NewService>();
    const id = crypto.randomUUID();

    // Generate slug from name if not provided
    const slug = body.slug || body.name
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .trim();

    const newService: NewService = {
      ...body,
      id,
      slug,
    };

    const result = await db.insert(services).values(newService).returning();
    return c.json({ data: result[0] }, 201);
  } catch (error) {
    console.error("Error creating service:", error);
    return c.json({ error: "Failed to create service" }, 500);
  }
});

// Update service
servicesRouter.put("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json<Partial<NewService>>();

    const result = await db
      .update(services)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(services.id, id))
      .returning();

    if (result.length === 0) {
      return c.json({ error: "Service not found" }, 404);
    }

    return c.json({ data: result[0] });
  } catch (error) {
    console.error("Error updating service:", error);
    return c.json({ error: "Failed to update service" }, 500);
  }
});

// Delete service
servicesRouter.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const result = await db.delete(services).where(eq(services.id, id)).returning();

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
