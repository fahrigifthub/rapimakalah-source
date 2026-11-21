import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Logo } from './ui/Common.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export function PublicShell({ children }) {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-white text-ink-900">
      <header className="sticky top-0 z-40 border-b border-line/80 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
          <Link to="/" aria-label="RapiMakalah — beranda">
            <Logo />
          </Link>
          <nav className="flex items-center gap-2">
            <Link to="/panduan" className="hidden rounded-lg px-3 py-1.5 text-[13px] font-medium text-ink-600 hover:bg-slate-50 hover:text-ink-900 sm:block">
              Panduan
            </Link>
            {user ? (
              <Link to="/app" className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-ink-900 px-4 text-[13px] font-medium text-white transition hover:bg-slate-800">
                Buka workspace <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <>
                <Link to="/login" className="hidden h-9 items-center rounded-lg px-3 text-[13px] font-medium text-ink-600 transition hover:bg-slate-50 sm:inline-flex">
                  Masuk
                </Link>
                <Link to="/register" className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-ink-900 px-4 text-[13px] font-medium text-white transition hover:bg-slate-800">
                  Mulai gratis
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-5 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="text-[11px] text-ink-400">Panduan format dokumen akademik</span>
          </div>
          <div className="flex flex-wrap items-center gap-5 text-[11px] text-ink-400">
            <Link to="/" className="hover:text-ink-700">Beranda</Link>
            <Link to="/panduan" className="hover:text-ink-700">Panduan</Link>
            <Link to="/login" className="hover:text-ink-700">Masuk</Link>
            <span>© {new Date().getFullYear()} RapiMakalah</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
