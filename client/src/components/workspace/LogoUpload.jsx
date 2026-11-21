import { useEffect, useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { cx } from '../../lib/format.js';

const MAX_SIDE = 600;
const MAX_FILE = 8 * 1024 * 1024;

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Gambar tidak dapat dibaca.'));
    };
    img.src = url;
  });
}

export async function prepareLogo(file) {
  if (!/^image\//.test(file.type)) throw new Error('File harus berupa gambar.');
  if (file.size > MAX_FILE) throw new Error('Ukuran gambar maksimum 8 MB.');
  const img = await loadImage(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const png = file.type !== 'image/jpeg';
  if (!png) {
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width, height);
  }
  ctx.drawImage(img, 0, 0, width, height);
  const logo = png ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.9);
  return { logo, logoWidth: width, logoHeight: height };
}

export function LogoUpload({ meta, onMetaChange }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');

  const pick = async (file) => {
    if (!file) return;
    setError('');
    try {
      onMetaChange({ ...meta, ...(await prepareLogo(file)) });
    } catch (e) {
      setError(e.message);
    }
  };

  const pickRef = useRef(pick);
  pickRef.current = pick;
  useEffect(() => {
    const onPaste = (event) => {
      const item = [...(event.clipboardData?.items || [])].find((i) => i.kind === 'file' && i.type.startsWith('image/'));
      if (!item) return;
      event.preventDefault();
      pickRef.current(item.getAsFile());
    };
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  }, []);

  const size = meta.logoSize || 2.5;
  const clear = () => onMetaChange({ ...meta, logo: '', logoWidth: undefined, logoHeight: undefined, logoSize: undefined });

  return (
    <div className="mb-3">
      <span className="mb-1 block text-[10px] font-medium text-ink-500">Logo / foto cover</span>
      {meta.logo ? (
        <div className="flex items-center gap-3 rounded-lg border border-line bg-white p-2">
          <img src={meta.logo} alt="Logo cover" className="h-14 w-14 shrink-0 rounded object-contain" />
          <div className="min-w-0 flex-1 text-[11px] text-ink-500">
            <div className="mb-1 flex justify-between"><span>Ukuran (tinggi)</span><span className="font-medium text-ink-700">{size.toFixed(1)} cm</span></div>
            <input type="range" min="1" max="8" step="0.5" value={size} onChange={(event) => onMetaChange({ ...meta, logoSize: Number(event.target.value) })} className="w-full accent-brand-600" />
          </div>
          <button type="button" onClick={clear} className="rounded p-1 text-ink-400 hover:bg-slate-100 hover:text-ink-700" aria-label="Hapus logo">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            pick(event.dataTransfer.files?.[0]);
          }}
          className={cx(
            'flex w-full flex-col items-center gap-1 rounded-lg border border-dashed px-3 py-4 text-[11px] transition',
            dragging ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-line bg-slate-50 text-ink-500 hover:border-brand-300 hover:bg-white',
          )}
        >
          <ImagePlus className="h-5 w-5" />
          <span className="font-medium">Unggah logo atau foto</span>
          <span className="text-[10px] text-ink-400">Gambar: klik, tarik ke sini, atau tempel (Ctrl+V)</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          pick(event.target.files?.[0]);
          event.target.value = '';
        }}
      />
      {error ? <p className="mt-1 text-[10px] text-red-600">{error}</p> : null}
    </div>
  );
}
