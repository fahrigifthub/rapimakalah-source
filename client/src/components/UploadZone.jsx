import { useCallback, useRef, useState } from 'react';
import { AlertCircle, ClipboardPaste, FileText, Loader2, UploadCloud, X } from 'lucide-react';
import { api } from '../lib/api.js';
import { cx, formatBytes } from '../lib/format.js';
import { ProgressBar } from './ui/Common.jsx';
import { Button } from './ui/Button.jsx';

const MAX_BYTES = 20 * 1024 * 1024;

export function UploadZone({ onUploaded, compact = false, onError, className }) {
  const [mode, setMode] = useState('file');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const submitText = async () => {
    if (text.trim().length < 20) {
      onError?.('Teks terlalu pendek. Tempel isi makalah terlebih dahulu.');
      return;
    }
    setSending(true);
    try {
      const payload = await api.post('/documents/text', { text });
      onUploaded?.(payload.document);
    } catch (e) {
      onError?.(e.message || 'Gagal membuat dokumen dari teks.');
    } finally {
      setSending(false);
    }
  };

  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [state, setState] = useState({ status: 'idle', progress: 0, fileName: '', error: '' });

  const upload = useCallback(
    (file) => {
      if (!file) return;
      setState({ status: 'uploading', progress: 0, fileName: file.name, error: '' });

      if (!/\.docx$/i.test(file.name)) {
        const message = 'Hanya file .docx yang didukung. File .doc, .pdf, atau format lain tidak dapat diproses.';
        setState({ status: 'error', progress: 0, fileName: file.name, error: message });
        onError?.(message);
        return;
      }
      if (file.size > MAX_BYTES) {
        const message = `Ukuran file ${formatBytes(file.size)} melebihi batas 20 MB.`;
        setState({ status: 'error', progress: 0, fileName: file.name, error: message });
        onError?.(message);
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/documents');
      xhr.withCredentials = true;
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          setState((current) => ({ ...current, progress: Math.round((event.loaded / event.total) * 100) }));
        }
      };
      xhr.onload = () => {
        let payload = null;
        try {
          payload = JSON.parse(xhr.responseText);
        } catch {
          payload = null;
        }
        if (xhr.status >= 200 && xhr.status < 300) {
          setState({ status: 'done', progress: 100, fileName: file.name, error: '' });
          onUploaded?.(payload.document);
        } else {
          const message = payload?.error || 'Upload gagal. Coba lagi.';
          setState({ status: 'error', progress: 0, fileName: file.name, error: message });
          onError?.(message);
        }
      };
      xhr.onerror = () => {
        const message = 'Koneksi terputus saat mengunggah. Periksa server RapiMakalah.';
        setState({ status: 'error', progress: 0, fileName: file.name, error: message });
        onError?.(message);
      };
      xhr.send(formData);
    },
    [onUploaded, onError],
  );

  const busy = state.status === 'uploading';
  const reset = () => setState({ status: 'idle', progress: 0, fileName: '', error: '' });

  const tabs = (
    <div className="mb-2 inline-flex rounded-lg border border-line bg-slate-50 p-0.5 text-[11px] font-medium">
      {[['file', 'Unggah DOCX', UploadCloud], ['text', 'Tempel teks', ClipboardPaste]].map(([key, label, Icon]) => (
        <button
          key={key}
          type="button"
          onClick={() => setMode(key)}
          className={cx('flex items-center gap-1.5 rounded-md px-2.5 py-1 transition', mode === key ? 'bg-white text-ink-800 shadow-sm' : 'text-ink-500 hover:text-ink-700')}
        >
          <Icon className="h-3 w-3" /> {label}
        </button>
      ))}
    </div>
  );

  if (mode === 'text') {
    return (
      <div className={className}>
        {tabs}
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={compact ? 7 : 14}
          placeholder={'Tempel isi makalah di sini (teks biasa atau Markdown dari ChatGPT).\n\n# BAB I\n## 1.1 Latar Belakang\nIsi paragraf...'}
          className="w-full resize-y rounded-xl border border-line bg-white px-3 py-2.5 font-mono text-[12px] leading-relaxed text-ink-800 outline-none transition placeholder:text-ink-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-[10px] leading-relaxed text-ink-400">
            Judul diawali <code>#</code>, <code>##</code>; daftar diawali <code>1.</code> atau <code>-</code>; tabel pakai <code>| kolom |</code>; <code>---</code> jadi pemisah halaman.
          </p>
          <Button onClick={submitText} disabled={sending || text.trim().length < 20} size="sm">
            {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {sending ? 'Membuat...' : 'Buat dokumen'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {tabs}
      <div
        role="button"
        tabIndex={0}
        aria-label="Unggah dokumen DOCX"
        onClick={() => !busy && inputRef.current?.click()}
        onKeyDown={(event) => {
          if ((event.key === 'Enter' || event.key === ' ') && !busy) inputRef.current?.click();
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!busy) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (!busy) upload(event.dataTransfer.files?.[0]);
        }}
        className={cx(
          'group relative flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed text-center transition',
          compact ? 'px-4 py-5' : 'px-6 py-10',
          dragging ? 'border-brand-400 bg-brand-50/60' : 'border-slate-300 bg-white hover:border-brand-300 hover:bg-brand-50/30',
          busy && 'cursor-wait',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          onChange={(event) => {
            upload(event.target.files?.[0]);
            event.target.value = '';
          }}
        />
        {busy ? (
          <div className="w-full max-w-xs">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50">
              <FileText className="h-5 w-5 text-brand-600" />
            </div>
            <p className="mt-3 truncate text-[13px] font-medium text-ink-800">{state.fileName}</p>
            <ProgressBar value={state.progress} className="mt-3" />
            <p className="mt-2 text-[11px] text-ink-500">Mengunggah… {state.progress}%</p>
          </div>
        ) : (
          <>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-ink-400 transition group-hover:bg-brand-50 group-hover:text-brand-600">
              <UploadCloud className="h-5 w-5" />
            </span>
            <p className="mt-3 text-[13px] font-medium text-ink-800">
              {compact ? 'Letakkan DOCX di sini atau pilih file' : 'Tarik dokumen DOCX ke sini'}
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-ink-500">
              {compact ? 'Maks. 20 MB' : 'Atau klik untuk memilih file. Hanya .docx, maksimum 20 MB.'}
            </p>
            {!compact && (
              <span className="mt-3 rounded-lg border border-line bg-white px-3 py-1.5 text-[11px] font-medium text-ink-600 shadow-sm">
                Pilih file
              </span>
            )}
          </>
        )}
      </div>
      {state.status === 'error' && (
        <div className="mt-2 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] leading-relaxed text-red-700">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span className="flex-1">{state.error}</span>
          <button type="button" onClick={reset} className="rounded p-0.5 hover:bg-red-100" aria-label="Tutup pesan">
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
      {state.status === 'done' && !busy && (
        <div className="mt-2 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] text-emerald-700">
          <span className="truncate">“{state.fileName}” terunggah.</span>
          <Button variant="ghost" size="sm" onClick={reset} className="ml-2 h-6 px-2 text-emerald-700">
            Unggah lain
          </Button>
        </div>
      )}
    </div>
  );
}
