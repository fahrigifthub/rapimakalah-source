/**
 * Uji alur berbagi template end-to-end lewat HTTP.
 * Jalankan hanya pada database pengembangan, bukan database produksi berisi data pengguna.
 * Server harus hidup: node scripts/test-share.mjs
 * BASE default http://localhost:4001 (produksi lokal).
 */
const BASE = process.env.BASE || 'http://localhost:4001';
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
  const email = `share.test.${tag}.${stamp}@example.com`;
  const res = await call('/auth/register', {
    method: 'POST',
    body: { name: `Uji ${tag}`, email, password: 'rahasia123' },
  });
  assert(res.status === 201 || res.status === 200, `registrasi ${tag} (${res.status})`);
  return { email, cookie: res.cookie };
}

const owner = await newUser('owner');
const friend = await newUser('friend');

const list = await call('/templates', { cookie: owner.cookie });
const system = list.json.templates.find((t) => t.isSystem);
assert(Boolean(system), 'template bawaan tersedia sebagai sumber config');

const created = await call('/templates', {
  method: 'POST',
  cookie: owner.cookie,
  body: {
    name: `Skripsi Uji ${stamp}`,
    description: 'Dibuat oleh skrip uji berbagi.',
    category: 'Skripsi',
    config: system.config,
  },
});
assert(created.status === 201, `buat template kustom (${created.status})`);
const templateId = created.json.template.id;

const shared = await call(`/templates/${templateId}/share`, { method: 'POST', cookie: owner.cookie });
assert(shared.status === 201 || shared.status === 200, `buat kode berbagi (${shared.status})`);
const shareId = shared.json.shareId;
assert(/^[23456789abcdefghjkmnpqrstuvwxyz]{8}$/.test(shareId), `format kode 8 karakter: ${shareId}`);

const again = await call(`/templates/${templateId}/share`, { method: 'POST', cookie: owner.cookie });
assert(again.json.shareId === shareId, 'kode berbagi stabil saat diminta ulang');

const pub = await call(`/share/${shareId}`);
assert(pub.status === 200, `GET publik /api/share/${shareId} (${pub.status})`);
assert(pub.json.template.name === `Skripsi Uji ${stamp}`, 'nama template terbaca publik');
assert(JSON.stringify(pub.json.template.config) === JSON.stringify(system.config), 'config publik identik dengan sumber');

const anon = await call(`/share/${shareId}/import`, { method: 'POST' });
assert(anon.status === 401, `impor tanpa login ditolak (${anon.status})`);

const imported = await call(`/share/${shareId}/import`, { method: 'POST', cookie: friend.cookie });
assert(imported.status === 201, `impor oleh pengguna lain (${imported.status})`);
assert(imported.json.template.isOwned === true, 'salinan menjadi milik pengimpor');
assert(
  JSON.stringify(imported.json.template.config) === JSON.stringify(system.config),
  'config salinan sama persis',
);
const copyId = imported.json.template.id;

const friendList = await call('/templates', { cookie: friend.cookie });
const copy = friendList.json.templates.find((t) => t.id === copyId);
assert(Boolean(copy), 'salinan muncul di daftar template pengimpor');
assert(copy.importedFrom === shareId, 'asal impor tercatat');

const ownerList = await call('/templates', { cookie: owner.cookie });
assert(!ownerList.json.templates.some((t) => t.id === copyId), 'pemilik asli tidak melihat salinan pengimpor');

// Nama bentrok harus menjadi "... (2)"
const second = await call(`/share/${shareId}/import`, { method: 'POST', cookie: friend.cookie });
assert(second.status === 201, `impor kedua (${second.status})`);
assert(second.json.template.name === `Skripsi Uji ${stamp} (2)`, `nama bentrok ditangani: ${second.json.template.name}`);

const forbidden = await call(`/templates/${templateId}/share`, { method: 'DELETE', cookie: friend.cookie });
assert(forbidden.status === 403, `pengguna lain tidak bisa mencabut (${forbidden.status})`);

const revoked = await call(`/templates/${templateId}/share`, { method: 'DELETE', cookie: owner.cookie });
assert(revoked.status === 200, `pemilik mencabut tautan (${revoked.status})`);

const gone = await call(`/share/${shareId}`);
assert(gone.status === 404, `tautan dicabut jadi 404 (${gone.status})`);

const goneImport = await call(`/share/${shareId}/import`, { method: 'POST', cookie: friend.cookie });
assert(goneImport.status === 404, `impor dari tautan dicabut 404 (${goneImport.status})`);

const page = await fetch(`${BASE}/t/${shareId}`, { headers: { Accept: 'text/html' } });
const html = await page.text();
assert(page.status === 200, `halaman /t/<kode> dirender (${page.status})`);
assert(/noindex/i.test(html), 'halaman berbagi memakai noindex');

const sitemap = await fetch(`${BASE}/sitemap.xml`);
const sitemapText = await sitemap.text();
assert(!sitemapText.includes('/t/'), 'sitemap tidak memuat tautan berbagi');

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

console.log('\nSemua pengujian berbagi template lulus.');
