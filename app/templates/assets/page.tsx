"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ProductFooter, ProductTopBar } from "@/components/layout/ProductChrome";
import { Button, Card, Spinner } from "@/components/ui";
import { api } from "@/lib/api/client";
import { useAuthStore } from "@/store/authStore";

interface Asset {
  id: string;
  type: "icon" | "illustration" | "chart" | "decoration";
  category: string;
  tags: string[];
  keywords: string[];
  description?: string;
  filePath: string;
  fileFormat: "svg" | "png" | "jpg";
  fileSize: number;
  width: number;
  height: number;
  aspectRatio: string;
  sourcePage?: number;
  sourceFile?: string;
  createdAt: string;
  updatedAt: string;
}

interface UploadTaskResponse {
  taskId: string;
  status: "queued" | "processing" | "completed" | "failed";
  fileName: string;
  message: string;
}

interface AssetTask {
  id: string;
  status: "queued" | "processing" | "completed" | "failed";
  fileName: string;
  progress: number;
  createdAt: string;
  updatedAt: string;
}

export default function AssetsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);

  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<Asset["type"] | "all">("all");
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ["assets", search, selectedType],
    queryFn: () => {
      const params: Record<string, string> = {};
      if (search.trim()) {
        params.q = search.trim();
      }
      if (selectedType !== "all") {
        params.type = selectedType;
      }
      return api.get<Asset[]>("/assets", params);
    },
    enabled: isAuthenticated(),
  });

  const { data: task } = useQuery({
    queryKey: ["asset-task", currentTaskId],
    queryFn: () => api.get<AssetTask>(`/assets/tasks/${currentTaskId}`),
    enabled: Boolean(currentTaskId),
    refetchInterval: 1500,
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/v1/assets/upload-ppt", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      });

      const json = (await response.json()) as { success: boolean; data?: UploadTaskResponse; error?: { message?: string } };
      if (!response.ok || !json.success || !json.data) {
        throw new Error(json.error?.message || "Failed to upload PPT");
      }
      return json.data;
    },
    onSuccess: async (data) => {
      setCurrentTaskId(data.taskId);
      await queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/assets/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
  });

  const sortedAssets = useMemo(() => {
    return [...assets].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [assets]);

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
        actionLabel="Layout Patterns"
        actionIcon="dashboard_customize"
        actionHref="/templates/layout-patterns"
      />

      <main className="min-h-[calc(100vh-80px)] bg-surface px-6 py-8 lg:px-8">
        <div className="mx-auto max-w-7xl grid grid-cols-1 gap-6 xl:grid-cols-3">
          <section className="xl:col-span-2">
            <Card variant="elevated" className="rounded-[28px] bg-white/85 p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-extrabold text-on-surface">Asset Library Management</h1>
                  <p className="mt-2 text-sm text-slate-600">Search and maintain assets used by `AssetMatcherAgent`.</p>
                </div>
                <Button variant="secondary" onClick={() => router.push("/templates")}>Back</Button>
              </div>

              <div className="mt-6 flex flex-col gap-3 md:flex-row">
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-3 py-2 text-sm outline-none focus:border-primary"
                  placeholder="Search by tag, keyword, category"
                />
                <select
                  value={selectedType}
                  onChange={(event) => setSelectedType(event.target.value as Asset["type"] | "all")}
                  className="rounded-xl border border-outline-variant/20 bg-surface-container-low px-3 py-2 text-sm outline-none focus:border-primary"
                >
                  <option value="all">All Types</option>
                  <option value="icon">Icon</option>
                  <option value="illustration">Illustration</option>
                  <option value="chart">Chart</option>
                  <option value="decoration">Decoration</option>
                </select>
              </div>

              <div className="mt-6 space-y-3">
                {isLoading ? (
                  <div className="flex min-h-[220px] items-center justify-center rounded-2xl bg-surface-container-low">
                    <Spinner size="lg" />
                  </div>
                ) : sortedAssets.length === 0 ? (
                  <div className="rounded-2xl bg-surface-container-low p-6 text-sm text-slate-500">No assets available. Upload a PPT to begin extraction.</div>
                ) : (
                  sortedAssets.map((asset) => (
                    <div key={asset.id} className="rounded-2xl border border-outline-variant/10 bg-white p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-bold text-on-surface">{asset.sourceFile || "Asset"}</p>
                          <p className="mt-1 text-xs text-slate-500">{asset.category} · {asset.type} · {asset.aspectRatio}</p>
                          <p className="mt-1 text-[11px] text-slate-400">Tags: {asset.tags.join(", ") || "-"}</p>
                          <p className="text-[11px] text-slate-400">Keywords: {asset.keywords.join(", ") || "-"}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => deleteMutation.mutate(asset.id)}
                          loading={deleteMutation.isPending}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </section>

          <aside>
            <Card variant="elevated" className="rounded-[28px] bg-white/85 p-6">
              <h2 className="text-xl font-bold text-on-surface">Upload PPT</h2>
              <p className="mt-2 text-sm text-slate-600">Create an extraction task from a PPT source file.</p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pptx"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    uploadMutation.mutate(file);
                  }
                }}
              />

              <div className="mt-6">
                <Button className="w-full" onClick={() => fileInputRef.current?.click()} loading={uploadMutation.isPending}>
                  Upload .pptx File
                </Button>
              </div>

              <div className="mt-6 rounded-2xl bg-surface-container-low p-4">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Latest Task</p>
                {task ? (
                  <>
                    <p className="mt-2 text-sm font-semibold text-on-surface">{task.fileName}</p>
                    <p className="mt-1 text-xs text-slate-500">Status: {task.status}</p>
                    <div className="mt-3 h-2 rounded-full bg-surface-container-high">
                      <div className="h-2 rounded-full bg-primary" style={{ width: `${task.progress}%` }} />
                    </div>
                  </>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">No running task.</p>
                )}
              </div>
            </Card>
          </aside>
        </div>
      </main>

      <ProductFooter />
    </div>
  );
}
