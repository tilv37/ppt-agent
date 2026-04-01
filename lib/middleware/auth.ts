import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";

export interface AuthContext {
  userId: string;
  sessionId: string;
}

export function authMiddleware(
  request: NextRequest
): AuthContext | Response {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Missing or invalid authorization header" } },
      { status: 401 }
    );
  }

  const token = authHeader.slice(7);
  const payload = verifyToken(token);

  if (!payload) {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_TOKEN", message: "Invalid or expired token" } },
      { status: 401 }
    );
  }

  return { userId: payload.userId, sessionId: payload.sessionId };
}

export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.slice(7);
}
