import { setParagraphProperty } from './xml.js';

// Numbered subheadings ("2.8 Upaya ...") place their title at 709 twips. List
// markers follow that same axis so "1." starts directly below "Upaya".
const LIST_MARKER_START = 709;
const LIST_LEVEL_STEP = 360;
// About 0.8 cm for marker plus gap (including the marker glyph itself), a
// tighter and more conventional list spacing than the previous 1.27 cm.
const LIST_MARKER_WIDTH = 450;

export function numberedListTextIndent(level = 0) {
  return LIST_MARKER_START + Math.max(0, level) * LIST_LEVEL_STEP + LIST_MARKER_WIDTH;
}

/** Indent a Word-native numbered paragraph with a hanging marker column. */
export function applyNumberedListIndent(paragraphXml) {
  if (!/<w:numPr\b[\s\S]*?<\/w:numPr>/.test(paragraphXml)) return paragraphXml;

  const numPr = /<w:numPr\b[\s\S]*?<\/w:numPr>/.exec(paragraphXml)?.[0] || '';
  const level = Number(/<w:ilvl\b[^>]*w:val="(\d+)"/.exec(numPr)?.[1] ?? 0);
  const left = numberedListTextIndent(level);
  return setParagraphProperty(
    paragraphXml,
    'w:ind',
    `<w:ind w:left="${left}" w:right="0" w:hanging="${LIST_MARKER_WIDTH}"/>`,
  );
}

/** Align the explanatory paragraph and all its wrapped lines under item text. */
export function applyListContinuationIndent(paragraphXml, left) {
  return setParagraphProperty(
    paragraphXml,
    'w:ind',
    `<w:ind w:left="${left}" w:right="0" w:firstLine="0"/>`,
  );
}
