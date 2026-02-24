import { Hono } from "hono";
import { db } from "../db";
import { users, type NewUser, roles } from "../db/schema";
import { eq } from "drizzle-orm";
import { sign } from "hono/jwt";
import { setCookie, deleteCookie } from "hono/cookie";
import { getJwtSecret, authMiddleware } from "../middleware/auth";

const usersRouter = new Hono();

// Auth middleare for all routes, except login
usersRouter.use("*", async (c, next) => {
  if (c.req.path === "/api/users/login") {
    return await next();
  }
  return authMiddleware(c, next);
});

// Login
usersRouter.post("/login", async (c) => {
  try {
    const { email, password } = await c.req.json<{ email: string; password: string }>();

    const result = await db
      .select({
        user: users,
        role: roles,
      })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.email, email));

    if (result.length === 0) {
      return c.json({ error: "Email atau password salah" }, 401);
    }

    const { user, role } = result[0];

    // Verify password using Bun's built-in secure hashing
    const isPasswordValid = await Bun.password.verify(password, user.password!);

    if (!isPasswordValid) {
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

    // Generate JWT
    const payload = {
      id: user.id,
      email: user.email,
      role: role?.slug || "user",
      unitKerjaId: user.unitKerjaId,
      name: user.name,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 12, // 12 hours
    };

    const token = await sign(payload, getJwtSecret());

    // Set HTTP-only cookie
    setCookie(c, "auth_token", token, {
      httpOnly: true,
      secure: true, // Always secure (requires HTTPS or localhost)
      sameSite: "Lax",
      path: "/",
      maxAge: 60 * 60 * 12, // 12 hours
    });

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    return c.json({
      data: {
        ...userWithoutPassword,
        role: role?.slug || "user", // Compatibility with frontend
        roleName: role?.name,
      },
      message: "Login berhasil",
    });
  } catch (error) {
    console.error("Error during login:", error);
    return c.json({ error: "Login gagal" }, 500);
  }
});

// Logout
usersRouter.post("/logout", async (c) => {
  deleteCookie(c, "auth_token");
  return c.json({ message: "Logout berhasil" });
});


// Get all roles
usersRouter.get("/roles", async (c) => {
  try {
    const result = await db.select().from(roles);
    return c.json({ data: result });
  } catch (error) {
    console.error("Error fetching roles:", error);
    return c.json({ error: "Failed to fetch roles" }, 500);
  }
});

// Get all users
usersRouter.get("/", async (c) => {
  try {
    const result = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        status: users.status,
        avatar: users.avatar,
        lastLogin: users.lastLogin,
        roleId: users.roleId,
        role: roles.slug,
        roleName: roles.name,
        unitKerjaId: users.unitKerjaId,
      })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id));

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
    const result = await db
      .select({
        user: users,
        role: roles,
      })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.id, id));

    if (result.length === 0) {
      return c.json({ error: "User not found" }, 404);
    }

    const { user, role } = result[0];
    const { password: _, ...userWithoutPassword } = user;

    return c.json({
      data: {
        ...userWithoutPassword,
        role: role?.slug,
        roleName: role?.name,
      }
    });
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

    // Hash password before saving
    let hashedPassword = body.password;
    if (body.password) {
      hashedPassword = await Bun.password.hash(body.password);
    }

    const newUser: NewUser = {
      ...body,
      id,
      password: hashedPassword,
    };

    const result = await db.insert(users).values(newUser).returning();
    // Remove password from response
    const { password: _, ...createdUser } = result[0];
    return c.json({ data: createdUser }, 201);
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

    const updateData: any = { ...body, updatedAt: new Date() };

    // Hash password if it's being updated
    if (body.password) {
      updateData.password = await Bun.password.hash(body.password);
    }

    const result = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();

    if (result.length === 0) {
      return c.json({ error: "User not found" }, 404);
    }

    // Remove password from response
    const { password: _, ...updatedUser } = result[0];
    return c.json({ data: updatedUser });
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

// Change password (self)
usersRouter.post("/change-password", async (c) => {
  try {
    const user = c.get("user");
    const { currentPassword, newPassword } = await c.req.json<{
      currentPassword: string;
      newPassword: string;
    }>();

    if (!currentPassword || !newPassword) {
      return c.json({ error: "Password saat ini dan baru diperlukan" }, 400);
    }

    // Fetch user from DB to get the current hashed password
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id));

    if (result.length === 0) {
      return c.json({ error: "User tidak ditemukan" }, 404);
    }

    const userData = result[0];

    // Verify current password
    const isPasswordValid = await Bun.password.verify(currentPassword, userData.password!);
    if (!isPasswordValid) {
      return c.json({ error: "Password saat ini salah" }, 401);
    }

    // Hash new password
    const hashedNewPassword = await Bun.password.hash(newPassword);

    // Update password
    await db
      .update(users)
      .set({ password: hashedNewPassword, updatedAt: new Date() })
      .where(eq(users.id, user.id));

    return c.json({ message: "Password berhasil diubah" });
  } catch (error) {
    console.error("Error changing password:", error);
    return c.json({ error: "Gagal mengubah password" }, 500);
  }
});

export { usersRouter };
