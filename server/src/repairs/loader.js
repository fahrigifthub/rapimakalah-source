// Opt-in routing for the additional repair layer. Original source files remain
// usable with the original entry point. Restrict redirects to document routes.
export async function resolve(specifier, context, nextResolve) {
  if (context.parentURL?.endsWith('/routes/documents.js')) {
    if (specifier === '../docx/format.js') specifier = '../docx/formatRepaired.js';
    if (specifier === '../docx/preview.js') specifier = '../docx/previewRepaired.js';
  }
  return nextResolve(specifier, context);
}
