import { Hono } from "hono";
import { db } from "../db";
import { programs, type NewProgram } from "../db/schema";
import { eq, desc } from "drizzle-orm";

const programsRouter = new Hono();

// Get all programs
programsRouter.get("/", async (c) => {
  try {
    const result = await db.select().from(programs).orderBy(desc(programs.createdAt));
    return c.json({ data: result });
  } catch (error) {
    console.error("Error fetching programs:", error);
    return c.json({ error: "Failed to fetch programs" }, 500);
  }
});

// Get active programs only
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

// Get program by ID
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

// Get program by slug
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

// Create program
programsRouter.post("/", async (c) => {
  try {
    const body = await c.req.json<NewProgram>();
    const id = crypto.randomUUID();

    // Generate slug from name if not provided
    const slug = body.slug || body.name
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .trim();

    const newProgram: NewProgram = {
      ...body,
      id,
      slug,
    };

    const result = await db.insert(programs).values(newProgram).returning();
    return c.json({ data: result[0] }, 201);
  } catch (error) {
    console.error("Error creating program:", error);
    return c.json({ error: "Failed to create program" }, 500);
  }
});

// Update program
programsRouter.put("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json<Partial<NewProgram>>();

    // Convert date strings to Date objects
    if (body.startDate && typeof body.startDate === "string") {
      body.startDate = new Date(body.startDate);
    }
    if (body.endDate && typeof body.endDate === "string") {
      body.endDate = new Date(body.endDate);
    }

    const result = await db
      .update(programs)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(programs.id, id))
      .returning();

    if (result.length === 0) {
      return c.json({ error: "Program not found" }, 404);
    }

    return c.json({ data: result[0] });
  } catch (error) {
    console.error("Error updating program:", error);
    return c.json({ error: "Failed to update program" }, 500);
  }
});

// Delete program
programsRouter.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const result = await db.delete(programs).where(eq(programs.id, id)).returning();

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
