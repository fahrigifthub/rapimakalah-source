import { getBodyStructure, readDocxBuffer } from './reader.js';
import { escapeXml } from './xml.js';

const plain = b => b?.type === 'w:p' && /^<w:p>(?:<w:r><w:t(?:\s[^>]*)?>[^<]*<\/w:t><\/w:r>)+<\/w:p>$/.test(b.xml) && b.data.plainText.length > 0;
const wrapped = text => text.length >= 45 && text.length <= 85 && !/[.!?:;"”\\]$/.test(text) && !/^https?:|^\d+[.)]\s/.test(text);

// Pasted fixed-width prose has many consecutive 45–85 character lines.
// Join unfinished lines only, never cross headings, lists, images, blank
// paragraphs, bibliography or an existing DOCX's formatted paragraphs.
export async function repairWrappedText(buffer) {
  const zip = await readDocxBuffer(buffer);
  if (!zip.file('rapimakalah/source.json')) return { buffer, joined: 0 };
  const xml = await zip.file('word/document.xml').async('string');
  const structure = getBodyStructure(xml);
  const blocks = structure.blocks;
  if (blocks.filter(b => plain(b) && wrapped(b.data.plainText)).length < 10) return { buffer, joined: 0 };
  let active = false;
  let joined = 0;
  const output = [];
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (/^(KATA PENGANTAR|BAB\s+[IVX\d]+)/i.test(b.data?.plainText || '')) active = true;
    if (/^(DAFTAR ISI|DAFTAR PUSTAKA|REFERENSI)$/i.test(b.data?.plainText || '')) active = false;
    if (!active || !plain(b)) { output.push(b.xml); continue; }
    let text = b.data.plainText;
    let tail = text;
    let count = 0;
    while (wrapped(tail) && plain(blocks[i + 1]) && !/^(?:Semarang,|Penulis$|https?:|\d+[.)]\s)/i.test(blocks[i + 1].data.plainText)) {
      tail = blocks[++i].data.plainText;
      text += ' ' + tail;
      count++;
    }
    if (!count) { output.push(b.xml); continue; }
    joined += count;
    const runs = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map(part => {
      const bold = part.startsWith('**') && part.endsWith('**');
      return `<w:r>${bold ? '<w:rPr><w:b/><w:bCs/></w:rPr>' : ''}<w:t xml:space="preserve">${escapeXml(bold ? part.slice(2, -2) : part)}</w:t></w:r>`;
    }).join('');
    output.push(`<w:p>${runs}</w:p>`);
  }
  if (!joined) return { buffer, joined: 0 };
  zip.file('word/document.xml', xml.slice(0, structure.bodyRange.openEnd) + output.join('') + xml.slice(structure.bodyRange.closeStart));
  return { buffer: await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }), joined };
}
