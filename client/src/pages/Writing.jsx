import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { EditorContent, useEditor } from '@tiptap/react';
import { generateJSON } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table';
import { ParagraphLayout, PageBreak, TocTitle, TocPageNumber, WritingImage, WritingTextStyle, WritingMath, WritingTab, WritingTocLeader, NumberLabel } from '../components/writing/WritingExtensions.js';
import { WritingRibbon, WritingNavigation, WritingSearchPanel, useTextReplacer } from '../components/writing/WritingRibbon.jsx';
import { WritingRuler } from '../components/writing/WritingRuler.jsx';
import { WritingPagination } from '../components/writing/WritingPagination.js';
import { WritingGuides } from '../components/writing/WritingGuides.jsx';
import { Plus, Download, Save, ArrowLeft, Trash2, PenLine } from 'lucide-react';
import { AppShell } from '../components/AppShell.jsx';
import { Button } from '../components/ui/Button.jsx';
import { PageHeader, PageLoader, EmptyState } from '../components/ui/Common.jsx';
import { ConfirmDialog } from '../components/ui/Modal.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api, downloadFile } from '../lib/api.js';
import './Writing.css';

const EMPTY = { type: 'doc', content: [{ type: 'paragraph' }] };

function WritingList() {
  const navigate = useNavigate();
  const { error } = useToast();
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [target, setTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    api.get('/writing').then(data => setDrafts(data.drafts)).catch(err => error(err.message)).finally(() => setLoading(false));
  }, []);
  async function create() {
    setCreating(true);
    try {
      const { draft } = await api.post('/writing', { title: 'Makalah baru', content: EMPTY });
      navigate(`/app/writing/${draft.id}`);
    } catch (err) { error(err.message); setCreating(false); }
  }
  async function remove() {
    setDeleting(true);
    try {
      await api.delete(`/writing/${target.id}`);
      setDrafts(items => items.filter(item => item.id !== target.id));
      setTarget(null);
    } catch (err) { error(err.message); }
    finally { setDeleting(false); }
  }
  return <>
    <PageHeader eyebrow="Workspace menulis" title="Tulis makalah dari HP" description="Buat dan edit makalah langsung. Draft disimpan ke akun Anda dan dapat diunduh sebagai Word (.docx)." actions={<Button icon={Plus} loading={creating} onClick={create}>Makalah baru</Button>} />
    {loading ? <PageLoader /> : drafts.length ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {drafts.map(draft => <article key={draft.id} className="surface-card flex items-center gap-3 p-4">
        <button className="min-w-0 flex-1 text-left" onClick={() => navigate(`/app/writing/${draft.id}`)}>
          <h2 className="truncate text-sm font-semibold text-ink-900">{draft.title}</h2>
          <p className="mt-1 text-xs text-ink-500">Diedit {new Date(draft.updatedAt).toLocaleString('id-ID')}</p>
        </button>
        <button className="rounded-lg p-3 text-ink-500 hover:bg-red-50 hover:text-red-700" aria-label={`Hapus ${draft.title}`} onClick={() => setTarget(draft)}><Trash2 size={18} /></button>
      </article>)}
    </div> : <EmptyState icon={PenLine} title="Mulai makalah pertama Anda" description="Menulis langsung dari HP atau laptop, tanpa harus mengunggah file." action={<Button onClick={create} loading={creating} icon={Plus}>Mulai menulis</Button>} />}
    <ConfirmDialog open={Boolean(target)} onClose={() => !deleting && setTarget(null)} onConfirm={remove} loading={deleting} title="Hapus draft?" description={`Draft “${target?.title || ''}” akan dihapus dari akun.`} />
  </>;
}

