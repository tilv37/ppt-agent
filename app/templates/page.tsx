"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProductFooter, ProductTopBar } from "@/components/layout/ProductChrome";
import { Button, Card, Spinner } from "@/components/ui";
import { useAuthStore } from "@/store/authStore";

export default function TemplatesPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated()) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <ProductTopBar
        activeNav="templates"
        userLabel={user?.name || user?.email}
        actionLabel="Manage Layout Patterns"
        actionIcon="dashboard_customize"
        actionHref="/templates/layout-patterns"
      />

      <main className="min-h-[calc(100vh-80px)] bg-surface px-6 py-8 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-8">
          <header>
            <h1 className="text-4xl font-extrabold text-on-surface">Template Management</h1>
            <p className="mt-2 text-base text-slate-600">Manage layout patterns and asset library for the generation pipeline.</p>
          </header>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card variant="elevated" className="rounded-[28px] bg-white/85 p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Module 01</p>
                  <h2 className="mt-2 text-2xl font-bold text-on-surface">Layout Pattern Management</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    Upload layout screenshots, capture pattern metadata, and maintain reusable structured layout definitions.
                  </p>
                </div>
                <span className="material-symbols-outlined text-3xl text-primary">dashboard_customize</span>
              </div>

              <div className="mt-8">
                <Button onClick={() => router.push("/templates/layout-patterns")}>Open Layout Patterns</Button>
              </div>
            </Card>

            <Card variant="elevated" className="rounded-[28px] bg-white/85 p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Module 02</p>
                  <h2 className="mt-2 text-2xl font-bold text-on-surface">Asset Library Management</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    Upload PPT source files, track extraction tasks, and curate searchable assets for visual matching.
                  </p>
                </div>
                <span className="material-symbols-outlined text-3xl text-tertiary">photo_library</span>
              </div>

              <div className="mt-8">
                <Button onClick={() => router.push("/templates/assets")}>Open Asset Library</Button>
              </div>
            </Card>
          </div>

          <Card className="rounded-2xl bg-white/70 p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Notes</p>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              This page now focuses on management workflows. Legacy template preview cards and schema inspector were removed to match the updated product design.
            </p>
          </Card>
        </div>
      </main>

      <ProductFooter />
    </div>
  );
}