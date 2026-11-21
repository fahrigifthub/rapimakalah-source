import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Check,
  Copy,
  FileText,
  Info,
  LayoutTemplate,
  RotateCcw,
  Ruler,
  Save,
  ShieldCheck,
  Sparkles,
  Type,
  Wand2,
} from 'lucide-react';
import { AppShell } from '../components/AppShell.jsx';
import { PageHeader, PageLoader, IconTile } from '../components/ui/Common.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Field, Input, Select, Textarea, Toggle } from '../components/ui/Form.jsx';
import { TemplatePreview } from '../components/TemplatePreview.jsx';
import { LogoUpload } from '../components/workspace/LogoUpload.jsx';
import { MembersEditor } from '../components/workspace/MembersEditor.jsx';
import { META_FIELDS } from '../components/workspace/FormatPanel.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api } from '../lib/api.js';
import { cx, FONT_OPTIONS, PAGE_SIZES } from '../lib/format.js';
import {
  ALIGNMENT_LABELS,
  CATEGORY_OPTIONS,
  DEFAULT_TEMPLATE_CONFIG,
  normalizeTemplateConfig,
  PAGE_NUMBER_LABELS,
  PAGE_NUMBER_POSITIONS,
  updateConfigPath,
} from '../lib/templateConfig.js';

function ConfigSection({ title, description, icon: Icon, children, defaultOpen = true, disabled = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="surface-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left sm:px-5"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-ink-500">
            <Icon className="h-4 w-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-[13px] font-semibold text-ink-900">{title}</span>
            {description && <span className="mt-0.5 block text-[11px] leading-relaxed text-ink-500">{description}</span>}
          </span>
        </span>
        <span
          className={cx(
            'shrink-0 rounded-md border border-line px-2 py-1 text-[10px] font-medium text-ink-400 transition',
            open && 'bg-slate-50 text-ink-600',
          )}
        >
          {open ? 'Tutup' : 'Buka'}
        </span>
      </button>
      {open && (
        <fieldset disabled={disabled} className="space-y-4 border-t border-line px-4 py-4 disabled:opacity-90 sm:px-5">
          {children}
        </fieldset>
      )}
    </section>
  );
}

