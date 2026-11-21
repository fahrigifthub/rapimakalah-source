import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, LevelFormat, ImageRun, Table, TableRow, TableCell, WidthType, PageBreak, Tab, ImportedXmlComponent } from 'docx';

/** Export only the editor's supported structures; never interpret HTML. */
export async function exportWriting(content) {
  let count = 0;
  function inline(nodes = [], depth = 0) {
    if (depth > 20) throw new Error('Struktur dokumen terlalu dalam.');
    return nodes.flatMap(node => {
      if (++count > 100000) throw new Error('Dokumen terlalu besar.');
      if (node.type === 'hardBreak') return [new TextRun({ break: 1 })];
      if (node.type === 'writingTab') return [new TextRun({ children: [new Tab()] })];
      if (node.type === 'numberLabel') return [new TextRun({ text: String(node.attrs?.label || '') }), new TextRun({ children: [new Tab()] })];
      if (node.type === 'writingMath') {
        const xml = String(node.attrs?.omml || '');
        if (xml.length > 100000 || !/^<m:oMath(?:Para)?\b/.test(xml) || /<!|<\?|<(?!\/?(?:m|w):)/.test(xml)) return [];
        return [ImportedXmlComponent.fromXmlString(xml)];
      }
      if (node.type === 'image') {
        const match = /^data:image\/(png|jpeg);base64,([A-Za-z0-9+/=]+)$/.exec(node.attrs?.src || '');
        if (!match || match[2].length > 1000000) return [];
        const rawWidth = Math.max(20, Number(node.attrs?.width) || 400);
        const rawHeight = Math.max(20, Number(node.attrs?.height) || 250);
        const scale = Math.min(1, 480 / rawWidth, 640 / rawHeight);
        return [new ImageRun({ data: Buffer.from(match[2], 'base64'), type: match[1] === 'jpeg' ? 'jpg' : 'png', transformation: { width: rawWidth * scale, height: rawHeight * scale } })];
      }
      if (node.type !== 'text') return [];
      const marks = new Set((node.marks || []).map(mark => mark.type));
      const textStyle = node.marks?.find(mark => mark.type === 'writingTextStyle')?.attrs || {};
      const color = value => {
        if (/^#[a-f\d]{6}$/i.test(value || '')) return value.slice(1);
        const rgb = /^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/.exec(value || '');
        return rgb ? rgb.slice(1).map(v => Math.min(255, Number(v)).toString(16).padStart(2, '0')).join('') : undefined;
      };
      return [new TextRun({ text: String(node.text || ''), bold: marks.has('bold'), italics: marks.has('italic'),
        underline: marks.has('underline') ? {} : undefined, strike: marks.has('strike'),
        font: ['Times New Roman', 'Arial', 'Calibri', 'Cambria', 'Georgia', 'Verdana'].includes(textStyle.fontFamily) ? textStyle.fontFamily : undefined,
        size: textStyle.fontSize ? Math.min(72, Math.max(8, Number(textStyle.fontSize) || 12)) * 2 : undefined,
        color: color(textStyle.color), shading: color(textStyle.highlight) ? { fill: color(textStyle.highlight) } : undefined,
      })];
    });
  }
  const children = [];
  let listId = 0;
  const lists = [];
  function blocks(nodes = [], depth = 0, list = null, output = children) {
    if (depth > 20) throw new Error('Struktur dokumen terlalu dalam.');
    for (const node of nodes) {
      if (++count > 100000) throw new Error('Dokumen terlalu besar.');
      if (node.type === 'bulletList' || node.type === 'orderedList') {
        const reference = `list-${++listId}`;
        lists.push({ reference, levels: [{ level: 0, format: node.type === 'bulletList' ? LevelFormat.BULLET : LevelFormat.DECIMAL,
          text: node.type === 'bulletList' ? '•' : '%1.', start: node.attrs?.start || 1,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] });
        blocks(node.content, depth + 1, reference, output);
      } else if (node.type === 'listItem') {
        blocks(node.content, depth + 1, list, output);
      } else if (node.type === 'paragraph' || node.type === 'heading') {
        const cm = value => Math.round(Math.min(13, Math.max(-13, Number(value) || 0)) * 567);
        const firstLine = cm(node.attrs?.firstLine);
        const paragraph = new Paragraph({
          children: inline(node.content),
          heading: node.type === 'heading' ? [HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3][Math.min(3, Math.max(1, node.attrs?.level || 1)) - 1] : undefined,
          alignment: { left: AlignmentType.LEFT, center: AlignmentType.CENTER, right: AlignmentType.RIGHT, justify: AlignmentType.JUSTIFIED }[node.attrs?.textAlign] || AlignmentType.LEFT,
          numbering: list ? { reference: list, level: 0 } : undefined,
          tabStops: node.content?.some(child => child.type === 'numberLabel') ? [{ type: 'left', position: Math.max(0, cm(node.attrs?.indentLeft)) || 709 }] : undefined,
          indent: { left: Math.max(0, cm(node.attrs?.indentLeft)), right: Math.max(0, cm(node.attrs?.indentRight)), ...(firstLine < 0 ? { hanging: -firstLine } : { firstLine }) },
          spacing: {
            line: Math.round(Math.min(3, Math.max(1, Number(node.attrs?.lineSpacing) || 1.5)) * 240),
            before: node.attrs?.spaceBefore == null ? (node.type === 'heading' ? ({ 1: 360, 2: 300, 3: 240 }[node.attrs?.level] || 360) : 0) : Math.round(Math.min(120, Math.max(0, Number(node.attrs.spaceBefore) || 0)) * 20),
            after: node.attrs?.spaceAfter == null ? (node.type === 'heading' && node.attrs?.level === 1 ? 240 : node.type === 'heading' && node.attrs?.level === 3 ? 150 : 180) : Math.round(Math.min(120, Math.max(0, Number(node.attrs.spaceAfter) || 0)) * 20),
          },
        });
        if (node.attrs?.bottomFrame) paragraph.properties.push(ImportedXmlComponent.fromXmlString('<w:framePr w:w="7937" w:hSpace="0" w:wrap="notBeside" w:vAnchor="margin" w:hAnchor="margin" w:xAlign="center" w:yAlign="bottom"/>'));
        output.push(paragraph);
        list = null;
      } else if (node.type === 'image') {
        output.push(new Paragraph({ children: inline([node]) }));
      } else if (node.type === 'pageBreak') {
        for (let i = 0; i < Math.min(10, Math.max(1, Number(node.attrs?.count) || 1)); i++) output.push(new Paragraph({ children: [new PageBreak()] }));
      } else if (node.type === 'table') {
        const rows = (node.content || []).slice(0, 500).map(row => new TableRow({ children: (row.content || []).slice(0, 50).map(cell => {
          const cellChildren = [];
          blocks(cell.content, depth + 1, null, cellChildren);
          return new TableCell({ children: cellChildren.length ? cellChildren : [new Paragraph('')], columnSpan: Math.min(50, Math.max(1, Number(cell.attrs?.colspan) || 1)), rowSpan: Math.min(500, Math.max(1, Number(cell.attrs?.rowspan) || 1)) });
        }) }));
        if (rows.length) output.push(new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE } }));
      } else if (node.type === 'horizontalRule') {
        output.push(new Paragraph({ text: '────────────────────' }));
      } else if (node.content) blocks(node.content, depth + 1, null, output);
    }
  }
  blocks(content.content);
  const document = new Document({
    styles: { default: { document: { run: { font: 'Times New Roman', size: 24 } } } },
    numbering: { config: lists },
    sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1701, right: 1701, bottom: 1701, left: 2268 } } }, children: children.length ? children : [new Paragraph('')] }],
  });
  return Packer.toBuffer(document);
}
