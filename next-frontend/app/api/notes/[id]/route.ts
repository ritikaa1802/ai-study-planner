export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { noteController } from "@/server";
import { requireUserId } from "../../_lib/auth";

export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const auth = requireUserId(req);
        if (!auth.ok) {
            return auth.response;
        }

        const body = await req.json();
        const result = await noteController.updateNote({
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

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const auth = requireUserId(req);
        if (!auth.ok) {
            return auth.response;
        }

        const result = await noteController.deleteNote({
            params,
            headers: Object.fromEntries(req.headers.entries()),
            userId: auth.userId,
        });

        return NextResponse.json(result.body, { status: result.status });
    } catch (error: any) {
        return NextResponse.json({ error: error?.message ?? "Internal server error" }, { status: 500 });
    }
}
