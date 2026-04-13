export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { authController } = await import("@/server");
    const body = await req.json();
    const result = await authController.login({
      body,
      headers: Object.fromEntries(req.headers.entries()),
    });

    return NextResponse.json(result.body, { status: result.status });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Internal server error" }, { status: 500 });
  }
}
