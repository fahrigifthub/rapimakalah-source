import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api.js';

const SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
let scriptPromise;

function loadGoogleIdentity() {
  if (window.google?.accounts?.id) return Promise.resolve(window.google);
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => window.google?.accounts?.id
      ? resolve(window.google)
      : reject(new Error('Google Sign-In gagal dimuat.'));
    script.onerror = () => reject(new Error('Tidak dapat memuat Google Sign-In.'));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export function GoogleSignIn({ onCredential, onError, disabled = false, dividerLabel = 'atau lanjutkan dengan', className = '' }) {
  const buttonRef = useRef(null);
  const [loadError, setLoadError] = useState('');
  const [clientId, setClientId] = useState(null);
  const credentialHandler = useCallback((response) => {
    if (response.credential) onCredential(response.credential);
    else onError?.('Google tidak mengembalikan token login.');
  }, [onCredential, onError]);

  useEffect(() => {
    let active = true;
    api.get('/auth/config', { cache: 'no-store' })
      .then((config) => {
        if (!active) return;
        setClientId(config.googleClientId || '');
        if (!config.googleClientId) setLoadError('Login Google belum dikonfigurasi.');
      })
      .catch((err) => {
        if (!active) return;
        setLoadError(err.message || 'Tidak dapat memuat konfigurasi login.');
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    if (!clientId) return () => { active = false; };
    loadGoogleIdentity()
      .then((google) => {
        if (!active || !buttonRef.current) return;
        buttonRef.current.replaceChildren();
        google.accounts.id.initialize({
          client_id: clientId,
          callback: credentialHandler,
          cancel_on_tap_outside: true,
        });
        google.accounts.id.renderButton(buttonRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          width: Math.min(buttonRef.current.clientWidth || 360, 360),
          logo_alignment: 'left',
        });
        setLoadError('');
      })
      .catch((err) => {
        if (!active) return;
        setLoadError(err.message || 'Google Sign-In gagal dimuat.');
        onError?.(err.message || 'Google Sign-In gagal dimuat.');
      });
    return () => { active = false; };
  }, [clientId, credentialHandler]);

  // Client ID belum termuat atau belum dikonfigurasi: jangan tampilkan
  // pemisah maupun tombol kosong.
  if (!clientId) return null;

  return (
    <div className={`${className} space-y-4`.trim()}>
      {dividerLabel && (
        <div className="relative flex items-center">
          <span className="h-px flex-1 bg-line" />
          <span className="px-3 text-[11px] text-ink-400">{dividerLabel}</span>
          <span className="h-px flex-1 bg-line" />
        </div>
      )}
      <div className="space-y-1.5">
        <div ref={buttonRef} className={disabled ? 'pointer-events-none opacity-50' : ''} aria-label="Masuk dengan Google" />
        {loadError && <p className="text-center text-[11px] text-ink-400">{loadError}</p>}
      </div>
    </div>
  );
}
