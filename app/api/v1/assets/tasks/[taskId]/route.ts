import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/lib/middleware/auth";
import { ok } from "@/lib/utils/api";
import { getAssetTask } from "@/lib/templateManagement/store";

export async function GET(request: NextRequest, context: { params: Promise<{ taskId: string }> }) {
  const auth = authMiddleware(request);
  if (auth instanceof Response) {
    return auth;
  }

  const { taskId } = await context.params;
  const task = await getAssetTask(taskId);

  if (!task) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "Asset task not found" } },
      { status: 404 }
    );
  }

  return ok(task);
}
