import { Hono } from "hono";
import { db } from "../db";
import { healthStatistics, districtHealthData, healthReports, healthProgramCoverage, healthDiseaseData } from "../db/schema";
import { eq, desc, asc } from "drizzle-orm";
import { nanoid } from "nanoid";

const healthReportsRouter = new Hono();

// ==================== HEALTH STATISTICS ====================

// GET /api/health/statistics - Get all health statistics
healthReportsRouter.get("/statistics", async (c) => {
  try {
    const data = await db
      .select()
      .from(healthStatistics)
      .orderBy(asc(healthStatistics.sortOrder));
    return c.json({ data });
  } catch (error) {
    console.error("Error fetching health statistics:", error);
    return c.json({ error: "Failed to fetch health statistics" }, 500);
  }
});

// GET /api/health/statistics/active - Get active health statistics
healthReportsRouter.get("/statistics/active", async (c) => {
  try {
    const data = await db
      .select()
      .from(healthStatistics)
      .where(eq(healthStatistics.status, "active"))
      .orderBy(asc(healthStatistics.sortOrder));
    return c.json({ data });
  } catch (error) {
    console.error("Error fetching active health statistics:", error);
    return c.json({ error: "Failed to fetch health statistics" }, 500);
  }
});

// GET /api/health/statistics/year/:year - Get health statistics by year
healthReportsRouter.get("/statistics/year/:year", async (c) => {
  try {
    const year = parseInt(c.req.param("year"));
    const data = await db
      .select()
      .from(healthStatistics)
      .where(eq(healthStatistics.year, year))
      .orderBy(asc(healthStatistics.sortOrder));
    return c.json({ data });
  } catch (error) {
    console.error("Error fetching health statistics by year:", error);
    return c.json({ error: "Failed to fetch health statistics" }, 500);
  }
});

// GET /api/health/statistics/:id - Get single health statistic
healthReportsRouter.get("/statistics/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const [data] = await db
      .select()
      .from(healthStatistics)
      .where(eq(healthStatistics.id, id));

    if (!data) {
      return c.json({ error: "Health statistic not found" }, 404);
    }
    return c.json({ data });
  } catch (error) {
    console.error("Error fetching health statistic:", error);
    return c.json({ error: "Failed to fetch health statistic" }, 500);
  }
});

// POST /api/health/statistics - Create health statistic
healthReportsRouter.post("/statistics", async (c) => {
  try {
    const body = await c.req.json();
    const id = nanoid();

    const [newData] = await db
      .insert(healthStatistics)
      .values({
        id,
        label: body.label,
        value: body.value,
        icon: body.icon,
        change: body.change,
        year: body.year,
        sortOrder: body.sortOrder || 0,
        status: body.status || "active",
      })
      .returning();

    return c.json({ data: newData }, 201);
  } catch (error) {
    console.error("Error creating health statistic:", error);
    return c.json({ error: "Failed to create health statistic" }, 500);
  }
});

// PUT /api/health/statistics/:id - Update health statistic
healthReportsRouter.put("/statistics/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();

    const [updated] = await db
      .update(healthStatistics)
      .set({
        label: body.label,
        value: body.value,
        icon: body.icon,
        change: body.change,
        year: body.year,
        sortOrder: body.sortOrder,
        status: body.status,
        updatedAt: new Date(),
      })
      .where(eq(healthStatistics.id, id))
      .returning();

    if (!updated) {
      return c.json({ error: "Health statistic not found" }, 404);
    }
    return c.json({ data: updated });
  } catch (error) {
    console.error("Error updating health statistic:", error);
    return c.json({ error: "Failed to update health statistic" }, 500);
  }
});

// DELETE /api/health/statistics/:id - Delete health statistic
healthReportsRouter.delete("/statistics/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const [deleted] = await db
      .delete(healthStatistics)
      .where(eq(healthStatistics.id, id))
      .returning();

    if (!deleted) {
      return c.json({ error: "Health statistic not found" }, 404);
    }
    return c.json({ message: "Health statistic deleted successfully" });
  } catch (error) {
    console.error("Error deleting health statistic:", error);
    return c.json({ error: "Failed to delete health statistic" }, 500);
  }
});

