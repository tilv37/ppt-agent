import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSession } from "@/lib/auth/jwt";
import { requireEmail, requireString } from "@/lib/utils/validation";
import { UnauthorizedError } from "@/lib/utils/error";
import { ok } from "@/lib/utils/api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const email = requireEmail(body.email, "email");
    const password = requireString(body.password, "password");

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const isValid = await verifyPassword(password, user.password);

    if (!isValid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const token = await createSession(user.id);

    return ok({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    });
  } catch (error) {
    const { formatError } = await import("@/lib/utils/error");
    const status = error instanceof UnauthorizedError ? 401 : 500;
    return Response.json(formatError(error), { status });
  }
}
