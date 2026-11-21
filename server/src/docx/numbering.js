import JSZip from 'jszip';
import {
  PPR_ORDER,
  escapeXml,
  findElement,
  getAttr,
  getInner,
  removeChild,
  scanChildren,
  upsertChild,
} from './xml.js';

export const SECTPR_ORDER = [
  'w:headerReference', 'w:footerReference', 'w:footnotePr', 'w:endnotePr', 'w:type', 'w:pgSz',
  'w:pgMar', 'w:paperSrc', 'w:pgBorders', 'w:lnNumType', 'w:pgNumType', 'w:cols', 'w:formProt',
  'w:vAlign', 'w:noEndnote', 'w:titlePg', 'w:textDirection', 'w:bidi', 'w:rtlGutter',
  'w:docGrid', 'w:printerSettings', 'w:sectPrChange',
];

const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const R_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';

export function cmToTwips(cm) {
  return Math.round((Number(cm) / 2.54) * 1440);
}

export function ptToTwips(pt) {
  return Math.round(Number(pt) * 20);
}

/** Rebuild a sectPr with new page size/numbers/footer reference. */
export function updateSectPr(sectPrXml, { pageSize, margins, pageNumbering, headerFooter, sectionType }) {
  let inner = getInner(sectPrXml, 'w:sectPr')?.inner ?? '';
  if (pageSize) {
    inner = removeChild(inner, 'w:pgSz');
    // pgSz should precede pgMar
    inner = upsertChild(
      inner,
      'w:pgSz',
      `<w:pgSz w:w="${pageSize.width}" w:h="${pageSize.height}"${pageSize.orientation === 'landscape' ? ' w:orient="landscape"' : ''}/>`,
      SECTPR_ORDER,
    );
  }
  if (margins) {
    inner = removeChild(inner, 'w:pgMar');
    inner = upsertChild(
      inner,
      'w:pgMar',
      `<w:pgMar w:top="${cmToTwips(margins.top)}" w:right="${cmToTwips(margins.right)}" w:bottom="${cmToTwips(margins.bottom)}" w:left="${cmToTwips(margins.left)}" w:header="720" w:footer="720" w:gutter="0"/>`,
      SECTPR_ORDER,
    );
  }
  if (headerFooter !== undefined) {
    inner = removeChild(inner, 'w:headerReference');
    inner = removeChild(inner, 'w:footerReference');
    if (headerFooter) {
      const tag = headerFooter.kind === 'header' ? 'w:headerReference' : 'w:footerReference';
      inner = upsertChild(inner, tag, `<${tag} w:type="default" r:id="${headerFooter.relationshipId}"/>`, SECTPR_ORDER);
    }
  }
  if (pageNumbering) {
    inner = removeChild(inner, 'w:pgNumType');
    if (pageNumbering.remove) {
      // no numFmt => continuous numbering
    } else {
      inner = upsertChild(
        inner,
        'w:pgNumType',
        `<w:pgNumType w:fmt="${pageNumbering.format}"${pageNumbering.start ? ` w:start="${pageNumbering.start}"` : ''}/>`,
        SECTPR_ORDER,
      );
    }
  }
  if (headerFooter) inner = removeChild(inner, 'w:titlePg');
  if (sectionType) {
    inner = removeChild(inner, 'w:type');
    inner = upsertChild(inner, 'w:type', `<w:type w:val="${sectionType}"/>`, SECTPR_ORDER);
  }
  return `<w:sectPr>${inner}</w:sectPr>`;
}

function uniqueRelId(relsXml, base) {
  let id = base;
  let i = 2;
  while (new RegExp(`Id="${id}"`).test(relsXml)) {
    id = `${base}${i}`;
    i += 1;
  }
  return id;
}

function makeFieldParagraph({ alignment, fontSize }) {
  const size = fontSize ? `<w:sz w:val="${fontSize * 2}"/><w:szCs w:val="${fontSize * 2}"/>` : '';
  return `<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:jc w:val="${alignment}"/><w:rPr>${size}</w:rPr></w:pPr><w:r><w:rPr>${size}</w:rPr><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText xml:space="preserve"> PAGE </w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:rPr>${size}</w:rPr><w:t>1</w:t></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r></w:p>`;
}

