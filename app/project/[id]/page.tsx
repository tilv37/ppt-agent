"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button, Spinner } from "@/components/ui";
import { ProductTopBar } from "@/components/layout/ProductChrome";
import { useProject } from "@/hooks/useProjects";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api/client";

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
    if (projectId) {
      api.get<ChatMessage[]>(`/chat?projectId=${projectId}`)
        .then((data) => setMessages(data.map((message) => ({ ...message, intent: message.role === "assistant" ? "SYSTEM" : "EDIT" }))))
        .catch(console.error);
    }
  }, [projectId]);

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
    <div className="flex min-h-screen flex-col overflow-hidden">
      <ProductTopBar
        activeNav="projects"
        userLabel={user?.name || user?.email}
        actionLabel="Create New"
        actionIcon="add"
        actionHref="/"
        searchSlot={
          <label className="flex min-w-[220px] items-center gap-3 rounded-full border border-white/70 bg-surface-container-low px-4 py-2 shadow-sm">
            <span className="material-symbols-outlined text-[18px] text-slate-400">search</span>
            <input placeholder="Search..." className="w-full border-none bg-transparent p-0 text-sm outline-none placeholder:text-slate-400" />
          </label>
        }
      />

      <main className="flex flex-1 overflow-hidden">
        <aside className="workspace-scrollbar hidden w-72 shrink-0 border-r border-outline-variant/15 bg-surface-container-low/80 p-5 lg:flex lg:flex-col lg:overflow-y-auto">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">Slide Deck</div>
              <div className="mt-1 text-sm font-semibold text-primary">{slides.length} Slides</div>
            </div>
            <button
              type="button"
              onClick={() => router.push(`/project/${projectId}/setup`)}
              className="rounded-full bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-500 shadow-sm transition-colors hover:text-primary"
            >
              Setup
            </button>
          </div>

          <div className="space-y-4">
            {slides.length > 0 ? (
              slides.map((slide, index) => {
                const isSelected = index === selectedSlideIndex;

                return (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => setSelectedSlideIndex(index)}
                    className={`relative w-full rounded-[24px] p-3 text-left transition-all ${isSelected ? "bg-white shadow-lg ring-2 ring-primary/70" : "bg-white/65 hover:bg-white/90"}`}
                  >
                    <div className="absolute left-4 top-4 rounded-full bg-slate-900/90 px-2 py-1 text-[10px] font-bold text-white">{getSlideLabel(index)}</div>
                    <div className="aspect-video overflow-hidden rounded-[18px] border border-white/80 bg-gradient-to-br from-slate-100 to-slate-50">
                      {slide.generatedSvg ? (
                        <div className="svg-stage h-full w-full scale-[0.22] origin-top-left" dangerouslySetInnerHTML={{ __html: slide.generatedSvg }} />
                      ) : (
                        <div className="flex h-full items-center justify-center text-slate-300">
                          <span className="material-symbols-outlined text-4xl">slideshow</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-slate-700">Slide {index + 1}</span>
                      <span className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{slide.templateId || "template"}</span>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="rounded-[24px] border-2 border-dashed border-outline-variant/30 bg-white/40 p-6 text-center text-sm text-slate-500">
                Slides will appear here after the generation pipeline runs.
              </div>
            )}
          </div>
        </aside>

        <section className="relative flex flex-1 items-center justify-center overflow-hidden bg-surface px-6 py-8 lg:px-10 xl:px-14">
          {slides.length > 0 ? (
            <>
              <div className="relative flex h-full w-full max-w-6xl items-center justify-center">
                <div className="absolute inset-0 rounded-[48px] bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.08),transparent_55%)]" />
                <div className="relative w-full max-w-5xl overflow-hidden rounded-[32px] border border-white/80 bg-white shadow-[0_36px_120px_rgba(15,23,42,0.16)]">
                  <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">Canvas</div>
                      <div className="mt-1 font-headline text-xl font-bold text-slate-900">{currentPresentation?.title || project?.name}</div>
                    </div>
                    <div className="rounded-full bg-surface-container-low px-3 py-1 text-xs font-semibold text-slate-500">Slide {selectedSlideNumber} / {slides.length}</div>
                  </div>
                  <div className="aspect-video bg-white p-4 sm:p-6">
                    {selectedSlide?.generatedSvg ? (
                      <div className="svg-stage h-full w-full overflow-hidden rounded-[24px] bg-slate-50 shadow-inner" dangerouslySetInnerHTML={{ __html: selectedSlide.generatedSvg }} />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center rounded-[24px] bg-gradient-to-br from-slate-100 to-slate-50 text-center text-slate-400">
                        <span className="material-symbols-outlined text-6xl">slideshow</span>
                        <p className="mt-4 text-sm">This slide has no generated SVG yet.</p>
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
            <div className="rounded-[36px] bg-white/78 px-10 py-16 text-center shadow-lg ring-1 ring-white/70">
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-violet-100 text-primary">
                <span className="material-symbols-outlined text-5xl">auto_awesome</span>
              </div>
              <h2 className="font-headline text-3xl font-extrabold text-slate-900">No slides yet</h2>
              <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">The editor workspace matches the approved prototype, but the current project still needs generation output.</p>
              <Button className="mt-8" onClick={() => router.push(`/project/${projectId}/setup`)}>Go to Setup</Button>
            </div>
          )}
        </section>

        <aside className="flex w-full max-w-[380px] shrink-0 flex-col border-l border-slate-200/20 bg-slate-50/95 p-5 shadow-2xl backdrop-blur-2xl">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="font-headline text-2xl font-bold text-slate-900">Intelligence</h2>
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Active Agent</p>
            </div>
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-blue-100 px-3 py-2 text-xs font-bold text-primary transition-transform active:scale-95"
            >
              <span className="material-symbols-outlined text-[16px]">ios_share</span>
              Export
            </button>
          </div>

          <div className="mb-4 inline-flex items-center gap-2 rounded-xl bg-surface-container px-3 py-2 text-[11px] font-bold text-slate-500">
            <span className="material-symbols-outlined text-[16px] text-primary">target</span>
            Editing: {slides.length ? `Slide ${selectedSlideNumber}` : "No Slide"}
          </div>

          <div className="workspace-scrollbar flex-1 space-y-4 overflow-y-auto py-2 pr-2">
            {messages.length > 0 ? (
              messages.map((msg) => {
                const isUser = msg.role === "user";
                const chip = msg.intent || (isUser ? "EDIT" : "SYSTEM");
                const chipClasses = chip === "ADD"
                  ? "bg-violet-100 text-violet-700"
                  : chip === "SYSTEM"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700";

                return (
                  <div key={msg.id} className={`flex flex-col gap-2 ${isUser ? "items-end" : "items-start"}`}>
                    <div className={`flex items-center gap-2 ${isUser ? "self-end" : "self-start"}`}>
                      <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${chipClasses}`}>{chip}</span>
                    </div>
                    <div className={[
                      "max-w-[90%] rounded-[22px] p-4 text-sm leading-6 shadow-sm",
                      isUser
                        ? "rounded-tr-none bg-primary-container text-on-primary-container"
                        : "rounded-tl-none border-l-2 border-tertiary bg-surface-container-highest text-slate-700",
                    ].join(" ")}>
                      {msg.content}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-[24px] bg-surface-container-highest p-4 text-sm leading-6 text-slate-600">
                Slide deck generated successfully. Select any slide and describe your changes, or ask to add new slides.
              </div>
            )}
          </div>

          <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-slate-200/40">
            <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-tertiary to-primary opacity-60" />
          </div>

          <div className="mt-5 space-y-4">
            <div className="flex flex-wrap gap-2">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action}
                  type="button"
                  onClick={() => setChatInput(action)}
                  className="rounded-full bg-slate-200/60 px-3 py-1.5 text-[11px] font-medium text-slate-600 transition-colors hover:bg-slate-200"
                >
                  {action}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIntent((current) => current === "EDIT" ? "ADD" : "EDIT")}
                className={`rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] ${intent === "EDIT" ? "bg-amber-100 text-amber-700" : "bg-violet-100 text-violet-700"}`}
              >
                {intent}
              </button>
              <span className="text-[10px] text-slate-400">Toggle between editing the current slide and adding a new one.</span>
            </div>

            <div className="relative">
              <textarea
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Describe changes or request new slides..."
                rows={3}
                className="w-full resize-none rounded-[24px] border border-outline-variant/20 bg-white p-4 pr-14 text-sm shadow-xl outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                disabled={sending}
              />
              <button
                type="button"
                onClick={handleSendMessage}
                disabled={sending}
                className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-container text-white shadow-lg transition-transform active:scale-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sending ? <Spinner size="sm" /> : <span className="material-symbols-outlined text-[18px]">arrow_upward</span>}
              </button>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-around border-t border-slate-200/20 pt-4 text-slate-400">
            <div className="flex flex-col items-center gap-1 text-primary">
              <span className="material-symbols-outlined text-[20px]">smart_toy</span>
              <span className="text-[10px] font-bold">Chat</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="material-symbols-outlined text-[20px]">history</span>
              <span className="text-[10px] font-bold">Log</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="material-symbols-outlined text-[20px]">database</span>
              <span className="text-[10px] font-bold">Data</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="material-symbols-outlined text-[20px]">help</span>
              <span className="text-[10px] font-bold">Help</span>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
