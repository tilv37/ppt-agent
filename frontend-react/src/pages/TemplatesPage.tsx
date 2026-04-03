import { useNavigate } from 'react-router-dom';
import ProductChrome from '../components/ProductChrome';

export default function TemplatesPage() {
  const navigate = useNavigate();

  return (
    <ProductChrome activeNav="templates">
      <main className="min-h-[calc(100vh-160px)] bg-gradient-to-br from-slate-50 to-blue-50/30 px-6 py-12 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-10">
          {/* Header */}
          <header className="text-center">
            <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight">
              Template Management
            </h1>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              Manage layout patterns and asset library for the generation pipeline
            </p>
          </header>

          {/* Module Cards */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Layout Pattern Management Card */}
            <div className="group relative bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200/50">
              <div className="flex flex-col h-full">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <div className="inline-block px-3 py-1 bg-blue-50 rounded-full mb-4">
                      <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                        Module 01
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-3">
                      Layout Pattern Management
                    </h2>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Upload layout screenshots, capture pattern metadata, and maintain reusable
                      structured layout definitions.
                    </p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center">
                      <span className="material-symbols-outlined text-blue-600 text-3xl">
                        dashboard_customize
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-auto">
                  <button
                    onClick={() => navigate('/templates/layout-patterns')}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 group-hover:scale-[1.02]"
                  >
                    <span>Open Layout Patterns</span>
                    <span className="material-symbols-outlined text-xl">arrow_forward</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Asset Library Management Card */}
            <div className="group relative bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200/50">
              <div className="flex flex-col h-full">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <div className="inline-block px-3 py-1 bg-purple-50 rounded-full mb-4">
                      <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">
                        Module 02
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-3">
                      Asset Library Management
                    </h2>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Upload PPT source files, track extraction tasks, and curate searchable assets
                      for visual matching.
                    </p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center">
                      <span className="material-symbols-outlined text-purple-600 text-3xl">
                        photo_library
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-auto">
                  <button
                    onClick={() => navigate('/templates/assets')}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white px-6 py-3.5 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 group-hover:scale-[1.02]"
                  >
                    <span>Open Asset Library</span>
                    <span className="material-symbols-outlined text-xl">arrow_forward</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Info Note */}
          <div className="bg-blue-50/50 border border-blue-200/50 rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-blue-600 text-xl mt-0.5">info</span>
              <div>
                <p className="text-sm font-semibold text-slate-900 mb-1">About Template Management</p>
                <p className="text-sm text-slate-600 leading-relaxed">
                  This page focuses on management workflows. Layout patterns and asset library are used by AI agents during slide generation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </ProductChrome>
  );
}
