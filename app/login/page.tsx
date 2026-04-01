"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Input, Card, CardContent } from "@/components/ui";
import { useLogin } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/authStore";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const login = useLogin();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (isAuthenticated()) {
    router.push("/");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await login.mutateAsync({ email, password });
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
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
            <p className="text-on-surface-variant">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded bg-error/10 text-error text-sm">
                {error}
              </div>
            )}

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
              placeholder="Enter your password"
              required
            />

            <Button
              type="submit"
              className="w-full"
              loading={login.isPending}
            >
              Sign In
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-on-surface-variant">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-primary hover:underline">
              Create one
            </Link>
          </p>

          <div className="mt-6 p-4 rounded bg-surface-container-low text-sm">
            <p className="text-on-surface-variant mb-2">Demo credentials:</p>
            <p className="text-on-surface">Email: demo@cognitivecanvas.ai</p>
            <p className="text-on-surface">Password: demo123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
