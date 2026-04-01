import { NextRequest } from "next/server";
import { authMiddleware } from "@/lib/middleware/auth";
import { invalidateSession } from "@/lib/auth/jwt";
import { noContent } from "@/lib/utils/api";

export async function POST(request: NextRequest) {
  const authResult = authMiddleware(request);

  if (authResult instanceof Response) {
    return authResult;
  }

  const token = request.headers.get("authorization")?.slice(7);

  if (token) {
    await invalidateSession(token);
  }

  return noContent();
}
