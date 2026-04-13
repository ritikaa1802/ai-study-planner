export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { calendarController } from "@/server";
import { requireUserId } from "../_lib/auth";

export async function GET(req: NextRequest) {
  try {
    const auth = requireUserId(req);
    if (!auth.ok) {
      return auth.response;
    }

    const result = await calendarController.getEvents({
      headers: Object.fromEntries(req.headers.entries()),
      userId: auth.userId,
    });

    return NextResponse.json(result.body, { status: result.status });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = requireUserId(req);
    if (!auth.ok) {
      return auth.response;
    }

    const body = await req.json();
    const result = await calendarController.createEvent({
      body,
      headers: Object.fromEntries(req.headers.entries()),
      userId: auth.userId,
    });

    return NextResponse.json(result.body, { status: result.status });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Internal server error" }, { status: 500 });
  }
}
