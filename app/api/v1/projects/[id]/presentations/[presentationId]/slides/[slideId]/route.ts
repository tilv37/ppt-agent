import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authMiddleware } from "@/lib/middleware/auth";
import { requireString } from "@/lib/utils/validation";
import { ok, noContent } from "@/lib/utils/api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; presentationId: string; slideId: string }> }
) {
  const authResult = authMiddleware(request);

  if (authResult instanceof Response) {
    return authResult;
  }

  const { id: projectId, presentationId, slideId } = await params;

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: authResult.userId },
  });

  if (!project) {
    return Response.json(
      { success: false, error: { code: "NOT_FOUND", message: "Project not found" } },
      { status: 404 }
    );
  }

  const slide = await prisma.slide.findFirst({
    where: { id: slideId, presentationId },
  });

  if (!slide) {
    return Response.json(
      { success: false, error: { code: "NOT_FOUND", message: "Slide not found" } },
      { status: 404 }
    );
  }

  return ok(slide);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; presentationId: string; slideId: string }> }
) {
  const authResult = authMiddleware(request);

  if (authResult instanceof Response) {
    return authResult;
  }

  const { id: projectId, presentationId, slideId } = await params;

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: authResult.userId },
  });

  if (!project) {
    return Response.json(
      { success: false, error: { code: "NOT_FOUND", message: "Project not found" } },
      { status: 404 }
    );
  }

  try {
    const body = await request.json();
    const templateId = body.templateId !== undefined
      ? (body.templateId ? requireString(body.templateId, "templateId") : null)
      : undefined;
    const generatedSvg = body.generatedSvg !== undefined
      ? requireString(body.generatedSvg, "generatedSvg")
      : undefined;
    const contentJson = body.contentJson !== undefined
      ? requireString(body.contentJson, "contentJson")
      : undefined;
    const index = body.index !== undefined ? parseInt(body.index, 10) : undefined;

    const slide = await prisma.slide.updateMany({
      where: { id: slideId, presentationId },
      data: {
        ...(templateId !== undefined && { templateId }),
        ...(generatedSvg !== undefined && { generatedSvg }),
        ...(contentJson !== undefined && { contentJson }),
        ...(index !== undefined && { index }),
      },
    });

    if (slide.count === 0) {
      return Response.json(
        { success: false, error: { code: "NOT_FOUND", message: "Slide not found" } },
        { status: 404 }
      );
    }

    const updated = await prisma.slide.findFirst({
      where: { id: slideId },
    });

    return ok(updated);
  } catch (error) {
    const { formatError } = await import("@/lib/utils/error");
    return Response.json(formatError(error), { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; presentationId: string; slideId: string }> }
) {
  const authResult = authMiddleware(request);

  if (authResult instanceof Response) {
    return authResult;
  }

  const { id: projectId, presentationId, slideId } = await params;

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: authResult.userId },
  });

  if (!project) {
    return Response.json(
      { success: false, error: { code: "NOT_FOUND", message: "Project not found" } },
      { status: 404 }
    );
  }

  await prisma.slide.deleteMany({
    where: { id: slideId, presentationId },
  });

  return noContent();
}
