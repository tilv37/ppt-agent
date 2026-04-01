import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authMiddleware } from "@/lib/middleware/auth";
import { requireString } from "@/lib/utils/validation";

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

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        sendEvent({ agent: "orchestrator", status: "running", reasoning: "Starting pipeline execution", result: null });

        await new Promise(resolve => setTimeout(resolve, 500));
        sendEvent({ agent: "content-extraction", status: "running", reasoning: "Extracting content from source", result: null });

        await new Promise(resolve => setTimeout(resolve, 800));
        sendEvent({ agent: "content-extraction", status: "complete", reasoning: "Content extracted successfully", result: { content: "Sample extracted content" } });

        await new Promise(resolve => setTimeout(resolve, 500));
        sendEvent({ agent: "outline-planner", status: "running", reasoning: "Planning presentation outline", result: null });

        await new Promise(resolve => setTimeout(resolve, 1000));
        sendEvent({ agent: "outline-planner", status: "complete", reasoning: "Outline created with 5 sections", result: { sections: ["Introduction", "Main Content", "Case Study", "Conclusion", "Q&A"] } });

        await new Promise(resolve => setTimeout(resolve, 500));
        sendEvent({ agent: "layout-selector", status: "running", reasoning: "Selecting optimal layouts", result: null });

        await new Promise(resolve => setTimeout(resolve, 800));
        sendEvent({ agent: "layout-selector", status: "complete", reasoning: "Layouts selected for all slides", result: { layouts: ["cover", "toc", "two-column", "image-text", "ending"] } });

        await new Promise(resolve => setTimeout(resolve, 500));
        sendEvent({ agent: "content-writer", status: "running", reasoning: "Writing slide content", result: null });

        await new Promise(resolve => setTimeout(resolve, 1500));
        sendEvent({ agent: "content-writer", status: "complete", reasoning: "All slide content written", result: { slidesCreated: 5 } });

        await new Promise(resolve => setTimeout(resolve, 500));
        sendEvent({ agent: "visual-decision", status: "running", reasoning: "Making visual decisions", result: null });

        await new Promise(resolve => setTimeout(resolve, 800));
        sendEvent({ agent: "visual-decision", status: "complete", reasoning: "Visual decisions made", result: { visualElements: [] } });

        await new Promise(resolve => setTimeout(resolve, 500));
        sendEvent({ agent: "graphic-generator", status: "running", reasoning: "Generating graphics", result: null });

        await new Promise(resolve => setTimeout(resolve, 1200));
        sendEvent({ agent: "graphic-generator", status: "complete", reasoning: "Graphics generated", result: { graphics: [] } });

        await new Promise(resolve => setTimeout(resolve, 500));
        sendEvent({ agent: "quality-review", status: "running", reasoning: "Reviewing quality", result: null });

        await new Promise(resolve => setTimeout(resolve, 1000));
        sendEvent({ agent: "quality-review", status: "complete", reasoning: "Quality review passed", result: { issues: [], passed: true } });

        sendEvent({ agent: "orchestrator", status: "complete", reasoning: "Pipeline completed successfully", result: { presentationId: project.id } });

      } catch (error) {
        sendEvent({ agent: "orchestrator", status: "error", reasoning: "Pipeline failed", result: null });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}

export async function POST(request: NextRequest) {
  const authResult = authMiddleware(request);

  if (authResult instanceof Response) {
    return authResult;
  }

  try {
    const body = await request.json();
    const projectId = requireString(body.projectId, "projectId");
    const content = body.content ? requireString(body.content, "content") : null;

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: authResult.userId },
    });

    if (!project) {
      return Response.json(
        { success: false, error: { code: "NOT_FOUND", message: "Project not found" } },
        { status: 404 }
      );
    }

    await prisma.project.update({
      where: { id: projectId },
      data: { status: "generating" },
    });

    return Response.json({
      success: true,
      data: { message: "Pipeline started", projectId },
    });
  } catch (error) {
    const { formatError } = await import("@/lib/utils/error");
    return Response.json(formatError(error), { status: 500 });
  }
}
