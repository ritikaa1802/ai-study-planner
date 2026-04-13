import { NextRequest, NextResponse } from "next/server";
import { dashboardController } from "@/server";
import { requireUserId } from "../_lib/auth";

export async function GET(req: NextRequest) {
  try {
    const auth = requireUserId(req);
    if (!auth.ok) {
      return auth.response;
    }

    const searchParams = new URL(req.url).searchParams;
    const query = Object.fromEntries(searchParams.entries());

    const result = await dashboardController.getDashboardStats({
      query,
      headers: Object.fromEntries(req.headers.entries()),
      userId: auth.userId,
    });

    return NextResponse.json(result.body, { status: result.status });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Internal server error" }, { status: 500 });
  }
}
