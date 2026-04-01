import { ValidationError } from "./error";

export function requireBody<T extends object>(body: unknown): asserts body is T {
  if (!body || typeof body !== "object") {
    throw new ValidationError("Request body is required");
  }
}

export function requireField<T>(value: T | null | undefined, fieldName: string): T {
  if (value === null || value === undefined) {
    throw new ValidationError(`Field '${fieldName}' is required`);
  }
  return value;
}

export function requireString(value: unknown, fieldName: string): string {
  if (typeof value !== "string") {
    throw new ValidationError(`Field '${fieldName}' must be a string`);
  }
  if (value.trim().length === 0) {
    throw new ValidationError(`Field '${fieldName}' cannot be empty`);
  }
  return value.trim();
}

export function requireEmail(value: unknown, fieldName: string): string {
  const str = requireString(value, fieldName);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(str)) {
    throw new ValidationError(`Field '${fieldName}' must be a valid email address`);
  }
  return str.toLowerCase();
}

export function requireNumber(value: unknown, fieldName: string): number {
  if (typeof value !== "number" || isNaN(value)) {
    throw new ValidationError(`Field '${fieldName}' must be a number`);
  }
  return value;
}

export function requireInteger(value: unknown, fieldName: string): number {
  const num = requireNumber(value, fieldName);
  if (!Number.isInteger(num)) {
    throw new ValidationError(`Field '${fieldName}' must be an integer`);
  }
  return num;
}

export function requirePositive(value: unknown, fieldName: string): number {
  const num = requireNumber(value, fieldName);
  if (num < 0) {
    throw new ValidationError(`Field '${fieldName}' must be a positive number`);
  }
  return num;
}

export function parseOptionalInt(value: unknown, defaultValue: number): number {
  if (value === undefined || value === null) return defaultValue;
  const parsed = parseInt(String(value), 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

export function parseOptionalString(value: unknown, defaultValue: string): string {
  if (value === undefined || value === null) return defaultValue;
  return String(value);
}
