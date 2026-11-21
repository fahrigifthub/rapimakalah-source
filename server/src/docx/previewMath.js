import { latexToOmml, splitMath } from './omml.js';
import { ommlToMathml } from './mathml.js';
import { textFromXml } from './reader.js';

// Word may split a pasted $$ equation into several paragraphs. Keep the
// paragraph positions (used by highlights) while collecting just the equation.
// This prepares the preview only; the original DOCX package is never modified.
export function preparePreviewMath(xml) {
  const paragraphs = [...xml.matchAll(/<w:p\b[^>]*>[\s\S]*?<\/w:p>/g)];
  const replacements = [];
  for (let i = 0; i < paragraphs.length; i++) {
    const first = paragraphs[i];
    const text = textFromXml(first[0]).trim();
    if (!text.startsWith('$$') || text.slice(2).includes('$$') || /<m:oMath\b/.test(first[0])) continue;
    let equation = text;
    let end = i;
    for (let j = i + 1; j < Math.min(paragraphs.length, i + 32); j++) {
      const previous = paragraphs[j - 1];
      const current = paragraphs[j];
      if (xml.slice(previous.index + previous[0].length, current.index).trim()) break;
      if (/<w:sectPr\b|<w:br\b[^>]*w:type=["']page["']|<w:pageBreakBefore\b/.test(previous[0] + current[0])) break;
      if (/<w:drawing\b|<w:pict\b|<m:oMath\b/.test(current[0])) break;
      const next = textFromXml(current[0]).trim();
      equation += '\n' + next;
      if (next.includes('$$')) { if (equation.endsWith('$$')) end = j; break; }
      if (equation.length > 16000) break;
    }
    if (end === i) continue;
    const math = latexToOmml(equation.slice(2, -2).trim(), true);
    for (let j = i; j <= end; j++) {
      const match = paragraphs[j];
      const opening = match[0].match(/^<w:p\b[^>]*>/)[0];
      const props = match[0].match(/<w:pPr\b[^>]*>[\s\S]*?<\/w:pPr>/)?.[0] || '';
      replacements.push({ start: match.index, end: match.index + match[0].length, xml: `${opening}${props}${j === i ? math : ''}</w:p>` });
    }
    i = end;
  }
  for (const replacement of replacements.reverse()) xml = xml.slice(0, replacement.start) + replacement.xml + xml.slice(replacement.end);
  return xml;
}

// Match delimiters across Word runs without losing formatting on plain text.
export function convertPreviewMath(runs) {
  const result = [];
  let group = [];
  const flush = () => {
    if (!group.length) return;
    const text = group.map(run => run.text).join('');
    let offset = 0;
    const ranges = group.map(run => { const start = offset; offset += run.text.length; return { run, start, end: offset }; });
    offset = 0;
    for (const part of splitMath(text)) {
      if (part.type === 'text') {
        for (const range of ranges) {
          const start = Math.max(offset, range.start), end = Math.min(offset + part.value.length, range.end);
          if (end > start) result.push({ ...range.run, text: text.slice(start, end) });
        }
        offset += part.value.length;
      } else {
        const display = part.type === 'display';
        result.push({ text: '', math: ommlToMathml(latexToOmml(part.value, display)), display });
        // splitMath trims display contents; locate the closing delimiter in
        // the source rather than deriving its length from the trimmed value.
        const delimiter = display ? '$$' : '$';
        offset = text.indexOf(delimiter, offset + delimiter.length) + delimiter.length;
      }
    }
    group = [];
  };
  for (const run of runs) {
    if (run.math || run.pageBreak) { flush(); result.push(run); }
    else group.push(run);
  }
  flush();
  return result;
}
