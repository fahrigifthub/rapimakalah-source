import { escapeXml } from './xml.js';

function parse(xml) {
  const root = { name: 'root', attrs: '', children: [] };
  const stack = [root];
  const re = /<(\/?)(m:[A-Za-z]+|w:[A-Za-z]+)([^>]*?)(\/?)>|([^<]+)/g;
  let m;
  while ((m = re.exec(xml))) {
    const top = stack[stack.length - 1];
    if (m[5] !== undefined) {
      top.children.push({ text: m[5] });
    } else if (m[1]) {
      if (stack.length > 1) stack.pop();
    } else {
      const node = { name: m[2], attrs: m[3] || '', children: [] };
      top.children.push(node);
      if (!m[4]) stack.push(node);
    }
  }
  return root;
}

const unescape = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
const esc = (s) => escapeXml(unescape(s));
const child = (node, name) => node.children.find((c) => c.name === name);
const attr = (node, name) => new RegExp(`${name}="([^"]*)"`).exec(node?.attrs || '')?.[1];
const textOf = (node) => node.children.map((c) => (c.text !== undefined ? c.text : c.name === 'm:t' || c.name === 'w:t' ? textOf(c) : '')).join('');

function runToMathml(node) {
  const props = child(node, 'm:rPr');
  const plain = Boolean(child(props || { children: [] }, 'm:nor')) || attr(child(props || { children: [] }, 'm:sty'), 'm:val') === 'p';
  const isText = Boolean(child(props || { children: [] }, 'm:nor'));
  const text = unescape(node.children.filter((c) => c.name === 'm:t').map(textOf).join(''));
  if (isText) return `<mtext>${esc(text).replace(/ /g, '&#160;')}</mtext>`;
  const out = [];
  const tokens = text.match(/\d+(?:\.\d+)?|[A-Za-z\u0370-\u03FF\u00B0]+|\s+|[\s\S]/gu) || [];
  for (const t of tokens) {
    if (/^\s+$/.test(t)) continue;
    if (/^\d/.test(t)) out.push(`<mn>${t}</mn>`);
    else if (/^[A-Za-z\u0370-\u03FF]+$/.test(t)) {
      if (plain) out.push(`<mi mathvariant="normal">${esc(t)}</mi>`);
      else for (const ch of t) out.push(`<mi>${esc(ch)}</mi>`);
    } else out.push(`<mo>${esc(t)}</mo>`);
  }
  return out.join('');
}

function kids(node) {
  return (node?.children || []).map(convert).join('');
}

const row = (node) => `<mrow>${kids(node)}</mrow>`;

function convert(node) {
  if (node.text !== undefined) return '';
  const part = (name) => row(child(node, name) || { children: [] });
  switch (node.name) {
    case 'm:r':
      return runToMathml(node);
    case 'm:f':
      return `<mfrac>${part('m:num')}${part('m:den')}</mfrac>`;
    case 'm:rad': {
      const hidden = attr(child(child(node, 'm:radPr') || { children: [] }, 'm:degHide'), 'm:val');
      return hidden === '1' || hidden === 'true' || !child(node, 'm:deg')?.children.length
        ? `<msqrt>${part('m:e')}</msqrt>`
        : `<mroot>${part('m:e')}${part('m:deg')}</mroot>`;
    }
    case 'm:sSub':
      return `<msub>${part('m:e')}${part('m:sub')}</msub>`;
    case 'm:sSup':
      return `<msup>${part('m:e')}${part('m:sup')}</msup>`;
    case 'm:sSubSup':
      return `<msubsup>${part('m:e')}${part('m:sub')}${part('m:sup')}</msubsup>`;
    case 'm:d': {
      const pr = child(node, 'm:dPr');
      const open = attr(child(pr || { children: [] }, 'm:begChr'), 'm:val') ?? '(';
      const close = attr(child(pr || { children: [] }, 'm:endChr'), 'm:val') ?? ')';
      return `<mrow>${open ? `<mo>${esc(open)}</mo>` : ''}${part('m:e')}${close ? `<mo>${esc(close)}</mo>` : ''}</mrow>`;
    }
    case 'm:bar':
      return `<mover>${part('m:e')}<mo>&#8254;</mo></mover>`;
    case 'm:acc': {
      const chr = attr(child(child(node, 'm:accPr') || { children: [] }, 'm:chr'), 'm:val') || '^';
      return `<mover accent="true">${part('m:e')}<mo>${esc(chr)}</mo></mover>`;
    }
    case 'm:rPr':
    case 'm:radPr':
    case 'm:dPr':
    case 'm:barPr':
    case 'm:accPr':
    case 'm:ctrlPr':
      return '';
    default:
      return row(node);
  }
}

/** OMML (m:oMath / m:oMathPara) to a MathML string the browser can render. */
export function ommlToMathml(ommlXml) {
  const display = /^<m:oMathPara\b/.test(ommlXml);
  const tree = parse(ommlXml);
  const body = kids(tree.children[0] ? { children: [tree.children[0]] } : { children: [] });
  return `<math xmlns="http://www.w3.org/1998/Math/MathML"${display ? ' display="block"' : ''}>${body}</math>`;
}
