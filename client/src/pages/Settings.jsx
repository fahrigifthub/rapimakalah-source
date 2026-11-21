import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  LogOut,
  Save,
  ShieldCheck,
  Trash2,
  UserRound,
} from 'lucide-react';
import { AppShell } from '../components/AppShell.jsx';
import { PageHeader } from '../components/ui/Common.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Field, Input } from '../components/ui/Form.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api } from '../lib/api.js';
import { formatBytes, formatDate, initials } from '../lib/format.js';

function PasswordInput({ value, onChange, placeholder, autoComplete }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="h-9 pr-9 text-[13px]"
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-ink-400 transition hover:bg-slate-100 hover:text-ink-700"
        aria-label={visible ? 'Sembunyikan password' : 'Tampilkan password'}
      >
        {visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}

export default function Settings() {
  const { user, updateProfile, logout } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [profile, setProfile] = useState({
    name: user?.name || '',
    institution: user?.institution || '',
    programStudy: user?.programStudy || '',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');

  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const [stats, setStats] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    let active = true;
    api
      .get('/dashboard')
      .then((payload) => {
        if (active) setStats(payload.stats);
      })
      .catch(() => null);
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setProfile({
      name: user?.name || '',
      institution: user?.institution || '',
      programStudy: user?.programStudy || '',
    });
  }, [user]);

  const handleProfile = async (event) => {
    event.preventDefault();
    setProfileError('');
    if (profile.name.trim().length < 2) {
      setProfileError('Nama minimal 2 karakter.');
      return;
    }
    setSavingProfile(true);
    try {
      await updateProfile({
        name: profile.name.trim(),
        institution: profile.institution.trim(),
        programStudy: profile.programStudy.trim(),
      });
      success('Profil diperbarui');
    } catch (err) {
      setProfileError(err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePassword = async (event) => {
    event.preventDefault();
    setPasswordError('');
    if (passwords.newPassword.length < 8) {
      setPasswordError('Password baru minimal 8 karakter.');
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordError('Konfirmasi password baru tidak cocok.');
      return;
    }
    if (passwords.newPassword === passwords.currentPassword) {
      setPasswordError('Password baru harus berbeda dari password saat ini.');
      return;
    }
    setSavingPassword(true);
    try {
      await api.post('/auth/password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      success('Password diperbarui', { description: 'Gunakan password baru pada sesi berikutnya.' });
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPasswordError(err.message);
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteError('');
    if (!deletePassword) {
      setDeleteError('Masukkan password untuk konfirmasi.');
      return;
    }
    setDeleting(true);
    try {
      await api.delete('/account', { password: deletePassword });
      await logout().catch(() => null);
      navigate('/', { replace: true });
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="Pengaturan"
        title="Akun & keamanan"
        description="Kelola profil akademik, password, dan data dokumen yang tersimpan di RapiMakalah."
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-5">
          <section className="surface-card overflow-hidden">
            <div className="flex items-center gap-3 border-b border-line px-5 py-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-900 text-[13px] font-semibold text-white">
                {initials(user?.name)}
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-[14px] font-semibold text-ink-900">{user?.name}</h2>
                <p className="truncate text-[11px] text-ink-500">{user?.email}</p>
              </div>
            </div>
            <form onSubmit={handleProfile} className="space-y-3.5 px-5 py-4">
              <div className="grid gap-3.5 sm:grid-cols-2">
                <Field label="Nama lengkap">
                  <Input
                    value={profile.name}
                    onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))}
                    maxLength={80}
                    className="h-9 text-[13px]"
                    required
                  />
                </Field>
                <Field label="Email" hint="Email dipakai untuk masuk dan tidak dapat diubah di sini.">
                  <Input value={user?.email || ''} readOnly className="h-9 bg-slate-50 text-[13px] text-ink-500" />
                </Field>
              </div>
              <div className="grid gap-3.5 sm:grid-cols-2">
                <Field label="Institusi / kampus">
                  <Input
                    value={profile.institution}
                    onChange={(event) => setProfile((current) => ({ ...current, institution: event.target.value }))}
                    placeholder="Contoh: Universitas Indonesia"
                    maxLength={120}
                    className="h-9 text-[13px]"
                  />
                </Field>
                <Field label="Program studi">
                  <Input
                    value={profile.programStudy}
                    onChange={(event) => setProfile((current) => ({ ...current, programStudy: event.target.value }))}
                    placeholder="Contoh: Ilmu Komputer"
                    maxLength={120}
                    className="h-9 text-[13px]"
                  />
                </Field>
              </div>
              {profileError && <p className="text-[12px] text-red-600">{profileError}</p>}
              <div className="flex items-center justify-between gap-3 border-t border-line pt-3.5">
                <p className="text-[10px] text-ink-400">
                  Bergabung {formatDate(user?.createdAt)}
                </p>
                <Button type="submit" size="sm" icon={Save} loading={savingProfile}>
                  Simpan profil
                </Button>
              </div>
            </form>
          </section>

          <section className="surface-card overflow-hidden">
            <div className="flex items-center gap-2.5 border-b border-line px-5 py-3.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-ink-500">
                <KeyRound className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-[13px] font-semibold text-ink-900">Ubah password</h2>
                <p className="text-[11px] text-ink-500">Minimal 8 karakter. Gunakan password yang tidak dipakai di layanan lain.</p>
              </div>
            </div>
            <form onSubmit={handlePassword} className="space-y-3.5 px-5 py-4">
              <Field label="Password saat ini">
                <PasswordInput
                  value={passwords.currentPassword}
                  onChange={(event) => setPasswords((current) => ({ ...current, currentPassword: event.target.value }))}
                  autoComplete="current-password"
                  placeholder="Masukkan password saat ini"
                />
              </Field>
              <div className="grid gap-3.5 sm:grid-cols-2">
                <Field label="Password baru" hint="Minimal 8 karakter.">
                  <PasswordInput
                    value={passwords.newPassword}
                    onChange={(event) => setPasswords((current) => ({ ...current, newPassword: event.target.value }))}
                    autoComplete="new-password"
                    placeholder="Password baru"
                  />
                </Field>
                <Field label="Ulangi password baru">
                  <PasswordInput
                    value={passwords.confirmPassword}
                    onChange={(event) => setPasswords((current) => ({ ...current, confirmPassword: event.target.value }))}
                    autoComplete="new-password"
                    placeholder="Ulangi password baru"
                  />
                </Field>
              </div>
              {passwordError && <p className="text-[12px] text-red-600">{passwordError}</p>}
              <div className="flex justify-end border-t border-line pt-3.5">
                <Button
                  type="submit"
                  size="sm"
                  icon={Lock}
                  loading={savingPassword}
                  disabled={!passwords.currentPassword || !passwords.newPassword}
                >
                  Perbarui password
                </Button>
              </div>
            </form>
          </section>

          <section className="rounded-xl border border-red-200 bg-white overflow-hidden">
            <div className="flex items-center gap-2.5 border-b border-red-100 bg-red-50/60 px-5 py-3.5">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <div>
                <h2 className="text-[13px] font-semibold text-red-800">Hapus akun</h2>
                <p className="text-[11px] text-red-800">Menghapus akun, seluruh dokumen, file hasil, dan template kustom secara permanen.</p>
              </div>
            </div>
            <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[11px] leading-relaxed text-ink-500">
                Tindakan ini tidak dapat dibatalkan. Dokumen asli yang Anda unggah juga dihapus dari penyimpanan server.
              </p>
              <Button variant="danger" size="sm" icon={Trash2} onClick={() => setDeleteOpen(true)}>
                Hapus akun
              </Button>
            </div>
          </section>
        </div>

        <aside className="min-w-0 space-y-4">
          <section className="surface-card p-4">
            <div className="mb-3 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <h2 className="text-[12px] font-semibold text-ink-900">Privasi & keamanan</h2>
            </div>
            <ul className="space-y-2.5 text-[11px] leading-relaxed text-ink-500">
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600" />
                Sesi memakai cookie httpOnly dengan token JWT; token tidak disimpan di localStorage.
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600" />
                Setiap endpoint dokumen memeriksa kepemilikan sebelum membaca file.
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600" />
                File disimpan dengan nama UUID internal, bukan nama publik yang mudah ditebak.
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600" />
                Isi dokumen tidak digunakan untuk pelatihan model.
              </li>
            </ul>
          </section>

          <section className="surface-card p-4">
            <div className="mb-3 flex items-center gap-2">
              <Database className="h-4 w-4 text-ink-400" />
              <h2 className="text-[12px] font-semibold text-ink-900">Data tersimpan</h2>
            </div>
            <dl className="space-y-2.5">
              <div className="flex items-center justify-between">
                <dt className="text-[11px] text-ink-500">Total dokumen</dt>
                <dd className="text-[12px] font-semibold tabular-nums text-ink-900">{stats?.totalDocuments ?? '—'}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-[11px] text-ink-500">Sudah diformat</dt>
                <dd className="text-[12px] font-semibold tabular-nums text-ink-900">{stats?.readyDocuments ?? '—'}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-[11px] text-ink-500">Ukuran file asli</dt>
                <dd className="text-[12px] font-semibold tabular-nums text-ink-900">{stats ? formatBytes(stats.storageBytes) : '—'}</dd>
              </div>
            </dl>
            <p className="mt-3 border-t border-line pt-2.5 text-[10px] leading-relaxed text-ink-400">
              File asli dipertahankan agar Anda bisa membandingkan dan membatalkan hasil formatting kapan saja.
            </p>
          </section>

          <section className="surface-card p-4">
            <div className="flex items-center gap-2">
              <UserRound className="h-4 w-4 text-ink-400" />
              <h2 className="text-[12px] font-semibold text-ink-900">Sesi</h2>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-ink-500">
              Keluar akan menghapus cookie sesi di browser ini. Untuk keluar dari perangkat lain, ubah password Anda.
            </p>
            <Button
              variant="secondary"
              size="sm"
              icon={LogOut}
              className="mt-3 w-full justify-center"
              onClick={async () => {
                await logout();
                navigate('/');
              }}
            >
              Keluar dari akun
            </Button>
          </section>
        </aside>
      </div>

      <Modal
        open={deleteOpen}
        onClose={() => {
          if (deleting) return;
          setDeleteOpen(false);
          setDeletePassword('');
          setDeleteError('');
        }}
        title="Hapus akun secara permanen?"
        description="Semua dokumen, file hasil, template kustom, dan riwayat aktivitas akan dihapus."
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setDeleteOpen(false);
                setDeletePassword('');
                setDeleteError('');
              }}
              disabled={deleting}
            >
              Batal
            </Button>
            <Button variant="danger" loading={deleting} icon={Trash2} onClick={handleDeleteAccount}>
              Hapus akun saya
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[11px] leading-relaxed text-red-700">
            Tindakan ini tidak dapat dibatalkan. Masukkan password akun Anda untuk melanjutkan.
          </div>
          <Field label="Password">
            <PasswordInput
              value={deletePassword}
              onChange={(event) => setDeletePassword(event.target.value)}
              autoComplete="current-password"
              placeholder="Password akun"
            />
          </Field>
          {deleteError && <p className="text-[12px] text-red-600">{deleteError}</p>}
        </div>
      </Modal>
    </AppShell>
  );
}
