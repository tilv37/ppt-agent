import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects, useCreateProject, useDeleteProject } from '../hooks/useProjects';
import ProductChrome from '../components/ProductChrome';

const PROJECT_GRADIENTS = [
  'from-blue-400 to-blue-600',
  'from-purple-400 to-purple-600',
  'from-cyan-400 to-cyan-600',
  'from-emerald-400 to-emerald-600',
  'from-amber-400 to-amber-600',
  'from-rose-400 to-rose-600',
];

export default function HomePage() {
  const navigate = useNavigate();
  const { data: projects = [], isLoading } = useProjects();
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) return;

    try {
      await createProject.mutateAsync({
        name: projectName.trim(),
        description: projectDescription.trim() || undefined,
      });
      setProjectName('');
      setProjectDescription('');
      setIsCreateOpen(false);
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  return (
    <ProductChrome activeNav="projects">
      <main className="min-h-[calc(100vh-160px)] bg-gradient-to-br from-slate-50 to-blue-50/30 px-6 py-12 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
            <div>
              <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 mb-2">
                My Projects
              </h1>
              <p className="text-lg text-slate-600">
                Organize and manage your intelligent presentation outlines
              </p>
            </div>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 rounded-xl font-semibold shadow-lg transition-all duration-200"
            >
              <span className="material-symbols-outlined text-xl">add</span>
              <span>Create New</span>
            </button>
          </header>

          {/* Content */}
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                <p className="text-slate-500">Loading projects...</p>
              </div>
            </div>
          ) : projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project, idx) => (
                <div
                  key={project.id}
                  onClick={() => navigate(`/project/${project.id}/setup`)}
                  className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-slate-200/50 overflow-hidden"
                >
                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete project "${project.name}"? This cannot be undone.`)) {
                        deleteProject.mutate(project.id);
                      }
                    }}
                    className="absolute right-4 top-4 z-10 p-2 bg-white/90 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>

                  {/* Thumbnail */}
                  <div
                    className={`aspect-video bg-gradient-to-br ${
                      PROJECT_GRADIENTS[idx % 6]
                    } relative flex items-center justify-center`}
                  >
                    <span className="material-symbols-outlined text-white/40 text-6xl">
                      slideshow
                    </span>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="bg-white text-blue-600 px-5 py-2.5 rounded-full font-bold text-sm flex items-center gap-2">
                        <span>Open Project</span>
                        <span className="material-symbols-outlined text-lg">arrow_forward</span>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-slate-900 mb-3 line-clamp-1">
                      {project.name}
                    </h3>
                    <div className="flex justify-between items-center text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-base">calendar_today</span>
                        <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                      </div>
                      <div className="bg-slate-100 px-3 py-1.5 rounded-full font-semibold text-slate-700">
                        {project.presentations?.[0]?._count?.slides || 0} Slides
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-slate-200/50">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-blue-600 text-5xl">
                  add_circle
                </span>
              </div>
              <h2 className="text-3xl font-extrabold text-slate-900 mb-3">No projects yet</h2>
              <p className="text-base text-slate-600 mb-8 max-w-md mx-auto">
                Create your first presentation project to get started with AI-powered slide generation
              </p>
              <button
                onClick={() => setIsCreateOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl font-semibold shadow-lg transition-all"
              >
                Create Your First Project
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
            <div className="px-8 pt-8 pb-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                    Create Project
                  </h2>
                  <p className="text-slate-600 text-sm mt-2">
                    Start a new presentation project
                  </p>
                </div>
                <button
                  onClick={() => setIsCreateOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleCreateProject} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Project Title
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                    placeholder="e.g., Annual Sales Kickoff"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Description <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <textarea
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
                    placeholder="What is this presentation about?"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="flex-1 py-3 px-4 rounded-xl text-slate-700 font-semibold bg-slate-100 hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!projectName.trim() || createProject.isPending}
                    className="flex-1 py-3 px-4 rounded-xl text-white font-semibold bg-blue-600 hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {createProject.isPending ? 'Creating...' : 'Create Project'}
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-blue-50 px-8 py-4 flex items-center gap-3 border-t border-blue-100">
              <span className="material-symbols-outlined text-blue-600 text-xl">auto_awesome</span>
              <p className="text-sm text-slate-600">
                AI will help generate your presentation outline
              </p>
            </div>
          </div>
        </div>
      )}
    </ProductChrome>
  );
}
