"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ProductFooter, ProductTopBar } from "@/components/layout/ProductChrome";
import { Button, Spinner } from "@/components/ui";
import { api } from "@/lib/api/client";
import { useAuthStore } from "@/store/authStore";

interface TemplateItem {
  id: string;
  name: string;
  category: string;
  svgContent: string;
  schemaJson: string;
  createdAt: string;
  updatedAt: string;
}

const CATEGORY_CONFIG = [
  { id: "all", label: "All Templates", icon: "dashboard" },
  { id: "cover", label: "Cover", icon: "front_loader" },
  { id: "toc", label: "Agenda", icon: "format_list_bulleted" },
  { id: "section-header", label: "Chapter", icon: "auto_stories" },
  { id: "text", label: "Text", icon: "article" },
  { id: "two-column", label: "Flow & Logic", icon: "account_tree" },
  { id: "image-text", label: "Image + Text", icon: "gallery_thumbnail" },
  { id: "ending", label: "Ending", icon: "celebration" },
];

function prettifyName(name: string) {
  return name
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getSlots(schemaJson: string) {
  try {
    const parsed = JSON.parse(schemaJson) as { properties?: Record<string, { title?: string; type?: string }> };
    return Object.entries(parsed.properties || {}).map(([key, value]) => ({
      key,
      label: value.title || prettifyName(key),
      type: value.type || "string",
    }));
  } catch {
    return [];
  }
}

export default function TemplatesPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["templates"],
    queryFn: () => api.get<TemplateItem[]>("/templates"),
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (!selectedTemplateId && templates.length > 0) {
      setSelectedTemplateId(templates[0].id);
    }
  }, [selectedTemplateId, templates]);

  if (!isAuthenticated()) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const filteredTemplates = activeCategory === "all"
    ? templates
    : templates.filter((template) => template.category === activeCategory);

  const selectedTemplate = filteredTemplates.find((template) => template.id === selectedTemplateId)
    || templates.find((template) => template.id === selectedTemplateId)
    || filteredTemplates[0]
    || templates[0]
    || null;

  const slots = selectedTemplate ? getSlots(selectedTemplate.schemaJson) : [];

  return (
    <div className="min-h-screen">
      <ProductTopBar
        activeNav="templates"
        userLabel={user?.name || user?.email}
        actionLabel="Import Screenshot"
        actionIcon="add_photo_alternate"
        onAction={() => undefined}
        searchSlot={
          <label className="flex min-w-[240px] items-center gap-3 rounded-full border border-white/70 bg-surface-container-low px-4 py-2 shadow-sm">
            <span className="material-symbols-outlined text-[18px] text-slate-400">search</span>
            <input placeholder="Search templates..." className="w-full border-none bg-transparent p-0 text-sm outline-none placeholder:text-slate-400" />
          </label>
        }
      />

      <main className="flex min-h-[calc(100vh-146px)] overflow-hidden">
        <aside className="hidden w-72 shrink-0 border-r border-outline-variant/15 bg-surface-container-low/70 p-6 lg:flex lg:flex-col">
          <div>
            <h3 className="mb-4 px-2 text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">Slide Categories</h3>
            <div className="space-y-1">
              {CATEGORY_CONFIG.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setActiveCategory(category.id)}
                  className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors ${activeCategory === category.id ? "bg-blue-50 text-primary" : "text-slate-500 hover:bg-white/60 hover:text-slate-900"}`}
                >
                  <span className="material-symbols-outlined text-[18px]">{category.icon}</span>
                  <span className="text-sm font-medium">{category.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-auto rounded-[24px] border border-tertiary/10 bg-tertiary/5 p-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-tertiary">AI Engine Active</p>
            <p className="text-[11px] leading-6 text-slate-500">The system can learn from screenshot imports later. For now, this page renders live template metadata from Prisma.</p>
          </div>
        </aside>

        <section className="workspace-scrollbar flex-1 overflow-y-auto px-6 py-8 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="font-headline text-4xl font-extrabold tracking-tight text-slate-900">Template Library</h1>
                <p className="mt-2 text-sm text-slate-500">{filteredTemplates.length} architectural skeletons available in the current workspace.</p>
              </div>
              <div className="inline-flex rounded-full bg-surface-container-high p-1 text-xs font-bold">
                <span className="rounded-full bg-white px-4 py-2 text-primary shadow-sm">Grid</span>
                <span className="px-4 py-2 text-slate-400">List</span>
              </div>
            </header>

            {isLoading ? (
              <div className="flex min-h-[320px] items-center justify-center rounded-[32px] bg-white/78 shadow-sm ring-1 ring-white/70">
                <Spinner size="lg" />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {filteredTemplates.map((template) => {
                  const isSelected = selectedTemplate?.id === template.id;

                  return (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => setSelectedTemplateId(template.id)}
                      className={`overflow-hidden rounded-[28px] bg-white/84 text-left shadow-sm transition-all duration-300 ${isSelected ? "ring-2 ring-primary" : "hover:-translate-y-1 hover:shadow-lg"}`}
                    >
                      <div className="aspect-[16/10] overflow-hidden bg-surface-container p-4">
                        <div className="svg-stage h-full w-full overflow-hidden rounded-[18px] border border-outline-variant/30 bg-white" dangerouslySetInnerHTML={{ __html: template.svgContent }} />
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h2 className="font-headline text-lg font-bold text-slate-900">{prettifyName(template.name)}</h2>
                            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{template.category}</p>
                          </div>
                          {isSelected ? <span className="material-symbols-outlined text-primary">check_circle</span> : null}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <aside className="hidden w-[380px] shrink-0 border-l border-outline-variant/15 bg-surface-container-high/60 p-6 backdrop-blur-2xl xl:flex xl:flex-col">
          {selectedTemplate ? (
            <>
              <header>
                <div className="mb-2 flex items-start justify-between gap-3">
                  <h2 className="font-headline text-2xl font-bold text-slate-900">{prettifyName(selectedTemplate.name)}</h2>
                  <span className="rounded-lg bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Live</span>
                </div>
                <p className="text-sm leading-6 text-slate-500">Category: {selectedTemplate.category}. This detail panel is driven from the stored schema and SVG source.</p>
              </header>

              <div className="mt-8 space-y-6">
                <section>
                  <h3 className="mb-4 text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">Slot Schema</h3>
                  <div className="space-y-3">
                    {slots.length > 0 ? slots.map((slot) => (
                      <div key={slot.key} className="rounded-2xl border-l-4 border-primary bg-white/85 p-4">
                        <p className="text-xs font-bold text-slate-900">{slot.label}</p>
                        <p className="mt-1 text-[11px] text-slate-500">Key: {slot.key}</p>
                        <p className="text-[11px] text-slate-400">Type: {slot.type}</p>
                      </div>
                    )) : (
                      <div className="rounded-2xl bg-white/85 p-4 text-sm text-slate-500">No slot metadata available.</div>
                    )}
                  </div>
                </section>

                <section>
                  <h3 className="mb-4 text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">SVG Source Preview</h3>
                  <div className="workspace-scrollbar max-h-[260px] overflow-auto rounded-[24px] bg-white/85 p-4 text-xs leading-6 text-slate-500">
                    <pre className="whitespace-pre-wrap break-all">{selectedTemplate.svgContent}</pre>
                  </div>
                </section>
              </div>

              <div className="mt-auto space-y-3 pt-6">
                <Button onClick={() => router.push("/")}>Apply Skeleton to Project</Button>
                <Button variant="secondary">Duplicate as Custom</Button>
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-500">Select a template to inspect its schema.</div>
          )}
        </aside>
      </main>

      <ProductFooter />
    </div>
  );
}