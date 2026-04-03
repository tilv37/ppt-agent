"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button, Spinner } from "@/components/ui";
import { ProductTopBar } from "@/components/layout/ProductChrome";
import { useProject, useDeleteProject } from "@/hooks/useProjects";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api/client";

function DeleteProjectButton({ projectId }: { projectId?: string | null }) {
  const router = useRouter();
  const deleteProject = useDeleteProject();

  if (!projectId) return null;

  const handleDelete = async () => {
    if (!confirm("Delete this project? This action cannot be undone.")) return;
    try {
      await deleteProject.mutateAsync(projectId);
      router.push("/");
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete project");
    }
  };

  return (
    <button
      onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleDelete(); }}
      title="Delete project"
      className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
    >
      <span className="material-symbols-outlined">delete</span>
      Delete
    </button>
  );
}

interface ChatMessage {
  id: string;
  role: string;
  content: string;
  createdAt: string;
  intent?: "EDIT" | "ADD" | "SYSTEM";
}

const QUICK_ACTIONS = [
  "Add a risk analysis slide",
  "Simplify the text on this slide",
  "Change the chart to a pie chart",
];

function getSlideLabel(index: number) {
  return String(index + 1).padStart(2, "0");
}

export default function ProjectEditorPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const { data: project, isLoading } = useProject(projectId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedSlideIndex, setSelectedSlideIndex] = useState(0);
  const [intent, setIntent] = useState<"EDIT" | "ADD">("EDIT");

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (projectId && isAuthenticated()) {
      api.get<ChatMessage[]>(`/chat?projectId=${projectId}`)
        .then((data) => setMessages(data.map((message) => ({ ...message, intent: message.role === "assistant" ? "SYSTEM" : "EDIT" }))))
        .catch(console.error);
    }
  }, [projectId, isAuthenticated]);

  useEffect(() => {
    const nextSlides = project?.presentations?.[0]?.slides;

    if (!nextSlides?.length) {
      setSelectedSlideIndex(0);
      return;
    }

    setSelectedSlideIndex((current) => Math.min(current, nextSlides.length - 1));
  }, [project]);

  if (!isAuthenticated() || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const handleExport = async () => {
    if (!project?.presentations?.[0]) return;
    try {
      const result = await api.post<{ url: string }>("/export", {
        presentationId: project.presentations[0].id,
        format: "pptx",
      });
      alert(`Export successful! (Mock: ${result.url})`);
    } catch (err) {
      alert("Export failed");
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    setSending(true);
    try {
      const result = await api.post<{ userMessage: ChatMessage; assistantMessage: ChatMessage }>(
        "/chat",
        { projectId, message: chatInput }
      );
      setMessages((prev) => [
        ...prev,
        { ...result.userMessage, intent },
        { ...result.assistantMessage, intent: "SYSTEM" },
      ]);
      setChatInput("");
    } catch (err) {
      console.error("Chat error:", err);
    } finally {
      setSending(false);
    }
  };

  const currentPresentation = project?.presentations?.[0];
  const slides = currentPresentation?.slides || [];
  const selectedSlide = slides[selectedSlideIndex];
  const selectedSlideNumber = slides.length ? selectedSlideIndex + 1 : 0;

  return (
    <div className="flex min-h-screen flex-col overflow-hidden bg-surface">
      <ProductTopBar
        activeNav="projects"
        userLabel={user?.name || user?.email}
        actionLabel="Create New"
        actionIcon="add"
        actionHref="/"
      />

      <main className="flex flex-1 overflow-hidden bg-surface">
        <aside className="workspace-scrollbar hidden w-72 shrink-0 border-r border-outline-variant/10 bg-white p-6 lg:flex lg:flex-col lg:overflow-y-auto">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Slides</div>
              <div className="mt-1 text-base font-bold text-on-surface">{slides.length}</div>
            </div>
            <button
              type="button"
              onClick={() => router.push(`/project/${projectId}/setup`)}
              className="rounded-lg bg-primary/10 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
            >
              Setup
            </button>
          </div>

          <div className="space-y-3 flex-1">
            {slides.length > 0 ? (
              slides.map((slide, index) => {
                const isSelected = index === selectedSlideIndex;

                return (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => setSelectedSlideIndex(index)}
                    className={`relative w-full rounded-lg p-3 text-left transition-all ${isSelected ? "bg-primary/10 ring-2 ring-primary border border-primary/20" : "bg-slate-100 hover:bg-slate-200 border border-outline-variant/10"}`}
                  >
                    <div className="absolute left-3 top-3 rounded-full bg-on-surface/70 px-2 py-0.5 text-[10px] font-bold text-white">{getSlideLabel(index)}</div>
                    <div className="aspect-video overflow-hidden rounded-lg bg-gradient-to-br from-slate-200 to-slate-300 border border-outline-variant/20">
                      {slide.generatedSvg ? (
                        <div className="svg-stage h-full w-full scale-[0.22] origin-top-left" dangerouslySetInnerHTML={{ __html: slide.generatedSvg }} />
                      ) : (
                        <div className="flex h-full items-center justify-center text-slate-400">
                          <span className="material-symbols-outlined text-3xl">slideshow</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-2 text-xs font-semibold text-slate-600">{slide.templateId || "Template"}</div>
                  </button>
                );
              })
            ) : (
              <div className="rounded-lg border-2 border-dashed border-outline-variant/30 bg-slate-50 p-6 text-center text-sm text-slate-500">
                Slides will appear here after generation.
              </div>
            )}
          </div>
        </aside>

        <section className="relative flex flex-1 items-center justify-center overflow-hidden bg-surface px-6 py-8">
          {slides.length > 0 ? (
            <>
              <div className="relative flex h-full w-full max-w-4xl items-center justify-center">
                <div className="relative w-full overflow-hidden rounded-2xl border border-outline-variant/10 bg-white shadow-lg">
                  <div className="flex items-center justify-between border-b border-outline-variant/10 px-6 py-4">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Canvas</div>
                      <div className="mt-1 text-lg font-bold text-on-surface">{currentPresentation?.title || project?.name}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Slide {selectedSlideNumber} / {slides.length}</div>
                      <DeleteProjectButton projectId={project?.id} />
                    </div>
                  </div>
                  <div className="aspect-video bg-white p-6">
                    {selectedSlide?.generatedSvg ? (
                      <div className="svg-stage h-full w-full overflow-hidden rounded-lg bg-slate-50" dangerouslySetInnerHTML={{ __html: selectedSlide.generatedSvg }} />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center rounded-lg bg-slate-100 text-center text-slate-500">
                        <span className="material-symbols-outlined text-5xl">slideshow</span>
                        <p className="mt-3 text-sm">No content yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedSlideIndex((index) => Math.max(0, index - 1))}
                disabled={selectedSlideIndex === 0}
                className="absolute left-4 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/70 text-slate-700 shadow-lg transition-all hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 xl:flex"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedSlideIndex((index) => Math.min(slides.length - 1, index + 1))}
                disabled={selectedSlideIndex >= slides.length - 1}
                className="absolute right-4 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/70 text-slate-700 shadow-lg transition-all hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 xl:flex"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>

              <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 items-center gap-5 rounded-full bg-slate-950/90 px-6 py-3 text-white shadow-2xl backdrop-blur-xl">
                <button type="button" className="transition-colors hover:text-blue-300">
                  <span className="material-symbols-outlined text-[20px]">undo</span>
                </button>
                <div className="h-4 w-px bg-white/20" />
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[20px] text-blue-300">text_fields</span>
                  <span className="material-symbols-outlined text-[20px]">image</span>
                  <span className="material-symbols-outlined text-[20px]">bar_chart</span>
                  <span className="material-symbols-outlined text-[20px]">shape_line</span>
                </div>
                <div className="h-4 w-px bg-white/20" />
                <span className="text-sm font-semibold">{selectedSlideNumber} / {slides.length}</span>
              </div>
            </>
          ) : (
            <div className="rounded-xl bg-white p-12 text-center shadow-lg">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <span className="material-symbols-outlined text-4xl">auto_awesome</span>
              </div>
              <h2 className="text-2xl font-bold text-on-surface">No Slides Yet</h2>
              <p className="mt-2 text-sm text-slate-600">Go to setup to generate your presentation</p>
              <Button className="mt-6" onClick={() => router.push(`/project/${projectId}/setup`)}>Start Setup</Button>
            </div>
          )}
        </section>

        {/* Right Panel */}
        <aside className="flex w-80 shrink-0 flex-col border-l border-outline-variant/10 bg-white">
          <div className="flex items-center justify-between border-b border-outline-variant/10 px-6 py-4">
            <h2 className="font-bold text-on-surface">Intelligence</h2>
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20"
            >
              <span className="material-symbols-outlined text-[16px]">ios_share</span>
              Export
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {messages.length > 0 ? (
              <div className="space-y-3">
                {messages.map((msg) => {
                  const isUser = msg.role === "user";
                  return (
                    <div key={msg.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-xs rounded-lg px-3 py-2 text-sm ${isUser ? "bg-primary text-white" : "bg-slate-100 text-slate-700"}`}>
                        {msg.content}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-sm text-slate-500">No messages yet</p>
            )}
          </div>

          <div className="border-t border-outline-variant/10 px-4 py-4 space-y-3">
            <textarea
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Describe changes..."
              rows={2}
              className="w-full rounded-lg border border-outline-variant/20 p-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <Button
              className="w-full"
              onClick={handleSendMessage}
              disabled={sending}
            >
              {sending ? "Sending..." : "Send"}
            </Button>
          </div>
        </aside>
      </main>
    </div>
  );
}
