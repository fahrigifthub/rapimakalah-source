import { z } from 'zod';

const cm = z.number().min(0).max(10);
const pt = z.number().min(6).max(72);

export const marginsSchema = z.object({
  top: cm,
  right: cm,
  bottom: cm,
  left: cm,
});

export const templateConfigSchema = z.object({
  page: z.object({
    size: z.enum(['A4', 'F4', 'Letter', 'A5']),
    orientation: z.enum(['portrait', 'landscape']),
    margins: marginsSchema,
  }),
  typography: z.object({
    fontFamily: z.string().min(1).max(80),
    fontSize: pt,
    lineSpacing: z.number().min(0.8).max(4),
    spaceBefore: z.number().min(0).max(72),
    spaceAfter: z.number().min(0).max(72),
    firstLineIndent: z.number().min(0).max(5),
    alignment: z.enum(['left', 'center', 'right', 'justify']),
  }),
  headings: z.object({
    chapter: z.object({
      fontFamily: z.string().min(1).max(80),
      fontSize: pt,
      bold: z.boolean(),
      alignment: z.enum(['left', 'center', 'right', 'justify']),
      spaceBefore: z.number().min(0).max(72),
      spaceAfter: z.number().min(0).max(72),
      uppercase: z.boolean(),
    }),
    subheading: z.object({
      fontFamily: z.string().min(1).max(80),
      fontSize: pt,
      bold: z.boolean(),
      alignment: z.enum(['left', 'center', 'right', 'justify']),
      spaceBefore: z.number().min(0).max(72),
      spaceAfter: z.number().min(0).max(72),
    }),
    subsubheading: z.object({
      fontFamily: z.string().min(1).max(80),
      fontSize: pt,
      bold: z.boolean(),
      alignment: z.enum(['left', 'center', 'right', 'justify']),
      spaceBefore: z.number().min(0).max(72),
      spaceAfter: z.number().min(0).max(72),
    }),
  }),
  pageNumbering: z.object({
    enabled: z.boolean(),
    position: z.enum(['bottom-center', 'bottom-right', 'top-right', 'top-center']),
    cover: z.boolean(),
    frontMatter: z.enum(['decimal', 'upperRoman', 'lowerRoman', 'upperLetter', 'lowerLetter']),
    body: z.enum(['decimal', 'upperRoman', 'lowerRoman', 'upperLetter', 'lowerLetter']),
    bodyRestart: z.boolean(),
  }),
  toc: z.object({
    enabled: z.boolean(),
    depth: z.number().int().min(1).max(5),
    title: z.string().min(1).max(80),
    includeTocTitle: z.boolean().default(true),
  }),
  cover: z.object({
    titleSize: z.number().min(8).max(36).default(16),
    institutionSize: z.number().min(8).max(36).default(16),
    showDepartment: z.boolean().default(true),
    institutionAtBottom: z.boolean().default(true),
    logo: z.string().max(1400000).regex(/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/).optional().or(z.literal('')),
    logoSize: z.number().min(1).max(8).optional(),
    defaults: z
      .object({
        documentType: z.string().max(40).optional(),
        course: z.string().max(120).optional(),
        lecturer: z.string().max(120).optional(),
        author: z.string().max(200).optional(),
        members: z.array(z.object({ name: z.string().max(120).optional(), nim: z.string().max(40).optional() })).max(30).optional(),
        program: z.string().max(120).optional(),
        department: z.string().max(120).optional(),
        faculty: z.string().max(120).optional(),
        institution: z.string().max(120).optional(),
        city: z.string().max(60).optional(),
        year: z.string().max(10).optional(),
      })
      .optional(),
  }).default({ titleSize: 16, institutionSize: 16, showDepartment: true, institutionAtBottom: true }),
  bibliography: z.object({
    linkUrls: z.boolean().default(true),
    hangingIndent: z.number().min(0).max(5).default(1.27),
    alignment: z.enum(['left', 'center', 'right', 'justify']).default('justify'),
  }).default({ linkUrls: true, hangingIndent: 1.27, alignment: 'justify' }),
  captions: z.object({
    requireImageCaption: z.boolean(),
    requireTableCaption: z.boolean(),
  }),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Nama minimal 2 karakter').max(80),
  email: z.string().trim().toLowerCase().email('Alamat email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter').max(128),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Alamat email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(80),
  institution: z.string().trim().max(120).optional().or(z.literal('')),
  programStudy: z.string().trim().max(120).optional().or(z.literal('')),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'Password baru minimal 8 karakter').max(128),
});

export const templateInputSchema = z.object({
  name: z.string().trim().min(2, 'Nama template minimal 2 karakter').max(80),
  description: z.string().trim().max(300).optional().or(z.literal('')),
  category: z.string().trim().min(2).max(40),
  config: templateConfigSchema,
});

export const formatOptionsSchema = z.object({
  margins: z.boolean().default(true),
  font: z.boolean().default(true),
  fontSize: z.boolean().default(true),
  lineSpacing: z.boolean().default(true),
  firstLineIndent: z.boolean().default(true),
  alignment: z.boolean().default(true),
  headings: z.boolean().default(true),
  paragraphSpacing: z.boolean().default(true),
  pageNumbering: z.boolean().default(true),
  toc: z.boolean().default(false),
  cover: z.boolean().default(false),
  preface: z.boolean().default(true),
});

const metaText = (max = 160) => z.string().trim().max(max).optional().or(z.literal(''));
export const documentMetaSchema = z.object({
  documentType: metaText(40),
  title: metaText(200),
  course: metaText(120),
  lecturer: metaText(120),
  author: metaText(200),
  members: z.array(z.object({ name: metaText(120), nim: metaText(40) })).max(30).optional(),
  nim: metaText(40),
  program: metaText(120),
  department: metaText(120),
  faculty: metaText(120),
  institution: metaText(120),
  city: metaText(60),
  year: metaText(10),
  logo: z.string().max(1400000).regex(/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/).optional().or(z.literal('')),
  logoSize: z.number().min(1).max(8).optional(),
  logoWidth: z.number().int().min(1).max(4000).optional(),
  logoHeight: z.number().int().min(1).max(4000).optional(),
});

export const formatRequestSchema = z.object({
  templateId: z.string().min(1).optional().nullable(),
  config: templateConfigSchema,
  options: formatOptionsSchema,
  meta: documentMetaSchema.optional(),
  /** Optional manual section boundaries (0-based body block indexes). */
  boundaries: z
    .object({
      coverEnd: z.number().int().min(0).optional(),
      bodyStart: z.number().int().min(0).optional(),
    })
    .optional(),
});
