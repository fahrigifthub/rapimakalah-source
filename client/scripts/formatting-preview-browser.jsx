import React from 'react';
import { createRoot } from 'react-dom/client';
import { DocumentPreview } from '../src/components/DocumentPreview.jsx';
import '../src/index.css';
const root = createRoot(document.getElementById('root'));
window.showPreview = preview => root.render(<main style={{ padding: 24, background: '#ddd', display: 'flex', gap: 24, flexWrap: 'wrap' }}>{preview.pages.map((page, i) => <DocumentPreview key={i} preview={preview} pageIndex={i} />)}</main>);
