import { Context } from "hono";

/**
 * Handle errors conditionally based on environment.
 * In development: Returns the generic message AND the detailed error (stack trace, query issue).
 * In production: Only returns the generic safe message.
 */
export function handleError(c: Context, message: string, error: unknown, status: number = 500) {
    const isDev = process.env.NODE_ENV !== "production";

    // Always log the full error to the backend console (server log)
    console.error(`[${c.req.method} ${c.req.path}] ${message}:`, error);

    if (isDev) {
        // Return detailed error in Development
        const errorDetail =
            error instanceof Error
                ? { name: error.name, message: error.message, stack: error.stack }
                : error;

        return c.json(
            {
                error: message,
                dev_details: errorDetail,
            },
            status as any
        );
    }

    // Return generic error in Production
    return c.json({ error: message }, status as any);
}
