import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductChrome from '../components/ProductChrome';

type AssetType = 'all' | 'icon' | 'illustration' | 'chart' | 'decoration';

export default function TemplatesAssetsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<AssetType>('all');

  return (
    <ProductChrome activeNav="templates">
      <main className="min-h-[calc(100vh-160px)] bg-gradient-to-br from-slate-50 to-purple-50/30 px-6 py-8 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
                Asset Library Management
              </h1>
              <p className="mt-2 text-base text-slate-600">
                Search and maintain assets used by AssetMatcherAgent
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
              {/* Search & Filter */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/50">
                <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wider">
                  Search & Filter
                </h3>
                <div className="flex flex-col gap-3 md:flex-row">
                  <div className="flex-1 relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
                      search
                    </span>
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all"
                      placeholder="Search by tag, keyword, category..."
                    />
                  </div>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value as AssetType)}
                    className="px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm font-medium outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all"
                  >
                    <option value="all">All Types</option>
                    <option value="icon">Icon</option>
                    <option value="illustration">Illustration</option>
                    <option value="chart">Chart</option>
                    <option value="decoration">Decoration</option>
                  </select>
                </div>
              </div>

              {/* Assets List */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/50">
                <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wider">
                  Assets Library
                </h3>
                <div className="bg-slate-50 rounded-xl p-8 text-center">
                  <span className="material-symbols-outlined text-slate-300 text-5xl mb-3 block">
                    photo_library
                  </span>
                  <p className="text-sm text-slate-500">
                    No assets available. Upload a PPT to begin extraction.
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
                      Asset library and PPT extraction endpoints are planned for Phase 1 implementation.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Sidebar - Upload */}
            <aside className="space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/50 sticky top-24">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-purple-600 text-xl">upload_file</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Upload PPT</h2>
                    <p className="text-xs text-slate-500">Extract assets from file</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50">
                    <span className="material-symbols-outlined text-slate-300 text-4xl mb-3 block">
                      cloud_upload
                    </span>
                    <p className="text-sm text-slate-600 mb-2">
                      Drag & drop or click to upload
                    </p>
                    <p className="text-xs text-slate-400">
                      Supports .pptx files
                    </p>
                  </div>

                  <button
                    disabled
                    className="w-full bg-slate-300 text-slate-500 px-4 py-3 rounded-lg font-semibold cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">lock</span>
                    <span>Coming Soon</span>
                  </button>
                </div>

                {/* Task Status */}
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <p className="text-xs font-bold text-slate-700 mb-3 uppercase tracking-wider">
                    Latest Task
                  </p>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-slate-400">
                      <span className="material-symbols-outlined text-lg">schedule</span>
                      <span className="text-sm">No running task</span>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </ProductChrome>
  );
}
