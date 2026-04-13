import { NextRequest, NextResponse } from "next/server";
import { calendarController } from "@/server";
import { requireUserId } from "../../_lib/auth";

type RouteParams = { params: { id: string } };

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const auth = requireUserId(req);
    if (!auth.ok) {
      return auth.response;
    }

    const result = await calendarController.deleteEvent({
      params,
      headers: Object.fromEntries(req.headers.entries()),
      userId: auth.userId,
    });

    return NextResponse.json(result.body, { status: result.status });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Internal server error" }, { status: 500 });
  }
}
