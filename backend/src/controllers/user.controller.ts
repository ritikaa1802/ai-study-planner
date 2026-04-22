// Helper to add a notification to a user
export async function addUserNotification(userId: number, notif: { text: string; time?: string; unread?: boolean }) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { notifs: true } });
  const now = new Date();
  const time = notif.time || now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const newNotif = { id: Date.now(), text: notif.text, time, unread: notif.unread !== false };
  const notifs = Array.isArray(user?.notifs) ? user!.notifs : [];
  notifs.unshift(newNotif);
  await prisma.user.update({ where: { id: userId }, data: { notifs } });
}
import { Request, Response } from "express";
import prisma from "../prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword
      }
    });

    return res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email
    });

  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: (req as any).userId },
      select: { id: true, name: true, email: true, bio: true, avatar: true, notifs: true }
    });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to load profile" });
  }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, bio, avatar, notifs } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: (req as any).userId },
      data: { name, bio, avatar, notifs },
      select: { id: true, name: true, email: true, bio: true, avatar: true, notifs: true }
    });

    res.json({ user: updatedUser });
  } catch (error) {
    res.status(500).json({ error: "Failed to update profile" });
  }
};

export const updateProfileAvatar = async (req: Request, res: Response): Promise<void> => {
  try {
    const file = req.file as Express.Multer.File | undefined;

    if (!file) {
      res.status(400).json({ error: "Please upload an image file" });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id: (req as any).userId },
      data: { avatar: `/uploads/${file.filename}` },
      select: { id: true, name: true, email: true, bio: true, avatar: true, notifs: true }
    });

    res.json({ user: updatedUser });
  } catch (error) {
    res.status(500).json({ error: "Failed to update profile photo" });
  }
};
