import { Extension, Mark, Node } from '@tiptap/core';
import Image from '@tiptap/extension-image';
import { Plugin } from '@tiptap/pm/state';

export const WRITING_FONTS = ['Times New Roman', 'Arial', 'Calibri', 'Cambria', 'Georgia', 'Verdana'];
const safeColor = value => /^(#[a-f\d]{6}|rgba?\([\d\s.,%]+\))$/i.test(value || '') ? value : null;
const parseIndent = value => {
  const match = /^(-?[\d.]+)(cm|mm|in|pt|px|%)?$/.exec(String(value || '').trim());
  if (!match) return 0;
  const amount = Number(match[1]);
  return ({ cm: amount, mm: amount / 10, in: amount * 2.54, pt: amount / 28.3465, px: amount / 37.7953, '%': amount * 0.14 })[match[2]] ?? amount;
};
export const WritingTextStyle = Mark.create({
  name: 'writingTextStyle',
  addAttributes() {
    return {
      fontFamily: { default: null, parseHTML: element => WRITING_FONTS.find(font => element.style.fontFamily.replace(/["']/g, '') === font) || null },
      fontSize: { default: null, parseHTML: element => element.style.fontSize.endsWith('pt') ? Math.min(72, Math.max(8, parseFloat(element.style.fontSize))) : null },
      color: { default: null, parseHTML: element => safeColor(element.style.color) },
      highlight: { default: null, parseHTML: element => safeColor(element.style.backgroundColor) },
    };
  },
  parseHTML: () => [{ tag: 'span[style]' }],
  renderHTML({ HTMLAttributes: attrs }) {
    const styles = [];
    if (WRITING_FONTS.includes(attrs.fontFamily)) styles.push(`font-family:${attrs.fontFamily}`);
    if (attrs.fontSize) styles.push(`font-size:${Math.min(72, Math.max(8, Number(attrs.fontSize) || 12))}pt`);
    if (safeColor(attrs.color)) styles.push(`color:${attrs.color}`);
    if (safeColor(attrs.highlight)) styles.push(`background-color:${attrs.highlight}`);
    return ['span', { style: styles.join(';') }, 0];
  },
});

export const WritingImage = Image.extend({
  inline: true,
  group: 'inline',
  addAttributes() {
    return {
      ...this.parent?.(),
      width: { default: null, parseHTML: element => Number(element.getAttribute('width')) || Number.parseFloat(element.style.width) || null, renderHTML: attrs => attrs.width ? { width: attrs.width } : {} },
      height: { default: null, parseHTML: element => Number(element.getAttribute('height')) || Number.parseFloat(element.style.height) || null, renderHTML: attrs => attrs.height ? { height: attrs.height } : {} },
    };
  },
});

export const WritingTab = Node.create({
  name: 'writingTab', inline: true, group: 'inline', atom: true,
  parseHTML: () => [{ tag: 'span[data-writing-tab]' }],
  renderHTML: () => ['span', { 'data-writing-tab': '1', class: 'writing-tab' }, '\t'],
});

export const NumberLabel = Node.create({
  name: 'numberLabel', inline: true, group: 'inline', atom: true,
  addAttributes: () => ({
    label: { default: '', parseHTML: el => el.dataset.numberLabel },
    width: { default: 1.25, parseHTML: el => Number(el.dataset.numberWidth) || 1.25 },
  }),
  parseHTML: () => [{ tag: 'span[data-number-label]' }],
  renderHTML: ({ node }) => ['span', { 'data-number-label': node.attrs.label, 'data-number-width': node.attrs.width, class: 'writing-number-label', style: `width:${Math.min(10, Math.max(0.2, Number(node.attrs.width) || 1.25))}cm;text-indent:0;display:inline-block` }, node.attrs.label],
});

export const WritingMath = Node.create({
  name: 'writingMath', inline: true, group: 'inline', atom: true,
  addAttributes: () => ({
    mathml: { default: '', parseHTML: el => el.dataset.writingMath },
    omml: { default: '', parseHTML: el => el.dataset.omml },
  }),
  parseHTML: () => [{ tag: 'span[data-writing-math]' }],
  renderHTML: ({ node }) => ['span', { 'data-writing-math': node.attrs.mathml, 'data-omml': node.attrs.omml, class: 'writing-math' }],
  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement('span');
      dom.className = 'writing-math';
      dom.contentEditable = 'false';
      const parsed = new DOMParser().parseFromString(node.attrs.mathml, 'application/xml');
      const allowed = new Set('math mrow mi mn mo mtext mfrac msqrt mroot msub msup msubsup munder mover munderover mtable mtr mtd mspace menclose mpadded mphantom'.split(' '));
      const copy = element => {
        if (element.nodeType === 3) return document.createTextNode(element.textContent);
        if (!allowed.has(element.localName)) return document.createTextNode(element.textContent || '');
        const out = document.createElementNS('http://www.w3.org/1998/Math/MathML', element.localName);
        for (const attr of element.attributes) if (['display', 'mathvariant', 'stretchy', 'fence', 'accent', 'notation'].includes(attr.name)) out.setAttribute(attr.name, attr.value);
        for (const child of element.childNodes) out.append(copy(child));
        return out;
      };
      dom.append(copy(parsed.documentElement));
      return { dom };
    };
  },
});

export const ParagraphLayout = Extension.create({
  name: 'paragraphLayout',
  addProseMirrorPlugins() {
    return [new Plugin({
      appendTransaction(transactions, oldState, state) {
        if (!transactions.some(transaction => transaction.docChanged)) return null;
        const title = state.schema.marks.tocTitle;
        if (!title) return null;
        const tr = state.tr;
        state.doc.descendants((node, pos) => {
          if (node.attrs.documentRole !== 'tocEntry') return;
          node.forEach((child, offset) => {
            if (!child.isText) return;
            const from = pos + 1 + offset;
            const page = child.marks.some(mark => mark.type.name === 'tocPageNumber');
            const hasTitle = title.isInSet(child.marks);
            if (page && hasTitle) tr.removeMark(from, from + child.nodeSize, title);
            if (!page && !hasTitle) tr.addMark(from, from + child.nodeSize, title.create());
          });
          return false;
        });
        return tr.docChanged ? tr : null;
      },
    })];
  },
  addGlobalAttributes() {
    return [{ types: ['paragraph', 'heading'], attributes: {
      bottomFrame: { default: false, parseHTML: element => element.dataset.bottomFrame === 'true',
        renderHTML: attrs => attrs.bottomFrame ? { 'data-bottom-frame': 'true' } : {} },
      documentRole: { default: null,
        parseHTML: element => element.classList.contains('toc-entry') ? 'tocEntry' : null,
        renderHTML: attrs => attrs.documentRole === 'tocEntry' ? { class: 'toc-entry' } : {} },
      importHeading: { default: false,
        parseHTML: element => element.classList.contains('import-heading'),
        renderHTML: attrs => attrs.importHeading ? { class: 'import-heading' } : {} },
      coverImage: { default: false,
        parseHTML: element => element.classList.contains('import-cover-image'),
        renderHTML: attrs => attrs.coverImage ? { class: 'import-cover-image' } : {} },
      spaceBefore: { default: null,
        parseHTML: element => element.hasAttribute('data-space-before') ? Number(element.dataset.spaceBefore) || 0 : null,
        renderHTML: attrs => attrs.spaceBefore === null ? {} : { style: `margin-top:${Math.min(120, Math.max(0, Number(attrs.spaceBefore) || 0))}pt` } },
      spaceAfter: { default: null,
        parseHTML: element => element.hasAttribute('data-space-after') ? Number(element.dataset.spaceAfter) || 0 : null,
        renderHTML: attrs => attrs.spaceAfter === null ? {} : { style: `margin-bottom:${Math.min(120, Math.max(0, Number(attrs.spaceAfter) || 0))}pt` } },
      lineSpacing: { default: null,
        parseHTML: element => Number(element.dataset.lineSpacing) || null,
        renderHTML: attrs => attrs.lineSpacing === null ? {} : { style: `line-height:${Math.min(3, Math.max(1, Number(attrs.lineSpacing) || 1.5))}` } },
      indentLeft: { default: 0, parseHTML: element => parseIndent(element.style.marginLeft),
        renderHTML: attrs => ({ style: `margin-left:${(Number(attrs.indentLeft) || 0) / 14 * 100}%` }) },
      indentRight: { default: 0, parseHTML: element => parseIndent(element.style.marginRight),
        renderHTML: attrs => ({ style: `margin-right:${(Number(attrs.indentRight) || 0) / 14 * 100}%` }) },
      firstLine: { default: 0, parseHTML: element => parseIndent(element.style.textIndent),
        renderHTML: attrs => ({ style: `text-indent:${(Number(attrs.firstLine) || 0) / 14 * 100}%` }) },
    } }];
  },
});

export const PageBreak = Node.create({
  name: 'pageBreak', group: 'block', atom: true,
  parseHTML: () => [
    { tag: 'div[data-page-break]' },
    { tag: 'div[data-page-break-before]', getAttrs: element => ({ count: Math.min(10, Math.max(1, Number(element.dataset.pageBreakBefore) || 1)) }) },
  ],
  addAttributes() { return { count: { default: 1 } }; },
  renderHTML: ({ node }) => ['div', { 'data-page-break': '', 'data-page-break-before': String(node.attrs.count || 1), class: 'writing-page-break', contenteditable: 'false' }, 'Pemisah halaman'],
});

export const WritingTocLeader = Node.create({
  name: 'writingTocLeader', inline: true, group: 'inline', atom: true,
  parseHTML: () => [{ tag: 'span.toc-leader' }],
  renderHTML: () => ['span', { class: 'toc-leader', 'aria-hidden': 'true' }],
  addNodeView() {
    return () => {
      const dom = document.createElement('span');
      dom.className = 'toc-leader';
      dom.setAttribute('aria-hidden', 'true');
      dom.contentEditable = 'false';
      return { dom };
    };
  },
});

export const TocTitle = Mark.create({
  name: 'tocTitle',
  priority: 1100,
  inclusive: false,
  parseHTML: () => [{ tag: 'span.toc-title' }],
  renderHTML: () => ['span', { class: 'toc-title' }, 0],
});

export const TocPageNumber = Mark.create({
  name: 'tocPageNumber',
  priority: 1101,
  inclusive: false,
  spanning: false,
  parseHTML: () => [{ tag: 'span.toc-page-number' }],
  renderHTML: () => ['span', { class: 'toc-page-number' }, 0],
});
