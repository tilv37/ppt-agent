import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authMiddleware } from "@/lib/middleware/auth";
import { requireString } from "@/lib/utils/validation";
import { ok, created } from "@/lib/utils/api";

const MOCK_RESPONSES = [
  "I've analyzed your slide and here are some suggestions for improvement.",
  "Based on your content, I recommend adjusting the layout to improve readability.",
  "Good progress! Here are a few refinements to make your slide more impactful.",
  "I've made the requested changes. The slide now has better visual hierarchy.",
  "Consider breaking this into smaller points for better audience comprehension.",
];

export async function POST(request: NextRequest) {
  const authResult = authMiddleware(request);

  if (authResult instanceof Response) {
    return authResult;
  }

  try {
    const body = await request.json();
    const projectId = requireString(body.projectId, "projectId");
    const message = requireString(body.message, "message");

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: authResult.userId },
    });

    if (!project) {
      return Response.json(
        { success: false, error: { code: "NOT_FOUND", message: "Project not found" } },
        { status: 404 }
      );
    }

    const userMessage = await prisma.chatMessage.create({
      data: {
        projectId,
        role: "user",
        content: message,
      },
    });

    const mockResponse = MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)];

    const agentMessage = await prisma.chatMessage.create({
      data: {
        projectId,
        role: "assistant",
        content: mockResponse,
      },
    });

    return created({
      userMessage,
      assistantMessage: agentMessage,
    });
  } catch (error) {
    const { formatError } = await import("@/lib/utils/error");
    return Response.json(formatError(error), { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const authResult = authMiddleware(request);

  if (authResult instanceof Response) {
    return authResult;
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return Response.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "projectId is required" } },
      { status: 400 }
    );
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: authResult.userId },
  });

  if (!project) {
    return Response.json(
      { success: false, error: { code: "NOT_FOUND", message: "Project not found" } },
      { status: 404 }
    );
  }

  const messages = await prisma.chatMessage.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  return ok(messages);
}
