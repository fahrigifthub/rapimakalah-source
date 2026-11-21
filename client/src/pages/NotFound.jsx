import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Compass, FileText, Home } from 'lucide-react';
import { Logo } from '../components/ui/Common.jsx';
import { Button } from '../components/ui/Button.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function NotFound() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const home = user ? '/app' : '/';

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="flex h-14 items-center px-5 sm:px-8">
        <Logo />
      </header>
      <main className="flex flex-1 items-center justify-center px-5 py-12">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-line bg-white text-brand-600 shadow-card">
            <Compass className="h-6 w-6" />
          </div>
          <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-400">Error 404</p>
          <h1 className="mt-1 text-[26px] font-semibold tracking-[-0.02em] text-ink-900">Halaman tidak ditemukan</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-500">
            Alamat ini mungkin salah ketik, sudah dipindahkan, atau dokumen yang Anda cari telah dihapus.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate(-1)}>
              Kembali
            </Button>
            <Button variant="secondary" icon={FileText} onClick={() => navigate(user ? '/app/documents' : '/login')}>
              {user ? 'Riwayat dokumen' : 'Masuk'}
            </Button>
            <Button icon={Home} onClick={() => navigate(home)}>
              {user ? 'Dashboard' : 'Beranda'}
            </Button>
          </div>
          <p className="mt-6 text-[11px] text-ink-400">
            Butuh bantuan? Buka <Link to={home} className="font-medium text-brand-600 hover:text-brand-700">RapiMakalah</Link> dan mulai dari dashboard.
          </p>
        </div>
      </main>
    </div>
  );
}
