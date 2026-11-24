/**
 * Uji alur galeri template publik end-to-end lewat HTTP.
 * Jalankan hanya pada database pengembangan, bukan database produksi berisi data pengguna.
 * Server harus hidup: node scripts/test-gallery.mjs
 * BASE default http://localhost:4000 (dev lokal).
 */
const BASE = process.env.BASE || 'http://localhost:4000';
const stamp = Date.now();

function cookieFrom(res) {
  const raw = res.headers.getSetCookie ? res.headers.getSetCookie() : [res.headers.get('set-cookie')];
  return raw.filter(Boolean).map((c) => c.split(';')[0]).join('; ');
}

async function call(path, { method = 'GET', body, cookie } = {}) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (cookie) headers.Cookie = cookie;
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    /* bukan JSON */
  }
  return { status: res.status, json, text, cookie: cookieFrom(res) };
}

function assert(cond, label) {
  if (!cond) throw new Error(`GAGAL: ${label}`);
  console.log(`ok  ${label}`);
}

async function newUser(tag) {
  const email = `gallery.test.${tag}.${stamp}@example.com`;
  const res = await call('/auth/register', {
    method: 'POST',
    body: { name: `Uji ${tag}`, email, password: 'rahasia123' },
  });
  assert(res.status === 201 || res.status === 200, `registrasi ${tag} (${res.status})`);
  return { email, cookie: res.cookie };
}

const owner = await newUser('owner');
const visitor = await newUser('visitor');

const list = await call('/templates', { cookie: owner.cookie });
const system = list.json.templates.find((t) => t.isSystem);
assert(Boolean(system), 'template bawaan tersedia sebagai sumber config');

const created = await call('/templates', {
  method: 'POST',
  cookie: owner.cookie,
  body: {
    name: `Galeri Uji ${stamp}`,
    description: 'Dibuat oleh skrip uji galeri.',
    category: 'Skripsi',
    config: system.config,
  },
});
assert(created.status === 201, `buat template kustom (${created.status})`);
const templateId = created.json.template.id;
assert(created.json.template.isPublished === false, 'template baru belum terbit');

const systemPublish = await call(`/templates/${system.id}/publish`, { method: 'POST', cookie: owner.cookie });
assert(systemPublish.status === 403, `template bawaan tidak bisa diterbitkan (${systemPublish.status})`);

const anonPublish = await call(`/templates/${templateId}/publish`, { method: 'POST' });
assert(anonPublish.status === 401, `terbit tanpa login ditolak (${anonPublish.status})`);

const published = await call(`/templates/${templateId}/publish`, { method: 'POST', cookie: owner.cookie });
assert(published.status === 200, `terbitkan template (${published.status})`);
assert(published.json.template.isPublished === true, 'status terbit tersimpan');
assert(Boolean(published.json.template.publishedAt), 'waktu terbit tersimpan');

const publicList = await call('/gallery');
assert(publicList.status === 200, `GET publik /api/gallery (${publicList.status})`);
const entry = publicList.json.templates.find((t) => t.id === templateId);
assert(Boolean(entry), 'template terbit muncul di galeri');
assert(entry.name === `Galeri Uji ${stamp}`, 'nama template terbaca publik');
assert(entry.ownerName === 'Uji owner', `nama pemilik tampil: ${entry.ownerName}`);
assert(JSON.stringify(entry.config) === JSON.stringify(system.config), 'config publik identik dengan sumber');

const detail = await call(`/gallery/${templateId}`);
assert(detail.status === 200, `detail galeri publik (${detail.status})`);
assert(detail.json.template.id === templateId, 'detail mengembalikan template yang benar');

const anonUse = await call(`/gallery/${templateId}/use`, { method: 'POST' });
assert(anonUse.status === 401, `salin tanpa login ditolak (${anonUse.status})`);

const copied = await call(`/gallery/${templateId}/use`, { method: 'POST', cookie: visitor.cookie });
assert(copied.status === 201, `salin template oleh pengguna lain (${copied.status})`);
assert(copied.json.template.name === `Galeri Uji ${stamp}`, 'salinan memakai nama sumber');
assert(JSON.stringify(copied.json.template.config) === JSON.stringify(system.config), 'config salinan sama persis');
const copyId = copied.json.template.id;