function NumberField({ label, value, onChange, min = 0, max = 100, step = 0.25, suffix, hint, disabled }) {
  return (
    <Field label={label} hint={hint}>
      <div className="relative">
        <input
          type="number"
          value={Number.isFinite(value) ? value : ''}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          onChange={(event) => {
            const raw = event.target.value;
            if (raw === '') {
              onChange(min);
              return;
            }
            const next = Number(raw);
            if (Number.isFinite(next)) onChange(Math.min(max, Math.max(min, next)));
          }}
          className="field-input h-9 pr-9 text-[13px]"
        />
        {suffix && <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-ink-400">{suffix}</span>}
      </div>
    </Field>
  );
}

const EMPTY_FORM = {
  name: '',
  description: '',
  category: 'Makalah',
  config: structuredClone(DEFAULT_TEMPLATE_CONFIG),
};

export default function TemplateEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [isSystem, setIsSystem] = useState(false);
  const [isOwned, setIsOwned] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(null);

  const isNew = !id;
  const readOnly = isSystem;

  useEffect(() => {
    let active = true;
    if (!id) {
      setForm(structuredClone(EMPTY_FORM));
      setLoading(false);
      setIsSystem(false);
      setIsOwned(false);
      setLoadError('');
      setUpdatedAt(null);
      return undefined;
    }
    setLoading(true);
    setLoadError('');
    api
      .get(`/templates/${id}`)
      .then(({ template }) => {
        if (!active) return;
        setForm({
          name: template.name,
          description: template.description || '',
          category: template.category || 'Makalah',
          config: normalizeTemplateConfig(template.config),
        });
        setIsSystem(template.isSystem);
        setIsOwned(template.isOwned);
        setUpdatedAt(template.updatedAt);
      })
      .catch((err) => {
        if (active) setLoadError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  const set = (path) => (value) => {
    setFieldError('');
    setForm((current) => ({ ...current, config: updateConfigPath(current.config, path, value) }));
  };

  const setMeta = (key) => (value) => {
    setFieldError('');
    setForm((current) => ({ ...current, [key]: value }));
  };

  const summary = useMemo(() => {
    const config = form.config;
    return [
      { label: 'Kertas', value: `${PAGE_SIZES[config.page.size]?.label || config.page.size} · ${config.page.orientation === 'landscape' ? 'Landscape' : 'Portrait'}` },
      { label: 'Margin', value: `${config.page.margins.top} / ${config.page.margins.right} / ${config.page.margins.bottom} / ${config.page.margins.left} cm` },
      { label: 'Teks isi', value: `${config.typography.fontFamily} · ${config.typography.fontSize} pt · ${config.typography.lineSpacing}×` },
      { label: 'Heading BAB', value: `${config.headings.chapter.fontSize} pt${config.headings.chapter.bold ? ' · tebal' : ''} · ${ALIGNMENT_LABELS[config.headings.chapter.alignment]}` },
      { label: 'Penomoran', value: config.pageNumbering.enabled ? `${PAGE_NUMBER_LABELS[config.pageNumbering.frontMatter]} → ${PAGE_NUMBER_LABELS[config.pageNumbering.body]}` : 'Nonaktif' },
      { label: 'Daftar isi', value: config.toc.enabled ? `Field TOC · kedalaman ${config.toc.depth}` : 'Tidak disisipkan' },
    ];
  }, [form.config]);

  const handleSave = async () => {
    if (!form.name.trim() || form.name.trim().length < 2) {
      setFieldError('Nama template minimal 2 karakter.');
      return;
    }
    setSaving(true);
    setFieldError('');
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category,
      config: form.config,
    };
    try {
      const response = isNew ? await api.post('/templates', payload) : await api.put(`/templates/${id}`, payload);
      success(isNew ? 'Template dibuat' : 'Template diperbarui', {
        description: 'Template siap dipakai saat memproses dokumen.',
      });
      if (isNew) {
        navigate(`/app/templates/${response.template.id}`, { replace: true });
      } else {
        setUpdatedAt(response.template.updatedAt);
        setForm((current) => ({ ...current, name: response.template.name }));
      }
    } catch (err) {
      setFieldError(err.message);
      error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = async () => {
    setDuplicating(true);
    try {
      const response = await api.post(`/templates/${id}/duplicate`);
      success('Duplikat dibuat', { description: 'Anda sekarang dapat mengubah salinan ini.' });
      navigate(`/app/templates/${response.template.id}`, { replace: true });
    } catch (err) {
      error(err.message);
    } finally {
      setDuplicating(false);
    }
  };

  const handleReset = () => {
    setForm((current) => ({ ...current, config: structuredClone(DEFAULT_TEMPLATE_CONFIG) }));
    success('Konfigurasi direset ke bawaan', { description: 'Simpan template untuk menerapkan perubahan.' });
  };

  if (loading) {
    return (
      <AppShell>
        <div className="surface-card">
          <PageLoader label="Memuat template…" />
        </div>
      </AppShell>
    );
  }

  if (loadError) {
    return (
      <AppShell>
        <PageHeader eyebrow="Template" title="Template tidak dapat dimuat" description={loadError} />
        <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate('/app/templates')}>
          Kembali ke daftar template
        </Button>
      </AppShell>
    );
  }

  const config = form.config;

  return (
    <AppShell>
      <Link
        to="/app/templates"
        className="mb-4 inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-500 transition hover:text-ink-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Semua template
      </Link>

      <PageHeader
        eyebrow={isNew ? 'Template baru' : 'Editor template'}
        title={isNew ? 'Buat template kustom' : form.name}
        description={
          isSystem
            ? 'Template bawaan bersifat baca-saja. Duplikat terlebih dahulu untuk menyesuaikan angkanya dengan pedoman kampus Anda.'
            : 'Atur pedoman format secara detail. Perubahan disimpan sebagai konfigurasi, bukan file DOCX.'
        }
        actions={
          isSystem ? (
            <>
              <Badge tone="blue">Template bawaan</Badge>
              <Button icon={Copy} loading={duplicating} onClick={handleDuplicate}>
                Duplikat & edit
              </Button>
            </>
          ) : (
            <>
              {!isNew && isOwned && (
                <Button variant="secondary" icon={Wand2} onClick={() => navigate(`/app/documents/new?template=${id}`)}>
                  Pakai template
                </Button>
              )}
              <Button icon={Save} loading={saving} onClick={handleSave}>
                {isNew ? 'Simpan template' : 'Simpan perubahan'}
              </Button>
            </>
          )
        }
      />

      {isSystem && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-brand-200 bg-brand-50/60 px-4 py-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
          <p className="text-[11px] leading-relaxed text-brand-800/90">
            Anda melihat konfigurasi template bawaan. Nilai di bawah tidak dapat diubah langsung agar pedoman awal
            tetap konsisten. Duplikat template untuk membuat versi kustom yang bisa Anda edit.
          </p>
        </div>
      )}

      {fieldError && !isSystem && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[12px] leading-relaxed text-red-700">
          {fieldError}
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_328px]">
        <div className="min-w-0 space-y-4">
          <section className="surface-card p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2">
              <IconTile icon={LayoutTemplate} tone="blue" />
              <div>
                <h2 className="text-[13px] font-semibold text-ink-900">Identitas template</h2>
                <p className="text-[11px] text-ink-500">Nama dan deskripsi yang akan tampil di pustaka template.</p>
              </div>
            </div>
            <fieldset disabled={readOnly} className="space-y-3.5 disabled:opacity-90">
              <Field label="Nama template" hint="Contoh: Makalah Teknik Informatika 2026.">
                <Input
                  value={form.name}
                  onChange={(event) => setMeta('name')(event.target.value)}
                  placeholder="Nama template"
                  maxLength={80}
                  className="h-9 text-[13px]"
                />
              </Field>
              <div className="grid gap-3.5 sm:grid-cols-2">
                <Field label="Kategori">
                  <Select
                    value={form.category}
                    onChange={(event) => setMeta('category')(event.target.value)}
                    className="h-9 text-[13px]"
                  >
                    {CATEGORY_OPTIONS.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Bahasa pedoman" hint="RapiMakalah mempertahankan teks asli dokumen.">
                  <Input value="Indonesia" readOnly className="h-9 bg-slate-50 text-[13px] text-ink-500" />
                </Field>
              </div>
              <Field label="Deskripsi" hint="Maksimal 300 karakter. Jelaskan untuk kebutuhan apa template ini dibuat.">
                <Textarea
                  rows={3}
                  value={form.description}
                  onChange={(event) => setMeta('description')(event.target.value)}
                  placeholder="Contoh: Pedoman format skripsi berdasarkan buku panduan fakultas."
                  maxLength={300}
                  className="text-[13px]"
                />
              </Field>
            </fieldset>
          </section>

          <ConfigSection title="Ukuran kertas & margin" description="Mempengaruhi sectPr halaman dan area teks." icon={Ruler} disabled={readOnly}>
            <div className="grid gap-3.5 sm:grid-cols-2">
              <Field label="Ukuran kertas">
                <Select
                  value={config.page.size}
                  onChange={(event) => set('page.size')(event.target.value)}
                  className="h-9 text-[13px]"
                >
                  {Object.entries(PAGE_SIZES).map(([key, meta]) => (
                    <option key={key} value={key}>{meta.label}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Orientasi">
                <Select
                  value={config.page.orientation}
                  onChange={(event) => set('page.orientation')(event.target.value)}
                  className="h-9 text-[13px]"
                >
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </Select>
              </Field>
            </div>
            <Field label="Margin halaman" hint="Nilai dalam sentimeter. Pastikan total margin masuk akal untuk ukuran kertas yang dipilih.">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {['top', 'right', 'bottom', 'left'].map((side) => (
                  <label key={side} className="block">
                    <span className="mb-1 block text-[10px] font-medium text-ink-500">
                      {side === 'top' ? 'Atas' : side === 'right' ? 'Kanan' : side === 'bottom' ? 'Bawah' : 'Kiri'}
                    </span>
                    <div className="relative">
                      <input
                        type="number"
                        value={config.page.margins[side]}
                        min={0}
                        max={10}
                        step={0.25}
                        onChange={(event) => {
                          const next = Number(event.target.value);
                          set(`page.margins.${side}`)(Number.isFinite(next) ? Math.min(10, Math.max(0, next)) : 0);
                        }}
                        className="field-input h-9 pr-8 text-[13px]"
                      />
                      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] text-ink-400">cm</span>
                    </div>
                  </label>
                ))}
              </div>
            </Field>
          </ConfigSection>

          <ConfigSection title="Tipografi isi" description="Berlaku pada paragraf isi, termasuk teks di dalam tabel." icon={Type} disabled={readOnly}>
            <div className="grid gap-3.5 sm:grid-cols-2">
              <Field label="Jenis font">
                <Select
                  value={config.typography.fontFamily}
                  onChange={(event) => set('typography.fontFamily')(event.target.value)}
                  className="h-9 text-[13px]"
                >
                  {FONT_OPTIONS.map((font) => (
                    <option key={font} value={font}>{font}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Perataan paragraf">
                <Select
                  value={config.typography.alignment}
                  onChange={(event) => set('typography.alignment')(event.target.value)}
                  className="h-9 text-[13px]"
                >
                  {Object.entries(ALIGNMENT_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="grid gap-3.5 sm:grid-cols-3">
              <NumberField label="Ukuran font" value={config.typography.fontSize} onChange={set('typography.fontSize')} min={6} max={72} step={0.5} suffix="pt" />
              <NumberField label="Spasi baris" value={config.typography.lineSpacing} onChange={set('typography.lineSpacing')} min={0.8} max={4} step={0.05} suffix="×" />
              <NumberField label="Indentasi baris pertama" value={config.typography.firstLineIndent} onChange={set('typography.firstLineIndent')} min={0} max={5} step={0.25} suffix="cm" />
            </div>
            <div className="grid gap-3.5 sm:grid-cols-2">
              <NumberField label="Jarak sebelum paragraf" value={config.typography.spaceBefore} onChange={set('typography.spaceBefore')} min={0} max={72} step={1} suffix="pt" />
              <NumberField label="Jarak sesudah paragraf" value={config.typography.spaceAfter} onChange={set('typography.spaceAfter')} min={0} max={72} step={1} suffix="pt" />
            </div>
          </ConfigSection>

          <ConfigSection title="Heading BAB & subbab" description="Diterapkan pada paragraf yang dikenali sebagai heading." icon={BookOpen} defaultOpen={false} disabled={readOnly}>
            {[
              { key: 'chapter', label: 'Heading BAB', showUppercase: true },
              { key: 'subheading', label: 'Subbab (1.1)' },
              { key: 'subsubheading', label: 'Sub-subbab (1.1.1)' },
            ].map((heading) => {
              const value = config.headings[heading.key];
              return (
                <div key={heading.key} className="rounded-lg border border-line p-3">
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-500">{heading.label}</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Font">
                      <Select
                        value={value.fontFamily}
                        onChange={(event) => set(`headings.${heading.key}.fontFamily`)(event.target.value)}
                        className="h-9 text-[13px]"
                      >
                        {FONT_OPTIONS.map((font) => (
                          <option key={font} value={font}>{font}</option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Perataan">
                      <Select
                        value={value.alignment}
                        onChange={(event) => set(`headings.${heading.key}.alignment`)(event.target.value)}
                        className="h-9 text-[13px]"
                      >
                        {Object.entries(ALIGNMENT_LABELS).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </Select>
                    </Field>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <NumberField label="Ukuran" value={value.fontSize} onChange={set(`headings.${heading.key}.fontSize`)} min={6} max={72} step={0.5} suffix="pt" />
                    <NumberField label="Jarak sebelum" value={value.spaceBefore} onChange={set(`headings.${heading.key}.spaceBefore`)} min={0} max={72} step={1} suffix="pt" />
                    <NumberField label="Jarak sesudah" value={value.spaceAfter} onChange={set(`headings.${heading.key}.spaceAfter`)} min={0} max={72} step={1} suffix="pt" />
                  </div>
                  <div className="mt-2 space-y-0.5">
                    <Toggle
                      label="Teks tebal"
                      checked={value.bold}
                      onChange={set(`headings.${heading.key}.bold`)}
                    />
                    {heading.showUppercase && (
                      <Toggle
                        label="Tampilkan kapital"
                        description="Menggunakan format kapital pada heading; teks asli tidak diubah."
                        checked={value.uppercase}
                        onChange={set('headings.chapter.uppercase')}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </ConfigSection>

          <ConfigSection title="Penomoran halaman" description="Membuat section break nyata dengan footer PAGE field." icon={FileText} defaultOpen={false} disabled={readOnly}>
            <Toggle
              label="Aktifkan penomoran halaman"
              description="Cover dapat dibiarkan tanpa nomor; bagian awal dan isi memakai format berbeda."
              checked={config.pageNumbering.enabled}
              onChange={set('pageNumbering.enabled')}
            />
            <div className="grid gap-3.5 sm:grid-cols-2">
              <Field label="Format bagian awal" hint="Biasanya Romawi untuk kata pengantar dan daftar isi.">
                <Select
                  value={config.pageNumbering.frontMatter}
                  onChange={(event) => set('pageNumbering.frontMatter')(event.target.value)}
                  className="h-9 text-[13px]"
                >
                  {Object.entries(PAGE_NUMBER_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Format bagian isi">
                <Select
                  value={config.pageNumbering.body}
                  onChange={(event) => set('pageNumbering.body')(event.target.value)}
                  className="h-9 text-[13px]"
                >
                  {Object.entries(PAGE_NUMBER_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="Posisi nomor">
              <Select
                value={config.pageNumbering.position}
                onChange={(event) => set('pageNumbering.position')(event.target.value)}
                className="h-9 text-[13px]"
              >
                {Object.entries(PAGE_NUMBER_POSITIONS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </Select>
            </Field>
            <div className="space-y-0.5">
              <Toggle
                label="Cover tanpa nomor halaman"
                checked={!config.pageNumbering.cover}
                onChange={(value) => set('pageNumbering.cover')(!value)}
              />
              <Toggle
                label="Mulai ulang dari 1 di bagian isi"
                description="Bagian isi memakai start=1 meskipun bagian awal sudah bernomor."
                checked={config.pageNumbering.bodyRestart}
                onChange={set('pageNumbering.bodyRestart')}
              />
            </div>
          </ConfigSection>

          <ConfigSection title="Daftar isi" description="Field TOC Word yang dapat diperbarui, bukan daftar statis." icon={Sparkles} defaultOpen={false} disabled={readOnly}>
            <Toggle
              label="Sisipkan field daftar isi"
              description="Ditempatkan setelah heading “DAFTAR ISI” yang ada, atau sebelum BAB pertama."
              checked={config.toc.enabled}
              onChange={set('toc.enabled')}
            />
            <div className="grid gap-3.5 sm:grid-cols-2">
              <NumberField label="Kedalaman heading" value={config.toc.depth} onChange={set('toc.depth')} min={1} max={5} step={1} suffix="level" />
              <Field label="Judul daftar isi">
                <Input
                  value={config.toc.title}
                  onChange={(event) => set('toc.title')(event.target.value)}
                  maxLength={80}
                  className="h-9 text-[13px]"
                />
              </Field>
            </div>
            <Toggle
              label="Cantumkan DAFTAR ISI di daftar isi"
              description="Judul DAFTAR ISI ikut tampil sebagai salah satu entri."
              checked={config.toc.includeTocTitle !== false}
              onChange={set('toc.includeTocTitle')}
            />
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
              <p className="text-[11px] leading-relaxed text-amber-800">
                Nomor halaman di daftar isi baru akurat setelah Word memperbarui field (biasanya saat file dibuka).
                RapiMakalah tidak melakukan pagination dan tidak mengklaim preview identik dengan Word.
              </p>
            </div>
          </ConfigSection>

          <ConfigSection title="Cover" description="Ukuran teks cover dan posisi blok institusi." icon={FileText} defaultOpen={false} disabled={readOnly}>
            <LogoUpload
              meta={config.cover || {}}
              onMetaChange={(next) => set('cover')({ ...next, logoWidth: undefined, logoHeight: undefined })}
            />
            <p className="-mt-1 text-[10px] leading-relaxed text-ink-400">Logo ini dipakai otomatis di cover setiap dokumen yang memakai template ini. Logo yang diunggah di workspace tetap menimpanya.</p>
            <div className="grid gap-3.5 sm:grid-cols-2">
              <NumberField label="Ukuran judul" value={config.cover?.titleSize ?? 16} onChange={set('cover.titleSize')} min={8} max={36} step={1} suffix="pt" />
              <NumberField label="Ukuran blok institusi" value={config.cover?.institutionSize ?? 16} onChange={set('cover.institutionSize')} min={8} max={36} step={1} suffix="pt" />
            </div>
            <div className="border-t border-line pt-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-500">Isian cover bawaan</p>
              <p className="mb-2 text-[10px] leading-relaxed text-ink-400">Terisi otomatis di setiap dokumen dengan template ini. Judul tetap diisi per dokumen. Isian di workspace menimpa nilai ini.</p>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {META_FIELDS.filter((f) => f.key !== 'title').map((field) => (
                  <Field key={field.key} label={field.label}>
                    <Input
                      value={config.cover?.defaults?.[field.key] ?? ''}
                      placeholder={field.placeholder}
                      onChange={(event) => set('cover.defaults')({ ...(config.cover?.defaults || {}), [field.key]: event.target.value })}
                      className="h-9 text-[13px]"
                    />
                  </Field>
                ))}
              </div>
              <MembersEditor
                meta={config.cover?.defaults || {}}
                onMetaChange={(next) => set('cover.defaults')(next)}
              />
            </div>
            <div className="space-y-0.5">
              <Toggle
                label="Blok institusi di dasar halaman"
                description="Program studi, fakultas, universitas, dan tahun menempel di bawah cover. Mati: mengalir setelah daftar anggota."
                checked={config.cover?.institutionAtBottom !== false}
                onChange={set('cover.institutionAtBottom')}
              />
              <Toggle
                label="Tampilkan baris Departemen"
                 description="Opsional. Muncul di bawah Program Studi jika nama departemen diisi."
                checked={config.cover?.showDepartment !== false}
                onChange={set('cover.showDepartment')}
              />
            </div>
          </ConfigSection>

          <ConfigSection title="Daftar pustaka" description="Entri tanpa nomor, indent gantung, gaya Bibliography." icon={BookOpen} defaultOpen={false} disabled={readOnly}>
            <NumberField label="Indent gantung" value={config.bibliography?.hangingIndent ?? 1.27} onChange={set('bibliography.hangingIndent')} min={0} max={5} step={0.25} suffix="cm" />
            <Field label="Perataan">
              <Select value={config.bibliography?.alignment ?? 'justify'} onChange={(event) => set('bibliography.alignment')(event.target.value)} className="h-9 text-[13px]">
                <option value="justify">Justify (rata kanan-kiri)</option>
                <option value="left">Kiri</option>
                <option value="center">Tengah</option>
                <option value="right">Kanan</option>
              </Select>
            </Field>
            <Toggle
              label="Ubah URL jadi link"
              description="URL http/https tampil biru, bergaris bawah, dan bisa diklik."
              checked={config.bibliography?.linkUrls !== false}
              onChange={set('bibliography.linkUrls')}
            />
          </ConfigSection>

          <ConfigSection title="Keterangan gambar & tabel" description="Aturan tambahan untuk pemeriksaan dokumen." icon={Check} defaultOpen={false} disabled={readOnly}>
            <div className="space-y-0.5">
              <Toggle
                label="Wajib keterangan gambar"
                description="Checker menandai gambar tanpa paragraf keterangan di dekatnya."
                checked={config.captions.requireImageCaption}
                onChange={set('captions.requireImageCaption')}
              />
              <Toggle
                label="Wajib keterangan tabel"
                description="Checker menandai tabel tanpa paragraf keterangan di dekatnya."
                checked={config.captions.requireTableCaption}
                onChange={set('captions.requireTableCaption')}
              />
            </div>
          </ConfigSection>

          {!isSystem && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-white px-4 py-3">
              <Button variant="ghost" size="sm" icon={RotateCcw} onClick={handleReset}>
                Reset konfigurasi ke bawaan
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="secondary" onClick={() => navigate('/app/templates')}>Batal</Button>
                <Button icon={Save} loading={saving} onClick={handleSave}>
                  {isNew ? 'Simpan template' : 'Simpan perubahan'}
                </Button>
              </div>
            </div>
          )}
        </div>

        <aside className="min-w-0 space-y-4 xl:sticky xl:top-20 xl:self-start">
          <section className="surface-card overflow-hidden">
            <div className="border-b border-line px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-400">Pratinjau konfigurasi</p>
              <p className="mt-0.5 text-[12px] font-medium text-ink-800">{form.name || 'Template tanpa nama'}</p>
            </div>
            <TemplatePreview config={config} className="h-[248px] border-0 bg-slate-50/60 p-4" />
            <div className="border-t border-line px-4 py-3">
              <p className="text-[10px] leading-relaxed text-ink-400">
                Ilustrasi struktural: proporsi halaman, margin, heading, indentasi, dan posisi nomor halaman. Bukan
                render Word.
              </p>
            </div>
          </section>

          <section className="surface-card p-4">
            <div className="mb-2.5 flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <h2 className="text-[12px] font-semibold text-ink-900">Ringkasan</h2>
            </div>
            <dl className="divide-y divide-line">
              {summary.map((item) => (
                <div key={item.label} className="flex items-start justify-between gap-3 py-2">
                  <dt className="shrink-0 text-[10px] font-medium uppercase tracking-[0.04em] text-ink-400">{item.label}</dt>
                  <dd className="text-right text-[11px] leading-snug text-ink-700">{item.value}</dd>
                </div>
              ))}
            </dl>
            {updatedAt && (
              <p className="mt-3 text-[10px] text-ink-400">
                Terakhir diperbarui {new Date(updatedAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            )}
          </section>

          {config.pageNumbering.enabled && config.toc.enabled && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5">
              <p className="text-[11px] font-semibold text-amber-800">Catatan daftar isi</p>
              <p className="mt-1 text-[10px] leading-relaxed text-amber-800/85">
                Format Romawi/Arab dan field TOC diterapkan pada DOCX. Buka hasil di Microsoft Word dan pilih
                “Update Field” untuk melihat nomor halaman final.
              </p>
            </div>
          )}

          {isSystem && (
            <Button className="w-full justify-center" icon={Copy} loading={duplicating} onClick={handleDuplicate}>
              Duplikat template ini
            </Button>
          )}
        </aside>
      </div>
    </AppShell>
  );
}
