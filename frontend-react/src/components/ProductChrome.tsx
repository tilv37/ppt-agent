import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useLogout } from '../hooks/useAuth';

interface ProductChromeProps {
  children: React.ReactNode;
  activeNav?: 'projects' | 'templates';
}

export default function ProductChrome({ children, activeNav = 'projects' }: ProductChromeProps) {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useLogout();

  const handleLogout = async () => {
    await logout.mutateAsync();
    navigate('/login');
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col">
      {/* TopNavBar */}
      <nav className="bg-white/80 backdrop-blur-xl sticky top-0 z-50 flex justify-between items-center w-full px-6 py-3 border-b border-slate-200/50">
        <div className="flex items-center gap-8">
          <button
            onClick={() => navigate('/')}
            className="text-2xl font-bold tracking-tight text-slate-900 font-headline hover:text-blue-600 transition-colors"
          >
            DeckGenie
          </button>
          <div className="hidden md:flex items-center gap-6">
            <button
              onClick={() => navigate('/')}
              className={`font-medium transition-colors ${
                activeNav === 'projects'
                  ? 'text-blue-600 font-bold border-b-2 border-blue-600'
                  : 'text-slate-500 hover:text-blue-500'
              }`}
            >
              Projects
            </button>
            <button
              onClick={() => navigate('/templates')}
              className={`font-medium transition-colors ${
                activeNav === 'templates'
                  ? 'text-blue-600 font-bold border-b-2 border-blue-600'
                  : 'text-slate-500 hover:text-blue-500'
              }`}
            >
              Templates
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 text-slate-500 hover:text-blue-500 hover:bg-slate-100 rounded-lg transition-all">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="p-2 text-slate-500 hover:text-blue-500 hover:bg-slate-100 rounded-lg transition-all">
            <span className="material-symbols-outlined">settings</span>
          </button>
          <button
            onClick={handleLogout}
            className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
            title="Logout"
          >
            <span className="material-symbols-outlined">logout</span>
          </button>
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center ml-2">
            <span className="text-white text-xs font-bold">
              {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
            </span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow">{children}</main>

      {/* Footer */}
      <footer className="bg-slate-50 py-6 mt-auto border-t border-slate-200/50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center px-8">
          <span className="text-xs tracking-wide text-slate-400">
            © 2024 DeckGenie AI. All rights reserved.
          </span>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a className="text-xs text-slate-500 hover:underline" href="#">
              Support
            </a>
            <a className="text-xs text-slate-500 hover:underline" href="#">
              Privacy
            </a>
            <a className="text-xs text-slate-500 hover:underline" href="#">
              Terms
            </a>
            <a className="text-xs text-slate-500 hover:underline" href="#">
              Documentation
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
