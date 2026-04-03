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
    <div className="min-h-screen bg-surface">
      <ProductTopBar
        activeNav="projects"
        userLabel={user?.name || user?.email}
        actionLabel="Back to Projects"
        actionIcon="arrow_back"
        actionHref="/"
      />

      <main className="grid min-h-[calc(100vh-66px)] grid-cols-1 lg:grid-cols-12 gap-0">
        <section className="lg:col-span-3 bg-surface-container-low p-8 lg:p-12 border-b lg:border-b-0 lg:border-r border-outline-variant/15">
          <div className="lg:sticky lg:top-24">
            <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface mb-6">Setup Your Canvas</h1>
            <p className="text-on-surface-variant leading-relaxed mb-8">Transform raw data into a narrative masterpiece. Our AI analyzes your content to extract key themes, data points, and structural flow.</p>

            <div className="space-y-6">
              {[
                ["description", "Step 1", "Provide source material via text, file, or web URL.", "primary"],
                ["tune", "Step 2", "Configure tone, audience, and slide density.", "tertiary"],
                ["auto_awesome", "Step 3", "Generate a structured outline for your review.", "primary"],
              ].map(([icon, step, text, color], i) => (
                <div key={i} className="flex gap-4">
                  <div className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center ${color === "tertiary" ? "bg-tertiary/10 text-tertiary" : "bg-primary/10 text-primary"}`}>
                    <span className="material-symbols-outlined">{icon}</span>
                  </div>
                  <div>
                    <h3 className={`font-semibold text-sm uppercase tracking-wider ${color === "tertiary" ? "text-tertiary" : "text-primary"} mb-1`}>{step}</h3>
                    <p className="text-sm text-on-surface-variant">{text}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-16 p-6 rounded-2xl bg-white shadow-sm border border-outline-variant/15">
              <div className="w-full h-32 rounded-xl mb-4 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-5xl text-blue-300">palette</span>
              </div>
              <p className="text-xs font-medium text-slate-400 italic">"Design is intelligence made visible."</p>
            </div>
          </div>
        </section>

        <section className="lg:col-span-6 bg-surface p-8 lg:p-12 overflow-y-auto">
          <div className="mx-auto max-w-3xl space-y-10">
            <section>
              <div className="mb-4 flex items-center justify-between">
                <label className="text-lg font-bold font-headline text-on-surface">Project Details</label>
                <span className="text-xs font-medium text-on-surface-variant bg-surface-container-high px-2 py-1 rounded-lg">Edit</span>
              </div>
              <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/15 p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-3">Project Title</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-outline-variant/15 bg-surface-container-low text-on-surface focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                    placeholder="e.g., Annual Sales Kickoff"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-3">Description</label>
                  <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl border border-outline-variant/15 bg-surface-container-low text-on-surface focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none resize-none"
                    placeholder="What is this presentation about?"
                  />
                </div>
              </div>
            </section>

            <section>
              <div className="mb-4 flex items-center justify-between">
                <label className="text-lg font-bold font-headline text-on-surface">Input Content</label>
                <span className="text-xs font-medium text-on-surface-variant bg-surface-container-high px-2 py-1 rounded-lg">4,000 char limit</span>
              </div>
              <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/15 p-1 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <textarea
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  className="w-full h-64 bg-transparent border-none focus:ring-0 p-4 text-on-surface font-body resize-none"
                  placeholder="Paste your research, notes, or raw transcript here..."
                />
              </div>
            </section>

            <section>
              <label className="block text-sm font-semibold text-on-surface-variant mb-3">Import from Web</label>
              <div className="flex gap-3">
                <div className="flex-grow bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/15 flex items-center px-4 py-3 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                  <span className="material-symbols-outlined text-slate-400 mr-3">link</span>
                  <input
                    type="url"
                    value={sourceUrl}
                    onChange={(event) => setSourceUrl(event.target.value)}
                    className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm outline-none"
                    placeholder="https://example.com/article"
                  />
                </div>
                <Button variant="secondary" className="px-6">
                  <span className="material-symbols-outlined">download</span>
                  Fetch
                </Button>
              </div>
            </section>

            <section>
              <label className="block text-sm font-semibold text-on-surface-variant mb-3">Upload Documents</label>
              <div className="border-2 border-dashed border-outline-variant/40 rounded-2xl p-10 flex flex-col items-center justify-center bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer group">
                <div className="h-16 w-16 rounded-full bg-white shadow-sm flex items-center justify-center text-primary group-hover:scale-110 transition-transform mb-4">
                  <span className="material-symbols-outlined text-3xl">upload_file</span>
                </div>
                <p className="text-on-surface font-semibold">Drop files here or click to browse</p>
                <p className="text-on-surface-variant text-xs mt-2">Support for PDF, Markdown, and TXT (Max 10MB)</p>
              </div>
            </section>
          </div>
        </section>

        <aside className="lg:col-span-3 bg-surface-container-high/50 backdrop-blur-2xl p-8 lg:p-10 flex flex-col border-t lg:border-t-0 lg:border-l border-outline-variant/15">
          <h2 className="text-xl font-bold font-headline text-on-surface mb-8 flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary">settings_input_component</span>
            Configuration
          </h2>
          
          <div className="space-y-8 flex-grow">
            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="text-sm font-bold text-on-surface">Target Slide Count</label>
                <span className="text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-lg text-sm">{slideCount}</span>
              </div>
              <input
                type="range"
                min="5"
                max="30"
                value={slideCount}
                onChange={(event) => setSlideCount(Number(event.target.value))}
                className="w-full h-2 bg-outline-variant rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between mt-2 text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                <span>Min (5)</span>
                <span>Max (30)</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-on-surface mb-4">Presentation Tone</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setTone("professional")}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                    tone === "professional"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-transparent bg-white/50 text-slate-500 hover:bg-white"
                  }`}
                >
                  <span className="material-symbols-outlined mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>work</span>
                  <span className="text-xs font-bold">Professional</span>
                </button>
                <button
                  onClick={() => setTone("creative")}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                    tone === "creative"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-transparent bg-white/50 text-slate-500 hover:bg-white"
                  }`}
                >
                  <span className="material-symbols-outlined mb-2">brush</span>
                  <span className="text-xs font-bold">Creative</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-on-surface mb-4">Target Audience</label>
              <select
                value={audience}
                onChange={(event) => setAudience(event.target.value)}
                className="w-full bg-white border border-outline-variant/30 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              >
                <option>Executive Leadership</option>
                <option>Technical Team</option>
                <option>General Public</option>
                <option>Sales Prospect</option>
              </select>
            </div>

            <div className="p-4 rounded-2xl bg-tertiary/5 border border-tertiary/10">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-tertiary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                <span className="text-xs font-bold text-tertiary uppercase tracking-wider">Engine Power</span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">Using <span className="font-bold text-on-surface">GPT-4 Omni</span> for maximum creative reasoning and data synthesis.</p>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-outline-variant/15">
            <Button className="w-full py-4 px-6 rounded-2xl text-lg" onClick={handleStartGeneration}>
              Start Generating
              <span className="material-symbols-outlined">auto_mode</span>
            </Button>
          </div>
        </aside>
      </main>

      <ProductFooter />
    </div>
  );
}
