import { useCallback, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Check, FileCheck2, LockKeyhole, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Field, Input } from '../components/ui/Form.jsx';
import { Logo } from '../components/ui/Common.jsx';
import { safeNextPath } from '../lib/safeNext.js';
import { GoogleSignIn } from '../components/GoogleSignIn.jsx';

const FEATURES = [
  'Format DOCX asli, bukan rebuild dari HTML',
  'Penomoran Romawi & Arab lewat section Word',
  'Daftar isi berupa field TOC yang bisa diperbarui',
];

export function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-white lg:grid lg:grid-cols-[1.05fr_1fr]">
      <div className="relative hidden overflow-hidden border-r border-line bg-slate-50 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <Logo />
        <div className="max-w-md">
          <span className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-brand-100 bg-white px-2.5 py-1 text-[11px] font-medium text-brand-700 shadow-sm">
            <Sparkles className="h-3 w-3" /> Dokumen akademik, tanpa format berantakan
          </span>
          <h1 className="text-[32px] font-semibold leading-[1.2] tracking-[-0.03em] text-ink-900">
            Fokus pada isi.
            <br />
            RapiMakalah yang merapikan formatnya.
          </h1>
          <p className="mt-4 text-[14px] leading-relaxed text-ink-500">
            Unggah DOCX, pilih pedoman kampus, periksa temuan format, lalu unduh file Word yang tetap bisa diedit.
          </p>
          <ul className="mt-8 space-y-3">
            {FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-[13px] text-ink-600">
                <span className="mt-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <Check className="h-2.5 w-2.5" strokeWidth={3} />
                </span>
                {feature}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex items-center gap-6 text-[11px] text-ink-400">
          <span className="flex items-center gap-1.5"><LockKeyhole className="h-3 w-3" /> File tidak untuk training AI</span>
          <span className="flex items-center gap-1.5"><FileCheck2 className="h-3 w-3" /> DOCX tetap editable</span>
        </div>
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full border border-brand-100" />
        <div className="pointer-events-none absolute -bottom-10 -right-10 h-44 w-44 rounded-full border border-brand-100" />
      </div>
      <div className="flex min-h-screen flex-col lg:min-h-0">
        <div className="flex items-center justify-between px-5 py-4 lg:hidden">
          <Logo />
          <Link to="/" className="text-xs text-ink-500 hover:text-ink-900">Beranda</Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-[380px]">
            <div className="mb-7">
              <h2 className="text-[24px] font-semibold tracking-[-0.02em] text-ink-900">{title}</h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-500">{subtitle}</p>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AuthFooter({ prompt, to, label }) {
  return (
    <p className="mt-6 text-center text-[13px] text-ink-500">
      {prompt}{' '}
      <Link to={to} className="font-medium text-brand-600 hover:text-brand-700">
        {label}
      </Link>
    </p>
  );
}

export function PasswordField({ value, onChange, name = 'password', label = 'Password', autoComplete = 'current-password', error, hint, placeholder }) {
  return (
    <Field label={label} error={error} hint={hint}>
      <Input
        type="password"
        name={name}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        placeholder={placeholder || '••••••••'}
        required
      />
    </Field>
  );
}

export function SubmitButton({ loading, children }) {
  return (
    <Button type="submit" size="lg" loading={loading} className="w-full justify-center">
      {children} <ArrowRight className="h-4 w-4" />
    </Button>
  );
}

export function GoogleAuthOption({ onCredential, onError, disabled, dividerLabel }) {
  return (
    <GoogleSignIn
      onCredential={onCredential}
      onError={onError}
      disabled={disabled}
      dividerLabel={dividerLabel}
      className="mt-5"
    />
  );
}

export function useAuthForm() {
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Kembali ke halaman asal (mis. tautan template yang dibagikan) bila ada.
  const nextPath = safeNextPath(params.get('next'), '/app');

  const submitGoogle = useCallback(async (credential) => {
    setError('');
    setLoading(true);
    try {
      await googleLogin(credential);
      navigate(nextPath);
    } catch (err) {
      setError(err.message || 'Gagal masuk dengan Google.');
    } finally {
      setLoading(false);
    }
  }, [googleLogin, navigate, nextPath]);

  const submitLogin = async (email, password) => {
    setError('');
    setLoading(true);
    try {
      await login({ email, password });
      navigate(nextPath);
    } catch (err) {
      setError(err.message || 'Gagal masuk.');
    } finally {
      setLoading(false);
    }
  };

  return { submitLogin, submitGoogle, error, loading, setError };
}
