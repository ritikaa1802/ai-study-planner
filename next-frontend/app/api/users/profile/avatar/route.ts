export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { userController } from "@/server";
import { requireUserId } from "../../../_lib/auth";

const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const auth = requireUserId(req);
    if (!auth.ok) {
      return auth.response;
    }

    const formData = await req.formData();
    const file = formData.get("photo");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Please upload an image file" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json({ error: "Image is too large. Max size is 2MB." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const avatarDataUrl = `data:${file.type};base64,${base64}`;

    const result = await userController.updateProfile({
      headers: Object.fromEntries(req.headers.entries()),
      userId: auth.userId,
      body: { avatar: avatarDataUrl },
    });

    return NextResponse.json(result.body, { status: result.status });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Internal server error" }, { status: 500 });
  }
}
