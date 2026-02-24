import { Hono } from "hono";
import { db } from "../db";
import { services, unitKerja, type NewService } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { authMiddleware } from "../middleware/auth";
import { getCookie } from "hono/cookie";
import { verify } from "hono/jwt";

const servicesRouter = new Hono();

// Helper: check if user is unit_kerja role
const isUnitKerjaRole = (role: string) => role === "unit_kerja";

// Fields to select (includes unit kerja name via LEFT JOIN)
const selectFields = {
  id: services.id,
  name: services.name,
  slug: services.slug,
  description: services.description,
  category: services.category,
  categoryId: services.categoryId,
  image: services.image,
  location: services.location,
  schedule: services.schedule,
  unitKerjaId: services.unitKerjaId,
  unitKerjaName: unitKerja.name,
  status: services.status,
  createdAt: services.createdAt,
  updatedAt: services.updatedAt,
};

// Get all services (Public + Optional Auth for Filtering)
servicesRouter.get("/", async (c) => {
  try {
    let isUnitKerja = false;
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
        const secret = process.env.JWT_SECRET || "super-secret-key-wellness-hub-2024";
        const payload = await verify(token, secret, "HS256");
        // @ts-ignore
        if (isUnitKerjaRole(payload.role)) {
          isUnitKerja = true;
          // @ts-ignore
          unitKerjaId = payload.unitKerjaId as string;
        }
      } catch (e) {
        // Invalid token, proceed as public
      }
    }

    let query = db
      .select(selectFields)
      .from(services)
      .leftJoin(unitKerja, eq(services.unitKerjaId, unitKerja.id))
      .$dynamic();

    if (isUnitKerja) {
      if (!unitKerjaId) return c.json({ data: [] });
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
    const result = await db
      .select(selectFields)
      .from(services)
      .leftJoin(unitKerja, eq(services.unitKerjaId, unitKerja.id))
      .where(eq(services.id, id));

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
    const result = await db
      .select(selectFields)
      .from(services)
      .leftJoin(unitKerja, eq(services.unitKerjaId, unitKerja.id))
      .where(eq(services.slug, slug));

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

    // If unit_kerja role, always use their own unitKerjaId
    let finalUnitKerjaId = body.unitKerjaId;
    if (isUnitKerjaRole(user.role) && user.unitKerjaId) {
      finalUnitKerjaId = user.unitKerjaId;
    }

    const newService: NewService = {
      ...body,
      id,
      slug,
      unitKerjaId: finalUnitKerjaId ?? null,
    };

    const result = await db.insert(services).values(newService).returning();
    return c.json({ data: result[0] }, 201);
  } catch (error) {
    console.error("Error creating service:", JSON.stringify(error, null, 2));
    return c.json({ error: "Failed to create service" }, 500);
  }
});

// Update service (Protected)
servicesRouter.put("/:id", authMiddleware, async (c) => {
  try {
    const id = c.req.param("id");
    const user = c.get("user");
    const isUnitKerja = isUnitKerjaRole(user.role) && user.unitKerjaId;

    const body = await c.req.json<Partial<NewService>>();

    let query = db
      .update(services)
      .set({ ...body, updatedAt: new Date() });

    const conditions = [eq(services.id, id)];
    if (isUnitKerja) {
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
    const isUnitKerja = isUnitKerjaRole(user.role) && user.unitKerjaId;

    let query = db.delete(services);

    const conditions = [eq(services.id, id)];
    if (isUnitKerja) {
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
