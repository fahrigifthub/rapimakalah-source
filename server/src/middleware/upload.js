import multer from 'multer';
import { config } from '../config.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxUploadBytes, files: 1 },
  fileFilter(req, file, cb) {
    const name = String(file.originalname || '');
    const extensionOk = /\.docx$/i.test(name);
    const mimeOk =
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.mimetype === 'application/zip' ||
      file.mimetype === 'application/octet-stream';
    if (!extensionOk) return cb(new Error('Hanya file dengan ekstensi .docx yang diterima.'));
    if (!mimeOk) return cb(new Error('Tipe MIME file tidak didukung. Unggah dokumen Word (.docx).'));
    cb(null, true);
  },
});

export const singleDocxUpload = upload.single('file');
