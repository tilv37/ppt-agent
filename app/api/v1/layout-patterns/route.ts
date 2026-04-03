import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/lib/middleware/auth";
import { created, ok } from "@/lib/utils/api";
import { ValidationError, formatError } from "@/lib/utils/error";
import { createLayoutPattern, listLayoutPatterns, type LayoutPatternRecord } from "@/lib/templateManagement/store";

function validateCategory(value: unknown): LayoutPatternRecord["category"] {
  if (value !== "content" && value !== "cover" && value !== "section" && value !== "conclusion") {
    throw new ValidationError("Field 'category' must be one of: content, cover, section, conclusion");
  }
  return value;
}

export async function GET(request: NextRequest) {
  const auth = authMiddleware(request);
  if (auth instanceof Response) {
    return auth;
  }

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || undefined;
    const patterns = await listLayoutPatterns(category);
    return ok(patterns);
  } catch (error) {
    const formatted = formatError(error);
    const status = error instanceof ValidationError ? error.statusCode : 500;
    return NextResponse.json(formatted, { status });
  }
}

export async function POST(request: NextRequest) {
  const auth = authMiddleware(request);
  if (auth instanceof Response) {
    return auth;
  }

  try {
    const body = await request.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const description = typeof body?.description === "string" ? body.description.trim() : "";
    const layoutJson = typeof body?.layoutJson === "string" ? body.layoutJson.trim() : "";
    const imageUrl = typeof body?.imageUrl === "string" && body.imageUrl.trim() ? body.imageUrl.trim() : undefined;
    const category = validateCategory(body?.category);

    if (!name) {
      throw new ValidationError("Field 'name' is required");
    }
    if (!description) {
      throw new ValidationError("Field 'description' is required");
    }
    if (!layoutJson) {
      throw new ValidationError("Field 'layoutJson' is required");
    }

    const record = await createLayoutPattern({
      name,
      description,
      category,
      layoutJson,
      imageUrl,
      createdBy: auth.userId,
    });

    return created(record);
  } catch (error) {
    const formatted = formatError(error);
    const status = error instanceof ValidationError ? error.statusCode : 500;
    return NextResponse.json(formatted, { status });
  }
}
