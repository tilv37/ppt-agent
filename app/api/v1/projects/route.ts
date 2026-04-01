import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authMiddleware } from "@/lib/middleware/auth";
import { requireString } from "@/lib/utils/validation";
import { created, ok, paginated } from "@/lib/utils/api";
import { parseOptionalInt } from "@/lib/utils/validation";

export async function GET(request: NextRequest) {
  const authResult = authMiddleware(request);

  if (authResult instanceof Response) {
    return authResult;
  }

  const { searchParams } = new URL(request.url);
  const page = parseOptionalInt(searchParams.get("page"), 1);
  const pageSize = parseOptionalInt(searchParams.get("pageSize"), 20);

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where: { userId: authResult.userId },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        presentations: {
          select: { id: true, title: true, _count: { select: { slides: true } } },
        },
        _count: { select: { chatMessages: true, agentTraces: true } },
      },
    }),
    prisma.project.count({ where: { userId: authResult.userId } }),
  ]);

  return paginated(projects, page, pageSize, total);
}

export async function POST(request: NextRequest) {
  const authResult = authMiddleware(request);

  if (authResult instanceof Response) {
    return authResult;
  }

  try {
    const body = await request.json();
    const name = requireString(body.name, "name");
    const description = body.description ? requireString(body.description, "description") : null;

    const project = await prisma.project.create({
      data: {
        userId: authResult.userId,
        name,
        description,
      },
      include: {
        presentations: true,
      },
    });

    return created(project);
  } catch (error) {
    const { formatError } = await import("@/lib/utils/error");
    return Response.json(formatError(error), { status: 500 });
  }
}
