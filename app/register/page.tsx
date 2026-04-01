"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Input, Card, CardContent } from "@/components/ui";
import { useRegister } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/authStore";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const register = useRegister();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (isAuthenticated()) {
    router.push("/");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      await register.mutateAsync({ email, password, name });
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <Card variant="elevated" className="w-full max-w-md">
        <CardContent>
          <div className="text-center mb-8">
            <h1 className="text-2xl font-headline font-bold text-gradient mb-2">
              CognitiveCanvas
            </h1>
            <p className="text-on-surface-variant">Create your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded bg-error/10 text-error text-sm">
                {error}
              </div>
            )}

            <Input
              label="Name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
            />

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
            />

            <Input
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              required
            />

            <Button
              type="submit"
              className="w-full"
              loading={register.isPending}
            >
              Create Account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-on-surface-variant">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
