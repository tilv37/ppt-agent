import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authMiddleware } from "@/lib/middleware/auth";
import { requireString } from "@/lib/utils/validation";
import { created, ok, noContent } from "@/lib/utils/api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; presentationId: string }> }
) {
  const authResult = authMiddleware(request);

  if (authResult instanceof Response) {
    return authResult;
  }

  const { id: projectId, presentationId } = await params;

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: authResult.userId },
  });

  if (!project) {
    return Response.json(
      { success: false, error: { code: "NOT_FOUND", message: "Project not found" } },
      { status: 404 }
    );
  }

  const presentation = await prisma.presentation.findFirst({
    where: { id: presentationId, projectId },
  });

  if (!presentation) {
    return Response.json(
      { success: false, error: { code: "NOT_FOUND", message: "Presentation not found" } },
      { status: 404 }
    );
  }

  const slides = await prisma.slide.findMany({
    where: { presentationId },
    orderBy: { index: "asc" },
  });

  return ok(slides);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; presentationId: string }> }
) {
  const authResult = authMiddleware(request);

  if (authResult instanceof Response) {
    return authResult;
  }

  const { id: projectId, presentationId } = await params;

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
    const templateId = body.templateId ? requireString(body.templateId, "templateId") : null;

    const lastSlide = await prisma.slide.findFirst({
      where: { presentationId },
      orderBy: { index: "desc" },
    });

    const newIndex = lastSlide ? lastSlide.index + 1 : 0;

    const slide = await prisma.slide.create({
      data: {
        presentationId,
        index: newIndex,
        templateId,
      },
    });

    return created(slide);
  } catch (error) {
    const { formatError } = await import("@/lib/utils/error");
    return Response.json(formatError(error), { status: 500 });
  }
}
