/**
 * Identitas pemilik untuk tampilan publik (galeri & tautan berbagi).
 * Template yang diterbitkan akun admin ditampilkan anonim agar nama
 * pengelola tidak ikut tersebar di katalog publik.
 */
export const PUBLIC_OWNER_SELECT = {
  name: true,
  role: true,
  institution: true,
  programStudy: true,
};

export function publicOwner(owner) {
  if (!owner) {
    return {
      ownerName: 'Pengguna RapiMakalah',
      ownerInstitution: null,
      ownerProgramStudy: null,
    };
  }
  const anonymous = owner.role === 'admin';
  return {
    ownerName: anonymous ? 'Anonim' : owner.name,
    ownerInstitution: anonymous ? null : owner.institution || null,
    ownerProgramStudy: anonymous ? null : owner.programStudy || null,
  };
}
