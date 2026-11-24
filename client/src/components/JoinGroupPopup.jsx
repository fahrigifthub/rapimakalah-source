import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { X } from 'lucide-react';

const GROUP_URL = 'https://whatsapp.com/channel/0029VbD1zGq6mYPUbtVh6U0L';
const STORAGE_KEY = 'rapimakalah:join-group:v2';
const SHOW_DELAY_MS = 1500;
const SNOOZE_DAYS = 14;

function readState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const value = JSON.parse(raw);
    return value && typeof value === 'object' ? value : {};
  } catch {
    return {};
  }
}

function writeState(patch) {
  try {
    const next = { ...readState(), ...patch };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* penyimpanan lokal diblokir: popup tetap bisa ditutup untuk sesi ini */
  }
}

function isPublicMarketingRoute(pathname) {
  return pathname === '/' || pathname === '/panduan' || pathname.startsWith('/panduan/') || pathname.startsWith('/t/');
}

function WhatsappMark({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className} fill="currentColor">
      <path d="M16.04 3.2c-7.06 0-12.8 5.74-12.8 12.8 0 2.26.59 4.46 1.72 6.4L3.2 28.8l6.58-1.72a12.75 12.75 0 0 0 6.26 1.6h.01c7.05 0 12.79-5.74 12.79-12.8 0-3.42-1.33-6.63-3.75-9.04a12.7 12.7 0 0 0-9.05-3.64Zm0 23.35h-.01a10.6 10.6 0 0 1-5.4-1.48l-.39-.23-4.02 1.05 1.07-3.92-.25-.4a10.58 10.58 0 0 1-1.63-5.66c0-5.87 4.78-10.65 10.66-10.65 2.84 0 5.51 1.11 7.52 3.12a10.57 10.57 0 0 1 3.12 7.53c0 5.88-4.78 10.64-10.67 10.64Zm5.85-7.97c-.32-.16-1.9-.94-2.19-1.04-.3-.11-.51-.16-.72.16-.21.32-.82 1.04-1.01 1.25-.19.21-.37.24-.69.08-.32-.16-1.35-.5-2.57-1.59-.95-.85-1.59-1.89-1.78-2.21-.19-.32-.02-.5.14-.66.14-.14.32-.37.48-.56.16-.19.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.72-1.74-.99-2.38-.26-.63-.53-.55-.72-.56h-.62c-.21 0-.56.08-.85.4-.29.32-1.11 1.09-1.11 2.66 0 1.56 1.14 3.08 1.3 3.29.16.21 2.24 3.42 5.42 4.8.76.33 1.35.52 1.81.67.77.24 1.46.21 2.01.13.61-.09 1.9-.78 2.17-1.53.27-.75.27-1.4.19-1.53-.08-.13-.29-.21-.61-.37Z" />
    </svg>
  );
}

export default function JoinGroupPopup() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const scheduled = useRef(false);
  const primaryRef = useRef(null);
  const lastFocused = useRef(null);

  const dismiss = useCallback((mode) => {
    setOpen(false);
    if (mode === 'never') writeState({ hidden: true });
    if (mode === 'snooze') {
      const until = Date.now() + SNOOZE_DAYS * 24 * 60 * 60 * 1000;
      writeState({ snoozeUntil: until });
    }
  }, []);

  useEffect(() => {
    if (scheduled.current) return undefined;
    if (!isPublicMarketingRoute(pathname)) return undefined;
    const state = readState();
    if (state.hidden) return undefined;
    if (state.snoozeUntil && Date.now() < state.snoozeUntil) return undefined;
    const timer = window.setTimeout(() => {
      scheduled.current = true;
      setOpen(true);
    }, SHOW_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    if (!open) return undefined;
    lastFocused.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event) => {
      if (event.key === 'Escape') dismiss('snooze');
    };
    document.addEventListener('keydown', onKeyDown);
    const focusTimer = window.setTimeout(() => primaryRef.current?.focus(), 50);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      window.clearTimeout(focusTimer);
      if (lastFocused.current instanceof HTMLElement) lastFocused.current.focus();
    };
  }, [open, dismiss]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-ink-900/45 p-4 backdrop-blur-[2px] sm:items-center"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) dismiss('snooze');
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="join-group-title"
        aria-describedby="join-group-desc"
        className="relative w-full max-w-md animate-fade-up rounded-2xl border border-line bg-white p-6 shadow-pop"
      >
        <button
          type="button"
          onClick={() => dismiss('snooze')}
          aria-label="Tutup"
          className="absolute right-4 top-4 rounded-lg p-1.5 text-ink-400 transition hover:bg-surface hover:text-ink-700"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#25D366] text-white">
            <WhatsappMark className="h-6 w-6" />
          </span>
          <div className="pr-6">
            <h2 id="join-group-title" className="text-base font-semibold text-ink-900">
              Info update di channel WhatsApp
            </h2>
            <p id="join-group-desc" className="mt-1 text-sm leading-relaxed text-ink-500">
              Ikuti kabar fitur baru dan tips format makalah melalui channel WhatsApp RapiMakalah.
            </p>
          </div>
        </div>

        <a
          ref={primaryRef}
          href={GROUP_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            writeState({ joined: true, joinedAt: Date.now() });
            setOpen(false);
          }}
          className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 text-sm font-semibold text-white transition hover:bg-[#1EBE5A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2"
        >
          <WhatsappMark className="h-5 w-5" />
          Ikuti channel WhatsApp
        </a>

        <div className="mt-3 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => dismiss('snooze')}
            className="text-xs font-medium text-ink-500 transition hover:text-ink-700"
          >
            Nanti saja
          </button>
          <button
            type="button"
            onClick={() => dismiss('never')}
            className="text-xs text-ink-400 underline decoration-line underline-offset-2 transition hover:text-ink-700"
          >
            Jangan tampilkan lagi
          </button>
        </div>

        <p className="mt-4 border-t border-line pt-3 text-[11px] leading-relaxed text-ink-400">
          Gratis. Anda bisa berhenti mengikuti channel kapan saja.
        </p>
      </div>
    </div>
  );
}

export { GROUP_URL };
