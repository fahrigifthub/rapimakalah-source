import { forwardRef, useLayoutEffect, useRef } from 'react';
import { cx } from '../lib/format.js';

const BASE_PX_PER_CM = 30;

const ALIGN = { both: 'justify', justify: 'justify', left: 'left', center: 'center', right: 'right' };

/** Word's default tab stop: every 0.5 inch (720 twips). */
const DEFAULT_TAB_CM = 1.27;

function runStyle(run, fontPx, baseSize) {
  return {
    fontWeight: run.bold ? 700 : undefined,
    fontStyle: run.italic ? 'italic' : undefined,
    textDecoration: run.underline ? 'underline' : undefined,
    textTransform: run.caps ? 'uppercase' : undefined,
    fontSize: run.size && fontPx && run.size !== baseSize ? fontPx(run.size) : undefined,
    verticalAlign: run.superscript ? 'super' : run.subscript ? 'sub' : undefined,
  };
}

/** Paragraph with a right-aligned tab (+ dot leader), like a TOC line in Word. */
function renderTabbed(block, fontPx, baseSize) {
  const runs = block.runs?.length ? block.runs : [{ text: block.text }];
  const left = [];
  const right = [];
  let afterTab = false;
  for (const run of runs) {
    const parts = run.text.split('\t');
    parts.forEach((part, i) => {
      if (i > 0) afterTab = true;
      if (part) (afterTab ? right : left).push({ ...run, text: part });
    });
  }
  const leader = block.tabs.find((t) => t.val === 'right')?.leader;
  const dots = { dot: '.', hyphen: '-', underscore: '_', middleDot: '.' }[leader];
  const render = (list) => list.map((run, i) => <span key={i} style={runStyle(run, fontPx, baseSize)}>{run.text}</span>);
  return (
    <span className="flex items-baseline" style={{ whiteSpace: 'pre-wrap', textIndent: 0, textAlign: 'left' }}>
      <span style={{ flex: '0 1 auto', minWidth: 0 }}>{render(left)}</span>
      <span
        aria-hidden
        className="min-w-0 flex-1 overflow-hidden whitespace-nowrap"
        style={{
          letterSpacing: 0,
          margin: 0,
        }}
      >
        {dots ? dots.repeat(300) : null}
      </span>
      <span style={{ flex: 'none' }}>{render(right)}</span>
    </span>
  );
}

function renderRuns(block, config, fontPx, baseSize) {
  if (block.runs?.length) {
    return block.runs.map((run, index) => run.math ? (
      <span
        key={index}
        className={run.display ? 'preview-equation block text-center' : 'preview-equation inline-block align-baseline'}
        style={{ fontSize: fontPx(baseSize), textIndent: 0, maxWidth: '100%', overflowX: run.display ? 'auto' : undefined }}
        dangerouslySetInnerHTML={{ __html: run.math }}
      />
    ) : (
      <span
        key={index}
        style={run.link ? { ...runStyle(run, fontPx, baseSize), color: '#0563C1', textDecoration: 'underline', cursor: 'pointer' } : runStyle(run, fontPx, baseSize)}
        onClick={run.link ? () => window.open(run.link, '_blank', 'noopener,noreferrer') : undefined}
      >
        {run.text}
      </span>
    ));
  }
  return block.text;
}

