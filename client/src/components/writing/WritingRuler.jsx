import { useRef, useState } from 'react';

const WIDTH = 14;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const round = value => Math.round(value * 10) / 10;

export function WritingRuler({ editor }) {
  const track = useRef(null);
  const drag = useRef(null);
  const [indicator, setIndicator] = useState(null);
  const type = editor.isActive('heading') ? 'heading' : 'paragraph';
  const attrs = editor.getAttributes(type);
  const left = Number(attrs.indentLeft) || 0;
  const right = Number(attrs.indentRight) || 0;
  const first = Number(attrs.firstLine) || 0;
  const absoluteFirst = left + first;
  const end = WIDTH - right;

  // Word: bottom square moves both markers; hanging triangle preserves first line.
  function apply(kind, target, initial = { left, first, right, type }) {
    const boundary = WIDTH - initial.right;
    let changes;
    if (kind === 'left') {
      const value = round(clamp(target, Math.max(0, -initial.first), boundary - Math.max(0, initial.first) - 1));
      changes = { indentLeft: value };
    } else if (kind === 'hanging') {
      const value = round(clamp(target, 0, boundary - 1));
      changes = { indentLeft: value, firstLine: round(initial.left + initial.first - value) };
    } else if (kind === 'first') {
      changes = { firstLine: round(clamp(target, 0, boundary - 1) - initial.left) };
    } else {
      changes = { indentRight: round(WIDTH - clamp(target, Math.max(initial.left, initial.left + initial.first) + 1, WIDTH)) };
    }
    const chain = editor.chain();
    if (initial.selection) chain.setTextSelection(initial.selection);
    chain.updateAttributes(initial.type, changes).run();
    return kind === 'right' ? WIDTH - changes.indentRight : kind === 'first' ? initial.left + changes.firstLine : changes.indentLeft;
  }
  const handles = [
    { kind: 'first', label: 'Indent baris pertama', position: absoluteFirst, min: 0, max: end - 1 },
    { kind: 'hanging', label: 'Hanging indent', position: left, min: 0, max: end - 1 },
    { kind: 'left', label: 'Indent kiri', position: left, min: Math.max(0, -first), max: end - Math.max(0, first) - 1 },
    { kind: 'right', label: 'Batas kanan paragraf', position: end, min: Math.max(left, absoluteFirst) + 1, max: WIDTH },
  ];
  function start(event, handle) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { left, first, right, type, selection: { from: editor.state.selection.from, to: editor.state.selection.to } };
    setIndicator({ label: handle.label, position: handle.position });
  }
  function move(event, handle) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId) || !drag.current) return;
    const rect = track.current.getBoundingClientRect();
    const target = (event.clientX - rect.left) / rect.width * 21 - 4;
    const position = apply(handle.kind, target, drag.current);
    setIndicator({ label: handle.label, position });
  }
  function finish(event) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    drag.current = null;
    setIndicator(null);
  }
  return <div className="writing-ruler-wrap">
    <div ref={track} className="writing-ruler" aria-label="Penggaris Word dalam sentimeter">
      <span className="writing-ruler-text-area" aria-hidden="true" />
      {Array.from({ length: 85 }, (_, index) => {
        const cm = index / 4 - 4;
        return <span key={index} aria-hidden="true" className={`writing-ruler-tick ${index % 4 === 0 ? 'whole' : index % 2 === 0 ? 'half' : 'quarter'}`} style={{ left: `${index / 84 * 100}%` }}>
          {index % 4 === 0 && cm !== 0 && index > 0 && index < 84 ? <span>{Math.abs(cm)}</span> : null}
        </span>;
      })}
      {handles.map(handle => <button key={handle.kind} type="button" role="slider" aria-label={handle.label}
        aria-valuemin={handle.min} aria-valuemax={handle.max} aria-valuenow={round(handle.position)} aria-valuetext={`${round(handle.position)} cm dari awal area teks`} title={`${handle.label}: ${round(handle.position)} cm`}
        className={`writing-ruler-handle marker-${handle.kind}`} style={{ left: `${(handle.position + 4) / 21 * 100}%` }}
        onPointerDown={event => start(event, handle)} onPointerMove={event => move(event, handle)} onPointerUp={finish} onPointerCancel={finish}
        onKeyDown={event => {
          if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
          event.preventDefault();
          apply(handle.kind, event.key === 'Home' ? handle.min : event.key === 'End' ? handle.max : handle.position + (event.key === 'ArrowRight' ? .1 : -.1));
        }}><span aria-hidden="true" /></button>)}
      {indicator && <>
        <span className="writing-ruler-drag-line" style={{ left: `${(indicator.position + 4) / 21 * 100}%` }} aria-hidden="true" />
        <output className="writing-ruler-tooltip">{indicator.label} · {round(indicator.position)} cm</output>
      </>}
    </div>
    <details className="writing-ruler-settings">
      <summary>Indentasi paragraf <span>cm</span></summary>
      <div className="writing-indent-fields">
        {[['left', 'Kiri', left], ['right', 'Kanan', right], ['first', 'Baris pertama', first]].map(([kind, label, value]) => <label key={kind}>{label}
          <input type="number" aria-label={`${label} dalam cm`} step="0.1" value={round(value)} min={kind === 'first' ? -left : 0} max={WIDTH - 1}
            onChange={event => { const value = Number(event.target.value) || 0; apply(kind, kind === 'right' ? WIDTH - value : kind === 'first' ? left + value : value); }} />
        </label>)}
        <p>Segitiga atas: baris pertama. Segitiga bawah: hanging indent. Kotak: geser seluruh paragraf.</p>
      </div>
    </details>
  </div>;
}
