import { useState } from 'react';
import { Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, AlignJustify, List, ListOrdered, Undo2, Redo2, Image, Table, FilePlus2, Minus, Eraser, Search, Maximize2, Save, Download, Upload } from 'lucide-react';
import { WRITING_FONTS } from './WritingExtensions.js';
import { ParagraphSpacing } from './WritingGuides.jsx';
import { updateToc } from './updateToc.js';
import { useToast } from '../../context/ToastContext.jsx';

export function WritingRibbon({ editor, save, download, upload, image, importing, busy, guides, setGuides, navigation, setNavigation, focus, setFocus, zoom, setZoom, setSearchOpen, viewMode, setViewMode, originalAvailable }) {
  const [tab, setTab] = useState('home');
  const { error, success } = useToast();
  const contextual = editor.isActive('table') ? 'table' : editor.isActive('image') ? 'image' : null;
  const selected = ['table', 'image'].includes(tab) && contextual !== tab ? 'home' : tab;
  const style = editor.getAttributes('writingTextStyle');
  const mark = attrs => editor.chain().focus().setMark('writingTextStyle', attrs).run();
  const icon = (label, Icon, action, active = false, disabled = false) => <button type="button" title={label} aria-label={label} aria-pressed={active} disabled={disabled} onMouseDown={event => event.preventDefault()} onClick={action} className={`word-icon ${active ? 'active' : ''}`}><Icon size={17} /></button>;
  const action = (label, Icon, handler, disabled = false) => <button type="button" className="word-command" disabled={disabled} onClick={handler}><Icon size={22} /><span>{label}</span></button>;
  const group = (label, children) => <div className="word-group"><div className="word-group-controls">{children}</div><span className="word-group-label">{label}</span></div>;
  return <div className="word-ribbon">
    <div className="word-tabs" role="tablist" aria-label="Menu dokumen">
      {[['file', 'File'], ['home', 'Beranda'], ['insert', 'Sisipkan'], ['layout', 'Tata Letak'], ['view', 'Tampilan'], ...(contextual ? [[contextual, contextual === 'table' ? 'Tabel' : 'Gambar']] : [])].map(([value, label]) => <button key={value} role="tab" id={`word-tab-${value}`} aria-selected={selected === value} aria-controls="word-ribbon-panel" className={selected === value ? 'selected' : ''} onClick={() => setTab(value)}>{label}</button>)}
      <a href="https://support.microsoft.com/en-us/word/" target="_blank" rel="noreferrer" className="word-help">Bantuan Word ↗</a>
    </div>
    <div className="word-ribbon-panel" id="word-ribbon-panel" role="tabpanel" aria-labelledby={`word-tab-${selected}`}>
      {selected === 'file' && <>
        {group('Dokumen', <>{action('Simpan', Save, save)}{action(importing ? 'Mengimpor…' : 'Buka Word', Upload, upload, importing)}{action(busy ? 'Mengunduh…' : 'Unduh Word', Download, download, busy)}</>)}
        <div className="word-ribbon-note"><strong>Disimpan otomatis</strong><span>Upload Word membuka salinan sebagai draft baru.</span></div>
      </>}
      {selected === 'home' && <>
        {group('Riwayat', <>{icon('Urungkan', Undo2, () => editor.chain().focus().undo().run(), false, !editor.can().undo())}{icon('Ulangi', Redo2, () => editor.chain().focus().redo().run(), false, !editor.can().redo())}</>)}
        {group('Font', <div className="word-font-controls"><div className="word-control-row"><select aria-label="Font" value={style.fontFamily || 'Times New Roman'} onChange={event => mark({ fontFamily: event.target.value })}>{WRITING_FONTS.map(font => <option key={font}>{font}</option>)}</select><select aria-label="Ukuran font" value={style.fontSize || 12} onChange={event => mark({ fontSize: Number(event.target.value) })}>{[8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 36, 48, 72].map(size => <option key={size}>{size}</option>)}</select></div><div className="word-control-row">
          {icon('Tebal', Bold, () => editor.chain().focus().toggleBold().run(), editor.isActive('bold'))}
          {icon('Miring', Italic, () => editor.chain().focus().toggleItalic().run(), editor.isActive('italic'))}
          {icon('Garis bawah', Underline, () => editor.chain().focus().toggleUnderline().run(), editor.isActive('underline'))}
          {icon('Coret', Strikethrough, () => editor.chain().focus().toggleStrike().run(), editor.isActive('strike'))}
          <label className="word-color" title="Warna teks">A<input aria-label="Warna teks" type="color" value={/^#[a-f\d]{6}$/i.test(style.color || '') ? style.color : '#172033'} onChange={event => mark({ color: event.target.value })} /></label>
          <label className="word-color" title="Sorotan teks">▰<input aria-label="Sorotan teks" type="color" value={/^#[a-f\d]{6}$/i.test(style.highlight || '') ? style.highlight : '#fff176'} onChange={event => mark({ highlight: event.target.value })} /></label>
          {icon('Hapus format teks', Eraser, () => editor.chain().focus().unsetAllMarks().run())}
        </div></div>)}
        {group('Paragraf', <div><div className="word-control-row">{icon('Daftar bullet', List, () => editor.chain().focus().toggleBulletList().run(), editor.isActive('bulletList'))}{icon('Daftar nomor', ListOrdered, () => editor.chain().focus().toggleOrderedList().run(), editor.isActive('orderedList'))}<button className="word-text-command" onClick={() => setTab('layout')}>Spasi & indent ↗</button></div><div className="word-control-row">{[[AlignLeft, 'left', 'Rata kiri'], [AlignCenter, 'center', 'Rata tengah'], [AlignRight, 'right', 'Rata kanan'], [AlignJustify, 'justify', 'Rata kiri kanan']].map(([Icon, align, label]) => icon(label, Icon, () => editor.chain().focus().setTextAlign(align).run(), editor.isActive({ textAlign: align })))}</div></div>)}
        {group('Gaya', <div className="word-styles">{[['p', 'Normal', 'Teks makalah'], [1, 'Heading 1', 'Judul BAB'], [2, 'Heading 2', 'Subbab'], [3, 'Heading 3', 'Subjudul']].map(([level, title, sample]) => <button key={level} className={(level === 'p' ? editor.isActive('paragraph') : editor.isActive('heading', { level })) ? 'active' : ''} onClick={() => level === 'p' ? editor.chain().focus().setParagraph().run() : editor.chain().focus().setHeading({ level }).run()}><strong>{title}</strong><span>{sample}</span></button>)}</div>)}
        {group('Pengeditan', action('Cari & ganti', Search, () => setSearchOpen(true)))}
      </>}
      {selected === 'insert' && <>
        {group('Daftar isi', <div><button className="word-text-command" disabled={viewMode === 'original'} onMouseDown={event => event.preventDefault()} onClick={() => { try { const count = updateToc(editor); success(`Daftar isi diperbarui: ${count} judul.`); } catch (err) { error(err.message); } }}>Perbarui daftar isi</button><p className="word-ribbon-note">Nomor mengikuti halaman web, termasuk cover.</p></div>)}
        {group('Halaman', action('Pemisah halaman', FilePlus2, () => editor.chain().focus().insertContent({ type: 'pageBreak' }).run()))}
        {group('Tabel', action('Tabel 3 × 3', Table, () => { editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(); setTab('table'); }))}
        {group('Ilustrasi', action('Gambar perangkat', Image, image))}
        {group('Elemen', action('Garis horizontal', Minus, () => editor.chain().focus().setHorizontalRule().run()))}
      </>}
      {selected === 'layout' && <>
        {group('Pengaturan halaman', <div className="word-page-preset"><strong>A4 · Potret</strong><span>Margin makalah: kiri 4 cm</span><span>Atas, bawah, kanan 3 cm</span></div>)}
        {group('Jarak paragraf', <ParagraphSpacing editor={editor} />)}
        {group('Indentasi', <button className="word-text-command" onClick={() => { setGuides(true); requestAnimationFrame(() => { const details = document.querySelector('.writing-ruler-settings'); if (details) { details.open = true; details.scrollIntoView({ block: 'center', behavior: 'smooth' }); } }); }}>Atur pada penggaris ↗</button>)}
      </>}
       {selected === 'view' && <>
         <div className="word-group"><div className="word-group-controls"><div className="word-view-modes" role="group" aria-label="Mode dokumen"><button type="button" aria-pressed={viewMode === 'edit'} onClick={() => setViewMode('edit')}>Edit</button><button type="button" aria-pressed={viewMode === 'original'} disabled={!originalAvailable} onClick={() => setViewMode('original')}>Asli</button></div></div><span className="word-group-label">Dokumen</span></div>
        {group('Tampilkan', <div className="word-view-options"><label><input type="checkbox" checked={guides} onChange={event => setGuides(event.target.checked)} />Penggaris & batas teks</label><label><input type="checkbox" checked={navigation} onChange={event => setNavigation(event.target.checked)} />Panel navigasi</label></div>)}
        {group('Zoom', <select aria-label="Zoom tampilan" value={zoom} onChange={event => setZoom(event.target.value)}><option value="fit">Sesuaikan layar</option>{[50, 75, 100, 125, 150].map(value => <option key={value} value={value}>{value}%</option>)}</select>)}
        {group('Workspace', action(focus ? 'Keluar fokus' : 'Mode fokus', Maximize2, () => setFocus(!focus)))}
      </>}
      {selected === 'table' && group('Tata letak tabel', <div className="word-table-actions">{[['Tambah baris', 'addRowAfter'], ['Tambah kolom', 'addColumnAfter'], ['Hapus baris', 'deleteRow'], ['Hapus kolom', 'deleteColumn'], ['Gabung sel', 'mergeCells'], ['Pisah sel', 'splitCell'], ['Hapus tabel', 'deleteTable']].map(([label, command]) => <button key={command} disabled={!editor.can()[command]()} onClick={() => editor.chain().focus()[command]().run()}>{label}</button>)}</div>)}
      {selected === 'image' && group('Ukuran gambar', <><label className="word-image-size">Lebar (px)<input aria-label="Lebar gambar" type="number" min="40" max="480" value={editor.getAttributes('image').width || 400} onChange={event => { const attrs = editor.getAttributes('image'); const width = Math.min(480, Math.max(40, Number(event.target.value) || 40)); editor.chain().updateAttributes('image', { width, height: Math.round(width * (attrs.height || 250) / (attrs.width || 400)) }).run(); }} /></label><button className="word-text-command" onClick={() => editor.chain().focus().deleteSelection().run()}>Hapus gambar</button></>)}
    </div>
  </div>;
}

export function WritingNavigation({ editor, close }) {
  const [query, setQuery] = useState('');
  const items = [];
  editor.state.doc.descendants((node, pos) => {
    if (query ? node.isTextblock && node.textContent.toLocaleLowerCase().includes(query.toLocaleLowerCase()) : node.type.name === 'heading') items.push({ pos, text: node.textContent, level: node.attrs.level || 1 });
  });
  return <aside className="word-navigation" aria-label="Navigasi dokumen"><div><strong>Navigasi</strong><button aria-label="Tutup navigasi" onClick={close}>×</button></div><input aria-label="Cari dalam dokumen" placeholder="Cari dalam dokumen…" value={query} onChange={event => setQuery(event.target.value)} /><p>{query ? `${items.length} paragraf ditemukan` : 'Judul dalam dokumen'}</p><nav>{items.slice(0, 200).map(item => <button key={item.pos} style={{ paddingLeft: `${(item.level - 1) * 12 + 10}px` }} onClick={() => { editor.chain().focus().setTextSelection(item.pos + 1).run(); editor.view.domAtPos(item.pos + 1).node.parentElement?.scrollIntoView({ block: 'center', behavior: 'smooth' }); }}>{item.text || '(Judul kosong)'}</button>)}</nav>{!items.length && <p>{query ? 'Tidak ada hasil.' : 'Gunakan Heading 1–3 untuk membuat navigasi judul.'}</p>}</aside>;
}

export function useTextReplacer(editor) {
  const [search, setSearch] = useState('');
  const [replacement, setReplacement] = useState('');
  const [cursor, setCursor] = useState(0);
  const results = [];
  if (search) editor.state.doc.descendants((node, pos) => {
    if (!node.isTextblock) return;
    const value = node.textContent.toLocaleLowerCase();
    const needle = search.toLocaleLowerCase();
    let index = 0;
    while ((index = value.indexOf(needle, index)) !== -1) {
      results.push({ from: pos + 1 + index, to: pos + 1 + index + search.length });
      index += Math.max(1, search.length);
    }
  });
  const current = results.length ? cursor % results.length : -1;
  const go = index => {
    const found = results[(index + results.length) % results.length];
    if (!found) return;
    setCursor((index + results.length) % results.length);
    editor.chain().focus().setTextSelection(found).scrollIntoView().run();
  };
  const replace = () => {
    const found = results[current]; if (!found) return;
    editor.chain().focus().insertContentAt(found, replacement).run();
    setCursor(current);
  };
  const replaceAll = () => {
    if (!search || !results.length) return;
    for (const found of [...results].reverse()) editor.commands.insertContentAt(found, replacement);
    setCursor(0);
  };
  return { search, setSearch, replacement, setReplacement, results, current, go, replace, replaceAll };
}

export function WritingSearchPanel({ state, close }) {
  return <aside className="word-navigation word-search-panel" aria-label="Cari dan ganti"><div><strong>Cari dan ganti</strong><button aria-label="Tutup pencarian" onClick={close}>×</button></div>
    <label>Cari<input aria-label="Cari teks" placeholder="Kata atau frasa" value={state.search} onChange={event => { state.setSearch(event.target.value); state.setCursor(0); }} /></label>
    {state.search && <div className="word-search-actions"><span>{state.results.length ? `${state.current + 1} dari ${state.results.length}` : 'Tidak ditemukan'}</span><button disabled={!state.results.length} onClick={() => state.go(state.current + 1)}>Berikutnya</button><button disabled={!state.results.length} onClick={() => state.go(state.current - 1)}>Sebelumnya</button></div>}
    <label>Ganti dengan<input aria-label="Ganti dengan" value={state.replacement} onChange={event => state.setReplacement(event.target.value)} /></label>
    <div className="word-search-actions"><button disabled={!state.results.length} onClick={state.replace}>Ganti</button><button disabled={!state.results.length} onClick={state.replaceAll}>Ganti semua</button></div>
  </aside>;
}