// ==================== DISTRICT HEALTH DATA ====================

// GET /api/health/districts - Get all district health data
healthReportsRouter.get("/districts", async (c) => {
  try {
    const data = await db
      .select()
      .from(districtHealthData)
      .orderBy(asc(districtHealthData.sortOrder));
    return c.json({ data });
  } catch (error) {
    console.error("Error fetching district health data:", error);
    return c.json({ error: "Failed to fetch district health data" }, 500);
  }
});

// GET /api/health/districts/active - Get active district health data
healthReportsRouter.get("/districts/active", async (c) => {
  try {
    const data = await db
      .select()
      .from(districtHealthData)
      .where(eq(districtHealthData.status, "active"))
      .orderBy(asc(districtHealthData.sortOrder));
    return c.json({ data });
  } catch (error) {
    console.error("Error fetching active district health data:", error);
    return c.json({ error: "Failed to fetch district health data" }, 500);
  }
});

// GET /api/health/districts/year/:year - Get district health data by year
healthReportsRouter.get("/districts/year/:year", async (c) => {
  try {
    const year = parseInt(c.req.param("year"));
    const data = await db
      .select()
      .from(districtHealthData)
      .where(eq(districtHealthData.year, year))
      .orderBy(asc(districtHealthData.sortOrder));
    return c.json({ data });
  } catch (error) {
    console.error("Error fetching district health data by year:", error);
    return c.json({ error: "Failed to fetch district health data" }, 500);
  }
});

// GET /api/health/districts/:id - Get single district health data
healthReportsRouter.get("/districts/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const [data] = await db
      .select()
      .from(districtHealthData)
      .where(eq(districtHealthData.id, id));

    if (!data) {
      return c.json({ error: "District health data not found" }, 404);
    }
    return c.json({ data });
  } catch (error) {
    console.error("Error fetching district health data:", error);
    return c.json({ error: "Failed to fetch district health data" }, 500);
  }
});

// POST /api/health/districts - Create district health data
healthReportsRouter.post("/districts", async (c) => {
  try {
    const body = await c.req.json();
    const id = nanoid();

    const [newData] = await db
      .insert(districtHealthData)
      .values({
        id,
        districtName: body.districtName,
        population: body.population,
        unitKerja: body.puskesmas || 0,
        hospitals: body.hospitals || 0,
        doctors: body.doctors || 0,
        nurses: body.nurses || 0,
        midwives: body.midwives || 0,
        year: body.year,
        sortOrder: body.sortOrder || 0,
        status: body.status || "active",
      })
      .returning();

    return c.json({ data: newData }, 201);
  } catch (error) {
    console.error("Error creating district health data:", error);
    return c.json({ error: "Failed to create district health data" }, 500);
  }
});

// PUT /api/health/districts/:id - Update district health data
healthReportsRouter.put("/districts/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();

    const [updated] = await db
      .update(districtHealthData)
      .set({
        districtName: body.districtName,
        population: body.population,
        unitKerja: body.puskesmas,
        hospitals: body.hospitals,
        doctors: body.doctors,
        nurses: body.nurses,
        midwives: body.midwives,
        year: body.year,
        sortOrder: body.sortOrder,
        status: body.status,
        updatedAt: new Date(),
      })
      .where(eq(districtHealthData.id, id))
      .returning();

    if (!updated) {
      return c.json({ error: "District health data not found" }, 404);
    }
    return c.json({ data: updated });
  } catch (error) {
    console.error("Error updating district health data:", error);
    return c.json({ error: "Failed to update district health data" }, 500);
  }
});

