import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authMiddleware } from "@/lib/middleware/auth";
import { ok } from "@/lib/utils/api";

export async function GET(request: NextRequest) {
  const authResult = authMiddleware(request);

  if (authResult instanceof Response) {
    return authResult;
  }

  const user = await prisma.user.findUnique({
    where: { id: authResult.userId },
    select: { id: true, email: true, name: true, createdAt: true },
  });

  if (!user) {
    return Response.json(
      { success: false, error: { code: "NOT_FOUND", message: "User not found" } },
      { status: 404 }
    );
  }

  return ok(user);
}
