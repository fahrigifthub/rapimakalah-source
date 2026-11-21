import { detectHeadings, getBodyStructure, parseStyles, readDocxBuffer } from './reader.js';
import { setParagraphProperty } from './xml.js';
import { buildPreviewPages, parseNumbering } from './preview.js';

const BIBLIOGRAPHY = /^(daftar\s+pustaka|referensi|references|bibliography)$/i;
const manualLabel = p => !p.hasNumbering && /^\d+[.)]\s+\S/.test(p.plainText) && p.plainText.length < 110 && !/[.;:?!]$/.test(p.plainText) && p.runs.filter(r => r.text?.trim()).every(r => r.bold);

/** Additive postprocessor. Only correct known formatter output patterns;
 * preserve text, runs, fields, relationships, media and section boundaries. */
export async function repairFormattedDocx(inputBuffer, { config, options = {} } = {}) {
  const zip = await readDocxBuffer(inputBuffer);
  const originalXml = await zip.file('word/document.xml').async('string');
  const styles = parseStyles((await zip.file('word/styles.xml')?.async('string')) || '');
  const structure = getBodyStructure(originalXml);
  const headings = new Map(detectHeadings(structure.blocks, styles).map(h => [h.blockIndex, h]));
  const bodyStart = [...headings.values()].find(h => h.level === 1 && /^BAB\s/i.test(h.text))?.blockIndex;
  const firstLine = Math.round((config.typography.firstLineIndent / 2.54) * 1440);
  const repairs = [];
  let contentTypes = await zip.file('[Content_Types].xml').async('string');
  const missingSourceType = zip.file('rapimakalah/source.json') && !/Extension="json"|PartName="\/rapimakalah\/source.json"/.test(contentTypes);
  if (missingSourceType) {
    contentTypes = contentTypes.replace('</Types>', '<Override PartName="/rapimakalah/source.json" ContentType="application/json"/></Types>');
    zip.file('[Content_Types].xml', contentTypes);
    repairs.push({ type: 'source-content-type' });
  }
  // Legacy linkification swallowed the Markdown boundary in [URL](URL).
  // Restore the intended link destination rather than the Markdown syntax.
  const relsPath = 'word/_rels/document.xml.rels';
  const rels = (await zip.file(relsPath)?.async('string')) || '';
  const fixedRels = rels.replace(/(<Relationship\b[^>]*\bTarget=")([^"\s]+)("[^>]*>)/g, (all, start, target, end) => {
    if (!/hyperlink/.test(all)) return all;
    const duplicate = /^(https?:\/\/.+?)\]\(\1\)?$/.exec(target);
    if (!duplicate) return all;
    repairs.push({ type: 'hyperlink-uri' });
    return start + duplicate[1] + end;
  });
  if (fixedRels !== rels) zip.file(relsPath, fixedRels);
  const edits = [];
  let headingLeft = 0;
  let inBibliography = false;
  let underLetterLabel = false;
  for (const block of structure.blocks) {
    const p = block.data;
    if (block.type !== 'w:p' || bodyStart === undefined || block.index < bodyStart) continue;
    if (BIBLIOGRAPHY.test(p.plainText)) inBibliography = true;
    if (inBibliography) continue;
    const heading = headings.get(block.index);
    let xml = block.xml;
    let kind;
    if (heading) {
      headingLeft = p.leftIndent || 0;
      underLetterLabel = false;
      if (options.headings) {
        xml = setParagraphProperty(xml, 'w:keepNext', '<w:keepNext/>');
        xml = setParagraphProperty(xml, 'w:keepLines', '<w:keepLines/>');
        kind = 'heading-with-body';
      }
    } else if (/^[A-Z]\.\s+/.test(p.plainText) && p.plainText.length < 90) {
      underLetterLabel = true;
    } else if (manualLabel(p) && p.plainText && !p.styleId && !p.hasImage) {
      if (options.headings) {
        xml = setParagraphProperty(xml, 'w:keepNext', '<w:keepNext/>');
        xml = setParagraphProperty(xml, 'w:keepLines', '<w:keepLines/>');
      }
      if (options.firstLineIndent) {
        xml = setParagraphProperty(xml, 'w:ind', '<w:ind w:left="425" w:right="0" w:hanging="425"/>');
        xml = setParagraphProperty(xml, 'w:tabs', '<w:tabs><w:tab w:val="left" w:pos="425"/></w:tabs>');
        // Replace only the separator following the literal label, retaining
        // the original number and all formatted runs.
        xml = xml.replace(/(<w:t\b[^>]*>)(\d+[.)])\s+/, '$1$2</w:t><w:tab/><w:t xml:space="preserve">');
      }
      if (options.alignment) xml = setParagraphProperty(xml, 'w:jc', '<w:jc w:val="left"/>');
      kind = 'numbered-label';
    } else if (options.firstLineIndent && headingLeft > 0 && !underLetterLabel && p.plainText && !p.hasNumbering && !p.styleId && !p.hasImage && !p.hangingIndent && !/<m:oMath|<w:framePr|<w:tabs/.test(xml) && p.leftIndent === headingLeft && p.firstLineIndent === firstLine) {
      xml = setParagraphProperty(xml, 'w:ind', `<w:ind w:left="0" w:right="0" w:firstLine="${firstLine}"/>`);
      kind = 'body-indent';
    }
    if (xml !== block.xml) {
      edits.push({ block, xml });
      repairs.push({ blockIndex: block.index, type: kind });
    }
  }
  let inner = structure.bodyInner;
  for (const { block, xml } of edits.reverse()) inner = inner.slice(0, block.start) + xml + inner.slice(block.end);
  let documentXml = originalXml.slice(0, structure.bodyRange.openEnd) + inner + originalXml.slice(structure.bodyRange.closeStart);

  // Refresh cached TOC page labels after reflow; keep the genuine Word field.
  if (options.toc) {
    const preview = buildPreviewPages(documentXml, styles, config, {}, parseNumbering((await zip.file('word/numbering.xml')?.async('string')) || ''), { formatted: true, formatOptions: { ...options, alignment: false, firstLineIndent: false } });
    const labels = new Map();
    for (const page of preview.pages) for (const b of page.blocks) {
      if (b.headingLevel && page.pageLabel) labels.set(`${b.numberMarker ? b.numberMarker + ' ' : ''}${b.text}`.replace(/\s+/g, ' ').trim(), page.pageLabel);
    }
    documentXml = documentXml.replace(/<w:p\b[\s\S]*?<\/w:p>/g, p => {
      if (!/^TOC\d+$/.test(/w:pStyle\s+w:val="([^"]+)"/.exec(p)?.[1] || '')) return p;
      const texts = [...p.matchAll(/<w:t\b[^>]*>([^<]*)<\/w:t>/g)];
      if (texts.length < 2) return p;
      // Decode through the existing reader so escaped ampersands match.
      const block = getBodyStructure(`<w:document><w:body>${p}</w:body></w:document>`).blocks[0];
      const title = block.data.plainText.replace(/\s+\S+$/, '').trim();
      const label = labels.get(title);
      const last = texts.at(-1);
      if (!label || last[1] === label) return p;
      repairs.push({ type: 'toc-page', title });
      return p.slice(0, last.index) + last[0].replace(last[1] + '</w:t>', label + '</w:t>') + p.slice(last.index + last[0].length);
    });
  }
  if (documentXml === originalXml && fixedRels === rels && !missingSourceType) return { buffer: inputBuffer, changed: false, report: { repairs: [] } };
  zip.file('word/document.xml', documentXml);
  return { buffer: await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }), changed: true, report: { repairs } };
}
