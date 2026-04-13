import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { userController } from "@/server";
import { requireUserId } from "../../../_lib/auth";

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

const sanitizeFilename = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, "-");

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
      return NextResponse.json({ error: "Image is too large. Max size is 5MB." }, { status: 400 });
    }

    const ext = path.extname(file.name || "") || ".jpg";
    const filename = `${Date.now()}-${randomUUID()}-${sanitizeFilename(path.basename(file.name || "avatar", ext))}${ext}`;
    const uploadsDir = path.join(process.cwd(), "public", "uploads");

    await mkdir(uploadsDir, { recursive: true });

    const arrayBuffer = await file.arrayBuffer();
    await writeFile(path.join(uploadsDir, filename), Buffer.from(arrayBuffer));

    const result = await userController.updateProfileAvatar({
      headers: Object.fromEntries(req.headers.entries()),
      userId: auth.userId,
      file: { filename },
    });

    return NextResponse.json(result.body, { status: result.status });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Internal server error" }, { status: 500 });
  }
}