// DELETE /api/health/districts/:id - Delete district health data
healthReportsRouter.delete("/districts/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const [deleted] = await db
      .delete(districtHealthData)
      .where(eq(districtHealthData.id, id))
      .returning();

    if (!deleted) {
      return c.json({ error: "District health data not found" }, 404);
    }
    return c.json({ message: "District health data deleted successfully" });
  } catch (error) {
    console.error("Error deleting district health data:", error);
    return c.json({ error: "Failed to delete district health data" }, 500);
  }
});

// ==================== HEALTH REPORTS ====================

// GET /api/health/reports - Get all health reports
healthReportsRouter.get("/reports", async (c) => {
  try {
    const data = await db
      .select()
      .from(healthReports)
      .orderBy(desc(healthReports.publishedAt));
    return c.json({ data });
  } catch (error) {
    console.error("Error fetching health reports:", error);
    return c.json({ error: "Failed to fetch health reports" }, 500);
  }
});

// GET /api/health/reports/active - Get active health reports
healthReportsRouter.get("/reports/active", async (c) => {
  try {
    const data = await db
      .select()
      .from(healthReports)
      .where(eq(healthReports.status, "active"))
      .orderBy(desc(healthReports.publishedAt));
    return c.json({ data });
  } catch (error) {
    console.error("Error fetching active health reports:", error);
    return c.json({ error: "Failed to fetch health reports" }, 500);
  }
});

// GET /api/health/reports/year/:year - Get health reports by year
healthReportsRouter.get("/reports/year/:year", async (c) => {
  try {
    const year = parseInt(c.req.param("year"));
    const data = await db
      .select()
      .from(healthReports)
      .where(eq(healthReports.year, year))
      .orderBy(desc(healthReports.publishedAt));
    return c.json({ data });
  } catch (error) {
    console.error("Error fetching health reports by year:", error);
    return c.json({ error: "Failed to fetch health reports" }, 500);
  }
});

// GET /api/health/reports/:id - Get single health report
healthReportsRouter.get("/reports/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const [data] = await db
      .select()
      .from(healthReports)
      .where(eq(healthReports.id, id));

    if (!data) {
      return c.json({ error: "Health report not found" }, 404);
    }
    return c.json({ data });
  } catch (error) {
    console.error("Error fetching health report:", error);
    return c.json({ error: "Failed to fetch health report" }, 500);
  }
});

// POST /api/health/reports - Create health report
healthReportsRouter.post("/reports", async (c) => {
  try {
    const body = await c.req.json();
    const id = nanoid();

    const [newData] = await db
      .insert(healthReports)
      .values({
        id,
        title: body.title,
        description: body.description,
        category: body.category,
        year: body.year,
        fileUrl: body.fileUrl,
        fileSize: body.fileSize,
        fileType: body.fileType || "PDF",
        publishedAt: body.publishedAt ? new Date(body.publishedAt) : new Date(),
        status: body.status || "active",
      })
      .returning();

    return c.json({ data: newData }, 201);
  } catch (error) {
    console.error("Error creating health report:", error);
    return c.json({ error: "Failed to create health report" }, 500);
  }
});

// PUT /api/health/reports/:id - Update health report
healthReportsRouter.put("/reports/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();

    const [updated] = await db
      .update(healthReports)
      .set({
        title: body.title,
        description: body.description,
        category: body.category,
        year: body.year,
        fileUrl: body.fileUrl,
        fileSize: body.fileSize,
        fileType: body.fileType,
        publishedAt: body.publishedAt ? new Date(body.publishedAt) : undefined,
        status: body.status,
        updatedAt: new Date(),
      })
      .where(eq(healthReports.id, id))
      .returning();

    if (!updated) {
      return c.json({ error: "Health report not found" }, 404);
    }
    return c.json({ data: updated });
  } catch (error) {
    console.error("Error updating health report:", error);
    return c.json({ error: "Failed to update health report" }, 500);
  }
});

