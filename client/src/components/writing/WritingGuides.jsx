import { Fragment, useEffect, useRef, useState } from 'react';

/** Page surfaces are separate from the editor's saved content. */
export function WritingGuides({ children, visible, pageLayout }) {
  const frame = useRef(null);
  const [layout, setLayout] = useState({ pages: 1, height: 1123, gap: 24, unit: 794 / 21, marginTop: 3 * 826 / 21, marginBottom: 3 * 826 / 21, marginLeft: 4 * 826 / 21, marginRight: 3 * 826 / 21 });
  useEffect(() => {
    const element = frame.current;
    const update = event => setLayout(event.detail);
    element.addEventListener('writing-pages', update);
    return () => element.removeEventListener('writing-pages', update);
  }, []);
  useEffect(() => {
    const element = frame.current;
    if (!element) return;
    element.dispatchEvent(new CustomEvent('writing-layout', { bubbles: true }));
  }, [pageLayout]);
  const { pages, height, gap, marginTop, marginBottom, marginLeft, marginRight } = layout;
  const width = pageLayout.width * 826 / 21;
  const pageUnit = width / pageLayout.width;
  return <div className={`writing-sheet-layout ${visible ? 'show-guides' : ''}`} style={{ width }}>
    <div ref={frame} className="writing-sheet-frame" style={{ width, '--writing-margin-top': `${(pageLayout.margins.top || 0) * pageUnit}px`, '--writing-margin-right': `${(pageLayout.margins.right || 0) * pageUnit}px`, '--writing-margin-bottom': `${(pageLayout.margins.bottom || 0) * pageUnit}px`, '--writing-margin-left': `${(pageLayout.margins.left || 0) * pageUnit}px` }} data-page-width={pageLayout.width} data-page-height={pageLayout.height} data-page-margins={JSON.stringify(pageLayout.margins)}>
      <div className="writing-page-surfaces" aria-hidden="true">
        {Array.from({ length: pages }, (_, page) => <div key={page} className="writing-page-surface" style={{ top: page * (height + gap), height }}>
          <span className="writing-page-number">Halaman {page + 1}</span>
        </div>)}
      </div>
      {children}
      {visible && <div className="writing-guide-overlays" aria-hidden="true">
        {Array.from({ length: pages }, (_, page) => <Fragment key={page}>
          <div className="writing-vertical-ruler" style={{ top: page * (height + gap), height }}>
            <div className="writing-vertical-text-area" style={{ top: marginTop, bottom: marginBottom }} />
            {Array.from({ length: Math.ceil(pageLayout.height / 0.5) + 1 }, (_, index) => <span key={index} className={index % 2 ? 'half' : ''} style={{ top: index / 2 * pageUnit }}>{index % 2 ? '' : index / 2}</span>)}
          </div>
          <div className="writing-text-boundary" style={{ top: page * (height + gap) + marginTop, height: height - marginTop - marginBottom, left: marginLeft, right: marginRight }} />
        </Fragment>)}
      </div>}
    </div>
    <p className="writing-page-count" aria-live="polite">{pages} halaman · {pageLayout.width.toFixed(1)} × {pageLayout.height.toFixed(1)} cm</p>
  </div>;
}

export function ParagraphSpacing({ editor }) {
  const type = editor.isActive('heading') ? 'heading' : 'paragraph';
  const attrs = editor.getAttributes(type);
  const set = (key, value) => editor.chain().updateAttributes(type, { [key]: value }).run();
  return <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line px-2 py-2 text-xs text-ink-700" role="group" aria-label="Jarak paragraf">
    <span className="font-semibold">Paragraf</span>
    {[['spaceBefore', 'Sebelum', type === 'paragraph' ? 0 : ({ 1: 18, 2: 15, 3: 12 }[attrs.level] || 18)], ['spaceAfter', 'Sesudah', type === 'heading' && attrs.level === 1 ? 12 : type === 'heading' && attrs.level === 3 ? 7.5 : 9]].map(([key, label, fallback]) => <label key={key} className="flex items-center gap-1">{label}
      <input aria-label={`Jarak ${label.toLowerCase()} paragraf dalam pt`} type="number" min="0" max="120" step="1" value={attrs[key] ?? fallback}
        onChange={event => set(key, Math.min(120, Math.max(0, Number(event.target.value) || 0)))} className="h-9 w-16 rounded border border-line px-2" /> pt
    </label>)}
    <label className="flex items-center gap-1">Spasi baris <select aria-label="Spasi baris" className="h-9 rounded border border-line bg-white px-2" value={attrs.lineSpacing ?? 1.5} onChange={event => set('lineSpacing', Number(event.target.value))}>
      {[1, 1.15, 1.5, 2, 2.5, 3].map(value => <option key={value} value={value}>{value}×</option>)}
    </select></label>
  </div>;
}
