import { Hono } from "hono";
import { db } from "../db";
import { documents, type NewDocument } from "../db/schema";
import { eq } from "drizzle-orm";

const documentsRouter = new Hono();

// Get all documents
documentsRouter.get("/", async (c) => {
  try {
    const result = await db.select().from(documents);
    return c.json({ data: result });
  } catch (error) {
    console.error("Error fetching documents:", error);
    return c.json({ error: "Failed to fetch documents" }, 500);
  }
});

// Get active documents only (for public page)
documentsRouter.get("/active", async (c) => {
  try {
    const result = await db
      .select()
      .from(documents)
      .where(eq(documents.status, "active"));
    return c.json({ data: result });
  } catch (error) {
    console.error("Error fetching active documents:", error);
    return c.json({ error: "Failed to fetch documents" }, 500);
  }
});

// Get document by ID
documentsRouter.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const result = await db.select().from(documents).where(eq(documents.id, id));

    if (result.length === 0) {
      return c.json({ error: "Document not found" }, 404);
    }

    return c.json({ data: result[0] });
  } catch (error) {
    console.error("Error fetching document:", error);
    return c.json({ error: "Failed to fetch document" }, 500);
  }
});

// Get document by code
documentsRouter.get("/code/:code", async (c) => {
  try {
    const code = c.req.param("code");
    const result = await db.select().from(documents).where(eq(documents.code, code));

    if (result.length === 0) {
      return c.json({ error: "Document not found" }, 404);
    }

    return c.json({ data: result[0] });
  } catch (error) {
    console.error("Error fetching document:", error);
    return c.json({ error: "Failed to fetch document" }, 500);
  }
});

// Create document
documentsRouter.post("/", async (c) => {
  try {
    const body = await c.req.json<NewDocument>();
    const id = crypto.randomUUID();

    const newDocument: NewDocument = {
      ...body,
      id,
    };

    const result = await db.insert(documents).values(newDocument).returning();
    return c.json({ data: result[0] }, 201);
  } catch (error) {
    console.error("Error creating document:", error);
    return c.json({ error: "Failed to create document" }, 500);
  }
});

// Update document
documentsRouter.put("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json<Partial<NewDocument>>();

    const result = await db
      .update(documents)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(documents.id, id))
      .returning();

    if (result.length === 0) {
      return c.json({ error: "Document not found" }, 404);
    }

    return c.json({ data: result[0] });
  } catch (error) {
    console.error("Error updating document:", error);
    return c.json({ error: "Failed to update document" }, 500);
  }
});

// Increment download count
documentsRouter.patch("/:id/download", async (c) => {
  try {
    const id = c.req.param("id");

    // Get current document
    const current = await db.select().from(documents).where(eq(documents.id, id));
    if (current.length === 0) {
      return c.json({ error: "Document not found" }, 404);
    }

    const result = await db
      .update(documents)
      .set({
        downloadCount: current[0].downloadCount + 1,
        updatedAt: new Date()
      })
      .where(eq(documents.id, id))
      .returning();

    return c.json({ data: result[0] });
  } catch (error) {
    console.error("Error updating download count:", error);
    return c.json({ error: "Failed to update download count" }, 500);
  }
});

// Delete document
documentsRouter.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const result = await db.delete(documents).where(eq(documents.id, id)).returning();

    if (result.length === 0) {
      return c.json({ error: "Document not found" }, 404);
    }

    return c.json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("Error deleting document:", error);
    return c.json({ error: "Failed to delete document" }, 500);
  }
});

export { documentsRouter };
