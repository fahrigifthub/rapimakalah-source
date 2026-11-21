import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

const key = new PluginKey('writingPagination');
const GAP = 24;

/** Layout-only spacers: never add automatic page breaks to the saved document. */
export const WritingPagination = Extension.create({
  name: 'writingPagination',
  addProseMirrorPlugins() {
    return [new Plugin({
      key,
      state: {
        init: () => DecorationSet.empty,
        apply: (tr, previous) => tr.getMeta(key) ?? previous.map(tr.mapping, tr.doc),
      },
      props: { decorations: state => key.getState(state) },
      view(view) {
        let frame = 0;
        let destroyed = false;
         let measuring = false;
         let lastWidth = 0;
         const sheet = view.dom.closest('.writing-sheet-frame');
         const layoutListener = () => schedule();
        function layout() {
          frame = 0;
          if (destroyed || view.composing) return;
          measuring = true;
          view.dispatch(view.state.tr.setMeta(key, DecorationSet.empty).setMeta('addToHistory', false));
          const sheetWidth = sheet?.clientWidth || view.dom.clientWidth;
          const frameWidth = sheet?.offsetWidth || sheetWidth;
          if (!sheetWidth || !frameWidth) { measuring = false; return; }
          lastWidth = sheetWidth;
          const width = frameWidth;
           const pageWidth = Number(sheet?.dataset.pageWidth) || 21;
           const pageHeight = Number(sheet?.dataset.pageHeight) || 29.7;
           const pageMargins = JSON.parse(sheet?.dataset.pageMargins || '{"top":3,"right":3,"bottom":3,"left":4}');
           const unit = width / pageWidth;
           const height = unit * pageHeight;
           const marginTop = unit * (Number(pageMargins.top) || 0);
           const marginBottom = unit * (Number(pageMargins.bottom) || 0);
           const margin = marginTop;
          const stride = height + GAP;
          const scale = view.dom.getBoundingClientRect().width / view.dom.offsetWidth || 1;
          const origin = view.dom.getBoundingClientRect().top;
          let offset = 0;
          let page = 0;
          const decorations = [];
          function spacer(pos, amount, inline = false) {
            if (amount < 0.5) return;
            decorations.push(Decoration.widget(pos, () => {
              const element = document.createElement('span');
              element.className = `writing-pagination-spacer${inline ? ' inline-spacer' : ''}`;
              element.style.height = `${amount}px`;
              element.contentEditable = 'false';
              element.setAttribute('aria-hidden', 'true');
              return element;
            }, { side: -1, key: `page-${pos}-${Math.round(amount * 100)}`, ignoreSelection: true }));
            offset += amount;
          }
          view.state.doc.forEach((node, pos, index) => {
            const element = view.nodeDOM(pos);
            if (!(element instanceof HTMLElement)) return;
            const rect = element.getBoundingClientRect();
            const top = (rect.top - origin) / scale;
            const bottom = (rect.bottom - origin) / scale;
            const blockHeight = rect.height / scale;
            // Older imports kept Word's empty section-carrier paragraph after
            // a bottom frame. It must not overflow and then trigger a second break.
            if (node.type.name === 'paragraph' && !node.content.size && index > 0
              && view.state.doc.child(index - 1).attrs.bottomFrame
              && view.state.doc.maybeChild(index + 1)?.type.name === 'pageBreak') {
              const nextElement = view.nodeDOM(pos + node.nodeSize);
              if (nextElement instanceof HTMLElement) {
                offset -= (nextElement.getBoundingClientRect().top - rect.top) / scale;
                decorations.push(Decoration.node(pos, pos + node.nodeSize, { style: 'display:none' }));
                return;
              }
            }
            // Consecutive bottom-anchored Word frame paragraphs form one group.
            if (node.attrs.bottomFrame && (index === 0 || !view.state.doc.child(index - 1).attrs.bottomFrame)) {
              let lastPos = pos;
              let lastNode = node;
              for (let i = index + 1; i < view.state.doc.childCount; i++) {
                const next = view.state.doc.child(i);
                if (!next.attrs.bottomFrame) break;
                lastPos += lastNode.nodeSize;
                lastNode = next;
              }
              const lastElement = view.nodeDOM(lastPos);
              if (lastElement instanceof HTMLElement) {
                const groupBottom = (lastElement.getBoundingClientRect().bottom - origin) / scale;
                const groupHeight = groupBottom - top;
                const available = height - marginTop - marginBottom;
                if (groupHeight <= available) {
                  if (top + offset + groupHeight > page * stride + height - marginBottom + 0.5) page++;
                  spacer(pos, page * stride + height - marginBottom - groupBottom - offset);
                }
              }
            }
             if (node.type.name === 'pageBreak') {
               const next = Math.max(page + 1, Math.floor((top + offset) / stride) + 1) + Math.max(0, Math.min(9, (Number(node.attrs.count) || 1) - 1));
               spacer(pos, next * stride + margin - (top + offset) - blockHeight);
               page = next;
              return;
            }
           const usable = height - marginTop - marginBottom;
            if (blockHeight <= usable) {
           while (bottom + offset > page * stride + height - marginBottom + 0.5) {
                page++;
                spacer(pos, Math.max(0, page * stride + margin - (top + offset)));
              }
            } else if (node.isTextblock) {
              // Split long paragraphs at actual visual line starts, keeping one paragraph in JSON.
              let lastTop = -Infinity;
              for (let index = 0; index < node.content.size; index++) {
                const position = pos + 1 + index;
                const coords = view.coordsAtPos(position);
                if (Math.abs(coords.top - lastTop) < 2) continue;
                lastTop = coords.top;
                const lineTop = (coords.top - origin) / scale;
                 if ((coords.bottom - origin) / scale + offset > page * stride + height - marginBottom + 0.5) {
                  page++;
                  spacer(position, Math.max(0, page * stride + margin - (lineTop + offset)), true);
                }
              }
            } else if (node.type.name === 'table') {
              // Keep a row's content together by adding layout-only padding to its cells.
              for (const row of element.querySelectorAll('tr')) {
                const rowRect = row.getBoundingClientRect();
                if (rowRect.height / scale > usable) continue;
                const rowTop = (rowRect.top - origin) / scale;
               if ((rowRect.bottom - origin) / scale + offset > page * stride + height - marginBottom) {
                  page++;
                  const amount = Math.max(0, page * stride + margin - (rowTop + offset));
                  if (amount) {
                    for (const cell of row.cells) {
                      const cellPos = view.posAtDOM(cell, 0) - 1;
                      const cellNode = view.state.doc.nodeAt(cellPos);
                      if (cellNode) decorations.push(Decoration.node(cellPos, cellPos + cellNode.nodeSize, { style: `padding-top:${parseFloat(getComputedStyle(cell).paddingTop) + amount}px` }));
                    }
                    offset += amount;
                  }
                }
              }
            } else {
              // Lists and blockquotes can span multiple sheets without splitting their saved nodes.
              node.descendants((child, relative) => {
                if (!child.isTextblock) return;
                const childPos = pos + 1 + relative;
                let lastTop = -Infinity;
                for (let index = 0; index < child.content.size; index++) {
                  const position = childPos + 1 + index;
                  const coords = view.coordsAtPos(position);
                  if (Math.abs(coords.top - lastTop) < 2) continue;
                  lastTop = coords.top;
                   if ((coords.bottom - origin) / scale + offset > page * stride + height - marginBottom + 0.5) {
                    page++;
                    spacer(position, Math.max(0, page * stride + margin - ((coords.top - origin) / scale + offset)), true);
                  }
                }
                return false;
              });
            }
          });
          const pages = Math.max(1, page + 1);
          view.dom.style.minHeight = `${pages * height + (pages - 1) * GAP}px`;
           if (sheet) {
             sheet.style.setProperty('--writing-page-width', `${width}px`);
             sheet.style.setProperty('--writing-page-height', `${height}px`);
             sheet.style.setProperty('--writing-page-stride', `${stride}px`);
             sheet.style.setProperty('--writing-text-height', `${height - marginTop - marginBottom}px`);
             sheet.dispatchEvent(new CustomEvent('writing-pages', { bubbles: true, detail: { pages, height, gap: GAP, unit, marginTop, marginBottom, marginLeft: unit * (Number(pageMargins.left) || 0), marginRight: unit * (Number(pageMargins.right) || 0), pageWidth } }));
          }
          view.dispatch(view.state.tr.setMeta(key, DecorationSet.create(view.state.doc, decorations)).setMeta('addToHistory', false));
          measuring = false;
        }
        const schedule = () => {
          if (!frame && !destroyed) frame = requestAnimationFrame(layout);
        };
         const resize = new ResizeObserver(entries => {
           if (Math.abs(entries[0].contentRect.width - lastWidth) > 0.5) schedule();
         });
         if (sheet?.parentElement) resize.observe(sheet.parentElement);
        view.dom.addEventListener('load', schedule, true);
         view.dom.addEventListener('compositionend', schedule);
         sheet?.addEventListener('writing-layout', schedule);
        document.fonts?.ready.then(schedule);
        schedule();
        return {
          update(updated, previous) {
            if (!measuring && !previous.doc.eq(updated.state.doc)) schedule();
          },
          destroy() {
            destroyed = true;
            cancelAnimationFrame(frame);
            resize.disconnect();
            view.dom.removeEventListener('load', schedule, true);
             view.dom.removeEventListener('compositionend', schedule);
             sheet?.removeEventListener('writing-layout', schedule);
          },
        };
      },
    })];
  },
});
