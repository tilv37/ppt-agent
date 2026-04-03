"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Spinner } from "@/components/ui";
import { ProductFooter, ProductTopBar } from "@/components/layout/ProductChrome";
import { useProjects, useCreateProject, useDeleteProject } from "@/hooks/useProjects";
import { useLogout, useCurrentUser } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/authStore";

const PROJECT_GRADIENTS = [
  "from-blue-100 via-white to-indigo-50",
  "from-violet-100 via-white to-fuchsia-50",
  "from-cyan-100 via-white to-sky-50",
  "from-emerald-100 via-white to-teal-50",
  "from-amber-100 via-white to-orange-50",
  "from-rose-100 via-white to-pink-50",
];

function formatUpdatedAt(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < hour) {
    const minutes = Math.max(1, Math.round(diff / minute));
    return `Updated ${minutes}m ago`;
  }

  if (diff < day) {
    const hours = Math.max(1, Math.round(diff / hour));
    return `Updated ${hours}h ago`;
  }

  const days = Math.max(1, Math.round(diff / day));
  return `Updated ${days}d ago`;
}

function getStatusLabel(status: string) {
  switch (status) {
    case "completed":
      return "Ready";
    case "generating":
      return "Generating";
    case "failed":
      return "Needs Review";
    default:
      return "Draft";
  }
}

