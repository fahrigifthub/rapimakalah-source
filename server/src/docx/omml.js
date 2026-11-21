import { Parser, run, el, arg, GREEK, SYMBOLS, FUNCS, TEXT_CMDS } from './latex.js';

const DELIMS = { '(': '(', ')': ')', '[': '[', ']': ']', '|': '|', '.': '', '\\{': '{', '\\}': '}', '\\|': '‖', '\\langle': '⟨', '\\rangle': '⟩' };

Parser.prototype.delim = function delim() {
  this.ws();
  const m = /^(\\[A-Za-z]+|\\.|.)/s.exec(this.s.slice(this.i));
  if (!m) return '';
  this.i += m[0].length;
  return DELIMS[m[0]] ?? m[0];
};

Parser.prototype.command = function command() {
  const m = /^\\([A-Za-z]+|.)/s.exec(this.s.slice(this.i));
  if (!m) { this.i += 1; return ''; }
  const name = m[1];
  this.i += m[0].length;
  if (GREEK[name]) return run(GREEK[name]);
  if (SYMBOLS[name]) return run(SYMBOLS[name], 'upright');
  if (TEXT_CMDS.has(name)) return run(this.rawGroup(), 'text');
  if (FUNCS.has(name)) return run(name, 'upright');
  if (name === 'frac' || name === 'dfrac' || name === 'tfrac') {
    const num = this.operand();
    const den = this.operand();
    return el('f', `${arg('num', num)}${arg('den', den)}`);
  }
  if (name === 'sqrt') {
    this.ws();
    let deg = '';
    if (this.s[this.i] === '[') {
      const end = this.s.indexOf(']', this.i);
      deg = new Parser(this.s.slice(this.i + 1, end)).seq(false);
      this.i = end + 1;
    }
    const body = this.operand();
    const pr = deg ? '' : '<m:radPr><m:degHide m:val="1"/></m:radPr>';
    return el('rad', `${pr}${arg('deg', deg)}${arg('e', body)}`);
  }
  if (name === 'left') {
    const open = this.delim();
    const inner = this.seq(false);
    let close = '';
    if (this.peekCmd() === 'right') { this.i += 6; close = this.delim(); }
    return el('d', `<m:dPr><m:begChr m:val="${open}"/><m:endChr m:val="${close}"/></m:dPr>${arg('e', inner)}`);
  }
  if (name === 'overline' || name === 'bar') return el('bar', `<m:barPr><m:pos m:val="top"/></m:barPr>${arg('e', this.operand())}`);
  if (name === 'hat' || name === 'vec') return el('acc', `<m:accPr><m:chr m:val="${name === 'hat' ? '^' : '→'}"/></m:accPr>${arg('e', this.operand())}`);
  if (name === ',' || name === ';' || name === ' ' || name === 'quad' || name === 'qquad') return run(' ');
  if (name === '!') return '';
  if (name === '%' || name === '$' || name === '&' || name === '#' || name === '_' || name === '{' || name === '}') return run(name);
  return run(name);
};

export function latexToOmml(src, display = false) {
  const body = new Parser(src).seq(false);
  if (display) return `<m:oMathPara><m:oMath>${body}</m:oMath></m:oMathPara>`;
  return `<m:oMath>${body}</m:oMath>`;
}

/** Split text into plain / inline-math / display-math segments. */
export function splitMath(text) {
  const parts = [];
  const re = /\$\$([\s\S]+?)\$\$|(?<![\\$])\$(?!\s)([^$\n]+?)(?<!\s)\$(?!\d)/g;
  let last = 0;
  let m;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push({ type: 'text', value: text.slice(last, m.index) });
    parts.push(m[1] !== undefined ? { type: 'display', value: m[1].trim() } : { type: 'inline', value: m[2] });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ type: 'text', value: text.slice(last) });
  return parts;
}