function PreviewTable({ block }) {
  const tableRef = useRef(null);
  useLayoutEffect(() => {
    const table = tableRef.current;
    if (!block.isMemberTable || !table) return;
    const fit = () => {
      const cells = [...table.querySelectorAll('td')];
      cells.forEach(cell => { cell.style.fontSize = ''; });
      const baseSize = parseFloat(getComputedStyle(table).fontSize);
      let ratio = 1;
      for (const cell of cells) {
        const style = getComputedStyle(cell);
        const width = cell.getBoundingClientRect().width - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
        const range = document.createRange();
        range.selectNodeContents(cell);
        ratio = Math.min(ratio, width / Math.max(1, range.getBoundingClientRect().width));
      }
      cells.forEach(cell => { cell.style.fontSize = `${baseSize * ratio}px`; });
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(table);
    return () => observer.disconnect();
  }, [block]);
  if (block.isEmpty) {
    return (
      <div className="my-2 rounded border border-dashed border-slate-300 px-2 py-2 text-center text-[10px] text-ink-400">
        Tabel kosong / tidak dapat dirender
      </div>
    );
  }
  return (
    <div className="my-2 overflow-hidden" style={{ textAlign: block.isCover ? 'center' : undefined }}>
      <table ref={tableRef} className={block.isMemberTable ? 'cover-members' : undefined}>
        <tbody>
          {block.rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="text-ink-800">
                  {cell.images?.map((src, imageIndex) => (
                    <img key={imageIndex} src={src} alt="" className="mb-1 max-h-24 max-w-full object-contain" />
                  ))}
                  {cell.text}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const DocumentPreview = forwardRef(function DocumentPreview(
  { preview, pageIndex = 0, zoom = 1, config, highlightForBlock, className },
  ref,
) {
  if (!preview?.pages?.length) {
    return (
      <div className={cx('flex h-full items-center justify-center text-[13px] text-ink-400', className)}>
        Tidak ada halaman untuk ditampilkan.
      </div>
    );
  }
  const page = preview.pages[Math.min(pageIndex, preview.pages.length - 1)] || preview.pages[0];
  const meta = preview.meta;
  const pxPerCm = BASE_PX_PER_CM * zoom;
  const width = meta.widthCm * pxPerCm;
  const height = meta.heightCm * pxPerCm;
  const fontPx = (size) => Math.max(6, size * 0.03528 * pxPerCm);
  const headingCfg = config?.headings || {};
  const h1 = headingCfg.chapter?.fontSize || (meta.fontSize + 2);
  const h2 = headingCfg.subheading?.fontSize || meta.fontSize;
  const h3 = headingCfg.subsubheading?.fontSize || meta.fontSize;

  return (
    <div
      ref={ref}
      className={cx('relative shrink-0 bg-white text-ink-900 shadow-paper', className)}
      style={{
        width,
        height,
        overflow: 'hidden',
        boxSizing: 'border-box',
        paddingTop: meta.margins.top * pxPerCm,
        paddingBottom: meta.margins.bottom * pxPerCm,
        paddingLeft: meta.margins.left * pxPerCm,
        paddingRight: meta.margins.right * pxPerCm,
        fontFamily: `"${meta.fontFamily}", serif`,
        fontSize: fontPx(meta.fontSize),
        lineHeight: meta.lineSpacing,
        tabSize: `${DEFAULT_TAB_CM}cm`,
      }}
    >
      <div className="docx-preview" style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {page.blocks.map((block) => {
          if (block.type === 'table') return <PreviewTable key={block.id} block={block} />;
          const level = block.headingLevel;
          const headingSize = level === 1 ? h1 : level === 2 ? h2 : h3;
          const severity = highlightForBlock ? highlightForBlock(block.blockIndex) : null;
          return (
            <div
              key={block.id}
              data-block={block.blockIndex}
              className="relative"
              style={{
                flexShrink: 0,
                marginLeft: block.bottomFrame && block.alignment !== 'center' ? 'auto' : undefined,
                width: block.bottomFrame && block.alignment !== 'center' ? 8 * pxPerCm : undefined,
                textAlign: ALIGN[block.alignment] || 'left',
                fontWeight: level ? 700 : undefined,
                fontSize: level ? fontPx(headingSize) : undefined,
                textTransform: level === 1 && headingCfg.chapter?.uppercase ? 'uppercase' : undefined,
                marginTop: level ? fontPx(meta.fontSize) * 0.55 : block.spaceBefore ? fontPx(block.spaceBefore) : undefined,
                marginBottom: level ? fontPx(meta.fontSize) * 0.55 : block.spaceAfter ? fontPx(block.spaceAfter) : undefined,
                paddingLeft: block.leftIndent ? `${block.leftIndent * pxPerCm}px` : undefined,
                textIndent: block.isCover
                  ? 0
                  : block.hangingIndent
                    ? `-${block.hangingIndent * pxPerCm}px`
                    : !level && block.firstLineIndent
                      ? `${block.firstLineIndent * pxPerCm}px`
                      : undefined,
                lineHeight: block.lineSpacing ? block.lineSpacing / 240 : undefined,
              }}
              title={severity ? 'Bagian ini memiliki temuan format' : undefined}
            >
              <span
                className="block whitespace-pre-wrap"
                style={
                  severity
                    ? {
                        backgroundColor: severity === 'error' ? 'rgba(254, 226, 226, 0.65)' : 'rgba(254, 243, 199, 0.65)',
                        boxShadow: `inset 0 0 0 2px ${severity === 'error' ? '#fca5a5' : '#fcd34d'}`,
                        borderRadius: 2,
                      }
                    : undefined
                }
              >
                {block.numberMarker && !block.isCover ? (
                  <span
                    className="inline-block align-top"
                    style={{ width: block.hangingIndent ? `${block.hangingIndent * pxPerCm}px` : undefined, textIndent: 0, whiteSpace: 'nowrap' }}
                  >
                    {block.numberMarker}
                  </span>
                ) : null}
                {block.images?.map((src, index) => (
                  <img key={index} src={src} alt="" className="my-2 max-w-full object-contain" style={block.imageSizes?.[index] ? { width: block.imageSizes[index].w * pxPerCm, height: block.imageSizes[index].h * pxPerCm, display: block.alignment === 'center' ? 'block' : undefined, marginLeft: block.alignment === 'center' ? 'auto' : undefined, marginRight: block.alignment === 'center' ? 'auto' : undefined } : undefined} />
                ))}
                {block.text || block.runs?.some(run => run.math)
                  ? block.tabs?.some((t) => t.val === 'right') && block.text.includes('\t')
                    ? renderTabbed(block, fontPx, meta.fontSize)
                    : renderRuns(block, config, fontPx, meta.fontSize)
                  : null}
              </span>
            </div>
          );
        })}
      </div>
      {page.pageLabel && (
        <div
          className="pointer-events-none absolute left-0 right-0 text-center"
          style={{ bottom: Math.max(4, (meta.margins.bottom * pxPerCm) / 2 - fontPx(meta.fontSize)) , fontSize: fontPx(Math.max(9, meta.fontSize - 1)) }}
        >
          {page.pageLabel}
        </div>
      )}
    </div>
  );
});
