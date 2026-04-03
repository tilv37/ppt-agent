import { useParams, useNavigate } from 'react-router-dom';
import { useProject } from '../hooks/useProjects';
import ProductChrome from '../components/ProductChrome';

export default function ProjectSetupPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: project, isLoading } = useProject(id!);

  if (isLoading) {
    return (
      <ProductChrome>
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-slate-500">Loading project...</p>
          </div>
        </div>
      </ProductChrome>
    );
  }

  if (!project) {
    return (
      <ProductChrome>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-red-600 text-4xl">error</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Project not found</h2>
            <button
              onClick={() => navigate('/')}
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              Back to projects
            </button>
          </div>
        </div>
      </ProductChrome>
    );
  }

  return (
    <ProductChrome>
      <main className="min-h-[calc(100vh-160px)] bg-gradient-to-br from-slate-50 to-emerald-50/30">
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-160px)]">
          {/* Left Sidebar - Instructions */}
          <aside className="lg:col-span-4 bg-white border-r border-slate-200 p-8 lg:p-12">
            <div className="sticky top-24 space-y-8">
              <div>
                <div className="inline-block px-3 py-1 bg-emerald-50 rounded-full mb-4">
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                    Step 1
                  </span>
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-4">
                  Setup Your Canvas
                </h1>
                <p className="text-slate-600 leading-relaxed">
                  Transform raw data into a narrative masterpiece. Our AI analyzes your content to
                  extract key themes, data points, and structural flow.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                    <span className="material-symbols-outlined text-blue-600 text-2xl">
                      description
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">Upload Content</h3>
                    <p className="text-sm text-slate-600">
                      PDF, Word, or paste text directly
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                    <span className="material-symbols-outlined text-purple-600 text-2xl">
                      auto_awesome
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">AI Analysis</h3>
                    <p className="text-sm text-slate-600">
                      Extract structure and key points
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <span className="material-symbols-outlined text-emerald-600 text-2xl">
                      slideshow
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">Generate Slides</h3>
                    <p className="text-sm text-slate-600">
                      Create presentation outline
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Right Content - Upload Area */}
          <div className="lg:col-span-8 p-8 lg:p-12">
            <div className="max-w-3xl mx-auto space-y-8">
              {/* Project Info */}
              <div>
                <h2 className="text-3xl font-bold text-slate-900 mb-2">{project.name}</h2>
                {project.description && (
                  <p className="text-slate-600">{project.description}</p>
                )}
              </div>

              {/* Upload Area */}
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200/50">
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer">
                  <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-blue-600 text-4xl">
                      cloud_upload
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    Upload Your Content
                  </h3>
                  <p className="text-sm text-slate-600 mb-6">
                    Drag and drop files here, or click to browse
                  </p>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all">
                    Choose Files
                  </button>
                  <p className="text-xs text-slate-500 mt-4">
                    Supports PDF, DOCX, TXT, or paste text directly
                  </p>
                </div>
              </div>

              {/* Text Input */}
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200/50">
                <label className="block text-sm font-bold text-slate-900 mb-3">
                  Or paste your content here
                </label>
                <textarea
                  className="w-full h-48 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
                  placeholder="Paste your presentation content here..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={() => navigate('/')}
                  className="flex-1 py-3.5 px-4 rounded-xl text-slate-700 font-semibold bg-white hover:bg-slate-50 border border-slate-200 transition-all"
                >
                  Back to Projects
                </button>
                <button
                  onClick={() => navigate(`/project/${id}/editor`)}
                  className="flex-1 py-3.5 px-4 rounded-xl text-white font-semibold bg-emerald-600 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                >
                  <span>Generate Slides</span>
                  <span className="material-symbols-outlined text-xl">arrow_forward</span>
                </button>
              </div>

              {/* Info Box */}
              <div className="bg-amber-50 border border-amber-200/50 rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-amber-600 text-xl">info</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 mb-1">
                      Content upload feature coming soon
                    </p>
                    <p className="text-sm text-slate-600">
                      For now, you can proceed to the editor to see the interface.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </ProductChrome>
  );
}
