"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button, Spinner } from "@/components/ui";
import { ProductFooter, ProductTopBar } from "@/components/layout/ProductChrome";
import { useProject } from "@/hooks/useProjects";
import { useAuthStore } from "@/store/authStore";

interface PipelineEvent {
  agent: string;
  status: "running" | "complete" | "error";
  reasoning: string;
  result?: unknown;
}

const AGENT_LABELS: Record<string, string> = {
  orchestrator: "Orchestrator",
  "content-extraction": "Content Extraction",
  "outline-planner": "Outline Planning",
  "layout-selector": "Layout Selection",
  "content-writer": "Content Writing",
  "visual-decision": "Visual Decisions",
  "graphic-generator": "Graphic Generation",
  "quality-review": "Quality Review",
};

const TIMELINE_STEPS = [
  { key: "content-extraction", label: "Content Extraction", icon: "cloud_download" },
  { key: "outline-planner", label: "Outline Planning", icon: "auto_awesome" },
  { key: "layout-selector", label: "Layout Selection", icon: "dashboard_customize" },
  { key: "graphic-generator", label: "Asset Generation", icon: "draw" },
];

export default function ProjectGeneratingPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const { data: project } = useProject(projectId);
  const [events, setEvents] = useState<PipelineEvent[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (!projectId) return;

    const eventSource = new EventSource(`/api/v1/pipeline/stream/${projectId}`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      const data: PipelineEvent = JSON.parse(event.data);
      setEvents((prev) => {
        const existing = prev.findIndex((e) => e.agent === data.agent);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = data;
          return updated;
        }
        return [...prev, data];
      });

      if (data.agent === "orchestrator" && data.status === "complete") {
        setIsComplete(true);
        setTimeout(() => {
          router.push(`/project/${projectId}`);
        }, 2000);
      }

      if (data.agent === "orchestrator" && data.status === "error") {
        eventSource.close();
      }
    };

    return () => {
      eventSource.close();
    };
  }, [projectId, router]);

  if (!isAuthenticated()) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const activeEvent = [...events].reverse().find((event) => event.status === "running") || events[events.length - 1];
  const outlinePlanner = events.find((event) => event.agent === "outline-planner" && event.status === "complete");
  const layoutSelector = events.find((event) => event.agent === "layout-selector" && event.status === "complete");
  const outlineSections = Array.isArray((outlinePlanner?.result as { sections?: string[] } | undefined)?.sections)
    ? ((outlinePlanner?.result as { sections?: string[] }).sections || [])
    : [];
  const selectedLayouts = Array.isArray((layoutSelector?.result as { layouts?: string[] } | undefined)?.layouts)
    ? ((layoutSelector?.result as { layouts?: string[] }).layouts || [])
    : [];
  const confidence = Math.min(
    100,
    18 + events.filter((event) => event.status === "complete" && event.agent !== "orchestrator").length * 13
  );
  const outlineRows = outlineSections.length
    ? outlineSections.map((section, index) => ({
        title: section,
        points: ["Narrative points synthesized from source material", activeEvent?.reasoning || "Awaiting agent reasoning"],
        template: selectedLayouts[index] || "pending",
      }))
    : [
        { title: "Executive Summary", points: ["Market context", "Value proposition"], template: "minimal-hero" },
        { title: "Core Problem", points: ["Pain points", "Operational friction"], template: "split-contrast" },
        { title: "Solution Overview", points: ["Workflow engine", "AI-assisted structure"], template: "visual-showcase" },
      ];

  return (
    <div className="min-h-screen">
      <ProductTopBar
        activeNav="projects"
        userLabel={user?.name || user?.email}
        actionLabel="Back to Projects"
        actionIcon="arrow_back"
        actionHref="/"
        searchSlot={
          <label className="flex min-w-[260px] items-center gap-3 rounded-full border border-white/70 bg-slate-50 px-4 py-2 shadow-sm">
            <span className="material-symbols-outlined text-[18px] text-slate-400">search</span>
            <input placeholder="Search projects..." className="w-full border-none bg-transparent p-0 text-sm outline-none placeholder:text-slate-400" />
          </label>
        }
      />

      <main className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-8 px-6 py-8">
        <section className="space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="font-headline text-4xl font-extrabold tracking-tight text-slate-900">Orchestrating AI Agents...</h1>
              <p className="mt-2 text-sm text-slate-500">Multi-agent intelligence is synthesizing the outline, layouts, and visual strategy for {project?.name || "your presentation"}.</p>
            </div>
            <div className="inline-flex items-center gap-3 rounded-full bg-white/80 px-4 py-2 shadow-sm ring-1 ring-white/70">
              <span className="h-3 w-3 animate-pulse rounded-full bg-tertiary" />
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-tertiary">Active Agent: {AGENT_LABELS[activeEvent?.agent || "content-extraction"] || "Content Extraction"}</span>
            </div>
          </div>

          <div className="overflow-hidden rounded-[32px] bg-white/82 p-6 shadow-sm ring-1 ring-white/70">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              {TIMELINE_STEPS.map((step, index) => {
                const stepEvent = events.find((event) => event.agent === step.key);
                const isDone = stepEvent?.status === "complete";
                const isActive = stepEvent?.status === "running" || (!stepEvent && index === 0 && events.length === 0);

                return (
                  <div key={step.key} className="flex flex-1 items-center gap-4">
                    <div className="flex flex-col items-center gap-3 text-center">
                      <div className={[
                        "flex h-14 w-14 items-center justify-center rounded-full transition-all",
                        isDone
                          ? "bg-emerald-100 text-emerald-600"
                          : isActive
                            ? "bg-primary-container text-on-primary-container shadow-lg shadow-primary/20"
                            : "bg-surface-container text-slate-400",
                      ].join(" ")}>
                        <span className="material-symbols-outlined">{isDone ? "check_circle" : step.icon}</span>
                      </div>
                      <span className="text-xs font-semibold text-slate-500">{step.label}</span>
                    </div>
                    {index < TIMELINE_STEPS.length - 1 ? (
                      <div className={`hidden h-1 flex-1 rounded-full lg:block ${isDone ? "bg-emerald-200" : "bg-surface-container-high"}`} />
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <div className="overflow-hidden rounded-[32px] bg-white/84 p-2 shadow-sm ring-1 ring-white/70">
              <div className="rounded-[28px] bg-white p-6">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="font-headline text-2xl font-bold text-slate-900">Slide Deck Outline</h2>
                    <p className="mt-1 text-sm text-slate-500">The table fills in as each pipeline phase completes.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" className="rounded-2xl p-2 text-slate-400 transition-colors hover:bg-surface-container-low hover:text-slate-700">
                      <span className="material-symbols-outlined">reorder</span>
                    </button>
                    <button type="button" className="rounded-2xl p-2 text-slate-400 transition-colors hover:bg-surface-container-low hover:text-slate-700">
                      <span className="material-symbols-outlined">add</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-outline-variant/15 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
                        <th className="px-4 pb-4">#</th>
                        <th className="px-4 pb-4">Slide Title</th>
                        <th className="px-4 pb-4">Key Narrative Points</th>
                        <th className="px-4 pb-4">Template</th>
                      </tr>
                    </thead>
                    <tbody>
                      {outlineRows.map((row, index) => (
                        <tr key={`${row.title}-${index}`} className="border-b border-outline-variant/8 transition-colors hover:bg-surface-container-low/40">
                          <td className="px-4 py-5 font-headline font-bold text-slate-400">{String(index + 1).padStart(2, "0")}</td>
                          <td className="px-4 py-5 font-semibold text-slate-900">{row.title}</td>
                          <td className="px-4 py-5 text-sm text-slate-500">
                            <ul className="space-y-1">
                              {row.points.map((point) => (
                                <li key={point} className="flex items-start gap-2">
                                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                                  <span>{point}</span>
                                </li>
                              ))}
                            </ul>
                          </td>
                          <td className="px-4 py-5">
                            <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-primary">
                              {row.template}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-6 lg:col-span-4">
            <div className="rounded-[32px] bg-slate-50 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] ring-1 ring-white/70">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-2xl bg-blue-100 p-3 text-primary">
                  <span className="material-symbols-outlined">smart_toy</span>
                </div>
                <div>
                  <h3 className="font-headline text-xl font-bold text-slate-900">Intelligence</h3>
                  <p className="text-xs text-slate-500">Active agent feedback</p>
                </div>
              </div>
              <div className="rounded-r-2xl rounded-tl-2xl border-l-2 border-tertiary bg-surface-container-highest p-4">
                <p className="text-sm italic leading-6 text-slate-700">
                  {activeEvent?.reasoning || "Initializing pipeline and preparing outline synthesis..."}
                </p>
              </div>
              <div className="mt-5">
                <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">Agent Confidence Score</div>
                <div className="flex items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full bg-gradient-to-r from-primary to-tertiary transition-all" style={{ width: `${confidence}%` }} />
                  </div>
                  <span className="text-xs font-bold text-primary">{confidence}%</span>
                </div>
              </div>
            </div>

            <div className="rounded-[32px] bg-white p-2 shadow-lg ring-1 ring-primary/10">
              <Button className="w-full py-5 text-base" disabled={!isComplete} onClick={() => router.push(`/project/${projectId}`)}>
                {isComplete ? "Open Editor" : "Rendering In Progress"}
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </Button>
              <p className="px-4 py-3 text-center text-[11px] uppercase tracking-[0.2em] text-slate-400">
                {isComplete ? "Generation complete. Redirect pending." : "Estimated render time: 14 seconds"}
              </p>
            </div>

            <div className="rounded-[32px] bg-white/78 p-5 shadow-sm ring-1 ring-white/70">
              <div className="mb-4 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">Event Log</div>
              <div className="workspace-scrollbar max-h-[280px] space-y-3 overflow-auto pr-2">
                {events.length === 0 ? (
                  <div className="flex items-center gap-3 rounded-2xl bg-surface-container-low px-4 py-3 text-sm text-slate-500">
                    <Spinner size="sm" />
                    Initializing pipeline...
                  </div>
                ) : (
                  events.map((event) => (
                    <div key={`${event.agent}-${event.status}`} className="rounded-2xl bg-surface-container-low px-4 py-3">
                      <div className="mb-1 flex items-center justify-between gap-3">
                        <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{AGENT_LABELS[event.agent] || event.agent}</span>
                        <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${event.status === "complete" ? "bg-emerald-100 text-emerald-700" : event.status === "error" ? "bg-red-100 text-red-700" : "bg-blue-100 text-primary"}`}>
                          {event.status}
                        </span>
                      </div>
                      <p className="text-sm leading-6 text-slate-600">{event.reasoning}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </aside>
        </section>
      </main>

      <ProductFooter />
    </div>
  );
}