function makeHeaderFooterPart({ kind, alignment, fontFamily, fontSize }) {
  const tag = kind === 'header' ? 'hdr' : 'ftr';
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:${tag} xmlns:w="${W_NS}" xmlns:r="${R_NS}"><w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:jc w:val="${alignment}"/><w:rPr><w:rFonts w:ascii="${escapeXml(fontFamily)}" w:hAnsi="${escapeXml(fontFamily)}" w:cs="${escapeXml(fontFamily)}"/><w:sz w:val="${fontSize * 2}"/><w:szCs w:val="${fontSize * 2}"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="${escapeXml(fontFamily)}" w:hAnsi="${escapeXml(fontFamily)}" w:cs="${escapeXml(fontFamily)}"/><w:sz w:val="${fontSize * 2}"/><w:szCs w:val="${fontSize * 2}"/></w:rPr><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText xml:space="preserve"> PAGE </w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:rPr><w:rFonts w:ascii="${escapeXml(fontFamily)}" w:hAnsi="${escapeXml(fontFamily)}" w:cs="${escapeXml(fontFamily)}"/><w:sz w:val="${fontSize * 2}"/><w:szCs w:val="${fontSize * 2}"/></w:rPr><w:t>1</w:t></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r></w:p></w:${tag}>`;
}

/**
 * Apply page numbering by creating (or reusing) real Word sections.
 * boundaries.bodyStart = block index of the first body heading (BAB).
 * boundaries.coverEnd = block index that ends the cover (first page/section break).
 *
 * Documents often already carry section breaks exactly at the cover and
 * front-matter boundaries. We reuse those instead of stacking new "nextPage"
 * breaks next to them: two consecutive section breaks around an empty
 * paragraph make Word render an extra blank page. Only a boundary without a
 * break gets a newly inserted one.
 */
export async function applyPageNumbering(zip, documentXml, structure, config, numbering, boundaries) {
  const body = getInner(documentXml, 'w:body');
  if (!body) return { documentXml, applied: false, warnings: ['Struktur body dokumen tidak dikenali.'] };
  const baseSectPr =
    structure.blocks.find((b) => b.type === 'w:sectPr')?.xml ||
    '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1701" w:right="1701" w:bottom="1701" w:left="2268"/></w:sectPr>';

  const bodyStart = boundaries?.bodyStart ?? null;
  const coverEnd = boundaries?.coverEnd ?? null;
  const warnings = [];

  const position = numbering.position || 'bottom-center';
  const kind = position.startsWith('top') ? 'header' : 'footer';
  const alignment = position.endsWith('right') ? 'right' : 'center';

  // Prepare header/footer part + relationship.
  const partName = `word/paperly${kind === 'header' ? 'Header' : 'Footer'}.xml`;
  const relType = `http://schemas.openxmlformats.org/officeDocument/2006/relationships/${kind}`;
  let relsXml = (await zip.file('word/_rels/document.xml.rels')?.async('string')) || '';
  if (!relsXml) {
    relsXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>';
  }
  const relId = uniqueRelId(relsXml, `rIdPaperly${kind === 'header' ? 'Header' : 'Footer'}`);
  const headerFooterRef = { kind, relationshipId: relId };
  zip.file(partName, makeHeaderFooterPart({ kind, alignment, fontFamily: numbering.fontFamily || 'Times New Roman', fontSize: numbering.fontSize || 11 }));
  if (!new RegExp(`Id="${relId}"`).test(relsXml)) {
    relsXml = relsXml.replace(
      '</Relationships>',
      `<Relationship Id="${relId}" Type="${relType}" Target="${partName.replace('word/', '')}"/></Relationships>`,
    );
  }
  zip.file('word/_rels/document.xml.rels', relsXml);

  let contentTypes = await zip.file('[Content_Types].xml')?.async('string');
  if (contentTypes) {
    const contentType =
      kind === 'header'
        ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml'
        : 'application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml';
    if (!contentTypes.includes(`PartName="/${partName}"`)) {
      contentTypes = contentTypes.replace(
        '</Types>',
        `<Override PartName="/${partName}" ContentType="${contentType}"/></Types>`,
      );
      zip.file('[Content_Types].xml', contentTypes);
    }
  }

  const blocks = structure.blocks;
  const finalSect = blocks.find((b) => b.type === 'w:sectPr');

  let hasCoverSection = false;
  let hasFrontSection = false;
  if (numbering.cover === false && coverEnd === null) {
    warnings.push('Pemisah halaman antara bagian cover dan isi tidak ditemukan. Nomor halaman mungkin tampil di halaman pertama.');
  }
  if (numbering.cover === false && coverEnd !== null && bodyStart !== null) hasCoverSection = true;
  const frontMatterExists = coverEnd !== null && bodyStart !== null && bodyStart > coverEnd + 1;
  if (frontMatterExists) hasFrontSection = true;

  const boundariesActive = hasCoverSection || hasFrontSection;
  let updatedBody = body.inner;

  if (boundariesActive) {
    // Existing section breaks: a paragraph whose w:pPr carries a w:sectPr.
    const paraSectIdx = blocks.filter((b) => b.type === 'w:p' && b.data?.sectionBreak).map((b) => b.index);

    // A sectPr sitting on the first body heading paragraph would end a section
    // right at "BAB I", splitting the chapter from its own heading. Demote it —
    // the boundary we manage replaces its pagination role.
    const demoteIdx = bodyStart !== null && paraSectIdx.includes(bodyStart) ? bodyStart : null;
    const existingBreaks = paraSectIdx.filter((i) => i !== demoteIdx);

    // Front|body boundary: reuse the break right before the body heading, or
    // one block earlier (when an empty paragraph sits in between).
    let frontBreak = null;
    if (hasFrontSection) {
      if (existingBreaks.includes(bodyStart - 1)) frontBreak = bodyStart - 1;
      else if (existingBreaks.includes(bodyStart - 2)) frontBreak = bodyStart - 2;
    }
    // Cover boundary: prefer the exact separator, then its neighbours.
    let coverBreak = null;
    let coverInsertAfter = null;
    if (hasCoverSection) {
      for (const candidate of [coverEnd, coverEnd - 1, coverEnd + 1]) {
        if (candidate >= 0 && candidate !== frontBreak && existingBreaks.includes(candidate)) {
          coverBreak = candidate;
          break;
        }
      }
      if (coverBreak === null) coverInsertAfter = coverEnd;
    }
    const frontInsertAfter = hasFrontSection && frontBreak === null ? bodyStart - 1 : null;

    const ops = []; // { start, end, xml } spliced into the body back-to-front.

    if (demoteIdx !== null) {
      const block = blocks[demoteIdx];
      const range = block ? findElement(block.xml, 'w:sectPr') : null;
      if (range) ops.push({ start: block.start + range.start, end: block.start + range.end, xml: '' });
    }

    // Ordered cuts: every cut ends one section. Existing breaks end a section
    // at their own block; an inserted boundary paragraph ends it right after
    // its carrier block (blockIndex + 0.5).
    const cuts = existingBreaks.map((i) => ({ pos: i, blockIndex: i, kind: 'existing' }));
    if (coverInsertAfter !== null) cuts.push({ pos: coverInsertAfter + 0.5, blockIndex: coverInsertAfter, kind: 'coverInsert' });
    if (frontInsertAfter !== null) cuts.push({ pos: frontInsertAfter + 0.5, blockIndex: frontInsertAfter, kind: 'frontInsert' });
    cuts.sort((a, b) => a.pos - b.pos);

    const coverPos = coverBreak ?? (coverInsertAfter !== null ? coverInsertAfter + 0.5 : null);
    const roleOf = (startBlock, endPos) => {
      if (bodyStart !== null && endPos >= bodyStart && startBlock <= bodyStart) return 'body';
      if (bodyStart !== null && startBlock > bodyStart) return 'body';
      if (coverPos !== null && endPos <= coverPos) return 'cover';
      return 'front';
    };

    // Walk the parts to find the first front-matter and first body section —
    // only those restart numbering (i/1); later sections continue it.
    let firstFrontCut = null;
    let firstBodyCut = null;
    let prevStart = 0;
    for (const cut of cuts) {
      cut.role = roleOf(prevStart, cut.pos);
      if (cut.role === 'front' && firstFrontCut === null) firstFrontCut = cut;
      if (cut.role === 'body' && firstBodyCut === null) firstBodyCut = cut;
      prevStart = cut.blockIndex + 1;
    }

    const pgNumFor = (role, isFirst) => {
      if (role === 'cover') return { remove: true };
      if (role === 'front') {
        return isFirst ? { format: numbering.frontMatter || 'lowerRoman', start: 1 } : { remove: true };
      }
      return isFirst ? { format: numbering.body || 'decimal', start: numbering.bodyRestart === false ? null : 1 } : { remove: true };
    };

    const stampSect = (sectXml, role, isFirst) =>
      updateSectPr(sectXml, {
        // Reused breaks keep their author-chosen w:type; only freshly inserted
        // boundaries are forced to "nextPage".
        headerFooter: role === 'cover' ? null : headerFooterRef,
        pageNumbering: pgNumFor(role, isFirst),
      });

    for (const cut of cuts) {
      const block = blocks[cut.blockIndex];
      if (!block) continue;
      const isFirst = cut === firstFrontCut || cut === firstBodyCut;
      if (cut.kind === 'existing') {
        const range = findElement(block.xml, 'w:sectPr');
        if (!range) continue;
        const stamped = stampSect(block.xml.slice(range.start, range.end), cut.role, isFirst);
        ops.push({ start: block.start + range.start, end: block.start + range.end, xml: stamped });
      } else {
        const sect = updateSectPr(baseSectPr, {
          headerFooter: cut.role === 'cover' ? null : headerFooterRef,
          pageNumbering: pgNumFor(cut.role, isFirst),
          sectionType: 'nextPage',
        });
        ops.push({ start: block.end, end: block.end, xml: `<w:p><w:pPr>${sect}</w:pPr></w:p>` });
      }
    }

    // Final (body) section: the sectPr at the end of w:body.
    if (finalSect) {
      const lastStart = cuts.length ? cuts[cuts.length - 1].blockIndex + 1 : 0;
      const role = roleOf(lastStart, Number.POSITIVE_INFINITY);
      const stamped = stampSect(finalSect.xml, role, role === 'body' && firstBodyCut === null);
      ops.push({ start: finalSect.start, end: finalSect.end, xml: stamped });
    } else {
      warnings.push('Section properti akhir tidak ditemukan; penomoran halaman isi tidak dapat diterapkan.');
    }

    // Splice back-to-front so earlier offsets stay valid.
    ops.sort((a, b) => b.start - a.start || b.end - a.end);
    for (const op of ops) {
      updatedBody = updatedBody.slice(0, op.start) + op.xml + updatedBody.slice(op.end);
    }
  }

  if (!hasCoverSection && !hasFrontSection) {
    warnings.push('Tidak ada section break yang dapat dibuat secara otomatis. Pastikan dokumen memiliki halaman cover dan pemisah halaman sebelum BAB pertama.');
  }
  if (!bodyStart) {
    warnings.push('Heading BAB pertama tidak terdeteksi; batas bagian isi tidak dapat ditentukan secara otomatis.');
  }

  const newDocumentXml =
    documentXml.slice(0, body.range.openEnd) + updatedBody + documentXml.slice(body.range.closeStart);

  return {
    documentXml: newDocumentXml,
    applied: hasCoverSection || hasFrontSection,
    sections: {
      cover: hasCoverSection,
      frontMatter: hasFrontSection,
      body: hasCoverSection || hasFrontSection,
    },
    warnings,
    footerPart: partName,
  };
}

