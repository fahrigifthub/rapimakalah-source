import { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Download,
  ExternalLink,
  FileText,
  Info,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button.jsx';
import { Checkbox, Field, Input, Select, Toggle } from '../ui/Form.jsx';
import { Badge } from '../ui/Badge.jsx';
import { cx } from '../../lib/format.js';
import { LogoUpload } from './LogoUpload.jsx';
import { MembersEditor } from './MembersEditor.jsx';

export const DEFAULT_OPTIONS = {
  margins: true,
  font: true,
  fontSize: true,
  lineSpacing: true,
  firstLineIndent: true,
  alignment: true,
  headings: true,
  paragraphSpacing: true,
  pageNumbering: true,
  toc: true,
  cover: true,
  preface: true,
};

export const DEFAULT_META = {
  documentType: 'Makalah',
  title: '',
  course: '',
  lecturer: '',
  author: '',
  members: [{ name: '', nim: '' }],
  program: '',
  faculty: '',
  institution: '',
  city: '',
  year: String(new Date().getFullYear()),
};

export const META_FIELDS = [
  { key: 'documentType', label: 'Jenis dokumen', placeholder: 'Makalah' },
  { key: 'title', label: 'Judul', placeholder: 'Judul makalah' },
  { key: 'course', label: 'Mata kuliah', placeholder: 'Contoh: Pemrograman Web' },
  { key: 'lecturer', label: 'Dosen pengampu', placeholder: 'Nama dosen' },
  { key: 'author', label: 'Nama penulis (tanda tangan)', placeholder: 'Nama penulis' },
  { key: 'program', label: 'Program studi', placeholder: 'Teknik Informatika' },
  { key: 'department', label: 'Departemen (opsional)', placeholder: 'Kosongkan jika tidak ada departemen' },
  { key: 'faculty', label: 'Fakultas', placeholder: 'Fakultas Teknik' },
  { key: 'institution', label: 'Institusi', placeholder: 'Nama universitas' },
  { key: 'city', label: 'Kota (tanda tangan)', placeholder: 'Jakarta' },
  { key: 'year', label: 'Tahun', placeholder: '2026' },
];

const RULES = [
  { key: 'margins', label: 'Margin halaman', hint: 'Atur margin tiap sisi' },
  { key: 'font', label: 'Jenis font', hint: 'Selaraskan semua run teks' },
  { key: 'fontSize', label: 'Ukuran teks', hint: 'Termasuk teks dalam tabel' },
  { key: 'lineSpacing', label: 'Spasi baris', hint: 'Line spacing paragraf' },
  { key: 'firstLineIndent', label: 'Indentasi', hint: 'Baris pertama paragraf' },
  { key: 'alignment', label: 'Perataan', hint: 'Justify / kiri / tengah' },
  { key: 'headings', label: 'Heading BAB & subbab', hint: 'Tebal, ukuran, perataan' },
  { key: 'paragraphSpacing', label: 'Jarak antarparagraf', hint: 'Spasi sebelum & sesudah' },
  { key: 'pageNumbering', label: 'Penomoran halaman', hint: 'Section Romawi & Arab' },
  { key: 'toc', label: 'Sisipkan daftar isi', hint: 'Field TOC yang bisa diperbarui' },
  { key: 'cover', label: 'Buat cover otomatis', hint: 'Jika dokumen belum punya cover' },
  { key: 'preface', label: 'Kata pengantar & tanda tangan', hint: 'Dibuat/dirapikan sesuai format' },
];

function updatePath(object, path, value) {
  const keys = path.split('.');
  const next = structuredClone(object);
  let target = next;
  for (let i = 0; i < keys.length - 1; i += 1) target = target[keys[i]];
  target[keys[keys.length - 1]] = value;
  return next;
}

function Section({ title, description, children, defaultOpen = false, icon: Icon }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg border border-line">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left"
      >
        <span className="flex min-w-0 items-center gap-2">
          {Icon && <Icon className="h-3.5 w-3.5 text-ink-400" />}
          <span>
            <span className="block text-[12px] font-semibold text-ink-800">{title}</span>
            {description && <span className="mt-0.5 block text-[10px] leading-relaxed text-ink-400">{description}</span>}
          </span>
        </span>
        <ChevronDown className={cx('h-3.5 w-3.5 shrink-0 text-ink-400 transition-transform', open && 'rotate-180')} />
      </button>
      {open && <div className="space-y-3 border-t border-line px-3 py-3">{children}</div>}
    </div>
  );
}

