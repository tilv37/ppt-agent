import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import type { User } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-key-change-in-production-32chars";
const JWT_EXPIRES_IN = "7d";

export interface JWTPayload {
  userId: string;
  sessionId: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export async function createSession(userId: string): Promise<string> {
  const token = generateToken({ userId, sessionId: "temp" });
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });

  return token;
}

export async function validateSession(token: string): Promise<User | null> {
  const payload = verifyToken(token);
  if (!payload) return null;

  const session = await prisma.session.findUnique({
    where: { token },
  });

  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });

  return user;
}

export async function invalidateSession(token: string): Promise<void> {
  await prisma.session.delete({
    where: { token },
  }).catch(() => {});
}
