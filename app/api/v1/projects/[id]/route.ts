import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authMiddleware } from "@/lib/middleware/auth";
import { requireString } from "@/lib/utils/validation";
import { ok, noContent } from "@/lib/utils/api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = authMiddleware(request);

  if (authResult instanceof Response) {
    return authResult;
  }

  const { id } = await params;

  const project = await prisma.project.findFirst({
    where: { id, userId: authResult.userId },
    include: {
      presentations: {
        include: {
          slides: {
            orderBy: { index: "asc" },
          },
        },
      },
      chatMessages: {
        orderBy: { createdAt: "asc" },
        take: 50,
      },
    },
  });

  if (!project) {
    return Response.json(
      { success: false, error: { code: "NOT_FOUND", message: "Project not found" } },
      { status: 404 }
    );
  }

  return ok(project);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = authMiddleware(request);

  if (authResult instanceof Response) {
    return authResult;
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const name = body.name ? requireString(body.name, "name") : undefined;
    const description = body.description !== undefined
      ? (body.description ? requireString(body.description, "description") : null)
      : undefined;
    const status = body.status ? requireString(body.status, "status") : undefined;

    const project = await prisma.project.updateMany({
      where: { id, userId: authResult.userId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
      },
    });

    if (project.count === 0) {
      return Response.json(
        { success: false, error: { code: "NOT_FOUND", message: "Project not found" } },
        { status: 404 }
      );
    }

    const updated = await prisma.project.findFirst({
      where: { id, userId: authResult.userId },
    });

    return ok(updated);
  } catch (error) {
    const { formatError } = await import("@/lib/utils/error");
    return Response.json(formatError(error), { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = authMiddleware(request);

  if (authResult instanceof Response) {
    return authResult;
  }

  const { id } = await params;

  const project = await prisma.project.deleteMany({
    where: { id, userId: authResult.userId },
  });

  if (project.count === 0) {
    return Response.json(
      { success: false, error: { code: "NOT_FOUND", message: "Project not found" } },
      { status: 404 }
    );
  }

  return noContent();
}
