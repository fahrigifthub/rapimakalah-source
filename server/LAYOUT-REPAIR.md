The additive layout repair layer runs with:

```powershell
node --env-file=.env.production src/index-repaired.js
```

It uses a Node module loader to redirect only document-route imports to the
new format/preview wrappers. The original formatter, preview, routes, and
entry point are preserved. Node 20.6 or newer is required for `register()`.
The original `npm start` and `npm run dev` commands still start the original
entry point; use the command above to keep the repair layer enabled.

To return to the original behavior, restart with:

```powershell
node --env-file=.env.production src/index.js
```

The repair addresses inherited heading indentation in body paragraphs,
headings/manual numbered labels stranded at page ends, and preview overrides
of explicit paragraph alignment/indentation. Cached TOC labels are recalculated
after reflow; Word remains responsible for final pagination.

Verification:

```powershell
node scripts/test-safe-repair.js
```

For live checks on a real deployment, use a private script outside the
repository. Never commit document IDs, production domains, or user data.
When applying a repair to stored files, back up the processed DOCX first and
keep the original upload unchanged.

## Admin: daftar dokumen semua pengguna

Admin panel has a third tab (`Dokumen`) that lists documents owned by every
user, with search by file name / owner name / email, a status filter, original
preview, processed preview and DOCX download.

Server endpoints (all behind `authenticate` + `requireAdmin`):

- `GET /api/admin/documents?page&q&status&userId`
- `GET /api/admin/documents/:id/preview?variant=original|processed`
- `GET /api/admin/documents/:id/download?variant=original|processed`

Preview reuses the settings stored on the document, so an admin does not need
to own the template. Files are read through the owning user's storage folder;
nothing is written. Back up modified source files locally before deploying.