function getStatusClasses(status: string) {
  switch (status) {
    case "completed":
      return "bg-emerald-100 text-emerald-700";
    case "generating":
      return "bg-amber-100 text-amber-700";
    case "failed":
      return "bg-red-100 text-red-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

export default function HomePage() {
  const router = useRouter();
  const { data: user } = useCurrentUser();
  const { data: projects, isLoading } = useProjects();
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();
  const logout = useLogout();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const storedUser = useAuthStore((state) => state.user);
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
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const handleCreateProject = async () => {
    const name = projectName.trim() || "New Presentation";
    const description = projectDescription.trim() || "A new AI-generated presentation";
    const result = await createProject.mutateAsync({
      name,
      description,
    });
    setProjectName("");
    setProjectDescription("");
    setIsCreateOpen(false);
    router.push(`/project/${result.id}/setup`);
  };

  const handleDeleteProject = async (id: string) => {
    if (confirm("Are you sure you want to delete this project?")) {
      await deleteProject.mutateAsync(id);
    }
  };

  const filteredProjects = (projects || []).filter((project) => {
    if (!searchQuery.trim()) {
      return true;
    }

    const query = searchQuery.toLowerCase();
    return (
      project.name.toLowerCase().includes(query) ||
      project.description?.toLowerCase().includes(query) ||
      project.status.toLowerCase().includes(query)
    );
  });

  const totalSlides = (projects || []).reduce((count, project) => {
    return count + (project.presentations?.[0]?._count.slides || 0);
  }, 0);

  const completedProjects = (projects || []).filter((project) => project.status === "completed").length;
  const activeProjects = (projects || []).filter((project) => project.status === "generating").length;

  return (
    <div className="min-h-screen">
      <ProductTopBar
        activeNav="projects"
        userLabel={user?.name || user?.email || storedUser?.name || storedUser?.email}
        onLogout={() => logout.mutate()}
        actionLabel="Create New"
        actionIcon="add"
        onAction={() => setIsCreateOpen(true)}
        searchSlot={
          <label className="flex min-w-[280px] items-center gap-3 rounded-full border border-white/70 bg-slate-50 px-4 py-2 shadow-sm">
            <span className="material-symbols-outlined text-[18px] text-slate-400">search</span>
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search projects..."
              className="w-full border-none bg-transparent p-0 text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
          </label>
        }
      />

      <main className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col px-6 py-8">
        <section className="mb-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary shadow-sm ring-1 ring-blue-100">
              <span className="material-symbols-outlined text-[16px]">dashboard</span>
              Presentation Workspace
            </div>
            <h1 className="max-w-3xl font-headline text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              My Projects
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              Organize narrative canvases, monitor generation progress, and reopen decks in the editor with the same structure approved in the prototype.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="surface-panel halo-ring rounded-[28px] px-5 py-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Projects</div>
              <div className="mt-3 text-3xl font-extrabold text-slate-900">{projects?.length || 0}</div>
              <div className="mt-2 text-xs text-slate-500">Total active workspaces</div>
            </div>
            <div className="surface-panel halo-ring rounded-[28px] px-5 py-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Slides</div>
              <div className="mt-3 text-3xl font-extrabold text-slate-900">{totalSlides}</div>
              <div className="mt-2 text-xs text-slate-500">Across all presentations</div>
            </div>
            <div className="surface-panel halo-ring rounded-[28px] px-5 py-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Status</div>
              <div className="mt-3 flex items-center gap-2 text-3xl font-extrabold text-slate-900">
                {completedProjects}
                <span className="text-sm font-semibold text-emerald-600">ready</span>
              </div>
              <div className="mt-2 text-xs text-slate-500">{activeProjects} currently generating</div>
            </div>
          </div>
        </section>

        {isLoading ? (
          <div className="flex min-h-[420px] items-center justify-center rounded-[32px] bg-white/70 shadow-ambient">
            <Spinner size="lg" />
          </div>
        ) : filteredProjects.length > 0 ? (
          <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredProjects.map((project, index) => {
              const slideCount = project.presentations?.[0]?._count.slides || 0;

              return (
                <article
                  key={project.id}
                  className="group rounded-[30px] bg-white/84 p-4 shadow-[0_24px_60px_rgba(15,23,42,0.08)] ring-1 ring-white/80 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_32px_70px_rgba(15,23,42,0.12)]"
                >
                  <button
                    type="button"
                    onClick={() => router.push(`/project/${project.id}`)}
                    className="w-full text-left"
                  >
                    <div className={`relative mb-5 aspect-[16/10] overflow-hidden rounded-[24px] bg-gradient-to-br ${PROJECT_GRADIENTS[index % PROJECT_GRADIENTS.length]} p-6`}>
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.75),transparent_30%)]" />
                      <div className="relative flex h-full flex-col justify-between">
                        <div className="flex items-start justify-between gap-3">
                          <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ${getStatusClasses(project.status)}`}>
                            {getStatusLabel(project.status)}
                          </span>
                          <span className="material-symbols-outlined text-4xl text-slate-300 transition-transform duration-300 group-hover:scale-110">slideshow</span>
                        </div>
                        <div>
                          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">AI slide deck</div>
                          <h2 className="font-headline text-2xl font-extrabold tracking-tight text-slate-900">
                            {project.name}
                          </h2>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 px-1">
                      <p className="line-clamp-2 min-h-10 text-sm leading-6 text-slate-500">
                        {project.description || "A fresh presentation canvas ready for AI-assisted structuring and editing."}
                      </p>
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[15px]">calendar_today</span>
                          {formatUpdatedAt(project.updatedAt)}
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
                          {slideCount} slides
                        </span>
                      </div>
                    </div>
                  </button>

                  <div className="mt-5 flex gap-3">
                    <Button className="flex-1" onClick={() => router.push(`/project/${project.id}`)}>
                      Open Project
                    </Button>
                    <Button variant="secondary" onClick={() => router.push(`/project/${project.id}/setup`)}>
                      Setup
                    </Button>
                    <Button variant="ghost" onClick={() => handleDeleteProject(project.id)}>
                      Delete
                    </Button>
                  </div>
                </article>
              );
            })}
          </section>
        ) : (
          <section className="surface-panel halo-ring flex min-h-[420px] flex-col items-center justify-center rounded-[36px] px-6 py-12 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-violet-100 text-primary">
              <span className="material-symbols-outlined text-4xl">auto_awesome</span>
            </div>
            <h2 className="font-headline text-3xl font-extrabold tracking-tight text-slate-900">
              {searchQuery ? "No matching projects" : "No projects yet"}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
              {searchQuery
                ? "Adjust the search query or create a new presentation workspace."
                : "Create your first AI-powered presentation and continue through setup, generation, and the editor workspace."}
            </p>
            <Button className="mt-8" onClick={() => setIsCreateOpen(true)}>
              Create Project
            </Button>
          </section>
        )}
      </main>

      {isCreateOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/20 p-6 backdrop-blur-sm">
          <div className="w-full max-w-xl overflow-hidden rounded-[32px] bg-white shadow-[0_36px_120px_rgba(15,23,42,0.2)]">
            <div className="p-8">
              <div className="mb-8 flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-headline text-3xl font-extrabold tracking-tight text-slate-900">Create Project</h2>
                  <p className="mt-2 text-sm text-slate-500">Define the canvas before moving into setup and AI generation.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-800">Project Title</label>
                  <input
                    value={projectName}
                    onChange={(event) => setProjectName(event.target.value)}
                    placeholder="e.g., Annual Sales Kickoff"
                    className="w-full rounded-2xl border border-outline-variant bg-surface-container-low px-4 py-3 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-800">Description</label>
                  <textarea
                    value={projectDescription}
                    onChange={(event) => setProjectDescription(event.target.value)}
                    placeholder="What is this presentation about?"
                    rows={4}
                    className="w-full resize-none rounded-2xl border border-outline-variant bg-surface-container-low px-4 py-3 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button className="flex-1" loading={createProject.isPending} onClick={handleCreateProject}>
                  Generate Canvas
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-3 border-t border-slate-100 bg-slate-50 px-8 py-4 text-xs text-slate-500">
              <span className="material-symbols-outlined text-tertiary">auto_awesome</span>
              Our AI can draft the project structure once the title is defined.
            </div>
          </div>
        </div>
      ) : null}

      <ProductFooter />
    </div>
  );
}