function NumberField({ label, value, onChange, min = 0, max = 100, step = 0.25, suffix }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-medium text-ink-500">{label}</span>
      <div className="relative">
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(event) => onChange(Number(event.target.value))}
          className="field-input h-8 px-2 pr-7 text-[12px]"
        />
        {suffix && <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-ink-400">{suffix}</span>}
      </div>
    </label>
  );
}

export function FormatPanel({
  config,
  onConfigChange,
  options,
  onOptionsChange,
  templates,
  selectedTemplateId,
  onTemplateChange,
  onFormat,
  formatting,
  onReanalyze,
  analyzing,
  warnings = [],
  document: doc,
  onDownloadClick,
  report,
  meta = DEFAULT_META,
  onMetaChange = () => {},
}) {
  if (!config) return null;
  const set = (path) => (value) => onConfigChange(updatePath(config, path, value));
  const template = templates.find((item) => item.id === selectedTemplateId);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
        <div>
          <div className="flex items-center justify-between">
            <span className="field-label">Template pedoman</span>
            <Link to="/app/templates" className="mb-1.5 inline-flex items-center gap-1 text-[10px] font-medium text-brand-600 hover:text-brand-700">
              Kelola <ExternalLink className="h-2.5 w-2.5" />
            </Link>
          </div>
          <Select
            value={selectedTemplateId}
            onChange={(event) => onTemplateChange(event.target.value)}
            className="h-9 text-[12px]"
          >
            <option value="">Konfigurasi manual</option>
            {templates.filter((item) => item.isSystem).length > 0 && (
              <optgroup label="Template bawaan">
                {templates.filter((item) => item.isSystem).map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </optgroup>
            )}
            {templates.filter((item) => !item.isSystem).length > 0 && (
              <optgroup label="Template saya">
                {templates.filter((item) => !item.isSystem).map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </optgroup>
            )}
          </Select>
          {template?.description && <p className="mt-1.5 text-[10px] leading-relaxed text-ink-500">{template.description}</p>}
          {!template && selectedTemplateId && <p className="mt-1.5 text-[10px] leading-relaxed text-ink-500">Template kustom aktif.</p>}
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="field-label mb-0">Aturan yang diterapkan</span>
            <span className="text-[10px] text-ink-400">{Object.values(options).filter(Boolean).length}/{RULES.length}</span>
          </div>
          <div className="rounded-lg border border-line px-3 py-1">
            {RULES.map((rule, index) => (
              <div key={rule.key} className={cx(index > 0 && 'border-t border-line/70')}>
                <Checkbox
                  checked={options[rule.key]}
                  onChange={(value) => onOptionsChange({ ...options, [rule.key]: value })}
                  label={rule.label}
                  description={rule.hint}
                />
              </div>
            ))}
          </div>
        </div>

        <Section title="Data dokumen" description="Dipakai untuk cover & kata pengantar otomatis" icon={FileText} defaultOpen>
          <LogoUpload meta={meta} onMetaChange={onMetaChange} />
          <div className="grid grid-cols-2 gap-2">
            {META_FIELDS.map((field) => (
              <label key={field.key} className={cx('block', ['title', 'institution'].includes(field.key) && 'col-span-2')}>
                <span className="mb-1 block text-[10px] font-medium text-ink-500">{field.label}</span>
                <input
                  value={meta[field.key] || ''}
                  placeholder={field.placeholder}
                  maxLength={200}
                  onChange={(event) => onMetaChange({ ...meta, [field.key]: event.target.value })}
                  className="field-input h-8 px-2 text-[12px]"
                />
              </label>
            ))}
          </div>
          <MembersEditor meta={meta} onMetaChange={onMetaChange} />
        </Section>

        <Section title="Tipografi isi" icon={Sparkles}>
          <Field label="Font">
            <Select value={config.typography.fontFamily} onChange={(event) => set('typography.fontFamily')(event.target.value)} className="h-8 text-[12px]">
              {['Times New Roman', 'Arial', 'Calibri', 'Cambria', 'Georgia', 'Book Antiqua', 'Segoe UI', 'Verdana'].map((font) => (
                <option key={font} value={font}>{font}</option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <NumberField label="Ukuran" value={config.typography.fontSize} onChange={set('typography.fontSize')} min={8} max={24} step={0.5} suffix="pt" />
            <NumberField label="Spasi baris" value={config.typography.lineSpacing} onChange={set('typography.lineSpacing')} min={1} max={3} step={0.05} suffix="×" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <NumberField label="Indentasi" value={config.typography.firstLineIndent} onChange={set('typography.firstLineIndent')} min={0} max={3} suffix="cm" />
            <label className="block">
              <span className="mb-1 block text-[10px] font-medium text-ink-500">Perataan</span>
              <Select value={config.typography.alignment} onChange={(event) => set('typography.alignment')(event.target.value)} className="h-8 text-[12px]">
                <option value="justify">Justify</option>
                <option value="left">Kiri</option>
                <option value="center">Tengah</option>
                <option value="right">Kanan</option>
              </Select>
            </label>
          </div>
          <label className="mt-2 block">
            <span className="mb-1 block text-[10px] font-medium text-ink-500">Perataan daftar pustaka</span>
            <Select value={config.bibliography?.alignment ?? 'justify'} onChange={(event) => set('bibliography.alignment')(event.target.value)} className="h-8 text-[12px]">
                <option value="justify">Justify (rata kanan-kiri)</option>
                <option value="left">Kiri</option>
                <option value="center">Tengah</option>
                <option value="right">Kanan</option>
              </Select>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <NumberField label="Jarak sebelum" value={config.typography.spaceBefore} onChange={set('typography.spaceBefore')} min={0} max={36} step={1} suffix="pt" />
            <NumberField label="Jarak sesudah" value={config.typography.spaceAfter} onChange={set('typography.spaceAfter')} min={0} max={36} step={1} suffix="pt" />
          </div>
        </Section>

        <Section title="Ukuran kertas & margin" icon={FileText}>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="mb-1 block text-[10px] font-medium text-ink-500">Kertas</span>
              <Select value={config.page.size} onChange={(event) => set('page.size')(event.target.value)} className="h-8 text-[12px]">
                <option value="A4">A4</option>
                <option value="F4">F4 / Folio</option>
                <option value="Letter">Letter</option>
                <option value="A5">A5</option>
              </Select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[10px] font-medium text-ink-500">Orientasi</span>
              <Select value={config.page.orientation} onChange={(event) => set('page.orientation')(event.target.value)} className="h-8 text-[12px]">
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </Select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {['top', 'left', 'bottom', 'right'].map((side) => (
              <NumberField
                key={side}
                label={`Margin ${side === 'top' ? 'atas' : side === 'bottom' ? 'bawah' : side === 'left' ? 'kiri' : 'kanan'}`}
                value={config.page.margins[side]}
                onChange={set(`page.margins.${side}`)}
                min={1}
                max={6}
                suffix="cm"
              />
            ))}
          </div>
        </Section>

        <Section title="Heading" icon={FileText}>
          <div className="grid grid-cols-2 gap-2">
            <NumberField label="Ukuran BAB" value={config.headings.chapter.fontSize} onChange={set('headings.chapter.fontSize')} min={10} max={24} step={0.5} suffix="pt" />
            <NumberField label="Ukuran subbab" value={config.headings.subheading.fontSize} onChange={set('headings.subheading.fontSize')} min={8} max={20} step={0.5} suffix="pt" />
          </div>
          <label className="block">
            <span className="mb-1 block text-[10px] font-medium text-ink-500">Perataan BAB</span>
            <Select value={config.headings.chapter.alignment} onChange={(event) => set('headings.chapter.alignment')(event.target.value)} className="h-8 text-[12px]">
              <option value="center">Tengah</option>
              <option value="left">Kiri</option>
            </Select>
          </label>
          <div className="space-y-0.5">
            <Toggle label="BAB tebal" checked={config.headings.chapter.bold} onChange={set('headings.chapter.bold')} />
            <Toggle label="BAB kapital" description="Menggunakan format kapital, teks asli tidak diubah." checked={config.headings.chapter.uppercase} onChange={set('headings.chapter.uppercase')} />
            <Toggle label="Subbab tebal" checked={config.headings.subheading.bold} onChange={set('headings.subheading.bold')} />
          </div>
        </Section>

        <Section title="Penomoran halaman" icon={FileText}>
          <Toggle
            label="Aktifkan penomoran"
            description="Membuat section break nyata di DOCX."
            checked={config.pageNumbering.enabled}
            onChange={set('pageNumbering.enabled')}
          />
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="mb-1 block text-[10px] font-medium text-ink-500">Bagian awal</span>
              <Select value={config.pageNumbering.frontMatter} onChange={(event) => set('pageNumbering.frontMatter')(event.target.value)} className="h-8 text-[12px]">
                <option value="upperRoman">I, II, III</option>
                <option value="lowerRoman">i, ii, iii</option>
                <option value="decimal">1, 2, 3</option>
              </Select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[10px] font-medium text-ink-500">Bagian isi</span>
              <Select value={config.pageNumbering.body} onChange={(event) => set('pageNumbering.body')(event.target.value)} className="h-8 text-[12px]">
                <option value="decimal">1, 2, 3</option>
                <option value="upperRoman">I, II, III</option>
              </Select>
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-[10px] font-medium text-ink-500">Posisi nomor</span>
            <Select value={config.pageNumbering.position} onChange={(event) => set('pageNumbering.position')(event.target.value)} className="h-8 text-[12px]">
              <option value="bottom-center">Bawah · tengah</option>
              <option value="bottom-right">Bawah · kanan</option>
              <option value="top-center">Atas · tengah</option>
              <option value="top-right">Atas · kanan</option>
            </Select>
          </label>
          <div className="space-y-0.5">
            <Toggle label="Cover tanpa nomor" checked={!config.pageNumbering.cover} onChange={(value) => set('pageNumbering.cover')(!value)} />
            <Toggle label="Mulai dari 1 di bagian isi" checked={config.pageNumbering.bodyRestart} onChange={set('pageNumbering.bodyRestart')} />
          </div>
        </Section>

        <Section title="Daftar isi & keterangan" icon={FileText}>
          <Toggle label="Sisipkan field daftar isi" checked={config.toc.enabled} onChange={set('toc.enabled')} />
          <NumberField label="Kedalaman heading" value={config.toc.depth} onChange={set('toc.depth')} min={1} max={4} step={1} />
          <div className="space-y-0.5">
            <Toggle label="Wajib keterangan gambar" checked={config.captions.requireImageCaption} onChange={set('captions.requireImageCaption')} />
            <Toggle label="Wajib keterangan tabel" checked={config.captions.requireTableCaption} onChange={set('captions.requireTableCaption')} />
          </div>
          <div className="flex items-start gap-2 rounded-md bg-amber-50 px-2.5 py-2">
            <Info className="mt-0.5 h-3 w-3 shrink-0 text-amber-600" />
            <p className="text-[10px] leading-relaxed text-amber-800">
              Nomor halaman pada daftar isi baru akurat setelah Microsoft Word memperbarui field TOC. RapiMakalah tidak melakukan pagination.
            </p>
          </div>
        </Section>

        {warnings.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-800">
              <AlertTriangle className="h-3.5 w-3.5" /> Catatan proses
            </div>
            <ul className="mt-1.5 space-y-1.5">
              {warnings.slice(0, 5).map((warning) => (
                <li key={warning} className="text-[10px] leading-relaxed text-amber-800/90">• {warning}</li>
              ))}
            </ul>
          </div>
        )}

        {doc?.processedAt && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-3">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800">
              <CheckCircle2 className="h-3.5 w-3.5" /> Hasil format tersedia
            </div>
            <p className="mt-1 text-[10px] leading-relaxed text-emerald-800/80">
              {report?.appliedRules?.length ? report.appliedRules.join(' · ') : 'File hasil sudah dibuat dan bisa diunduh.'}
            </p>
            <Button size="sm" variant="secondary" icon={Download} className="mt-2 h-7 text-[11px]" onClick={onDownloadClick}>
              Unduh hasil DOCX
            </Button>
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-line bg-white px-4 py-3">
        <Button className="w-full justify-center" size="lg" icon={Wand2} loading={formatting} onClick={onFormat}>
          {formatting ? 'Memproses DOCX…' : 'Terapkan formatting'}
        </Button>
        <button
          type="button"
          onClick={onReanalyze}
          disabled={analyzing || formatting}
          className="mt-2 flex w-full items-center justify-center gap-1.5 text-[11px] font-medium text-ink-500 transition hover:text-ink-900 disabled:opacity-50"
        >
          {analyzing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          Periksa ulang dengan konfigurasi ini
        </button>
        <p className="mt-2 flex items-center justify-center gap-1 text-[9px] text-ink-400">
          <ShieldCheck className="h-2.5 w-2.5 text-emerald-500" /> File asli tetap disimpan
        </p>
      </div>
    </div>
  );
}
