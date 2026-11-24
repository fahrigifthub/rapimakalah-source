import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  ChevronRight,
  FilePlus2,
  FileText,
  Globe,
  PenLine,
  LayoutDashboard,
  LayoutTemplate,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { Logo } from './ui/Common.jsx';
import { cx, initials } from '../lib/format.js';

const NAV = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/documents', label: 'Dokumen', icon: FileText },
  { to: '/app/writing', label: 'Menulis', icon: PenLine },
  { to: '/app/templates', label: 'Template', icon: LayoutTemplate },
  { to: '/galeri', label: 'Galeri template', icon: Globe },
  { to: '/app/settings', label: 'Pengaturan', icon: Settings },
];

const ADMIN_NAV = { to: '/app/admin', label: 'Admin panel', icon: BarChart3 };

function titleForPath(pathname) {
  if (pathname === '/app') return 'Dashboard';
  if (pathname.startsWith('/app/writing')) return 'Workspace menulis';
  if (pathname === '/app/documents') return 'Dokumen';
  if (pathname.startsWith('/app/documents/')) return 'Workspace';
  if (pathname === '/app/templates') return 'Template';
  if (pathname === '/app/templates/new') return 'Template kustom';
  if (pathname.startsWith('/app/templates/')) return 'Editor template';
  if (pathname === '/app/settings') return 'Pengaturan';
  if (pathname === '/app/admin') return 'Admin panel';
  return 'RapiMakalah';
}

function NavItems({ onNavigate }) {
  const { user } = useAuth();
  const items = user?.role === 'admin' ? [...NAV, ADMIN_NAV] : NAV;
  return (
    <nav className="space-y-0.5">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cx(
              'group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition',
              isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-500 hover:bg-slate-100 hover:text-ink-900',
            )
          }
        >
          {({ isActive }) => (
            <>
              <item.icon className={cx('h-4 w-4', isActive ? 'text-brand-600' : 'text-ink-400 group-hover:text-ink-600')} />
              {item.label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 transition hover:bg-slate-100"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink-900 text-[11px] font-semibold text-white">
          {initials(user?.name)}
        </span>
        <span className="hidden max-w-[120px] truncate text-[13px] font-medium text-ink-700 sm:block">{user?.name}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-10 z-50 w-64 animate-fade-up rounded-xl border border-line bg-white p-1.5 shadow-pop">
          <div className="border-b border-line px-2.5 py-2.5">
            <p className="truncate text-[13px] font-semibold text-ink-900">{user?.name}</p>
            <p className="truncate text-xs text-ink-500">{user?.email}</p>
          </div>
          <Link
            to="/app/settings"
            onClick={() => setOpen(false)}
            className="mt-1 flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] text-ink-700 transition hover:bg-slate-50"
          >
            <Settings className="h-3.5 w-3.5 text-ink-400" /> Pengaturan akun
          </Link>
          <button
            type="button"
            onClick={async () => {
              setOpen(false);
              await logout();
              navigate('/');
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] text-red-600 transition hover:bg-red-50"
          >
            <LogOut className="h-3.5 w-3.5" /> Keluar
          </button>
        </div>
      )}
    </div>
  );
}

export function AppShell({ children, bare = false, flush = false }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const title = titleForPath(location.pathname);
  const close = () => setMobileOpen(false);

  return (
    <div className="min-h-screen bg-surface">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[232px] flex-col border-r border-line bg-white lg:flex">
        <div className="flex h-14 items-center px-5">
          <Logo />
        </div>
        <div className="flex-1 px-3 py-3">
          <p className="mb-2 px-2.5 text-[10px] font-semibold uppercase tracking-[0.09em] text-ink-400">Workspace</p>
          <NavItems />
          <div className="my-5 border-t border-line" />
          <Link
            to="/app/documents/new"
            className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-ink-500 transition hover:bg-slate-100 hover:text-ink-900"
          >
            <FilePlus2 className="h-4 w-4 text-ink-400" />
            Dokumen baru
          </Link>
        </div>
        <div className="px-3 pb-3">
          <div className="rounded-xl border border-line bg-slate-50/70 p-3">
            <div className="flex items-center gap-2 text-[11px] font-semibold text-ink-700">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              Dokumen tetap milik Anda
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-ink-500">
              File hanya diproses untuk permintaan Anda dan tidak dipakai untuk pelatihan model.
            </p>
          </div>
          <Link
            to="/app/settings"
            className="mt-2 flex items-center justify-between rounded-lg px-2.5 py-2 text-[11px] text-ink-400 transition hover:bg-slate-50 hover:text-ink-700"
          >
            <span>RapiMakalah v1.0</span>
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button type="button" aria-label="Tutup menu" className="absolute inset-0 bg-slate-900/30" onClick={close} />
          <aside className="relative flex h-full w-[260px] animate-fade-up flex-col border-r border-line bg-white">
            <div className="flex h-14 items-center justify-between px-4">
              <Logo />
              <button type="button" onClick={close} className="rounded-lg p-1.5 text-ink-400 hover:bg-slate-100" aria-label="Tutup">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 px-3 py-3">
              <NavItems onNavigate={close} />
              <div className="my-5 border-t border-line" />
              <Link
                to="/app/documents/new"
                onClick={close}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-ink-500 hover:bg-slate-100"
              >
                <FilePlus2 className="h-4 w-4 text-ink-400" /> Dokumen baru
              </Link>
            </div>
          </aside>
        </div>
      )}

      <div className="lg:pl-[232px]">
        {!bare && (
          <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-line bg-white/90 px-4 backdrop-blur-sm sm:px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="rounded-lg p-1.5 text-ink-500 hover:bg-slate-100 lg:hidden"
                aria-label="Buka menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-1.5 text-[13px]">
                <span className="hidden text-ink-400 sm:inline">RapiMakalah</span>
                <ChevronRight className="hidden h-3 w-3 text-ink-300 sm:inline" />
                <span className="font-medium text-ink-700">{title}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/app/documents/new"
                className="hidden items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-ink-600 transition hover:border-slate-300 hover:bg-slate-50 sm:flex"
              >
                <FilePlus2 className="h-3.5 w-3.5" /> Upload
              </Link>
              <UserMenu />
            </div>
          </header>
        )}
        <main className={cx(bare || flush ? '' : 'mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8')}>{children}</main>
      </div>
    </div>
  );
}
