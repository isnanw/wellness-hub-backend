import { Hono } from "hono";
import { db } from "../db";
import { unitKerja, users, services, programs, news, registrations } from "../db/schema";
import { count, desc, eq } from "drizzle-orm";
import { authMiddleware } from "../middleware/auth";

const dashboardRouter = new Hono();

// Apply auth middleware to all dashboard routes
dashboardRouter.use("*", authMiddleware);

dashboardRouter.get("/stats", async (c) => {
    try {
        const user = c.get("user");
        // Filter data berdasarkan role:
        // - unit_kerja: hanya data milik unit kerja sendiri (berdasarkan unitKerjaId)
        // - admin / operator: lihat semua data
        const isUnitKerja = user.role === "unit_kerja" && user.unitKerjaId;
        const ukId = user.unitKerjaId;

        // Helper to apply unit_kerja filter
        const withFilter = (query: any, table: any) => {
            if (isUnitKerja && ukId) {
                return query.where(eq(table.unitKerjaId, ukId));
            }
            return query;
        };

        // For unit_kerja role, count only their own unit kerja (= 1)
        // For admin/operator: count all unit kerja
        const unitKerjaQuery = db.select({ count: count() }).from(unitKerja).$dynamic();
        if (isUnitKerja && ukId) {
            unitKerjaQuery.where(eq(unitKerja.id, ukId));
        }

        // For unit_kerja role, don't show user count (only admin/operator)
        const usersQuery = isUnitKerja
            ? db.select({ count: count() }).from(users).where(eq(users.unitKerjaId, ukId!))
            : db.select({ count: count() }).from(users);

        const [
            usersCount,
            ukCount,
            servicesCount,
            programsCount,
            newsCount,
            registrationsCount,
            recentRegistrations
        ] = await Promise.all([
            usersQuery,
            unitKerjaQuery,
            withFilter(db.select({ count: count() }).from(services).$dynamic(), services),
            withFilter(db.select({ count: count() }).from(programs).$dynamic(), programs),
            withFilter(db.select({ count: count() }).from(news).$dynamic(), news),
            withFilter(db.select({ count: count() }).from(registrations).$dynamic(), registrations),
            withFilter(db.select().from(registrations).$dynamic(), registrations).orderBy(desc(registrations.createdAt)).limit(5)
        ]);

        return c.json({
            data: {
                users: usersCount[0].count,
                unitKerja: ukCount[0].count,
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
