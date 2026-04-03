import { useParams, useNavigate } from 'react-router-dom';
import { useProject } from '../hooks/useProjects';
import ProductChrome from '../components/ProductChrome';

export default function ProjectEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: project, isLoading } = useProject(id!);

  if (isLoading) {
    return (
      <ProductChrome>
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-slate-500">Loading editor...</p>
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
            <button onClick={() => navigate('/')} className="text-blue-600 hover:text-blue-700 font-semibold">
              Back to projects
            </button>
          </div>
        </div>
      </ProductChrome>
    );
  }

  // Mock slides data
  const slides = [
    { id: 1, title: 'Cover Slide', gradient: 'from-blue-400 to-blue-600' },
    { id: 2, title: 'Introduction', gradient: 'from-purple-400 to-purple-600' },
    { id: 3, title: 'Key Points', gradient: 'from-cyan-400 to-cyan-600' },
    { id: 4, title: 'Data Analysis', gradient: 'from-emerald-400 to-emerald-600' },
    { id: 5, title: 'Conclusion', gradient: 'from-amber-400 to-amber-600' },
  ];

  return (
    <div className="bg-slate-100 h-screen flex flex-col overflow-hidden">
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200 flex justify-between items-center px-6 py-3 shadow-sm">
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate('/')}
            className="text-2xl font-bold tracking-tight text-slate-900 hover:text-blue-600 transition-colors"
          >
            DeckGenie
          </button>
          <div className="h-6 w-px bg-slate-200"></div>
          <div className="flex items-center gap-2 text-sm">
            <span className="material-symbols-outlined text-slate-400 text-lg">folder</span>
            <span className="font-semibold text-slate-700">{project.name}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all">
            <span className="material-symbols-outlined">settings</span>
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-all"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            <span>Exit</span>
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Slide Thumbnails */}
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
          <div className="p-4 border-b border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Slides
              </span>
              <span className="text-xs font-semibold text-blue-600">{slides.length} Total</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {slides.map((slide, idx) => (
              <div
                key={slide.id}
                className="group cursor-pointer bg-slate-50 hover:bg-slate-100 rounded-xl p-3 transition-all border border-slate-200 hover:border-blue-300 hover:shadow-sm"
              >
                <div
                  className={`aspect-video rounded-lg bg-gradient-to-br ${slide.gradient} mb-2 flex items-center justify-center shadow-sm`}
                >
                  <span className="text-3xl font-bold text-white/80">{idx + 1}</span>
                </div>
                <p className="text-xs font-semibold text-slate-700 truncate">{slide.title}</p>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-slate-200">
            <button className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-lg">add</span>
              <span>Add Slide</span>
            </button>
          </div>
        </aside>

        {/* Center: Canvas */}
        <div className="flex-1 flex flex-col bg-slate-100">
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="bg-white rounded-xl shadow-2xl" style={{ width: '960px', height: '540px' }}>
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <span className="material-symbols-outlined text-white text-4xl">slideshow</span>
                  </div>
                  <h1 className="text-4xl font-bold text-slate-900 mb-3">{project.name}</h1>
                  <p className="text-lg text-slate-600">Slide 1 of {slides.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Playback Controls */}
          <div className="bg-white border-t border-slate-200 p-4 flex items-center justify-center gap-4">
            <button className="p-2.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-all">
              <span className="material-symbols-outlined">skip_previous</span>
            </button>
            <button className="p-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all">
              <span className="material-symbols-outlined">play_arrow</span>
            </button>
            <button className="p-2.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-all">
              <span className="material-symbols-outlined">skip_next</span>
            </button>
            <div className="mx-4 text-sm font-semibold text-slate-600">1 / {slides.length}</div>
          </div>
        </div>

        {/* Right Sidebar: AI Assistant */}
        <aside className="w-80 bg-white border-l border-slate-200 flex flex-col">
          <div className="p-4 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-purple-600 text-lg">auto_awesome</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900">AI Assistant</h3>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <p className="text-sm text-slate-700 leading-relaxed">
                Hi! I'm your AI assistant. I can help you edit slides, suggest content, or answer
                questions about your presentation.
              </p>
            </div>

            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="material-symbols-outlined text-slate-300 text-4xl">chat</span>
              </div>
              <p className="text-sm text-slate-500">
                Chat feature coming soon
              </p>
            </div>
          </div>

          <div className="p-4 border-t border-slate-200">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ask AI anything..."
                className="flex-1 px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                disabled
              />
              <button
                className="p-2.5 bg-slate-300 text-slate-500 rounded-lg cursor-not-allowed"
                disabled
              >
                <span className="material-symbols-outlined">send</span>
              </button>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
