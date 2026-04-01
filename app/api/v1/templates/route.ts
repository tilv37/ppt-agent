import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authMiddleware } from "@/lib/middleware/auth";
import { ok } from "@/lib/utils/api";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");

  const templates = await prisma.template.findMany({
    where: category ? { category } : undefined,
    orderBy: { name: "asc" },
  });

  return ok(templates);
}
