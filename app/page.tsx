"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Spinner } from "@/components/ui";
import { ProductFooter, ProductTopBar } from "@/components/layout/ProductChrome";
import { useProjects, useCreateProject, useDeleteProject } from "@/hooks/useProjects";
import { useAuthStore } from "@/store/authStore";

const PROJECT_GRADIENTS = [
  "from-blue-100 to-indigo-50",
  "from-purple-100 to-fuchsia-50",
  "from-sky-100 to-cyan-50",
  "from-emerald-100 to-teal-50",
  "from-amber-100 to-orange-50",
  "from-rose-100 to-pink-50",
];

export default function HomePage() {
  const router = useRouter();
  const { data: projects = [], isLoading } = useProjects();
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated()) {
    return <div className="flex min-h-screen items-center justify-center"><Spinner size="lg" /></div>;
  }

  const handleCreateProject = async () => {
    if (!projectName.trim()) return;
    try {
      const result = await createProject.mutateAsync({
        name: projectName.trim(),
        description: projectDescription.trim() || "",
      });
      setProjectName("");
      setProjectDescription("");
      setIsCreateOpen(false);
      router.push(`/project/${result.id}/setup`);
    } catch (error) {
      console.error("Failed to create project:", error);
    }
  };

  const filteredProjects = projects.filter((p) =>
    searchQuery ? p.name.toLowerCase().includes(searchQuery.toLowerCase()) : true
  );

  const totalSlides = projects.reduce((sum, p) => sum + (p.presentations?.[0]?._count?.slides || 0), 0);
  const completedCount = projects.filter((p) => p.status === "completed").length;

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <ProductTopBar
        activeNav="projects"
        userLabel={user?.name || user?.email}
        actionLabel="Create New"
        actionIcon="add"
        onAction={() => setIsCreateOpen(true)}
        searchSlot={
          <label className="flex items-center gap-3 rounded-full border border-white/70 bg-slate-50 px-4 py-2 shadow-sm w-64">
            <span className="material-symbols-outlined text-slate-400">search</span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="w-full border-none bg-transparent p-0 text-sm outline-none placeholder:text-slate-400"
            />
          </label>
        }
      />

      <main className="flex-grow px-6 py-8 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 mb-4 text-[11px] font-semibold uppercase tracking-wide text-primary shadow-sm">
            <span className="material-symbols-outlined text-[16px]">dashboard</span>
            Workspace
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">My Projects</h1>
          <p className="text-sm text-slate-500 max-w-2xl">Manage your AI-powered presentation canvases with intelligent slide generation.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/5 shadow-sm">
            <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Projects</div>
            <div className="text-3xl font-extrabold text-slate-900 mt-3">{projects.length}</div>
            <div className="text-xs text-slate-500 mt-2">Total workspaces</div>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/5 shadow-sm">
            <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Slides</div>
            <div className="text-3xl font-extrabold text-slate-900 mt-3">{totalSlides}</div>
            <div className="text-xs text-slate-500 mt-2">Across all presentations</div>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/5 shadow-sm">
            <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Ready</div>
            <div className="text-3xl font-extrabold text-slate-900 mt-3">{completedCount}</div>
            <div className="text-xs text-slate-500 mt-2">Completed projects</div>
          </div>
        </div>

        {/* Projects Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]"><Spinner size="lg" /></div>
        ) : filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project, idx) => (
              <div
                key={project.id}
                onClick={() => router.push(`/project/${project.id}`)}
                className="group relative cursor-pointer bg-surface-container-lowest rounded-xl p-4 transition-all hover:-translate-y-1 hover:shadow-2xl border border-outline-variant/5 shadow-sm text-inherit block"
              >
                <button
                  onClick={(e) => { e.stopPropagation(); e.preventDefault();
                    if (confirm(`Delete project "${project.name}"? This cannot be undone.`)) {
                      deleteProject.mutate(project.id);
                    }
                  }}
                  title="Delete project"
                  className="absolute right-3 top-3 z-10 rounded-full p-1.5 text-slate-500 hover:text-red-600 bg-white/0 hover:bg-white/80 transition-colors"
                >
                  <span className="material-symbols-outlined">delete</span>
                </button>

                <div className={`aspect-video rounded-lg overflow-hidden mb-4 bg-gradient-to-br ${PROJECT_GRADIENTS[idx % 6]} relative flex items-center justify-center`}>
                  <span className="material-symbols-outlined text-5xl text-slate-300 group-hover:scale-110 transition-transform">slideshow</span>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="bg-white text-primary px-4 py-2 rounded-full font-bold text-sm">Open</span>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-on-surface mb-2">{project.name}</h3>
                <div className="flex justify-between items-center text-xs text-on-surface-variant">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                    {new Date(project.updatedAt).toLocaleDateString()}
                  </span>
                  <span className="bg-surface-container-high px-2 py-1 rounded text-on-secondary-container">
                    {project.presentations?.[0]?._count?.slides || 0} Slides
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-surface-container-lowest rounded-2xl p-12 text-center border border-outline-variant/5 shadow-sm min-h-[400px] flex flex-col items-center justify-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4 mx-auto">
              <span className="material-symbols-outlined text-2xl">auto_awesome</span>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900">No projects found</h2>
            <p className="text-sm text-slate-500 mt-2 max-w-sm">Create your first presentation to get started.</p>
            <Button className="mt-6" onClick={() => setIsCreateOpen(true)}>Create Project</Button>
          </div>
        )}
      </main>

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-on-background/20 backdrop-blur-sm p-6">
          <div className="bg-surface-container-lowest w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-outline-variant/15">
            <div className="px-8 pt-8 pb-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-extrabold text-on-surface tracking-tight font-headline">Create Project</h2>
                  <p className="text-on-surface-variant text-sm mt-1">Define your canvas for intelligent slide generation.</p>
                </div>
                <button
                  onClick={() => setIsCreateOpen(false)}
                  className="text-outline hover:text-on-surface transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-on-surface">Project Title</label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="e.g., Q4 Strategy Deck"
                    className="w-full px-4 py-3 rounded-xl border border-outline-variant/15 bg-surface-container-low text-on-surface focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-on-surface">Description <span className="text-on-surface-variant font-normal">(Optional)</span></label>
                  <textarea
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    placeholder="What is this presentation about?"
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-outline-variant/15 bg-surface-container-low text-on-surface focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none resize-none"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setIsCreateOpen(false)}
                    className="flex-1 py-3 px-4 rounded-xl text-on-surface font-semibold bg-surface-container-high hover:bg-surface-container-highest transition-colors"
                  >
                    Cancel
                  </button>
                  <Button className="flex-1" onClick={handleCreateProject} disabled={!projectName.trim()}>
                    Create & Setup
                  </Button>
                </div>
              </div>
            </div>
            <div className="bg-surface-container-low px-8 py-4 flex items-center gap-3 border-t border-outline-variant/10">
              <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              <p className="text-xs text-on-surface-variant">Configure content and settings in the setup flow, then AI will generate your slide outline.</p>
            </div>
          </div>
        </div>
      )}

      <ProductFooter />
    </div>
  );
}