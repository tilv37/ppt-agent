import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authMiddleware } from "@/lib/middleware/auth";
import { requireString } from "@/lib/utils/validation";
import { ok } from "@/lib/utils/api";

export async function POST(request: NextRequest) {
  const authResult = authMiddleware(request);

  if (authResult instanceof Response) {
    return authResult;
  }

  try {
    const body = await request.json();
    const presentationId = requireString(body.presentationId, "presentationId");
    const format = body.format || "pptx";

    const presentation = await prisma.presentation.findFirst({
      where: {
        id: presentationId,
        project: { userId: authResult.userId },
      },
      include: {
        slides: {
          orderBy: { index: "asc" },
        },
      },
    });

    if (!presentation) {
      return Response.json(
        { success: false, error: { code: "NOT_FOUND", message: "Presentation not found" } },
        { status: 404 }
      );
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    const mockExportUrl = `/exports/${presentationId}-${Date.now()}.${format}`;

    return ok({
      url: mockExportUrl,
      format,
      slidesCount: presentation.slides.length,
      message: "Export completed successfully (mock)",
    });
  } catch (error) {
    const { formatError } = await import("@/lib/utils/error");
    return Response.json(formatError(error), { status: 500 });
  }
}
