import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/lib/middleware/auth";
import { noContent, ok } from "@/lib/utils/api";
import { ValidationError, formatError } from "@/lib/utils/error";
import { deleteLayoutPattern, getLayoutPattern, updateLayoutPattern, type LayoutPatternRecord } from "@/lib/templateManagement/store";

function validateCategory(value: unknown): LayoutPatternRecord["category"] | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value !== "content" && value !== "cover" && value !== "section" && value !== "conclusion") {
    throw new ValidationError("Field 'category' must be one of: content, cover, section, conclusion");
  }
  return value;
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = authMiddleware(request);
  if (auth instanceof Response) {
    return auth;
  }

  const { id } = await context.params;
  const record = await getLayoutPattern(id);
  if (!record) {
    return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Layout pattern not found" } }, { status: 404 });
  }

  return ok(record);
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = authMiddleware(request);
  if (auth instanceof Response) {
    return auth;
  }

  try {
    const { id } = await context.params;
    const body = await request.json();

    const updated = await updateLayoutPattern(id, {
      name: typeof body?.name === "string" ? body.name.trim() : undefined,
      description: typeof body?.description === "string" ? body.description.trim() : undefined,
      category: validateCategory(body?.category),
      layoutJson: typeof body?.layoutJson === "string" ? body.layoutJson.trim() : undefined,
      imageUrl: typeof body?.imageUrl === "string" ? body.imageUrl.trim() : undefined,
    });

    if (!updated) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Layout pattern not found" } }, { status: 404 });
    }

    return ok(updated);
  } catch (error) {
    const formatted = formatError(error);
    const status = error instanceof ValidationError ? error.statusCode : 500;
    return NextResponse.json(formatted, { status });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = authMiddleware(request);
  if (auth instanceof Response) {
    return auth;
  }

  const { id } = await context.params;
  const deleted = await deleteLayoutPattern(id);
  if (!deleted) {
    return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Layout pattern not found" } }, { status: 404 });
  }

  return noContent();
}
