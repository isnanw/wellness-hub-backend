import { createMiddleware } from "hono/factory";
import { getCookie } from "hono/cookie";
import { verify } from "hono/jwt";

// Secret key for JWT signing - should be in .env in production
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-wellness-hub-2024";

export type AuthUser = {
    id: string;
    email: string;
    role: string;
    puskesmasId: string | null;
    name: string;
};

// Extend Hono Context to include user
declare module "hono" {
    interface ContextVariableMap {
        user: AuthUser;
    }
}

export const authMiddleware = createMiddleware(async (c, next) => {
    try {
        const token = getCookie(c, "auth_token");

        if (!token) {
            return c.json({ error: "Unauthorized: No token provided" }, 401);
        }

        const payload = await verify(token, JWT_SECRET, "HS256");

        // Set user to context
        c.set("user", payload as unknown as AuthUser);

        await next();
    } catch (error) {
        console.error("Auth Middleware Error:", error);
        return c.json({ error: "Unauthorized: Invalid token" }, 401);
    }
});

export const getJwtSecret = () => JWT_SECRET;
