import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/lib/middleware/auth";
import { noContent, ok } from "@/lib/utils/api";
import { ValidationError, formatError } from "@/lib/utils/error";
import { deleteAsset, getAsset, updateAsset } from "@/lib/templateManagement/store";

function normalizeAssetType(input: unknown): "icon" | "illustration" | "chart" | "decoration" | undefined {
  if (input === undefined) {
    return undefined;
  }
  if (input === "icon" || input === "illustration" || input === "chart" || input === "decoration") {
    return input;
  }
  throw new ValidationError("Field 'type' must be one of: icon, illustration, chart, decoration");
}

function normalizeStringArray(input: unknown): string[] | undefined {
  if (input === undefined) {
    return undefined;
  }
  if (!Array.isArray(input)) {
    throw new ValidationError("Expected an array of strings");
  }
  return input.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean);
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = authMiddleware(request);
  if (auth instanceof Response) {
    return auth;
  }

  const { id } = await context.params;
  const asset = await getAsset(id);
  if (!asset) {
    return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Asset not found" } }, { status: 404 });
  }

  return ok(asset);
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = authMiddleware(request);
  if (auth instanceof Response) {
    return auth;
  }

  try {
    const { id } = await context.params;
    const body = await request.json();

    const updated = await updateAsset(id, {
      type: normalizeAssetType(body?.type),
      category: typeof body?.category === "string" ? body.category.trim() : undefined,
      tags: normalizeStringArray(body?.tags),
      keywords: normalizeStringArray(body?.keywords),
      description: typeof body?.description === "string" ? body.description.trim() : undefined,
    });

    if (!updated) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Asset not found" } }, { status: 404 });
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
  const deleted = await deleteAsset(id);

  if (!deleted) {
    return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Asset not found" } }, { status: 404 });
  }

  return noContent();
}
