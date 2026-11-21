import { formatDocument as formatIndented } from './formatIndented.js';
import { repairBibliography } from './repairBibliography.js';

export async function formatDocument(buffer, settings) {
  const prepared = await repairBibliography(buffer);
  const result = await formatIndented(prepared.buffer, settings);
  return { ...result, report: { ...result.report,
    bibliographyLinesJoined: prepared.joined,
    appliedRules: [...result.report.appliedRules, ...(prepared.joined ? ['Baris lanjutan dan URL disatukan dengan referensi daftar pustaka'] : [])],
  } };
}
