import { prisma } from "../prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { json, type ServerContext } from "../shared/http";

export const createUser = async (ctx: ServerContext) => {
  try {
    const { name, email, password } = ctx.body ?? {};

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return json(400, { message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    return json(201, {
      id: user.id,
      name: user.name,
      email: user.email,
    });
  } catch (error) {
    return json(500, { message: "Server error" });
  }
};

export const loginUser = async (ctx: ServerContext) => {
  try {
    const { email, password } = ctx.body ?? {};

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return json(400, { message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return json(400, { message: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET as string, { expiresIn: "7d" });

    return json(200, {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    return json(500, { message: "Server error" });
  }
};

export const getProfile = async (ctx: ServerContext) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: ctx.userId },
      select: { id: true, name: true, email: true, bio: true, avatar: true, notifs: true },
    });
    if (!user) {
      return json(404, { error: "User not found" });
    }

    return json(200, user);
  } catch (error) {
    return json(500, { error: "Failed to load profile" });
  }
};

export const updateProfile = async (ctx: ServerContext) => {
  try {
    const { name, bio, avatar, notifs } = ctx.body ?? {};

    const updatedUser = await prisma.user.update({
      where: { id: ctx.userId },
      data: { name, bio, avatar, notifs },
      select: { id: true, name: true, email: true, bio: true, avatar: true, notifs: true },
    });

    return json(200, { user: updatedUser });
  } catch (error) {
    return json(500, { error: "Failed to update profile" });
  }
};

export const updateProfileAvatar = async (ctx: ServerContext) => {
  try {
    const file = ctx.file;

    if (!file) {
      return json(400, { error: "Please upload an image file" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: ctx.userId },
      data: { avatar: `/uploads/${file.filename}` },
      select: { id: true, name: true, email: true, bio: true, avatar: true, notifs: true },
    });

    return json(200, { user: updatedUser });
  } catch (error) {
    return json(500, { error: "Failed to update profile photo" });
  }
};
