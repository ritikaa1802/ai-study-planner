import { Request, Response } from "express"
import prisma from "../prisma"
import bcrypt from "bcrypt"
import { generateAccessToken, generateRefreshToken } from "../utils/generateToken"
import jwt from "jsonwebtoken"
import crypto from "crypto"
import { sendPasswordResetEmail } from "../utils/email"
// REGISTER
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      res.status(400).json({ error: "Email is already registered" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword
      }
    });

    res.status(201).json({ message: "User created", user: { id: user.id, email: user.email, name: user.name } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error during registration" });
  }
};

// LOGIN
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = (req.body ?? {}) as { email?: unknown; password?: unknown }

    if (!email || typeof email !== "string" || !password || typeof password !== "string") {
      return res.status(400).json({ error: "Email and password are required" })
    }

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" })
    }

    // Allow legacy plaintext passwords and migrate them to bcrypt on successful login.
    let isMatch = false
    const isBcryptHash = typeof user.password === "string" && user.password.startsWith("$2")

    if (isBcryptHash) {
      isMatch = await bcrypt.compare(password, user.password)
    } else {
      isMatch = password === user.password
      if (isMatch) {
        const hashedPassword = await bcrypt.hash(password, 10)
        await prisma.user.update({
          where: { id: user.id },
          data: { password: hashedPassword }
        })
      }
    }

    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" })
    }

    const accessToken = generateAccessToken(user.id)

    // Refresh token persistence can fail on out-of-sync schemas; do not fail login for that.
    let refreshToken: string | null = null
    try {
      refreshToken = generateRefreshToken(user.id)
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken }
      })
    } catch (tokenError) {
      console.error("REFRESH TOKEN ERROR:", tokenError)
    }

    res.json({
      accessToken,
      ...(refreshToken ? { refreshToken } : {})
    })
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({ error: "Server error during login" });
  }
}



export const refreshToken = async (req: Request, res: Response) => {
  const { refreshToken } = req.body

  if (!refreshToken) {
    return res.status(401).json({ message: "No refresh token provided" })
  }

  try {
    const decoded: any = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET as string
    )

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    })

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ message: "Invalid or expired refresh token" })
    }

    const newAccessToken = generateAccessToken(user.id)

    res.json({ accessToken: newAccessToken })

  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired refresh token" })
  }
}

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email || !email.includes("@")) {
      res.status(400).json({ error: "Valid email is required" });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Always return 200 to prevent email enumeration
    if (!user) {
      res.json({ message: "If that email is registered, a reset link has been sent." });
      return;
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: hashedToken,
        passwordResetExpires: new Date(Date.now() + 15 * 60 * 1000)
      }
    });

    // Send the real password reset email
    await sendPasswordResetEmail(email, resetToken);

    const isDev = process.env.NODE_ENV !== "production";
    const resetUrl = `${process.env.FRONTEND_URL ?? "http://localhost:5173"}/reset-password?token=${resetToken}`;

    res.json({
      message: "If that email is registered, a reset link has been sent.",
      ...(isDev ? { resetUrl } : {}),
    });
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);
    res.status(500).json({ error: "Failed to process request" });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const { token, newPassword } = req.body

  const hashedToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex")

  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: hashedToken,
      passwordResetExpires: { gt: new Date() }
    }
  })

  if (!user) {
    return res.status(400).json({ message: "Invalid or expired token" })
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10)

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null
    }
  })

  res.json({ message: "Password reset successful" })
}

export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = (req.body ?? {}) as {
      currentPassword?: string;
      newPassword?: string;
    };

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: "Current password and new password are required" });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({ error: "New password must be at least 8 characters" });
      return;
    }

    if (currentPassword === newPassword) {
      res.status(400).json({ error: "New password must be different from current password" });
      return;
    }

    const userId = (req as any).userId as number | undefined;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const isBcryptHash = typeof user.password === "string" && user.password.startsWith("$2");
    const isMatch = isBcryptHash
      ? await bcrypt.compare(currentPassword, user.password)
      : currentPassword === user.password;

    if (!isMatch) {
      res.status(400).json({ error: "Current password is incorrect" });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to change password" });
  }
}