import { getBodyStructure, readDocxBuffer } from './reader.js';
import { escapeXml, getInner } from './xml.js';

const title = /^(daftar\s+pustaka|referensi|references|bibliography)$/i;
const citation = /^[\p{L}][\s\S]*?\((?:\d{4}[a-z]?|n\.d\.|t\.t\.)\)\./u;
const plainRuns = xml => /^<w:p>(?:<w:r><w:t(?:\s[^>]*)?>[^<]*<\/w:t><\/w:r>)+<\/w:p>$/.test(xml);
const contents = xml => getInner(xml, 'w:p').inner.replace(/<w:pPr\b[^>]*\/>|<w:pPr\b[^>]*>[\s\S]*?<\/w:pPr>/, '');
const safe = b => b?.type === 'w:p' && b.data.plainText && !b.data.styleId && !b.data.hasNumbering && !b.data.hasImage && !b.data.pageBreakBefore && !b.data.pageBreakCount && !b.data.sectionBreak && !/<m:oMath|<w:fldChar|<w:bookmark/.test(b.xml);

// Repair unambiguous continuations in pasted bibliographies before formatting.
// Existing italic runs remain intact. A new author/year always starts an entry.
export async function repairBibliography(buffer) {
  const zip = await readDocxBuffer(buffer);
  if (!zip.file('rapimakalah/source.json')) return { buffer, joined: 0 };
  const xml = await zip.file('word/document.xml').async('string');
  const structure = getBodyStructure(xml);
  let active = false;
  let joined = 0;
  const output = [];
  for (let i = 0; i < structure.blocks.length; i++) {
    const b = structure.blocks[i];
    if (title.test(b.data?.plainText || '')) { active = true; output.push(b.xml); continue; }
    if (b.data?.styleId?.startsWith('Heading') || /^(?:LAMPIRAN|BAB\s)/i.test(b.data?.plainText || '')) active = false;
    if (!active || !safe(b) || !citation.test(b.data.plainText)) { output.push(b.xml); continue; }
    const group = [b];
    let text = b.data.plainText;
    let tail = text;
    while (safe(structure.blocks[i + 1])) {
      const next = structure.blocks[i + 1];
      if (citation.test(next.data.plainText)) break;
      const url = /^https?:\/\/\S+$/.test(next.data.plainText);
      const openItalic = (text.match(/(?<!\*)\*(?!\*)/g) || []).length % 2 === 1;
      const continuation = openItalic && next.data.plainText.includes('*') || (tail.length >= 45 && !/[.!?:;]$/.test(tail) && /^[a-z]/.test(next.data.plainText));
      if (!url && !continuation) break;
      group.push(next);
      tail = next.data.plainText;
      text += ' ' + tail;
      i++;
      joined++;
    }
    if (group.length === 1) { output.push(b.xml); continue; }
    let inner;
    if (group.every(p => plainRuns(p.xml)) && /(?<!\*)\*[^*]+\*(?!\*)/.test(text)) {
      inner = text.split(/(\*[^*]+\*)/g).filter(Boolean).map(part => {
        const italic = part.startsWith('*') && part.endsWith('*');
        return `<w:r>${italic ? '<w:rPr><w:i/><w:iCs/></w:rPr>' : ''}<w:t xml:space="preserve">${escapeXml(italic ? part.slice(1, -1) : part)}</w:t></w:r>`;
      }).join('');
    } else inner = group.map(p => contents(p.xml)).join('<w:r><w:t xml:space="preserve"> </w:t></w:r>');
    output.push(b.xml.slice(0, b.xml.indexOf('>') + 1) + inner + '</w:p>');
  }
  if (!joined) return { buffer, joined: 0 };
  zip.file('word/document.xml', xml.slice(0, structure.bodyRange.openEnd) + output.join('') + xml.slice(structure.bodyRange.closeStart));
  return { buffer: await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }), joined };
}
