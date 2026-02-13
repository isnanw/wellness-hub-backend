import { Hono } from "hono";
import { db } from "../db";
import { users, puskesmas, services, programs, news, registrations } from "../db/schema";
import { count, desc, eq } from "drizzle-orm";
import { authMiddleware } from "../middleware/auth";

const dashboardRouter = new Hono();

// Apply auth middleware to all dashboard routes
dashboardRouter.use("*", authMiddleware);

dashboardRouter.get("/stats", async (c) => {
    try {
        const user = c.get("user");
        const isPuskesmas = user.role === "puskesmas" && user.puskesmasId;
        const pId = user.puskesmasId;

        // Helper to apply puskesmas filter
        const withFilter = (query: any, table: any) => {
            if (isPuskesmas && pId) {
                return query.where(eq(table.puskesmasId, pId));
            }
            return query;
        };

        // For Puskesmas table itself, if role is puskesmas, filtering by ID results in count 1
        const puskesmasQuery = db.select({ count: count() }).from(puskesmas).$dynamic();
        if (isPuskesmas && pId) {
            puskesmasQuery.where(eq(puskesmas.id, pId));
        }

        const [
            usersCount,
            puskesmasCount,
            servicesCount,
            programsCount,
            newsCount,
            registrationsCount,
            recentRegistrations
        ] = await Promise.all([
            withFilter(db.select({ count: count() }).from(users).$dynamic(), users),
            puskesmasQuery,
            withFilter(db.select({ count: count() }).from(services).$dynamic(), services),
            withFilter(db.select({ count: count() }).from(programs).$dynamic(), programs),
            withFilter(db.select({ count: count() }).from(news).$dynamic(), news),
            withFilter(db.select({ count: count() }).from(registrations).$dynamic(), registrations),
            withFilter(db.select().from(registrations).orderBy(desc(registrations.createdAt)).limit(5).$dynamic(), registrations)
        ]);

        return c.json({
            data: {
                users: usersCount[0].count,
                puskesmas: puskesmasCount[0].count,
                services: servicesCount[0].count,
                programs: programsCount[0].count,
                news: newsCount[0].count,
                registrations: registrationsCount[0].count,
                recentActivity: recentRegistrations
            }
        });
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        return c.json({ error: "Failed to fetch dashboard stats" }, 500);
    }
});

export { dashboardRouter };
