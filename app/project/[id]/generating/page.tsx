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
    <div className="min-h-screen flex flex-col bg-surface">
      <ProductTopBar
        activeNav="projects"
        userLabel={user?.name || user?.email}
        actionLabel="Back to Projects"
        actionIcon="arrow_back"
        actionHref="/"
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        {/* Header */}
        <section className="mb-8">
          <h1 className="text-4xl font-extrabold text-on-surface">Orchestrating AI Agents</h1>
          <p className="mt-2 text-base text-slate-600">
            Multi-agent intelligence synthesizing the outline, layouts, and visual strategy for {project?.name || "your presentation"}.
          </p>
        </section>

        {/* Main 2-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Timeline Section - 2 columns */}
          <section className="lg:col-span-2 rounded-xl bg-white border border-outline-variant/10 p-6">
            <h2 className="text-xl font-bold text-on-surface mb-6">Pipeline Progress</h2>
            
            <div className="flex flex-col gap-4">
              {TIMELINE_STEPS.map((step) => {
                const isComplete = events.some((e) => e.agent === step.key && e.status === "complete");
                const isActive = events.some((e) => e.agent === step.key && e.status === "running");
                
                return (
                  <div key={step.key} className="flex items-center gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-full flex-shrink-0 transition-all font-bold text-white ${
                      isComplete
                        ? "bg-emerald-500"
                        : isActive
                        ? "bg-primary shadow-lg shadow-primary/30"
                        : "bg-slate-300"
                    }`}>
                      <span className="material-symbols-outlined">{isComplete ? "check_circle" : step.icon}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-on-surface">{step.label}</p>
                      {isActive && activeEvent?.reasoning && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{activeEvent.reasoning}</p>
                      )}
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      isComplete ? "bg-emerald-100 text-emerald-700" : isActive ? "bg-primary/10 text-primary" : "bg-slate-100 text-slate-500"
                    }`}>
                      {isComplete ? "Complete" : isActive ? "Active" : "Pending"}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Right Panel - Intelligence */}
          <section className="rounded-xl bg-gradient-to-br from-primary/5 to-tertiary/5 border border-primary/10 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">smart_toy</span>
              </div>
              <h3 className="font-bold text-on-surface">Intelligence</h3>
            </div>

            <div className="bg-white/60 rounded-lg border border-primary/10 p-4 mb-6">
              <p className="text-sm text-slate-700 italic leading-6">
                {activeEvent?.reasoning || "Initializing AI agent pipeline..."}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-slate-600">Confidence</span>
                <span className="text-primary text-base">{confidence}%</span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary to-tertiary transition-all duration-300" style={{ width: `${confidence}%` }} />
              </div>
            </div>

            <Button 
              className="w-full mt-6" 
              disabled={!isComplete}
              onClick={() => router.push(`/project/${projectId}`)}
            >
              {isComplete ? "Open Editor" : "Rendering..."}
            </Button>
          </section>
        </div>

        {/* Outline Table */}
        <section className="rounded-xl bg-white border border-outline-variant/10 p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-on-surface">Slide Deck Outline</h2>
            <p className="text-sm text-slate-500 mt-1">Table updates as pipeline processes</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant/15">
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-slate-500">#</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-slate-500">Slide Title</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-slate-500">Key Points</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-slate-500">Template</th>
                </tr>
              </thead>
              <tbody>
                {outlineRows.map((row, index) => (
                  <tr key={index} className="border-b border-outline-variant/5 hover:bg-surface-container/30 transition-colors">
                    <td className="px-4 py-4 font-bold text-slate-400">{String(index + 1).padStart(2, "0")}</td>
                    <td className="px-4 py-4 font-semibold text-on-surface">{row.title}</td>
                    <td className="px-4 py-4 text-slate-600">
                      {row.points.join(" • ")}
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary uppercase">
                        {row.template}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Footer */}
        <section className="mt-8 text-center text-sm text-slate-500">
          <p>Generation in progress • Estimated time: 45 seconds remaining</p>
        </section>
      </main>
    </div>
  );
}
