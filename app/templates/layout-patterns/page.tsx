"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ProductFooter, ProductTopBar } from "@/components/layout/ProductChrome";
import { Button, Card, Spinner } from "@/components/ui";
import { api } from "@/lib/api/client";
import { useAuthStore } from "@/store/authStore";

interface LayoutPattern {
  id: string;
  name: string;
  description: string;
  category: "content" | "cover" | "section" | "conclusion";
  layoutJson: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES: Array<LayoutPattern["category"]> = ["content", "cover", "section", "conclusion"];

export default function LayoutPatternsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  const [category, setCategory] = useState<LayoutPattern["category"]>("content");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [layoutJson, setLayoutJson] = useState('{"layout": {"type": "grid", "params": {"minColumns": 2, "maxColumns": 4, "gap": 24}}}');

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  const { data: patterns = [], isLoading } = useQuery({
    queryKey: ["layout-patterns", category],
    queryFn: () => api.get<LayoutPattern[]>("/layout-patterns", { category }),
    enabled: isAuthenticated(),
  });

  const createPattern = useMutation({
    mutationFn: async () => {
      return api.post<LayoutPattern>("/layout-patterns", {
        name,
        description,
        category,
        layoutJson,
      });
    },
    onSuccess: async () => {
      setName("");
      setDescription("");
      await queryClient.invalidateQueries({ queryKey: ["layout-patterns"] });
    },
  });

  const deletePattern = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/layout-patterns/${id}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["layout-patterns"] });
    },
  });

  const sorted = useMemo(() => {
    return [...patterns].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [patterns]);

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
        actionLabel="Asset Library"
        actionIcon="photo_library"
        actionHref="/templates/assets"
      />

      <main className="min-h-[calc(100vh-80px)] bg-surface px-6 py-8 lg:px-8">
        <div className="mx-auto max-w-7xl grid grid-cols-1 gap-6 xl:grid-cols-3">
          <section className="xl:col-span-2">
            <Card variant="elevated" className="rounded-[28px] bg-white/85 p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-extrabold text-on-surface">Layout Pattern Management</h1>
                  <p className="mt-2 text-sm text-slate-600">Manage structured layout patterns used by `LayoutSelectorAgent`.</p>
                </div>
                <Button variant="secondary" onClick={() => router.push("/templates")}>Back</Button>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {CATEGORIES.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setCategory(item)}
                    className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider ${category === item ? "bg-primary text-white" : "bg-surface-container-high text-slate-600"}`}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div className="mt-6 space-y-3">
                {isLoading ? (
                  <div className="flex min-h-[220px] items-center justify-center rounded-2xl bg-surface-container-low">
                    <Spinner size="lg" />
                  </div>
                ) : sorted.length === 0 ? (
                  <div className="rounded-2xl bg-surface-container-low p-6 text-sm text-slate-500">No layout patterns found for this category.</div>
                ) : (
                  sorted.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-outline-variant/10 bg-white p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-bold text-on-surface">{item.name}</p>
                          <p className="mt-1 text-xs text-slate-500">{item.description}</p>
                          <p className="mt-2 text-[11px] text-slate-400">Updated: {new Date(item.updatedAt).toLocaleString()}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => deletePattern.mutate(item.id)}
                          loading={deletePattern.isPending}
                        >
                          Delete
                        </Button>
                      </div>
                      <pre className="mt-3 max-h-40 overflow-auto rounded-xl bg-surface-container-low p-3 text-[11px] leading-5 text-slate-600 whitespace-pre-wrap break-all">
                        {item.layoutJson}
                      </pre>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </section>

          <aside>
            <Card variant="elevated" className="rounded-[28px] bg-white/85 p-6">
              <h2 className="text-xl font-bold text-on-surface">Create Pattern</h2>
              <p className="mt-2 text-sm text-slate-600">Upload parsing can be wired later. This form creates structured records via API.</p>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Name</label>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-3 py-2 text-sm outline-none focus:border-primary"
                    placeholder="e.g. multi-column-icon-text"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Description</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-3 py-2 text-sm outline-none focus:border-primary resize-none"
                    placeholder="Pattern usage and structure"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Layout JSON</label>
                  <textarea
                    rows={8}
                    value={layoutJson}
                    onChange={(event) => setLayoutJson(event.target.value)}
                    className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-3 py-2 text-xs font-mono outline-none focus:border-primary resize-none"
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={() => createPattern.mutate()}
                  loading={createPattern.isPending}
                  disabled={!name.trim() || !description.trim() || !layoutJson.trim()}
                >
                  Save Layout Pattern
                </Button>
              </div>
            </Card>
          </aside>
        </div>
      </main>

      <ProductFooter />
    </div>
  );
}
