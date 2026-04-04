import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductChrome from '../components/ProductChrome';
import {
  useLayoutPatterns,
  useCreateLayoutPattern,
  useDeleteLayoutPattern,
  useUploadLayoutImage,
} from '../hooks/useLayoutPatterns';

const CATEGORIES = ['content', 'cover', 'section', 'conclusion'] as const;
type Category = (typeof CATEGORIES)[number];
type Mode = 'manual' | 'ai';

export default function TemplatesLayoutPatternsPage() {
  const navigate = useNavigate();
  const [category, setCategory] = useState<Category>('content');
  const [mode, setMode] = useState<Mode>('manual');

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [layoutJson, setLayoutJson] = useState(
    '{"layoutId": "simple-layout", "name": "Simple Layout", "category": "content", "canvas": {"width": 1920, "height": 1080}, "regions": []}'
  );
  const [userPrompt, setUserPrompt] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');

  // API hooks
  const { data: patternsData, isLoading, error } = useLayoutPatterns({ category });
  const createPattern = useCreateLayoutPattern();
  const deletePattern = useDeleteLayoutPattern();
  const uploadImage = useUploadLayoutImage();

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);

    try {
      const result = await uploadImage.mutateAsync(file);
      setImageUrl(result.data.url);
    } catch (error) {
      console.error('Failed to upload image:', error);
      alert('Failed to upload image. Please try again.');
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Please enter a pattern name');
      return;
    }

    if (mode === 'ai' && (!imageUrl || !userPrompt.trim())) {
      alert('Please upload an image and provide a description for AI mode');
      return;
    }

    if (mode === 'manual' && !layoutJson.trim()) {
      alert('Please provide layout JSON for manual mode');
      return;
    }

    try {
      await createPattern.mutateAsync({
        mode,
        name,
        description: description || undefined,
        category,
        imageUrl: mode === 'ai' ? imageUrl : undefined,
        userPrompt: mode === 'ai' ? userPrompt : undefined,
        patternJson: mode === 'manual' ? layoutJson : undefined,
      });

      // Reset form
      setName('');
      setDescription('');
      setUserPrompt('');
      setImageFile(null);
      setImageUrl('');
      setLayoutJson(
        '{"layoutId": "simple-layout", "name": "Simple Layout", "category": "content", "canvas": {"width": 1920, "height": 1080}, "regions": []}'
      );

      alert('Layout pattern created successfully!');
    } catch (error: any) {
      console.error('Failed to create pattern:', error);
      alert(error.response?.data?.error?.message || 'Failed to create pattern. Please try again.');
    }
  };

  // Handle delete
  const handleDelete = async (id: string, patternName: string) => {
    if (!confirm(`Are you sure you want to delete "${patternName}"?`)) {
      return;
    }

    try {
      await deletePattern.mutateAsync(id);
      alert('Pattern deleted successfully!');
    } catch (error) {
      console.error('Failed to delete pattern:', error);
      alert('Failed to delete pattern. Please try again.');
    }
  };

  const patterns = patternsData?.data || [];

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
                  Patterns ({category}) - {patterns.length} total
                </h3>

                {isLoading ? (
                  <div className="bg-slate-50 rounded-xl p-8 text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-3"></div>
                    <p className="text-sm text-slate-500">Loading patterns...</p>
                  </div>
                ) : error ? (
                  <div className="bg-red-50 rounded-xl p-8 text-center">
                    <span className="material-symbols-outlined text-red-400 text-5xl mb-3 block">
                      error
                    </span>
                    <p className="text-sm text-red-600">Failed to load patterns</p>
                  </div>
                ) : patterns.length === 0 ? (
                  <div className="bg-slate-50 rounded-xl p-8 text-center">
                    <span className="material-symbols-outlined text-slate-300 text-5xl mb-3 block">
                      dashboard_customize
                    </span>
                    <p className="text-sm text-slate-500">
                      No layout patterns found for this category
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {patterns.map((pattern) => (
                      <div
                        key={pattern.id}
                        className="bg-slate-50 rounded-xl p-4 hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-slate-900">{pattern.name}</h4>
                              <span
                                className={`px-2 py-0.5 rounded text-xs font-medium ${
                                  pattern.createdBy === 'ai'
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                {pattern.createdBy === 'ai' ? 'AI Generated' : 'Manual'}
                              </span>
                              <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                                v{pattern.version}
                              </span>
                            </div>
                            {pattern.description && (
                              <p className="text-sm text-slate-600 mb-2">{pattern.description}</p>
                            )}
                            <p className="text-xs text-slate-400">
                              Created: {new Date(pattern.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDelete(pattern.id, pattern.name)}
                            disabled={deletePattern.isPending}
                            className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <span className="material-symbols-outlined text-xl">delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Sidebar - Create Form */}
            <aside className="space-y-6">
              <form
                onSubmit={handleSubmit}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/50 sticky top-24"
              >
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
                  {/* Mode Selection */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                      Creation Mode
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setMode('manual')}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                          mode === 'manual'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Manual
                      </button>
                      <button
                        type="button"
                        onClick={() => setMode('ai')}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                          mode === 'ai'
                            ? 'bg-purple-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        AI Generate
                      </button>
                    </div>
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                      Name *
                    </label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                      placeholder="e.g. left-image-right-list"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                      Description
                    </label>
                    <textarea
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
                      placeholder="Pattern usage and structure"
                    />
                  </div>

                  {/* AI Mode Fields */}
                  {mode === 'ai' && (
                    <>
                      {/* Image Upload */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                          Reference Image *
                        </label>
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/jpg"
                            onChange={handleImageUpload}
                            className="hidden"
                            id="image-upload"
                          />
                          <label
                            htmlFor="image-upload"
                            className="flex items-center justify-center gap-2 w-full px-3 py-2.5 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition-all"
                          >
                            {uploadImage.isPending ? (
                              <>
                                <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                                <span className="text-sm text-slate-600">Uploading...</span>
                              </>
                            ) : imageFile ? (
                              <>
                                <span className="material-symbols-outlined text-green-600 text-xl">
                                  check_circle
                                </span>
                                <span className="text-sm text-slate-700">{imageFile.name}</span>
                              </>
                            ) : (
                              <>
                                <span className="material-symbols-outlined text-slate-400 text-xl">
                                  upload
                                </span>
                                <span className="text-sm text-slate-600">Click to upload</span>
                              </>
                            )}
                          </label>
                        </div>
                      </div>

                      {/* User Prompt */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                          Layout Description *
                        </label>
                        <textarea
                          rows={3}
                          value={userPrompt}
                          onChange={(e) => setUserPrompt(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
                          placeholder="e.g. Left side large image, right side title with 5 bullet points"
                          required={mode === 'ai'}
                        />
                      </div>
                    </>
                  )}

                  {/* Manual Mode Fields */}
                  {mode === 'manual' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                        Layout JSON *
                      </label>
                      <textarea
                        rows={8}
                        value={layoutJson}
                        onChange={(e) => setLayoutJson(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-mono outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
                        required={mode === 'manual'}
                      />
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={createPattern.isPending}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    {createPattern.isPending ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-lg">add</span>
                        <span>Create Pattern</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </aside>
          </div>
        </div>
      </main>
    </ProductChrome>
  );
}
