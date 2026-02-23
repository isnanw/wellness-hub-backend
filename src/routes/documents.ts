import { Hono } from "hono";
import { db } from "../db";
import { documents, unitKerja, type NewDocument } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { authMiddleware } from "../middleware/auth";
import { getCookie } from "hono/cookie";
import { verify } from "hono/jwt";
import { handleError } from "../utils/errorHandler";

const documentsRouter = new Hono();

const isUnitKerjaRole = (role: string) => role === "unit_kerja";

// Helper: extract auth info from request (cookie or bearer)
async function getAuthInfo(c: any) {
  let token = getCookie(c, "auth_token");
  if (!token) {
    const authHeader = c.req.header("Authorization");
    if (authHeader?.startsWith("Bearer ")) token = authHeader.substring(7);
  }
  if (!token) return { isUnitKerja: false, unitKerjaId: null };
  try {
    const secret = process.env.JWT_SECRET || "super-secret-key-wellness-hub-2024";
    const payload = await verify(token, secret, "HS256") as any;
    if (isUnitKerjaRole(payload.role) && payload.unitKerjaId) {
      return { isUnitKerja: true, unitKerjaId: payload.unitKerjaId as string };
    }
  } catch { }
  return { isUnitKerja: false, unitKerjaId: null };
}

// GET /api/documents — Admin: all (filtered by unitKerja if role unit_kerja)
documentsRouter.get("/", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const isUK = isUnitKerjaRole(user.role) && user.unitKerjaId;

    let query = db.select().from(documents).$dynamic();
    if (isUK) {
      query = query.where(eq(documents.unitKerjaId, user.unitKerjaId!));
    }

    const result = await query;
    return c.json({ data: result });
  } catch (error) {
    return handleError(c, "Failed to fetch documents", error);
  }
});

// GET /api/documents/public — Public page: only public + active documents
documentsRouter.get("/public", async (c) => {
  try {
    const result = await db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.status, "active"),
          eq(documents.visibility, "public")
        )
      );
    return c.json({ data: result });
  } catch (error) {
    return handleError(c, "Failed to fetch documents", error);
  }
});

// GET /api/documents/active — alias for public (backward compat)
documentsRouter.get("/active", async (c) => {
  try {
    const result = await db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.status, "active"),
          eq(documents.visibility, "public")
        )
      );
    return c.json({ data: result });
  } catch (error) {
    return handleError(c, "Failed to fetch documents", error);
  }
});

// GET /api/documents/code/:code
documentsRouter.get("/code/:code", async (c) => {
  try {
    const code = c.req.param("code");
    const result = await db.select().from(documents).where(eq(documents.code, code));
    if (result.length === 0) return c.json({ error: "Document not found" }, 404);
    return c.json({ data: result[0] });
  } catch (error) {
    return handleError(c, "Failed to fetch document", error);
  }
});

// GET /api/documents/:id
documentsRouter.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const result = await db.select().from(documents).where(eq(documents.id, id));
    if (result.length === 0) return c.json({ error: "Document not found" }, 404);
    return c.json({ data: result[0] });
  } catch (error) {
    return handleError(c, "Failed to fetch document", error);
  }
});

// POST /api/documents — Create (Protected)
documentsRouter.post("/", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const body = await c.req.json<NewDocument>();
    const id = crypto.randomUUID();

    // unit_kerja: always use their own unitKerjaId
    let finalUnitKerjaId = body.unitKerjaId;
    if (isUnitKerjaRole(user.role) && user.unitKerjaId) {
      finalUnitKerjaId = user.unitKerjaId;
    }

    const newDocument: NewDocument = {
      ...body,
      id,
      unitKerjaId: finalUnitKerjaId ?? null,
      visibility: body.visibility || "public",
    };

    const result = await db.insert(documents).values(newDocument).returning();
    return c.json({ data: result[0] }, 201);
  } catch (error) {
    return handleError(c, "Failed to create document", error);
  }
});

// PUT /api/documents/:id — Update (Protected)
documentsRouter.put("/:id", authMiddleware, async (c) => {
  try {
    const id = c.req.param("id");
    const user = c.get("user");
    const isUK = isUnitKerjaRole(user.role) && user.unitKerjaId;
    const body = await c.req.json<Partial<NewDocument>>();

    const conditions = [eq(documents.id, id)];
    if (isUK) conditions.push(eq(documents.unitKerjaId, user.unitKerjaId!));

    const result = await db
      .update(documents)
      .set({ ...body, updatedAt: new Date() })
      .where(and(...conditions))
      .returning();

    if (result.length === 0) return c.json({ error: "Document not found" }, 404);
    return c.json({ data: result[0] });
  } catch (error) {
    return handleError(c, "Failed to update document", error);
  }
});

// PATCH /api/documents/:id/download — Increment download
documentsRouter.patch("/:id/download", async (c) => {
  try {
    const id = c.req.param("id");
    const current = await db.select().from(documents).where(eq(documents.id, id));
    if (current.length === 0) return c.json({ error: "Document not found" }, 404);

    const result = await db
      .update(documents)
      .set({ downloadCount: current[0].downloadCount + 1, updatedAt: new Date() })
      .where(eq(documents.id, id))
      .returning();

    return c.json({ data: result[0] });
  } catch (error) {
    return handleError(c, "Failed to update download count", error);
  }
});

// DELETE /api/documents/:id (Protected)
documentsRouter.delete("/:id", authMiddleware, async (c) => {
  try {
    const id = c.req.param("id");
    const user = c.get("user");
    const isUK = isUnitKerjaRole(user.role) && user.unitKerjaId;

    const conditions = [eq(documents.id, id)];
    if (isUK) conditions.push(eq(documents.unitKerjaId, user.unitKerjaId!));

    const result = await db.delete(documents).where(and(...conditions)).returning();
    if (result.length === 0) return c.json({ error: "Document not found" }, 404);
    return c.json({ message: "Document deleted successfully" });
  } catch (error) {
    return handleError(c, "Failed to delete document", error);
  }
});

export { documentsRouter };
