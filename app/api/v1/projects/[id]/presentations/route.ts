import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authMiddleware } from "@/lib/middleware/auth";
import { requireString } from "@/lib/utils/validation";
import { created, ok } from "@/lib/utils/api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = authMiddleware(request);

  if (authResult instanceof Response) {
    return authResult;
  }

  const { id: projectId } = await params;

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: authResult.userId },
  });

  if (!project) {
    return Response.json(
      { success: false, error: { code: "NOT_FOUND", message: "Project not found" } },
      { status: 404 }
    );
  }

  const presentations = await prisma.presentation.findMany({
    where: { projectId },
    include: {
      slides: {
        orderBy: { index: "asc" },
      },
    },
  });

  return ok(presentations);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = authMiddleware(request);

  if (authResult instanceof Response) {
    return authResult;
  }

  const { id: projectId } = await params;

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
    const title = body.title ? requireString(body.title, "title") : "Untitled Presentation";

    const presentation = await prisma.presentation.create({
      data: {
        projectId,
        title,
      },
    });

    return created(presentation);
  } catch (error) {
    const { formatError } = await import("@/lib/utils/error");
    return Response.json(formatError(error), { status: 500 });
  }
}
