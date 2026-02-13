import { Hono } from "hono";
import { db } from "../db";
import { users, puskesmas, services, programs, news, registrations } from "../db/schema";
import { count, desc } from "drizzle-orm";

const dashboardRouter = new Hono();

dashboardRouter.get("/stats", async (c) => {
    try {
        const [
            usersCount,
            puskesmasCount,
            servicesCount,
            programsCount,
            newsCount,
            registrationsCount,
            recentRegistrations
        ] = await Promise.all([
            db.select({ count: count() }).from(users),
            db.select({ count: count() }).from(puskesmas),
            db.select({ count: count() }).from(services),
            db.select({ count: count() }).from(programs),
            db.select({ count: count() }).from(news),
            db.select({ count: count() }).from(registrations),
            db.select().from(registrations).orderBy(desc(registrations.createdAt)).limit(5)
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
