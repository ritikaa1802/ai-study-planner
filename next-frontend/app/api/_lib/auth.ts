import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export type AuthResult =
  | { ok: true; userId: number }
  | { ok: false; response: NextResponse };

export function requireUserId(req: NextRequest): AuthResult {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return {
        ok: false,
        response: NextResponse.json({ message: "No token provided" }, { status: 401 }),
      };
    }

    const token = authHeader.split(" ")[1];
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      console.error("JWT_SECRET environment variable is not set!");
      return {
        ok: false,
        response: NextResponse.json({ message: "Server configuration error" }, { status: 500 }),
      };
    }

    const decoded = jwt.verify(token, jwtSecret) as { userId: number };

    return { ok: true, userId: decoded.userId };
  } catch (error) {
    const errorMessage = error instanceof jwt.TokenExpiredError 
      ? "Token expired"
      : error instanceof jwt.JsonWebTokenError 
      ? "Invalid token format"
      : error instanceof Error 
      ? error.message 
      : "Invalid token";
    
    console.error("[Auth Error]", errorMessage, "Token:", req.headers.get("authorization")?.substring(0, 50));
    
    return {
      ok: false,
      response: NextResponse.json({ message: "Invalid token", reason: errorMessage }, { status: 401 }),
    };
  }
}
