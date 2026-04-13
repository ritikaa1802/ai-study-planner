import { prisma } from "../prisma";
import { json, type ServerContext } from "../shared/http";

export const getResources = async (ctx: ServerContext) => {
  try {
    const userId = ctx.userId as number;

    const resources = await prisma.resource.findMany({
      where: { uploaderId: userId },
      include: {
        uploader: { select: { id: true, name: true } },
        studyCircle: { select: { id: true, name: true } },
      },
      orderBy: { uploadedAt: "desc" },
    });

    return json(200, { resources });
  } catch (error) {
    return json(500, { error: "Failed to fetch resources" });
  }
};

export const createResource = async (ctx: ServerContext) => {
  try {
    const userId = ctx.userId as number;
    const { title, url, description, studyCircleId } = ctx.body ?? {};
    const file = ctx.file as { filename: string; mimetype?: string } | undefined;

    if (!title || (!url && !file)) {
      return json(400, { error: "Title and either a URL or a file are required" });
    }

    const resource = await prisma.resource.create({
      data: {
        title,
        url: url || null,
        fileUrl: file ? `/uploads/${file.filename}` : null,
        fileType: file?.mimetype || null,
        description: description || null,
        studyCircleId: studyCircleId ? Number(studyCircleId) : undefined,
        uploaderId: userId,
      },
    });

    return json(201, { resource });
  } catch (error) {
    return json(500, { error: "Failed to create resource" });
  }
};

export const deleteResource = async (ctx: ServerContext) => {
  try {
    const { id } = ctx.params ?? {};
    const userId = ctx.userId as number;

    const resource = await prisma.resource.findUnique({ where: { id: Number(id) } });
    if (!resource) {
      return json(404, { error: "Resource not found" });
    }

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    const isAdmin = user?.role === "ADMIN";

    if (resource.uploaderId !== userId && !isAdmin) {
      return json(403, { error: "Not authorized to delete this resource" });
    }

    await prisma.resource.delete({ where: { id: Number(id) } });

    return json(200, { message: "Resource deleted" });
  } catch (error) {
    return json(500, { error: "Failed to delete resource" });
  }
};
