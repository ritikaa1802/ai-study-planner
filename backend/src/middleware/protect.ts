import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const protect = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const jwtSecret = process.env.JWT_SECRET as string;

    if (!jwtSecret) {
      console.error("CRITICAL: JWT_SECRET environment variable is not set!");
      return res.status(500).json({ message: "Server configuration error" });
    }

    const decoded = jwt.verify(
      token,
      jwtSecret
    ) as { userId: number };

    (req as any).userId = decoded.userId;

    next();
  } catch (error) {
    const errorMsg = error instanceof jwt.TokenExpiredError 
      ? "Token expired"
      : error instanceof jwt.JsonWebTokenError 
      ? "Invalid token format"
      : error instanceof Error 
      ? error.message 
      : "Invalid token";
    
    console.error("[Auth Error]", errorMsg, "Token:", (req.headers.authorization || "").substring(0, 50));
    
    return res.status(401).json({ message: "Invalid token", reason: errorMsg });
  }
};