// PATCH /api/health/reports/:id/download - Increment download count
healthReportsRouter.patch("/reports/:id/download", async (c) => {
  try {
    const id = c.req.param("id");

    const [existing] = await db
      .select()
      .from(healthReports)
      .where(eq(healthReports.id, id));

    if (!existing) {
      return c.json({ error: "Health report not found" }, 404);
    }

    const [updated] = await db
      .update(healthReports)
      .set({
        downloadCount: existing.downloadCount + 1,
        updatedAt: new Date(),
      })
      .where(eq(healthReports.id, id))
      .returning();

    return c.json({ data: updated });
  } catch (error) {
    console.error("Error incrementing download count:", error);
    return c.json({ error: "Failed to increment download count" }, 500);
  }
});

// DELETE /api/health/reports/:id - Delete health report
healthReportsRouter.delete("/reports/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const [deleted] = await db
      .delete(healthReports)
      .where(eq(healthReports.id, id))
      .returning();

    if (!deleted) {
      return c.json({ error: "Health report not found" }, 404);
    }
    return c.json({ message: "Health report deleted successfully" });
  } catch (error) {
    console.error("Error deleting health report:", error);
    return c.json({ error: "Failed to delete health report" }, 500);
  }
});

// ==================== HEALTH PROGRAM COVERAGE ====================

// GET /api/health/coverage - Get all program coverage
healthReportsRouter.get("/coverage", async (c) => {
  try {
    const data = await db
      .select()
      .from(healthProgramCoverage)
      .orderBy(asc(healthProgramCoverage.sortOrder));
    return c.json({ data });
  } catch (error) {
    console.error("Error fetching program coverage:", error);
    return c.json({ error: "Failed to fetch program coverage" }, 500);
  }
});

// GET /api/health/coverage/active - Get active program coverage
healthReportsRouter.get("/coverage/active", async (c) => {
  try {
    const data = await db
      .select()
      .from(healthProgramCoverage)
      .where(eq(healthProgramCoverage.status, "active"))
      .orderBy(asc(healthProgramCoverage.sortOrder));
    return c.json({ data });
  } catch (error) {
    console.error("Error fetching active program coverage:", error);
    return c.json({ error: "Failed to fetch active program coverage" }, 500);
  }
});

// GET /api/health/coverage/year/:year - Get program coverage by year
healthReportsRouter.get("/coverage/year/:year", async (c) => {
  try {
    const year = parseInt(c.req.param("year"));
    const data = await db
      .select()
      .from(healthProgramCoverage)
      .where(eq(healthProgramCoverage.year, year))
      .orderBy(asc(healthProgramCoverage.sortOrder));
    return c.json({ data });
  } catch (error) {
    console.error("Error fetching program coverage by year:", error);
    return c.json({ error: "Failed to fetch program coverage" }, 500);
  }
});

// POST /api/health/coverage - Create program coverage
healthReportsRouter.post("/coverage", async (c) => {
  try {
    const body = await c.req.json();
    const [created] = await db
      .insert(healthProgramCoverage)
      .values({
        id: nanoid(),
        programName: body.programName,
        coveragePercent: body.coveragePercent,
        year: body.year,
        sortOrder: body.sortOrder || 0,
        status: body.status || "active",
      })
      .returning();
    return c.json({ data: created }, 201);
  } catch (error) {
    console.error("Error creating program coverage:", error);
    return c.json({ error: "Failed to create program coverage" }, 500);
  }
});

// PUT /api/health/coverage/:id - Update program coverage
healthReportsRouter.put("/coverage/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const [updated] = await db
      .update(healthProgramCoverage)
      .set({
        programName: body.programName,
        coveragePercent: body.coveragePercent,
        year: body.year,
        sortOrder: body.sortOrder,
        status: body.status,
        updatedAt: new Date(),
      })
      .where(eq(healthProgramCoverage.id, id))
      .returning();

    if (!updated) {
      return c.json({ error: "Program coverage not found" }, 404);
    }
    return c.json({ data: updated });
  } catch (error) {
    console.error("Error updating program coverage:", error);
    return c.json({ error: "Failed to update program coverage" }, 500);
  }
});

