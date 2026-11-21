export function updateToc(editor) {
  const rows = [], headings = [];
  let insideToc = false;
  const sheet = editor.view.dom.closest('.writing-sheet-frame');
  const height = parseFloat(sheet?.style.getPropertyValue('--writing-page-height'));
  const stride = parseFloat(sheet?.style.getPropertyValue('--writing-page-stride'));
  if (!height || !stride) throw new Error('Tunggu halaman selesai ditata, lalu coba lagi dalam mode Edit.');
  const origin = editor.view.dom.getBoundingClientRect().top;
  const scale = editor.view.dom.getBoundingClientRect().width / editor.view.dom.offsetWidth || 1;
  editor.state.doc.forEach((node, pos) => {
    if (node.attrs.documentRole === 'tocEntry') {
      insideToc = true;
      rows.push({ node, pos });
      return;
    }
    if (node.type.name === 'pageBreak') {
      insideToc = false;
      return;
    }
    if (insideToc && node.type.name === 'heading' && /daftar\s+isi/i.test(node.textContent)) return;
    if (node.type.name !== 'heading') {
      if (insideToc && node.isTextblock && node.textContent.trim()) insideToc = false;
      return;
    }
    if (node.attrs.documentRole === 'tocEntry') return;
    let label = '';
    node.forEach(child => { label += child.type.name === 'numberLabel' ? `${child.attrs.label} ` : child.type.name === 'hardBreak' ? ' ' : child.textContent; });
    label = label.trim();
    if (!label || /^daftar\s+isi$/i.test(label)) return;
    const dom = editor.view.nodeDOM(pos);
    const page = Math.max(1, Math.floor(((dom.getBoundingClientRect().top - origin) / scale + 1) / stride) + 1);
    headings.push({ label, page, level: node.attrs.level });
  });
  if (!rows.length) throw new Error('Daftar isi belum tersedia. Impor dokumen yang memiliki daftar isi terlebih dahulu.');
  if (!headings.length) throw new Error('Tidak ada judul Heading 1–3 yang bisa dimasukkan ke daftar isi.');
  const content = headings.map(({ label, page, level }) => {
    const marks = level === 1 ? [{ type: 'bold' }] : [];
    return editor.schema.nodeFromJSON({ type: 'paragraph', attrs: { documentRole: 'tocEntry', textAlign: 'left', indentLeft: (level - 1) * .75, spaceBefore: 0, spaceAfter: 0, lineSpacing: 1.5 }, content: [
      { type: 'text', text: label, marks: [{ type: 'tocTitle' }, ...marks] },
      { type: 'writingTocLeader' },
      { type: 'text', text: String(page), marks: [...marks, { type: 'tocPageNumber' }] },
    ] });
  });
  const first = rows[0], last = rows.at(-1);
  const from = first.pos;
  const to = last.pos + last.node.nodeSize;
  let transaction = editor.state.tr;
  for (const row of rows.slice(1).reverse()) transaction = transaction.delete(row.pos, row.pos + row.node.nodeSize);
  const currentFirst = transaction.doc.nodeAt(from);
  if (!currentFirst || currentFirst.attrs.documentRole !== 'tocEntry') throw new Error('Daftar isi berubah saat diperbarui. Coba klik lagi.');
  transaction = transaction.replaceWith(from, from + currentFirst.nodeSize, content);
  editor.view.dispatch(transaction);
  editor.commands.focus();
  return headings.length;
}
