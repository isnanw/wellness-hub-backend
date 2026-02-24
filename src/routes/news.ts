import { Hono } from "hono";
import { db } from "../db";
import { news, unitKerja, type NewNews } from "../db/schema";
import { eq, desc, and } from "drizzle-orm";
import { authMiddleware } from "../middleware/auth";
import { getCookie } from "hono/cookie";
import { verify } from "hono/jwt";

const newsRouter = new Hono();

// Helper: check if user is unit_kerja role
const isUnitKerjaRole = (role: string) => role === "unit_kerja";

// Get all news (Public + Optional Auth for Filtering)
newsRouter.get("/", async (c) => {
  try {
    let isUnitKerja = false;
    let unitKerjaId = "";

    // Check for auth token manually to allow public access
    const token = getCookie(c, "auth_token");
    if (token) {
      try {
        const secret = process.env.JWT_SECRET || "super-secret-key-wellness-hub-2024";
        const payload = await verify(token, secret, "HS256");
        // @ts-ignore
        if (isUnitKerjaRole(payload.role) && payload.unitKerjaId) {
          isUnitKerja = true;
          // @ts-ignore
          unitKerjaId = payload.unitKerjaId as string;
        }
      } catch (e) {
        // Invalid token, proceed as public
      }
    }

    let query = db
      .select({
        id: news.id,
        title: news.title,
        slug: news.slug,
        excerpt: news.excerpt,
        content: news.content,
        category: news.category,
        categoryId: news.categoryId,
        image: news.image,
        author: news.author,
        unitKerjaId: news.unitKerjaId,
        unitKerjaName: unitKerja.name,
        status: news.status,
        publishedAt: news.publishedAt,
        createdAt: news.createdAt,
        updatedAt: news.updatedAt,
      })
      .from(news)
      .leftJoin(unitKerja, eq(news.unitKerjaId, unitKerja.id))
      .$dynamic();

    if (isUnitKerja) {
      query = query.where(eq(news.unitKerjaId, unitKerjaId));
    }

    const result = await query.orderBy(desc(news.publishedAt));
    return c.json({ data: result });
  } catch (error) {
    console.error("Error fetching news:", error);
    return c.json({ error: "Failed to fetch news" }, 500);
  }
});

// Get published news only (Public)
newsRouter.get("/published", async (c) => {
  try {
    const result = await db
      .select({
        id: news.id,
        title: news.title,
        slug: news.slug,
        excerpt: news.excerpt,
        content: news.content,
        category: news.category,
        categoryId: news.categoryId,
        image: news.image,
        author: news.author,
        unitKerjaId: news.unitKerjaId,
        unitKerjaName: unitKerja.name,
        status: news.status,
        publishedAt: news.publishedAt,
        createdAt: news.createdAt,
        updatedAt: news.updatedAt,
      })
      .from(news)
      .leftJoin(unitKerja, eq(news.unitKerjaId, unitKerja.id))
      .where(eq(news.status, "published"))
      .orderBy(desc(news.publishedAt));
    return c.json({ data: result });
  } catch (error) {
    console.error("Error fetching published news:", error);
    return c.json({ error: "Failed to fetch published news" }, 500);
  }
});

// Get news by ID (Public)
newsRouter.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const result = await db
      .select({
        id: news.id,
        title: news.title,
        slug: news.slug,
        excerpt: news.excerpt,
        content: news.content,
        category: news.category,
        categoryId: news.categoryId,
        image: news.image,
        author: news.author,
        unitKerjaId: news.unitKerjaId,
        unitKerjaName: unitKerja.name,
        status: news.status,
        publishedAt: news.publishedAt,
        createdAt: news.createdAt,
        updatedAt: news.updatedAt,
      })
      .from(news)
      .leftJoin(unitKerja, eq(news.unitKerjaId, unitKerja.id))
      .where(eq(news.id, id));

    if (result.length === 0) {
      return c.json({ error: "News not found" }, 404);
    }

    return c.json({ data: result[0] });
  } catch (error) {
    console.error("Error fetching news:", error);
    return c.json({ error: "Failed to fetch news" }, 500);
  }
});

