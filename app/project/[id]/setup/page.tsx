"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button, Input, Spinner } from "@/components/ui";
import { ProductFooter, ProductTopBar } from "@/components/layout/ProductChrome";
import { useProject, useUpdateProject } from "@/hooks/useProjects";
import { useAuthStore } from "@/store/authStore";

export default function ProjectSetupPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const { data: project, isLoading } = useProject(projectId);
  const updateProject = useUpdateProject();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [slideCount, setSlideCount] = useState(12);
  const [tone, setTone] = useState<"professional" | "creative">("professional");
  const [audience, setAudience] = useState("Executive Leadership");

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description || "");
    }
  }, [project]);

  if (!isAuthenticated() || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const handleStartGeneration = async () => {
    await updateProject.mutateAsync({ id: projectId, name, description, status: "generating" });
    router.push(`/project/${projectId}/generating`);
  };

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
            <input
              placeholder="Search projects..."
              className="w-full border-none bg-transparent p-0 text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
          </label>
        }
      />

      <main className="grid min-h-[calc(100vh-146px)] grid-cols-1 lg:grid-cols-12">
        <section className="border-b border-white/40 bg-surface-container-low px-8 py-10 lg:col-span-3 lg:border-b-0 lg:border-r lg:border-outline-variant/20 lg:px-10 xl:px-14">
          <div className="lg:sticky lg:top-28">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary shadow-sm">
              <span className="material-symbols-outlined text-[16px]">tune</span>
              Setup Flow
            </div>
            <h1 className="font-headline text-4xl font-extrabold tracking-tight text-slate-900">Setup Your Canvas</h1>
            <p className="mt-4 max-w-sm text-sm leading-6 text-slate-500">
              Transform raw notes, URLs, and supporting documents into a structured presentation brief. The right column keeps the configuration aligned with the approved prototype.
            </p>

            <div className="mt-10 space-y-6">
              {[
                ["description", "Step 1", "Provide source material via raw text, links, or upload placeholders."],
                ["tune", "Step 2", "Set tone, audience, and slide density before generation begins."],
                ["auto_awesome", "Step 3", "Hand the brief to the AI pipeline for outline planning and rendering."],
              ].map(([icon, step, text], index) => (
                <div key={step} className="flex gap-4">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${index === 1 ? "bg-tertiary/10 text-tertiary" : "bg-primary/10 text-primary"}`}>
                    <span className="material-symbols-outlined">{icon}</span>
                  </div>
                  <div>
                    <div className={`mb-1 text-xs font-bold uppercase tracking-[0.2em] ${index === 1 ? "text-tertiary" : "text-primary"}`}>{step}</div>
                    <p className="text-sm leading-6 text-slate-500">{text}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 rounded-[28px] bg-white/90 p-5 shadow-sm ring-1 ring-white/70">
              <div className="mb-4 flex aspect-[4/3] items-center justify-center rounded-[20px] bg-gradient-to-br from-blue-100 to-violet-100 text-primary">
                <span className="material-symbols-outlined text-6xl">palette</span>
              </div>
              <p className="text-xs italic leading-6 text-slate-400">"Design is intelligence made visible."</p>
            </div>
          </div>
        </section>

        <section className="bg-surface px-8 py-10 lg:col-span-6 xl:px-14">
          <div className="mx-auto max-w-3xl space-y-9">
            <section>
              <div className="mb-4 flex items-center justify-between gap-3">
                <label className="text-lg font-bold text-slate-900">Project Details</label>
                <span className="rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 ring-1 ring-slate-200">Editable</span>
              </div>
              <div className="space-y-4 rounded-[28px] bg-white/82 p-6 shadow-sm ring-1 ring-white/70">
                <Input label="Project Name" value={name} onChange={(event) => setName(event.target.value)} placeholder="My Presentation" />
                <Input label="Description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="A brief description of your presentation" />
              </div>
            </section>

            <section>
              <div className="mb-4 flex items-center justify-between gap-3">
                <label className="text-lg font-bold text-slate-900">Input Content</label>
                <span className="rounded-full bg-surface-container-high px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">4,000 char guide</span>
              </div>
              <div className="rounded-[28px] bg-white/82 p-2 shadow-sm ring-1 ring-white/70 focus-within:ring-primary/20">
                <textarea
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder="Paste research, meeting notes, or a transcript here..."
                  className="h-72 w-full resize-none rounded-[22px] border-none bg-transparent px-4 py-4 text-sm leading-6 text-slate-700 outline-none placeholder:text-slate-400"
                />
              </div>
            </section>

            <section>
              <label className="mb-3 block text-sm font-semibold text-slate-600">Import from Web</label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex flex-1 items-center gap-3 rounded-[22px] bg-white/82 px-4 py-3 shadow-sm ring-1 ring-white/70 focus-within:ring-primary/20">
                  <span className="material-symbols-outlined text-slate-400">link</span>
                  <input
                    value={sourceUrl}
                    onChange={(event) => setSourceUrl(event.target.value)}
                    placeholder="https://example.com/article"
                    className="w-full border-none bg-transparent p-0 text-sm outline-none placeholder:text-slate-400"
                  />
                </div>
                <Button variant="secondary" className="px-6">Fetch</Button>
              </div>
            </section>

            <section>
              <label className="mb-3 block text-sm font-semibold text-slate-600">Upload Documents</label>
              <div className="group flex cursor-pointer flex-col items-center justify-center rounded-[28px] border-2 border-dashed border-outline-variant/40 bg-white/55 px-6 py-12 text-center transition-colors hover:bg-white/72">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white text-primary shadow-sm transition-transform group-hover:scale-105">
                  <span className="material-symbols-outlined text-4xl">upload_file</span>
                </div>
                <p className="font-semibold text-slate-900">Drop files here or click to browse</p>
                <p className="mt-2 text-xs text-slate-500">Support for PDF, Markdown, and TXT (Max 10MB)</p>
              </div>
            </section>
          </div>
        </section>

        <aside className="border-t border-white/40 bg-white/50 px-8 py-10 backdrop-blur-2xl lg:col-span-3 lg:border-l lg:border-t-0 lg:border-outline-variant/20 lg:px-8 xl:px-10">
          <div className="flex h-full flex-col">
            <h2 className="mb-8 flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900">
              <span className="material-symbols-outlined text-tertiary">settings_input_component</span>
              Configuration
            </h2>

            <div className="space-y-8">
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <label className="text-sm font-bold text-slate-900">Target Slide Count</label>
                  <span className="rounded-lg bg-primary/10 px-2 py-1 text-sm font-bold text-primary">{slideCount}</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={30}
                  value={slideCount}
                  onChange={(event) => setSlideCount(Number(event.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-primary"
                />
                <div className="mt-2 flex justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                  <span>Min (5)</span>
                  <span>Max (30)</span>
                </div>
              </div>

              <div>
                <label className="mb-4 block text-sm font-bold text-slate-900">Presentation Tone</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTone("professional")}
                    className={`flex flex-col items-center justify-center rounded-[22px] border-2 p-4 text-center transition-all ${tone === "professional" ? "border-primary bg-primary/5 text-primary" : "border-transparent bg-white/60 text-slate-500 hover:bg-white"}`}
                  >
                    <span className="material-symbols-outlined mb-2">work</span>
                    <span className="text-xs font-bold">Professional</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTone("creative")}
                    className={`flex flex-col items-center justify-center rounded-[22px] border-2 p-4 text-center transition-all ${tone === "creative" ? "border-primary bg-primary/5 text-primary" : "border-transparent bg-white/60 text-slate-500 hover:bg-white"}`}
                  >
                    <span className="material-symbols-outlined mb-2">brush</span>
                    <span className="text-xs font-bold">Creative</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-4 block text-sm font-bold text-slate-900">Target Audience</label>
                <select
                  value={audience}
                  onChange={(event) => setAudience(event.target.value)}
                  className="w-full rounded-[18px] border border-outline-variant/40 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option>Executive Leadership</option>
                  <option>Technical Team</option>
                  <option>General Public</option>
                  <option>Sales Prospect</option>
                </select>
              </div>

              <div className="rounded-[24px] border border-tertiary/10 bg-tertiary/5 p-4">
                <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-tertiary">
                  <span className="material-symbols-outlined text-sm">bolt</span>
                  Engine Power
                </div>
                <p className="text-xs leading-6 text-slate-500">
                  Using <span className="font-bold text-slate-900">GPT-5.4 compatible orchestration</span> for narrative synthesis and slide structure planning.
                </p>
              </div>
            </div>

            <div className="mt-12 border-t border-outline-variant/20 pt-8">
              <Button
                className="w-full py-4 text-base"
                onClick={handleStartGeneration}
                loading={updateProject.isPending}
                disabled={!name.trim()}
              >
                Start Generating
                <span className="material-symbols-outlined text-[18px]">auto_mode</span>
              </Button>
              <p className="mt-4 text-center text-[11px] font-medium uppercase tracking-[0.2em] text-slate-400">Estimated processing time: ~45 seconds</p>
            </div>
          </div>
        </aside>
      </main>

      <ProductFooter />
    </div>
  );
}
