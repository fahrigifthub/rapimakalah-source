import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { AuthFooter, AuthLayout, PasswordField, SubmitButton, useAuthForm } from './AuthShared.jsx';
import { Field, Input } from '../components/ui/Form.jsx';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { submitLogin, error, loading } = useAuthForm();

  const onSubmit = (event) => {
    event.preventDefault();
    submitLogin(email.trim(), password);
  };

  return (
    <AuthLayout
      title="Masuk ke RapiMakalah"
      subtitle="Lanjutkan merapikan dokumen akademik dari workspace Anda."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] leading-relaxed text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
        <Field label="Email">
          <Input
            type="email"
            name="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="nama@kampus.ac.id"
            autoComplete="email"
            required
          />
        </Field>
        <PasswordField value={password} onChange={(event) => setPassword(event.target.value)} />
        <div className="pt-1">
          <SubmitButton loading={loading}>Masuk</SubmitButton>
        </div>
        <p className="flex items-center gap-1.5 text-[11px] leading-relaxed text-ink-400">
          <span className="h-1 w-1 rounded-full bg-ink-400" />
          Sesi disimpan sebagai cookie httpOnly. RapiMakalah tidak menyimpan password dalam bentuk teks.
        </p>
      </form>
      <AuthFooter prompt="Belum punya akun?" to="/register" label="Daftar gratis" />
    </AuthLayout>
  );
}
