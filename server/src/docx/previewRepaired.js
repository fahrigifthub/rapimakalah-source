import { createPreview as legacyPreview } from './preview.js';

// Processed XML already contains the formatter's effective paragraph rules.
// Respect its TOC/list/bibliography alignment and explicit zero indents.
export async function createPreview(buffer, config, variant = 'original', options = {}) {
  return legacyPreview(buffer, config, variant, variant === 'processed'
    ? { ...options, alignment: false, firstLineIndent: false }
    : options);
}
