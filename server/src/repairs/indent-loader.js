export async function resolve(specifier, context, nextResolve) {
  if (context.parentURL?.endsWith('/routes/documents.js')) {
    if (specifier === '../docx/format.js') specifier = '../docx/formatIndented.js';
    if (specifier === '../docx/preview.js') specifier = '../docx/previewRepaired.js';
  }
  return nextResolve(specifier, context);
}
