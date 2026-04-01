import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSession } from "@/lib/auth/jwt";
import { requireEmail, requireString, requireField } from "@/lib/utils/validation";
import { ValidationError, ConflictError } from "@/lib/utils/error";
import { created, apiResponse } from "@/lib/utils/api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const email = requireEmail(body.email, "email");
    const password = requireString(body.password, "password");
    const name = requireField(body.name, "name");

    if (password.length < 6) {
      throw new ValidationError("Password must be at least 6 characters");
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictError("User with this email already exists");
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
      },
    });

    const token = await createSession(user.id);

    return created({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    });
  } catch (error) {
    const { formatError } = await import("@/lib/utils/error");
    return Response.json(formatError(error), { status: error instanceof Error && error.name === "ValidationError" ? 400 : 500 });
  }
}
