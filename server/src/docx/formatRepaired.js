import { formatDocument as legacyFormat } from './format.js';
import { repairFormattedDocx } from './safeRepair.js';
import { repairWrappedText } from './repairWrappedText.js';

export async function formatDocument(buffer, settings) {
  const prepared = await repairWrappedText(buffer);
  const result = await legacyFormat(prepared.buffer, settings);
  const repaired = await repairFormattedDocx(result.buffer, settings);
  return {
    ...result,
    buffer: repaired.buffer,
    report: {
      ...result.report,
      layoutRepairs: repaired.report.repairs,
      wrappedLinesJoined: prepared.joined,
      appliedRules: [...result.report.appliedRules, ...(repaired.changed ? ['Indentasi isi dan keterkaitan subjudul dirapikan'] : [])],
    },
  };
}
