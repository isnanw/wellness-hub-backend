import { Hono } from "hono";
import { db } from "../db";
import { users, type NewUser } from "../db/schema";
import { eq } from "drizzle-orm";

const usersRouter = new Hono();

// Login
usersRouter.post("/login", async (c) => {
  try {
    const { email, password } = await c.req.json<{ email: string; password: string }>();

    const result = await db.select().from(users).where(eq(users.email, email));

    if (result.length === 0) {
      return c.json({ error: "Email atau password salah" }, 401);
    }

    const user = result[0];

    // Simple password check (in production, use bcrypt)
    if (user.password !== password) {
      return c.json({ error: "Email atau password salah" }, 401);
    }

    if (user.status !== "active") {
      return c.json({ error: "Akun tidak aktif" }, 401);
    }

    // Update last login
    await db
      .update(users)
      .set({ lastLogin: new Date() })
      .where(eq(users.id, user.id));

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    return c.json({
      data: userWithoutPassword,
      message: "Login berhasil",
    });
  } catch (error) {
    console.error("Error during login:", error);
    return c.json({ error: "Login gagal" }, 500);
  }
});

// Get all users
usersRouter.get("/", async (c) => {
  try {
    const result = await db.select().from(users);
    return c.json({ data: result });
  } catch (error) {
    console.error("Error fetching users:", error);
    return c.json({ error: "Failed to fetch users" }, 500);
  }
});

// Get user by ID
usersRouter.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const result = await db.select().from(users).where(eq(users.id, id));

    if (result.length === 0) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json({ data: result[0] });
  } catch (error) {
    console.error("Error fetching user:", error);
    return c.json({ error: "Failed to fetch user" }, 500);
  }
});

// Create user
usersRouter.post("/", async (c) => {
  try {
    const body = await c.req.json<NewUser>();
    const id = crypto.randomUUID();

    const newUser: NewUser = {
      ...body,
      id,
    };

    const result = await db.insert(users).values(newUser).returning();
    return c.json({ data: result[0] }, 201);
  } catch (error) {
    console.error("Error creating user:", error);
    return c.json({ error: "Failed to create user" }, 500);
  }
});

// Update user
usersRouter.put("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json<Partial<NewUser>>();

    const result = await db
      .update(users)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    if (result.length === 0) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json({ data: result[0] });
  } catch (error) {
    console.error("Error updating user:", error);
    return c.json({ error: "Failed to update user" }, 500);
  }
});

// Delete user
usersRouter.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const result = await db.delete(users).where(eq(users.id, id)).returning();

    if (result.length === 0) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return c.json({ error: "Failed to delete user" }, 500);
  }
});

export { usersRouter };