function WritingEditor({ id }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { error } = useToast();
  const key = `rapimakalah-writing-${user.id}-${id}`;
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState('Memuat draft…');
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [viewMode, setViewMode] = useState('edit');
  const [originalAvailable, setOriginalAvailable] = useState(false);
  const originalContainer = useRef(null);
  const [, redraw] = useState(0);
  const latest = useRef(null);
  const revision = useRef(0);
  const saved = useRef(0);
  const queue = useRef(Promise.resolve());
  const timer = useRef(null);
  const mounted = useRef(true);
  const imageInput = useRef(null);
  const wordInput = useRef(null);
  const [importing, setImporting] = useState(false);
  const [pendingImport, setPendingImport] = useState(null);
  const [showGuides, setShowGuides] = useState(() => !window.matchMedia('(max-width: 640px)').matches);
  const [navigation, setNavigation] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [focus, setFocus] = useState(false);
  const [zoom, setZoom] = useState('fit');
  const [fitScale, setFitScale] = useState(1);
  const [pages, setPages] = useState(1);
  const [pageLayout, setPageLayout] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(`writing-page-layout-${id}`)) || { width: 21, height: 29.7, margins: { top: 3, right: 3, bottom: 3, left: 4 } }; }
    catch { return { width: 21, height: 29.7, margins: { top: 3, right: 3, bottom: 3, left: 4 } }; }
  });
  const workspace = useRef(null);
  const body = useRef(null);
  const canvas = useRef(null);
  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const update = () => {
      const style = getComputedStyle(element);
      const width = element.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      if (width > 0) setFitScale(Math.min(1, width / (pageLayout.width / 21 * 826)));
    };
    const observer = new ResizeObserver(update);
    observer.observe(element);
    window.addEventListener('resize', update);
    window.visualViewport?.addEventListener('resize', update);
    update();
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('resize', update);
    };
  }, [loading]);
  const updatePages = useCallback(event => setPages(event.detail.pages), []);
  useEffect(() => {
    const element = workspace.current;
    if (!element) return;
    element.addEventListener('writing-pages', updatePages);
    return () => element.removeEventListener('writing-pages', updatePages);
  }, [updatePages, loading, failed]);

  function schedule(content, nextTitle = latest.current?.title || 'Makalah baru') {
    latest.current = { title: nextTitle, content, updatedAt: new Date().toISOString() };
    revision.current += 1;
    try { localStorage.setItem(key, JSON.stringify(latest.current)); } catch { /* server autosave remains available */ }
    setStatus('Perubahan belum tersimpan ke akun…');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { save().catch(() => {}); }, 1200);
  }
  function save() {
    clearTimeout(timer.current);
    const job = queue.current.catch(() => {}).then(async () => {
      if (!latest.current || saved.current === revision.current) return;
      const version = revision.current;
      const data = { title: latest.current.title.trim() || 'Makalah baru', content: latest.current.content };
      if (mounted.current) setStatus('Menyimpan…');
      try {
        await api.put(`/writing/${id}`, data);
        saved.current = version;
        if (revision.current === version) {
          try { localStorage.removeItem(key); } catch { /* optional recovery */ }
          if (mounted.current) setStatus('Tersimpan ke akun');
        }
      } catch (err) {
        if (mounted.current) setStatus('Gagal menyimpan. Tekan Simpan untuk mencoba lagi.');
        throw err;
      }
    });
    queue.current = job;
    return job;
  }
  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [1, 2, 3] }, underline: false, link: false, code: false, codeBlock: false }), Underline, TocTitle, TocPageNumber, WritingTextStyle, WritingMath, WritingTab, WritingTocLeader, NumberLabel, TextAlign.configure({ types: ['heading', 'paragraph'] }), ParagraphLayout, PageBreak, WritingPagination, WritingImage.configure({ allowBase64: true }), Table.configure({ resizable: true }), TableRow, TableCell, TableHeader],
    content: EMPTY,
    editorProps: { attributes: { 'aria-label': 'Isi makalah', role: 'textbox', 'aria-multiline': 'true', spellcheck: 'true' } },
    onUpdate: ({ editor: activeEditor }) => schedule(activeEditor.getJSON()),
    onSelectionUpdate: () => redraw(value => value + 1),
    onTransaction: () => redraw(value => value + 1),
  });
  const searchState = useTextReplacer(editor);
  useEffect(() => {
    if (!editor) return;
    let active = true;
    mounted.current = true;
    api.get(`/writing/${id}`).then(({ draft }) => {
      if (!active) return;
      let recovery;
      try { recovery = JSON.parse(localStorage.getItem(key)); } catch { /* no recovery */ }
      const restore = recovery?.content?.type === 'doc' && recovery.updatedAt > draft.updatedAt;
      const data = restore ? recovery : draft;
      latest.current = data;
      setTitle(data.title);
      setOriginalAvailable(Boolean(draft.originalDocx));
      editor.commands.setContent(data.content, { emitUpdate: false });
      setLoading(false);
      setStatus('Tersimpan ke akun');
      if (restore) schedule(data.content, data.title);
    }).catch(err => { if (active) { error(err.message); setFailed(true); setLoading(false); } });
    return () => { active = false; mounted.current = false; clearTimeout(timer.current); };
  }, [editor, id]);
  useEffect(() => {
    function warn(event) {
      if (revision.current !== saved.current) { event.preventDefault(); event.returnValue = ''; }
    }
    function online() { save().catch(() => {}); }
    window.addEventListener('beforeunload', warn);
    window.addEventListener('online', online);
    return () => { window.removeEventListener('beforeunload', warn); window.removeEventListener('online', online); };
  }, [pageLayout.width]);

  useEffect(() => {
    if (!originalAvailable || !originalContainer.current) return undefined;
    let active = true;
    let objectUrl;
    import('docx-preview').then(async ({ renderAsync }) => {
      const response = await fetch(`/api/writing/${id}/original`, { credentials: 'include' });
      if (!response.ok) throw new Error('File Word asli tidak dapat dimuat.');
      const sourceBlob = await response.blob();
      if (!active) return;
      objectUrl = URL.createObjectURL(sourceBlob);
      if (!active || !originalContainer.current) return;
      const mount = originalContainer.current;
      if (mount.clientWidth < 500) {
        const scale = mount.clientWidth / 794;
        mount.style.setProperty('--source-page-scale', String(scale));
      } else {
        mount.style.removeProperty('--source-page-scale');
      }
      await renderAsync(objectUrl, originalContainer.current, originalContainer.current, {
        className: 'word-source-preview', inWrapper: true, breakPages: true,
        ignoreLastRenderedPageBreak: false, renderHeaders: true, renderFooters: true,
        renderFootnotes: true, renderEndnotes: true, useBase64URL: true,
      });
    }).catch(err => { if (active) error(err.message); });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      originalContainer.current?.replaceChildren();
    };
  }, [originalAvailable, id]);

  async function leave() {
    try { await save(); navigate('/app/writing'); } catch (err) { error(err.message); }
  }
  async function download() {
    setBusy(true);
    try {
      await save();
      await downloadFile(`/writing/${id}/download`, `${title.replace(/[\\/:*?"<>|]/g, '-') || 'Makalah'}.docx`);
    } catch (err) { error(err.message); }
    finally { setBusy(false); }
  }
  async function insertImage(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/png', 'image/jpeg'].includes(file.type)) return error('Pilih gambar PNG atau JPG.');
    if (file.size > 700000) return error('Gambar maksimal 700 KB. Kecilkan gambar terlebih dahulu.');
    const reader = new FileReader();
    reader.onload = () => {
      const nextSize = JSON.stringify(editor.getJSON()).length + String(reader.result).length;
      if (nextSize > 1800000) return error('Isi draft terlalu besar. Kurangi gambar sebelum menambahkan lagi.');
      const picture = new window.Image();
      picture.onload = () => {
        const width = Math.min(480, picture.naturalWidth);
        const height = Math.round(width * picture.naturalHeight / picture.naturalWidth);
        editor.chain().focus().setImage({ src: String(reader.result), alt: file.name, width, height }).run();
      };
      picture.onerror = () => error('Gambar rusak atau tidak dapat dibaca.');
      picture.src = String(reader.result);
    };
    reader.onerror = () => error('Gambar tidak dapat dibaca.');
    reader.readAsDataURL(file);
  }
  async function importWord(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setImporting(true);
    try {
      const body = new FormData(); body.append('file', file);
      const data = await api.post('/writing/import', body);
      setPendingImport({ ...data, file, title: file.name.replace(/\.docx$/i, '').slice(0, 120) });
    } catch (err) { error(err.message); }
    finally { setImporting(false); }
  }
  async function confirmImport() {
    setImporting(true);
    let createdDraftId = null;
    try {
      // Preserve this draft before creating a separate imported copy.
      await save();
      const content = generateJSON(pendingImport.html, editor.extensionManager.extensions);
      const { draft } = await api.post('/writing', { title: pendingImport.title || 'Makalah impor', content });
      createdDraftId = draft.id;
      const original = new FormData(); original.append('file', pendingImport.file);
      await api.upload(`/writing/${draft.id}/original`, original);
      if (pendingImport.page) {
        const page = pendingImport.page;
        const width = Number(page.width);
        const height = Number(page.height);
        const margins = page.margins || {};
        if (width > 10 && width < 50 && height > 10 && height < 60) {
          const layout = { width, height, margins };
          sessionStorage.setItem(`writing-page-layout-${draft.id}`, JSON.stringify(layout));
          setPageLayout(layout);
        }
      }
      navigate(`/app/writing/${draft.id}`);
    } catch (err) {
      if (createdDraftId) {
        try { await api.delete(`/writing/${createdDraftId}`); } catch { /* leave the editable draft if cleanup fails */ }
      }
      error(err.message);
    }
    finally { setImporting(false); }
  }
  if (loading) return <PageLoader label="Memuat workspace menulis…" />;
  if (failed) return <EmptyState title="Draft tidak dapat dibuka" description="Coba buka kembali dari daftar draft." action={<Button onClick={() => navigate('/app/writing')}>Ke daftar draft</Button>} />;
  return <div ref={workspace} className={`writing-workspace word-workspace word-workspace-flush ${focus ? 'word-focus' : ''}`}>
    <div className="word-titlebar">
      <button onClick={leave} aria-label="Simpan dan kembali ke draft" className="rounded-lg p-3 hover:bg-slate-100"><ArrowLeft size={20} /></button>
      <div className="word-document-icon" aria-hidden="true"><PenLine size={20} /></div>
      <div className="min-w-0 flex-1">
        <input aria-label="Judul makalah" maxLength={120} value={title} onChange={event => { setTitle(event.target.value); schedule(editor.getJSON(), event.target.value); }} className="w-full border-0 bg-transparent text-lg font-semibold text-ink-900 outline-none focus:ring-2 focus:ring-brand-500" />
        <p role="status" className="mt-1 text-xs text-ink-600">{status}</p>
      </div>
      <Button variant="secondary" icon={Save} onClick={() => save().catch(err => error(err.message))}>Simpan</Button>
      <Button icon={Download} onClick={download} loading={busy}>Unduh Word</Button>
    </div>
    <input ref={imageInput} type="file" accept="image/png,image/jpeg" className="hidden" onChange={insertImage} />
    <input ref={wordInput} type="file" accept=".docx" className="hidden" onChange={importWord} />
     <WritingRibbon editor={editor} save={() => save().catch(err => error(err.message))} download={download} upload={() => wordInput.current?.click()} image={() => imageInput.current?.click()} importing={importing} busy={busy} guides={showGuides} setGuides={setShowGuides} navigation={navigation} setNavigation={setNavigation} focus={focus} setFocus={setFocus} zoom={zoom} setZoom={setZoom} setSearchOpen={setSearchOpen} viewMode={viewMode} setViewMode={setViewMode} originalAvailable={originalAvailable} />
    <div className={`word-body ${zoom === 'fit' ? 'word-body-fit' : 'word-body-zoomed'}`} ref={body}>
      {navigation && <WritingNavigation editor={editor} close={() => setNavigation(false)} />}
      {searchOpen && <WritingSearchPanel state={searchState} close={() => setSearchOpen(false)} />}
      <div className="word-canvas" ref={canvas}>
        <div className="word-zoom-wrapper" style={{ width: `${pageLayout.width / 21 * 826 * (zoom === 'fit' ? fitScale : Number(zoom) / 100)}px`, height: viewMode === 'original' ? 'auto' : `${pages * (pageLayout.height / 29.7 * 1123 * (zoom === 'fit' ? fitScale : Number(zoom) / 100)) + (pages - 1) * 24 * (zoom === 'fit' ? fitScale : Number(zoom) / 100)}px`, maxWidth: 'none' }}>
       <div className="writing-page-stage" style={{ width: `${pageLayout.width / 21 * 826}px`, transform: `scale(${zoom === 'fit' ? fitScale : Number(zoom) / 100})`, transformOrigin: 'top left', height: viewMode === 'original' ? 'auto' : undefined }}>
          <div ref={originalContainer} className="word-source-preview" hidden={viewMode !== 'original'} />
          {viewMode !== 'original' && <>{showGuides && <div className="writing-horizontal-guide"><WritingRuler editor={editor} /></div>}<WritingGuides visible={showGuides} pageLayout={pageLayout}><EditorContent editor={editor} className="writing-paper bg-white shadow-sm" /></WritingGuides></>}
      </div>
      </div>
      </div>
    </div>
     <footer className="word-statusbar"><span>{pages} halaman</span><span>{editor.getText().trim().split(/\s+/u).filter(Boolean).length.toLocaleString('id-ID')} kata</span><span className="word-status-format">{pageLayout.width.toFixed(1)} × {pageLayout.height.toFixed(1)} cm</span><label>Zoom <select aria-label="Zoom halaman" value={zoom} onChange={event => setZoom(event.target.value)}><option value="fit">Sesuaikan layar</option>{[50, 75, 100, 125, 150].map(value => <option key={value} value={value}>{value}%</option>)}</select></label></footer>
    <ConfirmDialog open={Boolean(pendingImport)} onClose={() => !importing && setPendingImport(null)} onConfirm={confirmImport} loading={importing} title="Buka salinan Word di editor?" confirmLabel="Buka salinan" tone="primary" description={`Draft sekarang tetap disimpan. Perataan paragraf dan struktur cover yang didukung akan dipertahankan. Daftar isi Word dibuka sebagai teks statis, bukan field yang bisa memperbarui nomor halaman. Sebagian tata letak lanjutan mungkin berubah; periksa ulang hasilnya.${pendingImport?.warnings?.length ? ` Peringatan impor: ${pendingImport.warnings.join(' ')}` : ''}`} />
  </div>;
}

export default function Writing() {
  const { id } = useParams();
  return <AppShell flush={Boolean(id)}>{id ? <WritingEditor key={id} id={id} /> : <WritingList />}</AppShell>;
}
