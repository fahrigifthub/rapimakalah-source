import assert from 'node:assert/strict';
import { buildDocxFromText } from '../src/docx/fromText.js';
import { formatDocument } from '../src/docx/format.js';
import { readDocxBuffer } from '../src/docx/reader.js';
import { DEFAULT_TEMPLATE_CONFIG } from '../src/templates/defaults.js';
import { createPreview } from '../src/docx/preview.js';

const config = structuredClone(DEFAULT_TEMPLATE_CONFIG);
config.cover.logo = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=';
config.cover.defaults = { members: [{ name: 'Anggota Template', nim: '260001' }], institution: 'Universitas Template', department: 'Departemen Teknik' };
const options = { cover: true, preface: false, font: true, headings: true, pageNumbering: true };
const format = async text => formatDocument(await buildDocxFromText(text), { config, options });
const xmlOf = async result => (await readDocxBuffer(result.buffer)).file('word/document.xml').async('string');
const generic = await format('Judul asli yang panjang dan harus tetap lengkap ketika memakai template makalah\n\nDisusun Oleh:\n\nMahasiswa Program Studi Teknik Informatika\n\nSemarang, November 2026\n\n---\n\n# KATA PENGANTAR\n\nPengantar.\n\n# BAB I PENDAHULUAN\n\nIsi.');
assert.match(await xmlOf(generic), /Anggota Template \(260001\)/);
assert.match(await xmlOf(generic), /JUDUL ASLI YANG PANJANG/);
assert.match(await xmlOf(generic), /<a:blip/);
for (const separator of ['---', '']) {
  const source = await readDocxBuffer(await buildDocxFromText(`SERAT OPTIK\n\nPenulis Contoh (0000001)\n\nUniversitas Contoh\n\n${separator}\n\n# BAB I PENDAHULUAN\n\nIsi.`));
  source.remove('rapimakalah/source.json');
  source.file('word/document.xml', (await source.file('word/document.xml').async('string')).replace(/<w:p><w:r><w:pict>[\s\S]*?<\/w:pict><\/w:r><\/w:p>/g, '<w:p><w:r><w:br w:type="page"/></w:r></w:p>'));
  const existing = await formatDocument(await source.generateAsync({ type: 'nodebuffer' }), { config, options });
  const xml = await xmlOf(existing);
  assert.match(xml, /Penulis Contoh \(0000001\)/);
  assert.match(xml, /Universitas Contoh/);
  assert.doesNotMatch(xml, /Anggota Template|UNIVERSITAS TEMPLATE|\[JUDUL MAKALAH\]/);
}
for (const legacy of [false, true]) {
  const source = await readDocxBuffer(await buildDocxFromText('STUDI KASUS CONTOH\n\nDisusun oleh:\n\nPENULIS CONTOH\n\nNIM: 0000001\n\nUNIVERSITAS CONTOH\n\nLEMBAR PENGESAHAN\n\nDisahkan oleh dosen.\n\n---\n\n# KATA PENGANTAR\n\nPengantar.\n\n# BAB I PENDAHULUAN\n\nIsi.'));
  if (legacy) source.remove('rapimakalah/source.json');
  const result = await formatDocument(await source.generateAsync({ type: 'nodebuffer' }), { config, options });
  const xml = await xmlOf(result);
  assert.match(xml, /Anggota Template \(260001\)/);
  assert.match(xml, /<a:blip/);
  assert.match(xml, /Disahkan oleh dosen/);
  assert.doesNotMatch(xml, /PENULIS CONTOH|UNIVERSITAS CONTOH/);
  const pages = (await createPreview(result.buffer, config, 'processed', options)).pages;
  assert.ok(pages[0].blocks.some(b => b.text?.includes('Anggota Template')));
  assert.ok(!pages[0].blocks.some(b => b.text === 'LEMBAR PENGESAHAN'));
  const blankConfig = structuredClone(config);
  delete blankConfig.cover.logo;
  blankConfig.cover.defaults = { documentType: 'Makalah' };
  const blankResult = await formatDocument(await source.generateAsync({ type: 'nodebuffer' }), { config: blankConfig, options });
  const blankPreview = await createPreview(blankResult.buffer, blankConfig, 'processed', options);
  const blankCover = blankPreview.pages[0].blocks.map(b => b.text || '').join('\n');
  for (const label of ['MAKALAH', 'STUDI KASUS CONTOH', '[NAMA MATA KULIAH]', '[Nama dosen pengampu]', '[Tempel logo / foto di sini]', '[Nama Anggota 1]', '[NIM]', '[FAKULTAS]', '[UNIVERSITAS]']) assert.ok(blankCover.includes(label), label);
  assert.doesNotMatch(blankCover, /PENULIS CONTOH|UNIVERSITAS CONTOH|Anggota Template/);
  assert.ok(blankPreview.pages.slice(1).some(p => p.blocks[0]?.text === 'LEMBAR PENGESAHAN'));
}
// Re-uploaded generated covers retain their original media and identity even
// when another template provides a logo with the same package filename.
const originalZip = await readDocxBuffer(generic.buffer);
const originalLogo = await originalZip.file('word/media/paperly-logo.png').async('nodebuffer');
const other = structuredClone(config);
other.cover.logo = config.cover.logo.replace('CAQAAAC1', 'CAQAAAC2');
const again = await formatDocument(generic.buffer, { config: other, options });
const againZip = await readDocxBuffer(again.buffer);
assert.deepEqual(await againZip.file('word/media/paperly-logo.png').async('nodebuffer'), originalLogo);
assert.match(await xmlOf(again), /r:embed="rIdPaperlyLogo"/);
const preview = await createPreview(again.buffer, config, 'processed', options);
assert.ok(preview.pages[0].blocks.some(b => b.text?.includes('Anggota Template')));
console.log('PASS: Saved template identity and logo applied to generic cover; existing short-title covers and re-uploaded logos preserved.');
