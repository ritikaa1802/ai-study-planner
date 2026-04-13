import { NextRequest, NextResponse } from "next/server";
import { taskController } from "@/server";
import { requireUserId } from "../../_lib/auth";

type RouteParams = { params: { id: string } };

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const auth = requireUserId(req);
    if (!auth.ok) {
      return auth.response;
    }

    const result = await taskController.getTaskById({
      params,
      headers: Object.fromEntries(req.headers.entries()),
      userId: auth.userId,
    });

    return NextResponse.json(result.body, { status: result.status });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const auth = requireUserId(req);
    if (!auth.ok) {
      return auth.response;
    }

    const body = await req.json();
    const result = await taskController.updateTask({
      body,
      params,
      headers: Object.fromEntries(req.headers.entries()),
      userId: auth.userId,
    });

    return NextResponse.json(result.body, { status: result.status });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const auth = requireUserId(req);
    if (!auth.ok) {
      return auth.response;
    }

    const result = await taskController.deleteTask({
      params,
      headers: Object.fromEntries(req.headers.entries()),
      userId: auth.userId,
    });

    return NextResponse.json(result.body, { status: result.status });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Internal server error" }, { status: 500 });
  }
}
