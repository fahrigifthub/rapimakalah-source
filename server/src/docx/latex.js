import { escapeXml } from './xml.js';

const GREEK = {
  alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ε', varepsilon: 'ε', zeta: 'ζ', eta: 'η', theta: 'θ', vartheta: 'ϑ',
  iota: 'ι', kappa: 'κ', lambda: 'λ', mu: 'μ', nu: 'ν', xi: 'ξ', pi: 'π', rho: 'ρ', sigma: 'σ', tau: 'τ', phi: 'φ', varphi: 'φ',
  chi: 'χ', psi: 'ψ', omega: 'ω', Gamma: 'Γ', Delta: 'Δ', Theta: 'Θ', Lambda: 'Λ', Xi: 'Ξ', Pi: 'Π', Sigma: 'Σ', Phi: 'Φ', Psi: 'Ψ', Omega: 'Ω',
};
const SYMBOLS = {
  approx: '≈', times: '×', cdot: '·', pm: '±', mp: '∓', leq: '≤', le: '≤', geq: '≥', ge: '≥', neq: '≠', ne: '≠', infty: '∞',
  to: '→', rightarrow: '→', leftarrow: '←', Rightarrow: '⇒', Leftrightarrow: '⇔', sim: '∼', propto: '∝', partial: '∂', nabla: '∇',
  circ: '°', degree: '°', ldots: '…', dots: '…', cdots: '⋯', div: '÷', ll: '≪', gg: '≫', equiv: '≡', angle: '∠', sum: '∑', prod: '∏',
  int: '∫', perp: '⊥', parallel: '∥',
};
const FUNCS = new Set(['sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'arcsin', 'arccos', 'arctan', 'sinh', 'cosh', 'tanh', 'log', 'ln', 'lg', 'exp', 'lim', 'min', 'max', 'det']);
const TEXT_CMDS = new Set(['text', 'mathrm', 'textrm', 'mbox', 'operatorname', 'mathit', 'textit', 'textbf', 'mathbf']);

const run = (text, kind = 'math') => {
  const rpr = kind === 'upright' ? '<m:rPr><m:sty m:val="p"/></m:rPr>' : kind === 'text' ? '<m:rPr><m:nor/></m:rPr>' : '';
  return `<m:r>${rpr}<m:t xml:space="preserve">${escapeXml(text)}</m:t></m:r>`;
};
const el = (name, inner) => `<m:${name}>${inner}</m:${name}>`;
const arg = (name, xml) => `<m:${name}>${xml || run('')}</m:${name}>`;

class Parser {
  constructor(src) {
    this.s = src;
    this.i = 0;
  }

  ws() {
    while (/\s/.test(this.s[this.i] || '')) this.i += 1;
  }

  peekCmd() {
    const m = /^\\([A-Za-z]+)/.exec(this.s.slice(this.i, this.i + 24));
    return m ? m[1] : null;
  }

  seq(untilBrace) {
    let out = '';
    for (;;) {
      this.ws();
      if (this.i >= this.s.length) break;
      if (untilBrace && this.s[this.i] === '}') break;
      if (this.peekCmd() === 'right') break;
      out += this.scripted();
    }
    return out;
  }

  scripted() {
    const base = this.atom();
    let sub = null;
    let sup = null;
    for (;;) {
      this.ws();
      const c = this.s[this.i];
      if (c === '_' && sub === null) { this.i += 1; sub = this.operand(); } else if (c === '^' && sup === null) { this.i += 1; sup = this.operand(); } else break;
    }
    const e = arg('e', base);
    if (sub !== null && sup !== null) return el('sSubSup', `${e}${arg('sub', sub)}${arg('sup', sup)}`);
    if (sub !== null) return el('sSub', `${e}${arg('sub', sub)}`);
    if (sup !== null) return el('sSup', `${e}${arg('sup', sup)}`);
    return base;
  }

  operand() {
    this.ws();
    if (this.s[this.i] === '{') return this.group();
    return this.atom();
  }

  group() {
    this.i += 1;
    const inner = this.seq(true);
    if (this.s[this.i] === '}') this.i += 1;
    return inner;
  }

  rawGroup() {
    this.ws();
    if (this.s[this.i] !== '{') return '';
    let depth = 0;
    let j = this.i;
    for (; j < this.s.length; j += 1) {
      if (this.s[j] === '{') depth += 1;
      else if (this.s[j] === '}') { depth -= 1; if (!depth) break; }
    }
    const text = this.s.slice(this.i + 1, j);
    this.i = j + 1;
    return text;
  }

  atom() {
    const c = this.s[this.i];
    if (c === '{') return this.group();
    if (c !== '\\') {
      this.i += 1;
      if (/\d/.test(c)) {
        let d = c;
        while (/[\d.]/.test(this.s[this.i] || '') && !(this.s[this.i] === '.' && !/\d/.test(this.s[this.i + 1] || ''))) { d += this.s[this.i]; this.i += 1; }
        return run(d);
      }
      if (c === '<' || c === '>' || c === '=' || c === '+' || c === '-' || c === '(' || c === ')') return run(c === '-' ? '−' : c, 'upright');
      return run(c);
    }
    return this.command();
  }
}

export { Parser, run, el, arg, GREEK, SYMBOLS, FUNCS, TEXT_CMDS };
