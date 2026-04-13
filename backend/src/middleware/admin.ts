import { Request, Response, NextFunction } from "express"
import prisma from "../prisma"

export const isAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = (req as any).userId

  const user = await prisma.user.findUnique({
    where: { id: userId }
  })

  if (!user || user.role !== "ADMIN") {
    return res.status(403).json({ message: "Access denied" })
  }

  next()
}