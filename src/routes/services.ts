import { Hono } from "hono";
import { db } from "../db";
import { services, type NewService } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { authMiddleware } from "../middleware/auth";
import { getCookie } from "hono/cookie";
import { verify } from "hono/jwt";

const servicesRouter = new Hono();

// Get all services (Public + Optional Auth for Filtering)
servicesRouter.get("/", async (c) => {
  try {
    let isPuskesmas = false;
    let unitKerjaId = "";

    // Check for auth token manually to allow public access
    let token = getCookie(c, "auth_token");

    // Also check Authorization header
    if (!token) {
      const authHeader = c.req.header("Authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (token) {
      try {
        const secret = process.env.JWT_SECRET || "your-secret-key";
        const payload = await verify(token, secret, "HS256");

        // @ts-ignore
        if (payload.role === "puskesmas") {
          isPuskesmas = true;
          // @ts-ignore
          unitKerjaId = payload.unitKerjaId as string;
        }
      } catch (e) {
        // Invalid token, proceed as public
      }
    }

    let query = db.select().from(services).$dynamic();

    if (isPuskesmas) {
      // If puskesmas user has no ID, show nothing
      if (!unitKerjaId) {
        return c.json({ data: [] });
      }
      query = query.where(eq(services.unitKerjaId, unitKerjaId));
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

    // Handle unitKerjaId
    let finalPuskesmasId = body.unitKerjaId;
    if (user.role === "puskesmas" && user.unitKerjaId) {
      finalPuskesmasId = user.unitKerjaId;
    }

    const newService: NewService = {
      ...body,
      id,
      slug,
      unitKerjaId: finalPuskesmasId
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
    const isPuskesmas = user.role === "puskesmas" && user.unitKerjaId;

    const body = await c.req.json<Partial<NewService>>();

    let query = db
      .update(services)
      .set({ ...body, updatedAt: new Date() });

    const conditions = [eq(services.id, id)];
    if (isPuskesmas) {
      conditions.push(eq(services.unitKerjaId, user.unitKerjaId!));
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
    const isPuskesmas = user.role === "puskesmas" && user.unitKerjaId;

    let query = db.delete(services);

    const conditions = [eq(services.id, id)];
    if (isPuskesmas) {
      conditions.push(eq(services.unitKerjaId, user.unitKerjaId!));
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
