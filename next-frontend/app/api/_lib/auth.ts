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

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: number };

    return { ok: true, userId: decoded.userId };
  } catch (error) {
    return {
      ok: false,
      response: NextResponse.json({ message: "Invalid token" }, { status: 401 }),
    };
  }
}
