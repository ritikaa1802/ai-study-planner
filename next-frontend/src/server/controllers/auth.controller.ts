import { prisma } from "../prisma";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { generateAccessToken, generateRefreshToken } from "../utils/generateToken";
import { sendPasswordResetEmail } from "../utils/email";
import { json, type ServerContext } from "../shared/http";

export const register = async (ctx: ServerContext) => {
  try {
    const { name, email, password } = ctx.body ?? {};

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !name.trim() ||
      !email.trim() ||
      password.length < 8
    ) {
      return json(400, { error: "Name, valid email, and password (min 8 chars) are required" });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return json(400, { error: "Email is already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    return json(201, { message: "User created", user: { id: user.id, email: user.email, name: user.name } });
  } catch (error) {
    console.error("REGISTER ERROR:", error);

    if (error instanceof Prisma.PrismaClientInitializationError) {
      return json(500, { error: "Database connection failed. Check DATABASE_URL and DB network access." });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return json(400, { error: "Email is already registered" });
      }

      if (error.code === "P2021") {
        return json(500, { error: "Database schema is missing in production. Run Prisma migration deploy." });
      }
    }

    return json(500, { error: "Server error during registration" });
  }
};

export const login = async (ctx: ServerContext) => {
  try {
    const { email, password } = (ctx.body ?? {}) as { email?: unknown; password?: unknown };

    if (!email || typeof email !== "string" || !password || typeof password !== "string") {
      return json(400, { error: "Email and password are required" });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        password: true,
      },
    });

    if (!user) {
      return json(400, { error: "Invalid credentials" });
    }

    let isMatch = false;
    const isBcryptHash = typeof user.password === "string" && user.password.startsWith("$2");

    if (isBcryptHash) {
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      isMatch = password === user.password;
      if (isMatch) {
        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.user.update({
          where: { id: user.id },
          data: { password: hashedPassword },
        });
      }
    }

    if (!isMatch) {
      return json(400, { error: "Invalid credentials" });
    }

    const accessToken = generateAccessToken(user.id);

    let refreshToken: string | null = null;
    try {
      refreshToken = generateRefreshToken(user.id);
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken },
      });
    } catch (tokenError) {
      console.error("REFRESH TOKEN ERROR:", tokenError);
    }

    return json(200, {
      accessToken,
      ...(refreshToken ? { refreshToken } : {}),
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return json(500, { error: "Server error during login" });
  }
};

export const refreshToken = async (ctx: ServerContext) => {
  const { refreshToken } = ctx.body ?? {};

  if (!refreshToken) {
    return json(401, { message: "No refresh token provided" });
  }

  try {
    const decoded: any = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET as string);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        refreshToken: true,
      },
    });

    if (!user || user.refreshToken !== refreshToken) {
      return json(403, { message: "Invalid or expired refresh token" });
    }

    const newAccessToken = generateAccessToken(user.id);
    return json(200, { accessToken: newAccessToken });
  } catch (error) {
    return json(403, { message: "Invalid or expired refresh token" });
  }
};

export const forgotPassword = async (ctx: ServerContext) => {
  try {
    const { email } = ctx.body ?? {};

    if (!email || !email.includes("@")) {
      return json(400, { error: "Valid email is required" });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      return json(200, { message: "If that email is registered, a reset link has been sent." });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: hashedToken,
        passwordResetExpires: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    await sendPasswordResetEmail(email, resetToken);

    const isDev = process.env.NODE_ENV !== "production";
    const resetUrl = `${process.env.FRONTEND_URL ?? "http://localhost:5173"}/reset-password?token=${resetToken}`;

    return json(200, {
      message: "If that email is registered, a reset link has been sent.",
      ...(isDev ? { resetUrl } : {}),
    });
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);
    return json(500, { error: "Failed to process request" });
  }
};

export const resetPassword = async (ctx: ServerContext) => {
  const { token, newPassword } = ctx.body ?? {};

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: hashedToken,
      passwordResetExpires: { gt: new Date() },
    },
    select: { id: true },
  });

  if (!user) {
    return json(400, { message: "Invalid or expired token" });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null,
    },
  });

  return json(200, { message: "Password reset successful" });
};

export const changePassword = async (ctx: ServerContext) => {
  try {
    const { currentPassword, newPassword } = (ctx.body ?? {}) as {
      currentPassword?: string;
      newPassword?: string;
    };

    if (!currentPassword || !newPassword) {
      return json(400, { error: "Current password and new password are required" });
    }

    if (newPassword.length < 8) {
      return json(400, { error: "New password must be at least 8 characters" });
    }

    if (currentPassword === newPassword) {
      return json(400, { error: "New password must be different from current password" });
    }

    const userId = ctx.userId as number | undefined;
    if (!userId) {
      return json(401, { error: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        password: true,
      },
    });
    if (!user) {
      return json(404, { error: "User not found" });
    }

    const isBcryptHash = typeof user.password === "string" && user.password.startsWith("$2");
    const isMatch = isBcryptHash
      ? await bcrypt.compare(currentPassword, user.password)
      : currentPassword === user.password;

    if (!isMatch) {
      return json(400, { error: "Current password is incorrect" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return json(200, { message: "Password changed successfully" });
  } catch (error) {
    console.error(error);
    return json(500, { error: "Failed to change password" });
  }
};
