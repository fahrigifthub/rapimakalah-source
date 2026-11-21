import { normalizeTemplateConfig } from '../lib/templateConfig.js';
import { cx } from '../lib/format.js';

const PAPER_DIMENSIONS = {
  A4: { width: 21.0, height: 29.7 },
  F4: { width: 21.59, height: 33.0 },
  Letter: { width: 21.59, height: 27.94 },
  A5: { width: 14.8, height: 21.0 },
};

/**
 * A deliberately small, honest visual summary of a template.
 * It is not a DOCX renderer — it only illustrates page proportions, margins,
 * typography weight, indentation and page-number placement.
 */
export function TemplatePreview({ config, className, showHeading = true }) {
  const safe = normalizeTemplateConfig(config);
  const dimensions = PAPER_DIMENSIONS[safe.page.size] || PAPER_DIMENSIONS.A4;
  const landscape = safe.page.orientation === 'landscape';
  const width = landscape ? dimensions.height : dimensions.width;
  const height = landscape ? dimensions.width : dimensions.height;
  const margins = safe.page.margins;

  const numberPosition = safe.pageNumbering.position;
  const numberStyle = {
    bottom: numberPosition.startsWith('bottom'),
    center: numberPosition.endsWith('center'),
  };

  return (
    <div className={cx('flex items-center justify-center rounded-lg border border-line bg-slate-100/80 p-3', className)}>
      <div
        className="relative overflow-hidden rounded-[2px] bg-white shadow-paper ring-1 ring-slate-900/5"
        style={{
          width: '100%',
          maxWidth: landscape ? 210 : 138,
          aspectRatio: `${width} / ${height}`,
        }}
      >
        <div
          className="absolute inset-0 flex flex-col"
          style={{
            paddingTop: `${(margins.top / height) * 100}%`,
            paddingBottom: `${(margins.bottom / height) * 100}%`,
            paddingLeft: `${(margins.left / width) * 100}%`,
            paddingRight: `${(margins.right / width) * 100}%`,
          }}
        >
          {showHeading && (
            <div
              className="mb-[8%] text-center"
              style={{
                fontFamily: safe.headings.chapter.fontFamily,
                fontSize: `${Math.max(5, safe.headings.chapter.fontSize * 0.52)}px`,
                fontWeight: safe.headings.chapter.bold ? 700 : 400,
                textTransform: safe.headings.chapter.uppercase ? 'uppercase' : 'none',
              }}
            >
              BAB I
              <br />
              PENDAHULUAN
            </div>
          )}
          <div className="min-h-0 flex-1 space-y-[5%] overflow-hidden">
            {[1.25, 1.25, 0.65].map((indent, index) => (
              <div key={index} className="space-y-[3px]">
                <div
                  style={{
                    height: 2,
                    background: '#cbd5e1',
                    borderRadius: 1,
                    marginLeft: `${(indent / width) * 100}%`,
                    width: `calc(100% - ${(indent / width) * 100}%)`,
                  }}
                />
                <div style={{ height: 2, width: `${92 - index * 7}%`, background: '#e2e8f0', borderRadius: 1 }} />
                <div style={{ height: 2, width: `${84 - index * 5}%`, background: '#e2e8f0', borderRadius: 1 }} />
              </div>
            ))}
            <div className="flex gap-2 pt-[3%]">
              <div className="h-10 flex-1 rounded-[1px] border border-slate-200 bg-slate-50" />
              <div className="flex flex-1 flex-col justify-center gap-1">
                <div style={{ height: 2, width: '100%', background: '#cbd5e1', borderRadius: 1 }} />
                <div style={{ height: 2, width: '80%', background: '#e2e8f0', borderRadius: 1 }} />
                <div style={{ height: 2, width: '90%', background: '#e2e8f0', borderRadius: 1 }} />
              </div>
            </div>
          </div>
        </div>
        {safe.pageNumbering.enabled && (
          <span
            className={cx(
              'absolute text-[6px] tabular-nums text-ink-400',
              numberStyle.bottom ? 'bottom-[3%]' : 'top-[3%]',
              numberStyle.center ? 'left-1/2 -translate-x-1/2' : 'right-[5%]',
            )}
            style={{ fontFamily: safe.typography.fontFamily }}
          >
            {numberStyle.bottom ? '1' : '1'}
          </span>
        )}
      </div>
    </div>
  );
}