export function setUpdateFields(settingsXml) {
  if (!settingsXml) return settingsXml;
  if (/<w:updateFields\b/.test(settingsXml)) {
    return settingsXml.replace(/<w:updateFields\b[^>]*\/>/, '<w:updateFields w:val="true"/>');
  }
  if (settingsXml.includes('</w:settings>')) {
    return settingsXml.replace('</w:settings>', '<w:updateFields w:val="true"/></w:settings>');
  }
  return settingsXml;
}

/**
 * Justified paragraphs stretch a line that ends with a manual line break
 * (Shift+Enter) across the full width. This compat flag makes Word leave
 * such lines with normal word spacing.
 */
export function setNoExpandShiftReturn(settingsXml) {
  if (!settingsXml || /<w:doNotExpandShiftReturn\b/.test(settingsXml)) return settingsXml;
  const flag = '<w:doNotExpandShiftReturn/>';
  const compat = /<w:compat\b[^>]*>([\s\S]*?)<\/w:compat>/.exec(settingsXml);
  if (compat) {
    const inner = compat[1];
    // Schema order: only these elements may precede doNotExpandShiftReturn.
    const earlier = ['useSingleBorderforContiguousCells', 'wpJustification', 'noTabHangInd', 'noLeading', 'spaceForUL', 'noColumnBalance', 'balanceSingleByteDoubleByteWidth', 'noExtraLineSpacing', 'doNotLeaveBackslashAlone', 'ulTrailSpace'];
    let insertAt = 0;
    for (const name of earlier) {
      const m = new RegExp(`<w:${name}\\b[^>]*/>`).exec(inner);
      if (m) insertAt = Math.max(insertAt, m.index + m[0].length);
    }
    const start = compat.index + compat[0].indexOf('>') + 1;
    return settingsXml.slice(0, start + insertAt) + flag + settingsXml.slice(start + insertAt);
  }
  if (/<w:compat\s*\/>/.test(settingsXml)) return settingsXml.replace(/<w:compat\s*\/>/, `<w:compat>${flag}</w:compat>`);
  return settingsXml;
}

export { makeFieldParagraph, scanChildren, getAttr, PPR_ORDER };
