import { Hono } from "hono";
import { db } from "../db";
import { programs, type NewProgram } from "../db/schema";
import { eq, desc, and } from "drizzle-orm";
import { authMiddleware } from "../middleware/auth";
import { getCookie } from "hono/cookie";
import { verify } from "hono/jwt";

const programsRouter = new Hono();

// Get all programs (Public + Optional Auth for Filtering)
programsRouter.get("/", async (c) => {
  try {
    let isPuskesmas = false;
    let puskesmasId = "";

    // Check for auth token manually to allow public access
    const token = getCookie(c, "auth_token");
    if (token) {
      try {
        const secret = process.env.JWT_SECRET || "your-secret-key";
        const payload = await verify(token, secret, "HS256");
        // @ts-ignore
        if (payload.role === "puskesmas" && payload.puskesmasId) {
          isPuskesmas = true;
          // @ts-ignore
          puskesmasId = payload.puskesmasId as string;
        }
      } catch (e) {
        // Invalid token, proceed as public
      }
    }

    let query = db.select().from(programs).$dynamic();

    if (isPuskesmas) {
      query = query.where(eq(programs.puskesmasId, puskesmasId));
    }

    const result = await query.orderBy(desc(programs.createdAt));
    return c.json({ data: result });
  } catch (error) {
    console.error("Error fetching programs:", error);
    return c.json({ error: "Failed to fetch programs" }, 500);
  }
});

// Get active programs only (Public)
programsRouter.get("/active", async (c) => {
  try {
    const result = await db
      .select()
      .from(programs)
      .where(eq(programs.status, "active"))
      .orderBy(desc(programs.createdAt));
    return c.json({ data: result });
  } catch (error) {
    console.error("Error fetching active programs:", error);
    return c.json({ error: "Failed to fetch active programs" }, 500);
  }
});

// Get program by ID (Public)
programsRouter.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const result = await db.select().from(programs).where(eq(programs.id, id));

    if (result.length === 0) {
      return c.json({ error: "Program not found" }, 404);
    }

    return c.json({ data: result[0] });
  } catch (error) {
    console.error("Error fetching program:", error);
    return c.json({ error: "Failed to fetch program" }, 500);
  }
});

// Get program by slug (Public)
programsRouter.get("/slug/:slug", async (c) => {
  try {
    const slug = c.req.param("slug");
    const result = await db.select().from(programs).where(eq(programs.slug, slug));

    if (result.length === 0) {
      return c.json({ error: "Program not found" }, 404);
    }

    return c.json({ data: result[0] });
  } catch (error) {
    console.error("Error fetching program:", error);
    return c.json({ error: "Failed to fetch program" }, 500);
  }
});

// Create program (Protected)
programsRouter.post("/", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const body = await c.req.json<NewProgram>();
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

    const newProgram: NewProgram = {
      ...body,
      id,
      slug,
      puskesmasId: finalPuskesmasId
    };

    const result = await db.insert(programs).values(newProgram).returning();
    return c.json({ data: result[0] }, 201);
  } catch (error) {
    console.error("Error creating program:", error);
    return c.json({ error: "Failed to create program" }, 500);
  }
});

// Update program (Protected)
programsRouter.put("/:id", authMiddleware, async (c) => {
  try {
    const id = c.req.param("id");
    const user = c.get("user");
    const isPuskesmas = user.role === "puskesmas" && user.puskesmasId;

    const body = await c.req.json<Partial<NewProgram>>();

    // Convert date strings to Date objects
    if (body.startDate && typeof body.startDate === "string") {
      body.startDate = new Date(body.startDate);
    }
    if (body.endDate && typeof body.endDate === "string") {
      body.endDate = new Date(body.endDate);
    }

    let query = db
      .update(programs)
      .set({ ...body, updatedAt: new Date() });

    const conditions = [eq(programs.id, id)];
    if (isPuskesmas) {
      conditions.push(eq(programs.puskesmasId, user.puskesmasId!));
    }

    const result = await query.where(and(...conditions)).returning();

    if (result.length === 0) {
      return c.json({ error: "Program not found" }, 404);
    }

    return c.json({ data: result[0] });
  } catch (error) {
    console.error("Error updating program:", error);
    return c.json({ error: "Failed to update program" }, 500);
  }
});

// Delete program (Protected)
programsRouter.delete("/:id", authMiddleware, async (c) => {
  try {
    const id = c.req.param("id");
    const user = c.get("user");
    const isPuskesmas = user.role === "puskesmas" && user.puskesmasId;

    let query = db.delete(programs);

    const conditions = [eq(programs.id, id)];
    if (isPuskesmas) {
      conditions.push(eq(programs.puskesmasId, user.puskesmasId!));
    }

    const result = await query.where(and(...conditions)).returning();

    if (result.length === 0) {
      return c.json({ error: "Program not found" }, 404);
    }

    return c.json({ message: "Program deleted successfully" });
  } catch (error) {
    console.error("Error deleting program:", error);
    return c.json({ error: "Failed to delete program" }, 500);
  }
});

export { programsRouter };