// Get news by slug (Public)
newsRouter.get("/slug/:slug", async (c) => {
  try {
    const slug = c.req.param("slug");
    const result = await db
      .select({
        id: news.id,
        title: news.title,
        slug: news.slug,
        excerpt: news.excerpt,
        content: news.content,
        category: news.category,
        categoryId: news.categoryId,
        image: news.image,
        author: news.author,
        unitKerjaId: news.unitKerjaId,
        unitKerjaName: unitKerja.name,
        status: news.status,
        publishedAt: news.publishedAt,
        createdAt: news.createdAt,
        updatedAt: news.updatedAt,
      })
      .from(news)
      .leftJoin(unitKerja, eq(news.unitKerjaId, unitKerja.id))
      .where(eq(news.slug, slug));

    if (result.length === 0) {
      return c.json({ error: "News not found" }, 404);
    }

    return c.json({ data: result[0] });
  } catch (error) {
    console.error("Error fetching news:", error);
    return c.json({ error: "Failed to fetch news" }, 500);
  }
});

// Create news (Protected)
newsRouter.post("/", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const body = await c.req.json<NewNews>();
    const id = crypto.randomUUID();

    // Generate slug from title if not provided
    const slug = body.slug || body.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .trim();

    // If unit_kerja role, always use their own unitKerjaId
    let finalUnitKerjaId = body.unitKerjaId;
    if (isUnitKerjaRole(user.role) && user.unitKerjaId) {
      finalUnitKerjaId = user.unitKerjaId;
    }

    const newNews: NewNews = {
      ...body,
      id,
      slug,
      publishedAt: body.status === "published" ? new Date() : null,
      unitKerjaId: finalUnitKerjaId
    };

    const result = await db.insert(news).values(newNews).returning();
    return c.json({ data: result[0] }, 201);
  } catch (error) {
    console.error("Error creating news:", error);
    return c.json({ error: "Failed to create news" }, 500);
  }
});

// Update news (Protected)
newsRouter.put("/:id", authMiddleware, async (c) => {
  try {
    const id = c.req.param("id");
    const user = c.get("user");
    const isUnitKerja = isUnitKerjaRole(user.role) && user.unitKerjaId;

    const body = await c.req.json<Partial<NewNews>>();

    // Convert publishedAt string to Date if provided
    if (body.publishedAt && typeof body.publishedAt === "string") {
      body.publishedAt = new Date(body.publishedAt);
    }

    // If status is being changed to published and publishedAt is not set
    if (body.status === "published" && !body.publishedAt) {
      body.publishedAt = new Date();
    }

    let query = db
      .update(news)
      .set({ ...body, updatedAt: new Date() });

    const conditions = [eq(news.id, id)];
    if (isUnitKerja) {
      conditions.push(eq(news.unitKerjaId, user.unitKerjaId!));
    }

    const result = await query.where(and(...conditions)).returning();

    if (result.length === 0) {
      return c.json({ error: "News not found" }, 404);
    }

    return c.json({ data: result[0] });
  } catch (error) {
    console.error("Error updating news:", error);
    return c.json({ error: "Failed to update news" }, 500);
  }
});

// Delete news (Protected)
newsRouter.delete("/:id", authMiddleware, async (c) => {
  try {
    const id = c.req.param("id");
    const user = c.get("user");
    const isUnitKerja = isUnitKerjaRole(user.role) && user.unitKerjaId;

    let query = db.delete(news);

    const conditions = [eq(news.id, id)];
    if (isUnitKerja) {
      conditions.push(eq(news.unitKerjaId, user.unitKerjaId!));
    }

    const result = await query.where(and(...conditions)).returning();

    if (result.length === 0) {
      return c.json({ error: "News not found" }, 404);
    }

    return c.json({ message: "News deleted successfully" });
  } catch (error) {
    console.error("Error deleting news:", error);
    return c.json({ error: "Failed to delete news" }, 500);
  }
});

export { newsRouter };
