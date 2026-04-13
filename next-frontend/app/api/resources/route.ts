import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { resourceController } from "@/server";
import { requireUserId } from "../_lib/auth";

const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024;
const sanitizeFilename = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, "-");

export async function GET(req: NextRequest) {
  try {
    const auth = requireUserId(req);
    if (!auth.ok) {
      return auth.response;
    }

    const result = await resourceController.getResources({
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

    const formData = await req.formData();
    const title = String(formData.get("title") ?? "").trim();
    const url = String(formData.get("url") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const studyCircleId = String(formData.get("studyCircleId") ?? "").trim();

    let fileInfo: { filename: string; mimetype?: string } | undefined;
    const file = formData.get("file");

    if (file instanceof File) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json({ error: "File too large. Maximum size is 100MB." }, { status: 400 });
      }

      const ext = path.extname(file.name || "") || ".bin";
      const filename = `${Date.now()}-${randomUUID()}-${sanitizeFilename(path.basename(file.name || "resource", ext))}${ext}`;
      const uploadsDir = path.join(process.cwd(), "public", "uploads");

      await mkdir(uploadsDir, { recursive: true });
      await writeFile(path.join(uploadsDir, filename), Buffer.from(await file.arrayBuffer()));
      fileInfo = { filename, mimetype: file.type };
    }

    const result = await resourceController.createResource({
      body: {
        title,
        url: url || null,
        description: description || null,
        studyCircleId: studyCircleId || null,
      },
      file: fileInfo,
      headers: Object.fromEntries(req.headers.entries()),
      userId: auth.userId,
    });

    return NextResponse.json(result.body, { status: result.status });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Internal server error" }, { status: 500 });
  }
}