// DELETE /api/health/coverage/:id - Delete program coverage
healthReportsRouter.delete("/coverage/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const [deleted] = await db
      .delete(healthProgramCoverage)
      .where(eq(healthProgramCoverage.id, id))
      .returning();

    if (!deleted) {
      return c.json({ error: "Program coverage not found" }, 404);
    }
    return c.json({ message: "Program coverage deleted successfully" });
  } catch (error) {
    console.error("Error deleting program coverage:", error);
    return c.json({ error: "Failed to delete program coverage" }, 500);
  }
});

// ==================== HEALTH DISEASE DATA ====================

// GET /api/health/diseases - Get all disease data
healthReportsRouter.get("/diseases", async (c) => {
  try {
    const data = await db
      .select()
      .from(healthDiseaseData)
      .orderBy(asc(healthDiseaseData.sortOrder));
    return c.json({ data });
  } catch (error) {
    console.error("Error fetching disease data:", error);
    return c.json({ error: "Failed to fetch disease data" }, 500);
  }
});

// GET /api/health/diseases/active - Get active disease data
healthReportsRouter.get("/diseases/active", async (c) => {
  try {
    const data = await db
      .select()
      .from(healthDiseaseData)
      .where(eq(healthDiseaseData.status, "active"))
      .orderBy(asc(healthDiseaseData.sortOrder));
    return c.json({ data });
  } catch (error) {
    console.error("Error fetching active disease data:", error);
    return c.json({ error: "Failed to fetch active disease data" }, 500);
  }
});

// GET /api/health/diseases/year/:year - Get disease data by year
healthReportsRouter.get("/diseases/year/:year", async (c) => {
  try {
    const year = parseInt(c.req.param("year"));
    const data = await db
      .select()
      .from(healthDiseaseData)
      .where(eq(healthDiseaseData.year, year))
      .orderBy(asc(healthDiseaseData.sortOrder));
    return c.json({ data });
  } catch (error) {
    console.error("Error fetching disease data by year:", error);
    return c.json({ error: "Failed to fetch disease data" }, 500);
  }
});

// POST /api/health/diseases - Create disease data
healthReportsRouter.post("/diseases", async (c) => {
  try {
    const body = await c.req.json();
    const [created] = await db
      .insert(healthDiseaseData)
      .values({
        id: nanoid(),
        diseaseName: body.diseaseName,
        cases: body.cases,
        year: body.year,
        sortOrder: body.sortOrder || 0,
        status: body.status || "active",
      })
      .returning();
    return c.json({ data: created }, 201);
  } catch (error) {
    console.error("Error creating disease data:", error);
    return c.json({ error: "Failed to create disease data" }, 500);
  }
});

// PUT /api/health/diseases/:id - Update disease data
healthReportsRouter.put("/diseases/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const [updated] = await db
      .update(healthDiseaseData)
      .set({
        diseaseName: body.diseaseName,
        cases: body.cases,
        year: body.year,
        sortOrder: body.sortOrder,
        status: body.status,
        updatedAt: new Date(),
      })
      .where(eq(healthDiseaseData.id, id))
      .returning();

    if (!updated) {
      return c.json({ error: "Disease data not found" }, 404);
    }
    return c.json({ data: updated });
  } catch (error) {
    console.error("Error updating disease data:", error);
    return c.json({ error: "Failed to update disease data" }, 500);
  }
});

// DELETE /api/health/diseases/:id - Delete disease data
healthReportsRouter.delete("/diseases/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const [deleted] = await db
      .delete(healthDiseaseData)
      .where(eq(healthDiseaseData.id, id))
      .returning();

    if (!deleted) {
      return c.json({ error: "Disease data not found" }, 404);
    }
    return c.json({ message: "Disease data deleted successfully" });
  } catch (error) {
    console.error("Error deleting disease data:", error);
    return c.json({ error: "Failed to delete disease data" }, 500);
  }
});

export { healthReportsRouter };