const visitorList = await call('/templates', { cookie: visitor.cookie });
const copy = visitorList.json.templates.find((t) => t.id === copyId);
assert(Boolean(copy), 'salinan muncul di daftar template penyalin');
assert(copy.importedFrom === `gallery:${templateId}`, 'asal salinan galeri tercatat');
assert(copy.isPublished === false, 'salinan tidak otomatis ikut terbit');

const ownerList = await call('/templates', { cookie: owner.cookie });
assert(!ownerList.json.templates.some((t) => t.id === copyId), 'pemilik asli tidak melihat salinan penyalin');

const forbidden = await call(`/templates/${templateId}/publish`, { method: 'DELETE', cookie: visitor.cookie });
assert(forbidden.status === 403, `pengguna lain tidak bisa menarik template (${forbidden.status})`);

const revoked = await call(`/templates/${templateId}/publish`, { method: 'DELETE', cookie: owner.cookie });
assert(revoked.status === 200, `pemilik menarik template (${revoked.status})`);

const goneList = await call('/gallery');
assert(!goneList.json.templates.some((t) => t.id === templateId), 'template ditarik hilang dari daftar');
const goneDetail = await call(`/gallery/${templateId}`);
assert(goneDetail.status === 404, `detail template ditarik 404 (${goneDetail.status})`);
const goneUse = await call(`/gallery/${templateId}/use`, { method: 'POST', cookie: visitor.cookie });
assert(goneUse.status === 404, `salin template ditarik 404 (${goneUse.status})`);

// Akun admin yang menerbitkan template harus tampil anonim di permukaan publik.
const admin = await newUser('admin');
const { PrismaClient } = await import('@prisma/client');
const prismaAdmin = new PrismaClient();
await prismaAdmin.user.update({ where: { email: admin.email }, data: { role: 'admin' } });
await prismaAdmin.$disconnect();

const adminCreated = await call('/templates', {
  method: 'POST',
  cookie: admin.cookie,
  body: {
    name: `Galeri Admin ${stamp}`,
    description: 'Diterbitkan oleh akun admin.',
    category: 'Skripsi',
    config: system.config,
  },
});
assert(adminCreated.status === 201, `buat template admin (${adminCreated.status})`);
const adminTemplateId = adminCreated.json.template.id;

const adminPublished = await call(`/templates/${adminTemplateId}/publish`, { method: 'POST', cookie: admin.cookie });
assert(adminPublished.status === 200, `terbitkan template admin (${adminPublished.status})`);

const adminList = await call('/gallery');
const adminEntry = adminList.json.templates.find((t) => t.id === adminTemplateId);
assert(Boolean(adminEntry), 'template admin muncul di galeri');
assert(adminEntry.ownerName === 'Anonim', `nama admin dianonimkan: ${adminEntry.ownerName}`);
assert(adminEntry.ownerInstitution === null, 'institusi admin tidak ditampilkan');
assert(adminEntry.ownerProgramStudy === null, 'program studi admin tidak ditampilkan');

const adminShare = await call(`/templates/${adminTemplateId}/share`, { method: 'POST', cookie: admin.cookie });
assert(adminShare.status === 201, `buat tautan berbagi admin (${adminShare.status})`);
const adminShareView = await call(`/share/${adminShare.json.shareId}`);
assert(adminShareView.json.template.ownerName === 'Anonim', 'tautan berbagi admin juga anonim');

const page = await fetch(`${BASE}/galeri`, { headers: { Accept: 'text/html' } });
const html = await page.text();
assert(page.status === 200, `halaman /galeri dirender (${page.status})`);
assert(/Galeri Template Makalah/.test(html), 'halaman galeri memuat metadata SEO');

// Bersihkan data uji (jalankan dengan KEEP=1 untuk mempertahankannya).
if (process.env.KEEP !== '1') {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  const removed = await prisma.user.deleteMany({
    where: { email: { contains: `.${stamp}@example.com` } },
  });
  await prisma.$disconnect();
  console.log(`bersih: ${removed.count} akun uji dihapus (template ikut terhapus lewat cascade)`);
}

console.log('\nSemua pengujian galeri template lulus.');
