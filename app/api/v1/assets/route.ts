import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/lib/middleware/auth";
import { ok } from "@/lib/utils/api";
import { ValidationError, formatError } from "@/lib/utils/error";
import { listAssets } from "@/lib/templateManagement/store";

export async function GET(request: NextRequest) {
  const auth = authMiddleware(request);
  if (auth instanceof Response) {
    return auth;
  }

  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || undefined;
    const type = searchParams.get("type") || undefined;
    const category = searchParams.get("category") || undefined;

    if (type && !["icon", "illustration", "chart", "decoration"].includes(type)) {
      throw new ValidationError("Field 'type' must be one of: icon, illustration, chart, decoration");
    }

    const assets = await listAssets({ q, type, category });
    return ok(assets);
  } catch (error) {
    const formatted = formatError(error);
    const status = error instanceof ValidationError ? error.statusCode : 500;
    return NextResponse.json(formatted, { status });
  }
}
