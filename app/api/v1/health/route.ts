import { ok } from "@/lib/utils/api";

export async function GET() {
  return ok({ status: "ok", timestamp: new Date().toISOString() });
}
