import { useCallback, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthFooter, AuthLayout, GoogleAuthOption, PasswordField, SubmitButton } from './AuthShared.jsx';
import { Field, Input } from '../components/ui/Form.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { safeNextPath } from '../lib/safeNext.js';

export default function Register() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { register, googleLogin } = useAuth();
  const { success } = useToast();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Kembali ke halaman asal (mis. tautan template) setelah akun dibuat.
  const nextPath = safeNextPath(params.get('next'), '/app');

  const handleGoogleError = useCallback((message) => {
    setError(message);
  }, []);

  const handleGoogleCredential = useCallback(async (credential) => {
    setError('');
    setLoading(true);
    try {
      await googleLogin(credential);
      success('Akun berhasil dibuat', { description: 'Selamat datang di RapiMakalah.' });
      navigate(nextPath);
    } catch (err) {
      setError(err.message || 'Gagal melanjutkan dengan Google.');
    } finally {
      setLoading(false);
    }
  }, [googleLogin, navigate, nextPath, success]);

  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (form.name.trim().length < 2) return setError('Nama minimal 2 karakter.');
    if (form.password.length < 8) return setError('Password minimal 8 karakter.');
    if (form.password !== form.confirm) return setError('Konfirmasi password tidak sama.');
    setLoading(true);
    try {
      await register({ name: form.name.trim(), email: form.email.trim(), password: form.password });
      success('Akun berhasil dibuat', { description: 'Selamat datang di RapiMakalah.' });
      navigate(nextPath);
    } catch (err) {
      setError(err.message || 'Pendaftaran gagal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Buat akun RapiMakalah"
      subtitle="Gratis untuk mulai merapikan makalah, laporan, dan skripsi."
    >
      <form onSubmit={onSubmit} className="space-y-3.5">
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] leading-relaxed text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
        <Field label="Nama lengkap">
          <Input value={form.name} onChange={update('name')} placeholder="Nama sesuai dokumen" autoComplete="name" required />
        </Field>
        <Field label="Email">
          <Input type="email" value={form.email} onChange={update('email')} placeholder="nama@kampus.ac.id" autoComplete="email" required />
        </Field>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <PasswordField
            label="Password"
            value={form.password}
            onChange={update('password')}
            autoComplete="new-password"
            placeholder="Min. 8 karakter"
          />
          <PasswordField
            label="Ulangi password"
            name="confirm"
            value={form.confirm}
            onChange={update('confirm')}
            autoComplete="new-password"
            placeholder="Ulangi password"
          />
        </div>
        <div className="pt-1">
          <SubmitButton loading={loading}>Buat akun</SubmitButton>
        </div>
        <p className="text-[11px] leading-relaxed text-ink-400">
          Dengan mendaftar, Anda setuju bahwa dokumen yang diunggah hanya digunakan untuk memproses permintaan Anda
          dan tidak dipakai untuk pelatihan model AI.
        </p>
      </form>
      <GoogleAuthOption onCredential={handleGoogleCredential} onError={handleGoogleError} disabled={loading} />
      <AuthFooter prompt="Sudah punya akun?" to="/login" label="Masuk" />
    </AuthLayout>
  );
}
