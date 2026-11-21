import { formatDocument as repairedFormat } from './formatRepaired.js';
import { indentBody } from './indentBody.js';
import { repairFormattedDocx } from './safeRepair.js';

export async function formatDocument(buffer, settings) {
  const result = await repairedFormat(buffer, settings);
  const indented = await indentBody(result.buffer, settings);
  // Recompute cached TOC labels using the new paragraph widths, while retaining
  // the selected indentation. Existing repair implementations remain available.
  const refreshed = await repairFormattedDocx(indented.buffer, {
    ...settings, options: { ...settings.options, firstLineIndent: false, headings: false, alignment: false },
  });
  return { ...result, buffer: refreshed.buffer, report: {
    ...result.report, indentedBodyParagraphs: indented.count,
    appliedRules: [...result.report.appliedRules, ...(indented.count ? ['Isi disejajarkan dengan teks subbab dan diberi indentasi baris pertama'] : [])],
  } };
}
