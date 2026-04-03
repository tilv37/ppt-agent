import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductChrome from '../components/ProductChrome';

const CATEGORIES = ['content', 'cover', 'section', 'conclusion'] as const;
type Category = (typeof CATEGORIES)[number];

export default function TemplatesLayoutPatternsPage() {
  const navigate = useNavigate();
  const [category, setCategory] = useState<Category>('content');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [layoutJson, setLayoutJson] = useState(
    '{"layout": {"type": "grid", "params": {"minColumns": 2, "maxColumns": 4, "gap": 24}}}'
  );

  return (
    <ProductChrome activeNav="templates">
      <main className="min-h-[calc(100vh-160px)] bg-gradient-to-br from-slate-50 to-blue-50/30 px-6 py-8 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
                Layout Pattern Management
              </h1>
              <p className="mt-2 text-base text-slate-600">
                Manage structured layout patterns used by LayoutSelectorAgent
              </p>
            </div>
            <button
              onClick={() => navigate('/templates')}
              className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl border border-slate-200 transition-all"
            >
              <span className="material-symbols-outlined text-xl">arrow_back</span>
              <span>Back</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            {/* Main Content */}
            <section className="xl:col-span-2 space-y-6">
              {/* Category Filter */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/50">
                <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wider">
                  Filter by Category
                </h3>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setCategory(item)}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${
                        category === item
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              {/* Patterns List */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/50">
                <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wider">
                  Patterns ({category})
                </h3>
                <div className="bg-slate-50 rounded-xl p-8 text-center">
                  <span className="material-symbols-outlined text-slate-300 text-5xl mb-3 block">
                    dashboard_customize
                  </span>
                  <p className="text-sm text-slate-500">
                    No layout patterns found for this category
                  </p>
                </div>
              </div>

              {/* Info Banner */}
              <div className="bg-amber-50 border border-amber-200/50 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-amber-600 text-xl">info</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 mb-1">
                      Backend API not implemented yet
                    </p>
                    <p className="text-sm text-slate-600">
                      Layout pattern CRUD endpoints are planned for Phase 1 implementation.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Sidebar - Create Form */}
            <aside className="space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/50 sticky top-24">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-blue-600 text-xl">add</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Create Pattern</h2>
                    <p className="text-xs text-slate-500">Add new layout definition</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                      Name
                    </label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                      placeholder="e.g. multi-column-icon-text"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
                      placeholder="Pattern usage and structure"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                      Layout JSON
                    </label>
                    <textarea
                      rows={8}
                      value={layoutJson}
                      onChange={(e) => setLayoutJson(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-mono outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
                    />
                  </div>

                  <button
                    disabled
                    className="w-full bg-slate-300 text-slate-500 px-4 py-3 rounded-lg font-semibold cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">lock</span>
                    <span>Coming Soon</span>
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </ProductChrome>
  );
}
