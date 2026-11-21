# -*- coding: utf-8 -*-
"""Membangun versi Word (.docx) dari docs/MANUAL-BOOK-RAPIMAKALAH.md."""

import re
import sys
from pathlib import Path

from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

BASE = Path(__file__).resolve().parent
SOURCE = BASE / "MANUAL-BOOK-RAPIMAKALAH.md"
TARGET = BASE / "MANUAL-BOOK-RAPIMAKALAH.docx"

FONT = "Times New Roman"
MONO = "Consolas"
CONTENT_WIDTH_CM = 14.0  # A4 21 cm - margin kiri 4 cm - margin kanan 3 cm


# --------------------------------------------------------------------------
# Utilitas XML
# --------------------------------------------------------------------------
def shade(element, color):
    """Beri warna latar pada paragraf atau sel."""
    pr = element.get_or_add_pPr() if hasattr(element, "get_or_add_pPr") else element
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), color)
    pr.append(shd)


def shade_cell(cell, color):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), color)
    tcPr.append(shd)


def para_border_bottom(paragraph, color="808080", size="6"):
    pPr = paragraph._p.get_or_add_pPr()
    borders = OxmlElement("w:pBdr")
    bottom = OxmlElement("w:bottom")
    bottom.set(qn("w:val"), "single")
    bottom.set(qn("w:sz"), size)
    bottom.set(qn("w:space"), "1")
    bottom.set(qn("w:color"), color)
    borders.append(bottom)
    pPr.append(borders)


def add_field(paragraph, instruction, placeholder=""):
    run = paragraph.add_run()
    fld = OxmlElement("w:fldChar")
    fld.set(qn("w:fldCharType"), "begin")
    run._r.append(fld)

    run = paragraph.add_run()
    instr = OxmlElement("w:instrText")
    instr.set(qn("xml:space"), "preserve")
    instr.text = instruction
    run._r.append(instr)

    run = paragraph.add_run()
    fld = OxmlElement("w:fldChar")
    fld.set(qn("w:fldCharType"), "separate")
    run._r.append(fld)

    if placeholder:
        paragraph.add_run(placeholder)

    run = paragraph.add_run()
    fld = OxmlElement("w:fldChar")
    fld.set(qn("w:fldCharType"), "end")
    run._r.append(fld)


def set_cell_margins(cell, top=60, bottom=60, left=100, right=100):
    tcPr = cell._tc.get_or_add_tcPr()
    mar = OxmlElement("w:tcMar")
    for tag, value in (("top", top), ("left", left), ("bottom", bottom), ("right", right)):
        node = OxmlElement(f"w:{tag}")
        node.set(qn("w:w"), str(value))
        node.set(qn("w:type"), "dxa")
        mar.append(node)
    tcPr.append(mar)


def set_repeat_header(row):
    trPr = row._tr.get_or_add_trPr()
    header = OxmlElement("w:tblHeader")
    header.set(qn("w:val"), "true")
    trPr.append(header)


def set_cant_split(row):
    trPr = row._tr.get_or_add_trPr()
    cant = OxmlElement("w:cantSplit")
    cant.set(qn("w:val"), "true")
    trPr.append(cant)


def set_table_borders(table, color="7F7F7F"):
    tbl = table._tbl
    tblPr = tbl.tblPr
    borders = OxmlElement("w:tblBorders")
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        node = OxmlElement(f"w:{edge}")
        node.set(qn("w:val"), "single")
        node.set(qn("w:sz"), "4")
        node.set(qn("w:space"), "0")
        node.set(qn("w:color"), color)
        borders.append(node)
    tblPr.append(borders)


def set_paragraph_numbering(paragraph, level=0):
    """Hentikan penomoran otomatis warisan style (dipakai untuk daftar manual)."""
    pPr = paragraph._p.get_or_add_pPr()
    numPr = OxmlElement("w:numPr")
    ilvl = OxmlElement("w:ilvl")
    ilvl.set(qn("w:val"), "0")
    numId = OxmlElement("w:numId")
    numId.set(qn("w:val"), "0")
    numPr.append(ilvl)
    numPr.append(numId)
    pPr.append(numPr)


# --------------------------------------------------------------------------
# Inline formatting
# --------------------------------------------------------------------------
INLINE = re.compile(r"(\*\*.+?\*\*|`[^`]+`|\*[^*\n]+?\*)")


def add_inline(paragraph, text, size=None, bold=False, italic=False):
    text = text.replace("\\*", "*")
    for token in INLINE.split(text):
        if not token:
            continue
        if token.startswith("**") and token.endswith("**") and len(token) > 4:
            add_inline(paragraph, token[2:-2], size=size, bold=True, italic=italic)
        elif token.startswith("`") and token.endswith("`") and len(token) > 2:
            run = paragraph.add_run(token[1:-1])
            run.font.name = MONO
            run._element.rPr.rFonts.set(qn("w:eastAsia"), MONO)
            run.font.size = Pt((size or 12) - 1.5)
            if bold:
                run.bold = True
            if italic:
                run.italic = True
        elif token.startswith("*") and token.endswith("*") and len(token) > 2:
            add_inline(paragraph, token[1:-1], size=size, bold=bold, italic=True)
        else:
            run = paragraph.add_run(token)
            if bold:
                run.bold = True
            if italic:
                run.italic = True
        if size and not token.startswith("`"):
            for run in paragraph.runs[-1:]:
                run.font.size = Pt(size)
    return paragraph


# --------------------------------------------------------------------------
# Dokumen
# --------------------------------------------------------------------------
def setup_styles(doc):
    normal = doc.styles["Normal"]
    normal.font.name = FONT
    normal.font.size = Pt(12)
    normal.font.color.rgb = RGBColor(0, 0, 0)
    rpr = normal.element.get_or_add_rPr()
    rpr.rFonts.set(qn("w:eastAsia"), FONT)
    rpr.rFonts.set(qn("w:cs"), FONT)
    pf = normal.paragraph_format
    pf.line_spacing = 1.5
    pf.space_before = Pt(0)
    pf.space_after = Pt(6)
    pf.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    pf.widow_control = True

    specs = {
        "Heading 1": (16, True, WD_ALIGN_PARAGRAPH.CENTER, 0, 18),
        "Heading 2": (13.5, True, WD_ALIGN_PARAGRAPH.LEFT, 14, 6),
        "Heading 3": (12, True, WD_ALIGN_PARAGRAPH.LEFT, 10, 4),
        "Heading 4": (12, True, WD_ALIGN_PARAGRAPH.LEFT, 8, 3),
    }
    for name, (size, bold, align, before, after) in specs.items():
        style = doc.styles[name]
        style.font.name = FONT
        style.font.size = Pt(size)
        style.font.bold = bold
        style.font.italic = False
        style.font.color.rgb = RGBColor(0, 0, 0)
        srpr = style.element.get_or_add_rPr()
        srpr.rFonts.set(qn("w:eastAsia"), FONT)
        srpr.rFonts.set(qn("w:cs"), FONT)
        spf = style.paragraph_format
        spf.alignment = align
        spf.space_before = Pt(before)
        spf.space_after = Pt(after)
        spf.line_spacing = 1.15
        spf.keep_with_next = True
        spf.keep_together = True

    # Gaya daftar isi (dipakai Word saat field TOC diperbarui).
    from docx.enum.style import WD_STYLE_TYPE
    for lvl in (1, 2, 3):
        style = doc.styles.add_style(f"toc {lvl}", WD_STYLE_TYPE.PARAGRAPH)
        style.base_style = doc.styles["Normal"]
        style.font.name = FONT
        style.font.size = Pt(12)
        style.font.bold = False
        style.paragraph_format.left_indent = Cm(0.6 * (lvl - 1))
        style.paragraph_format.first_line_indent = Cm(0)
        style.paragraph_format.line_spacing = 1.15
        style.paragraph_format.space_before = Pt(2)
        style.paragraph_format.space_after = Pt(2)
        style.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT
        style.element.set(qn("w:styleId"), f"TOC{lvl}")


def setup_page(section):
    section.page_width = Cm(21)
    section.page_height = Cm(29.7)
    section.top_margin = Cm(3)
    section.bottom_margin = Cm(3)
    section.left_margin = Cm(4)
    section.right_margin = Cm(3)
    section.header_distance = Cm(1.5)
    section.footer_distance = Cm(1.5)

    sectPr = section._sectPr
    for old in sectPr.findall(qn("w:pgNumType")):
        sectPr.remove(old)
    pg_num = OxmlElement("w:pgNumType")
    pg_num.set(qn("w:fmt"), "decimal")
    pg_num.set(qn("w:start"), "1")
    sectPr.append(pg_num)


def build_heading(doc, level, text, page_break=False):
    p = doc.add_paragraph(style=f"Heading {level}")
    add_inline(p, text)
    if page_break:
        p.paragraph_format.page_break_before = True
    if level == 1:
        p.paragraph_format.space_after = Pt(18)
        pPr_border = p._p.get_or_add_pPr()
        borders = OxmlElement("w:pBdr")
        bottom = OxmlElement("w:bottom")
        bottom.set(qn("w:val"), "single")
        bottom.set(qn("w:sz"), "8")
        bottom.set(qn("w:space"), "4")
        bottom.set(qn("w:color"), "1F3864")
        borders.append(bottom)
        pPr_border.append(borders)
    return p


def build_cover(doc):
    for _ in range(2):
        doc.add_paragraph()

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(4)
    r = p.add_run("MANUAL BOOK")
    r.bold = True
    r.font.size = Pt(22)
    r.font.name = FONT

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(10)
    r = p.add_run("RAPIMAKALAH")
    r.bold = True
    r.font.size = Pt(36)
    r.font.name = FONT

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(18)
    para_border_bottom(p, color="1F3864", size="12")

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.line_spacing = 1.3
    r = p.add_run(
        "Panduan Instalasi, Penggunaan, dan Pemeliharaan\n"
        "Aplikasi Web Perapi Format Dokumen Akademik"
    )
    r.italic = True
    r.font.size = Pt(16)

    for _ in range(3):
        doc.add_paragraph()

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run("Versi aplikasi 1.0.0")
    r.bold = True
    r.font.size = Pt(13)

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run("https://domain-anda.example")
    r.font.size = Pt(13)

    for _ in range(5):
        doc.add_paragraph()

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(4)
    add_inline(p, "Disusun sebagai dokumentasi resmi penggunaan aplikasi.", size=12)

    for label in (
        "Nama penyusun: ................................................",
        "Institusi: ....................................................",
        "Program studi: ...............................................",
    ):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.line_spacing = 1.15
        add_inline(p, label, size=12)

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(14)
    r = p.add_run("2026")
    r.bold = True
    r.font.size = Pt(13)


def build_title_page(doc):
    doc.add_page_break()

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(4)
    r = p.add_run("MANUAL BOOK RAPIMAKALAH")
    r.bold = True
    r.font.size = Pt(20)

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(24)
    r = p.add_run("Panduan Instalasi, Penggunaan, dan Pemeliharaan")
    r.italic = True
    r.font.size = Pt(12)

    rows = [
        ("Judul dokumen", "Manual Book RapiMakalah"),
        ("Subjudul", "Panduan Instalasi, Penggunaan, dan Pemeliharaan Aplikasi Web Perapi Format Dokumen Akademik"),
        ("Versi aplikasi", "1.0.0"),
        ("Situs resmi", "https://domain-anda.example"),
        ("Repositori lokal", "<folder-proyek>"),
        ("Jenis dokumen", "Manual book / dokumentasi pengguna dan operator"),
        ("Penyusun", "................................................"),
        ("Institusi", "................................................"),
        ("Program studi", "................................................"),
        ("Tahun", "2026"),
    ]
    table = doc.add_table(rows=0, cols=2)
    table.style = "Table Grid"
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(table)
    for label, value in rows:
        cells = table.add_row().cells
        cells[0].width = Cm(4.6)
        cells[1].width = Cm(9.4)
        shade_cell(cells[0], "E8EDF5")
        for i, text in enumerate((label, value)):
            para = cells[i].paragraphs[0]
            para.paragraph_format.line_spacing = 1.15
            para.paragraph_format.space_after = Pt(2)
            para.paragraph_format.space_before = Pt(2)
            para.alignment = WD_ALIGN_PARAGRAPH.LEFT
            run = para.add_run(text)
            run.font.size = Pt(10.5)
            run.bold = i == 0
        set_cell_margins(cells[0])
        set_cell_margins(cells[1])

    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(24)
    p.paragraph_format.line_spacing = 1.2
    r = p.add_run(
        "Catatan: RapiMakalah membantu memeriksa dan merapikan format dokumen, "
        "tetapi tidak menggantikan pemeriksaan akhir di Microsoft Word. Pratinjau "
        "di aplikasi bersifat struktural dan jumlah halaman merupakan estimasi."
    )
    r.italic = True
    r.font.size = Pt(11)
    para_border_bottom(p, color="BFBFBF", size="4")


def build_toc_page(doc):
    doc.add_page_break()

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(18)
    p.paragraph_format.line_spacing = 1.15
    r = p.add_run("DAFTAR ISI")
    r.bold = True
    r.font.size = Pt(16)
    r.font.name = FONT

    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(10)
    add_field(p, r'TOC \o "1-3" \h \z \u',
              "Daftar isi akan terisi setelah field diperbarui.")

    p = doc.add_paragraph()
    p.paragraph_format.line_spacing = 1.2
    r = p.add_run(
        "Cara memperbarui: klik kanan pada daftar isi di Microsoft Word, pilih "
        "Update Field, lalu pilih Update entire table. Nomor halaman dihitung "
        "oleh Word, bukan oleh RapiMakalah."
    )
    r.italic = True
    r.font.size = Pt(10)


def build_body(doc, lines):
    pending_page_break = False
    first_heading = True
    i = 0
    total = len(lines)

    while i < total:
        raw = lines[i]
        line = raw.rstrip()
        stripped = line.strip()

        if not stripped:
            i += 1
            continue

        if stripped == "---":
            i += 1
            continue

        # Heading
        m = re.match(r"^(#{1,4})\s+(.*)$", stripped)
        if m:
            level = len(m.group(1))
            text = m.group(2).strip()
            if text.upper() == "DAFTAR ISI":
                # Dilewati: daftar isi dibuat sebagai field TOC Word.
                i += 1
                while i < total and not re.match(r"^#{1,4}\s+", lines[i].strip()):
                    i += 1
                continue
            if level == 2 and text.upper() in {"KATA PENGANTAR", "DAFTAR TABEL"}:
                level = 1
            page_break = level == 1 and not first_heading
            build_heading(doc, level, text, page_break=page_break)
            if level == 1:
                first_heading = False
            i += 1
            continue

        # Blok kode
        if stripped.startswith("```"):
            i += 1
            code_lines = []
            while i < total and not lines[i].strip().startswith("```"):
                code_lines.append(lines[i].rstrip("\n"))
                i += 1
            i += 1
            p = doc.add_paragraph()
            pf = p.paragraph_format
            pf.line_spacing = 1.0
            pf.space_before = Pt(6)
            pf.space_after = Pt(10)
            pf.left_indent = Cm(0.4)
            pf.right_indent = Cm(0.2)
            pf.alignment = WD_ALIGN_PARAGRAPH.LEFT
            pf.keep_together = True
            shade(p._p, "F2F2F2")
            for idx, code_line in enumerate(code_lines):
                run = p.add_run(code_line)
                run.font.name = MONO
                run._element.rPr.rFonts.set(qn("w:eastAsia"), MONO)
                run.font.size = Pt(9)
                if idx < len(code_lines) - 1:
                    run.add_break()
            continue

        # Tabel
        if stripped.startswith("|"):
            table_lines = []
            while i < total and lines[i].strip().startswith("|"):
                table_lines.append(lines[i].strip())
                i += 1
            add_table(doc, table_lines)
            continue

        # Kutipan
        if stripped.startswith(">"):
            quote = []
            while i < total and lines[i].strip().startswith(">"):
                quote.append(lines[i].strip().lstrip(">").strip())
                i += 1
            p = doc.add_paragraph()
            pf = p.paragraph_format
            pf.left_indent = Cm(0.8)
            pf.right_indent = Cm(0.4)
            pf.space_before = Pt(6)
            pf.space_after = Pt(8)
            pf.line_spacing = 1.2
            pf.alignment = WD_ALIGN_PARAGRAPH.LEFT
            shade(p._p, "F6F3EA")
            add_inline(p, " ".join(quote), size=11)
            for run in p.runs:
                run.italic = True
            continue

        # Daftar berbutir
        m = re.match(r"^(\s*)[-*]\s+(.*)$", line)
        if m:
            indent = len(m.group(1)) // 2
            add_list_item(doc, m.group(2), level=indent, marker="\u2022")
            i += 1
            continue

        # Daftar bernomor
        m = re.match(r"^(\s*)(\d+)\.\s+(.*)$", line)
        if m:
            indent = len(m.group(1)) // 2
            add_list_item(doc, m.group(3), level=indent, marker=f"{m.group(2)}.")
            i += 1
            continue

        # Paragraf biasa
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        add_inline(p, stripped)

        if re.match(r"^Tabel\s+\d+\.", stripped):
            for run in p.runs:
                run.bold = True
            p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT
            p.paragraph_format.space_before = Pt(10)
            p.paragraph_format.space_after = Pt(4)
            p.paragraph_format.keep_with_next = True
        elif re.match(r"^\*\*(?!\s).+\*\*$", stripped):
            # Pertanyaan FAQ: tebal dan menempel pada jawabannya.
            p.paragraph_format.space_before = Pt(8)
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.keep_with_next = True
        i += 1


def add_list_item(doc, text, level=0, marker="\u2022"):
    p = doc.add_paragraph()
    pf = p.paragraph_format
    pf.left_indent = Cm(0.75 + 0.75 * level)
    pf.first_line_indent = Cm(-0.6)
    pf.space_before = Pt(0)
    pf.space_after = Pt(4)
    pf.line_spacing = 1.3
    pf.alignment = WD_ALIGN_PARAGRAPH.LEFT
    pf.tab_stops.add_tab_stop(Cm(0.75 + 0.75 * level))
    run = p.add_run(marker)
    run.font.name = FONT
    p.add_run("\t")
    add_inline(p, text)


def add_table(doc, table_lines):
    rows = []
    for line in table_lines:
        if re.match(r"^\|[\s:\-|]+\|$", line):
            continue
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        rows.append(cells)
    if not rows:
        return

    cols = max(len(r) for r in rows)
    table = doc.add_table(rows=0, cols=cols)
    table.style = "Table Grid"
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = True
    set_table_borders(table)

    total_width = Cm(CONTENT_WIDTH_CM)
    base_width = int(total_width / cols)

    for r_idx, row in enumerate(rows):
        cells = table.add_row().cells
        set_cant_split(table.rows[-1])
        if r_idx == 0:
            set_repeat_header(table.rows[-1])
        for c_idx in range(cols):
            text = row[c_idx] if c_idx < len(row) else ""
            cell = cells[c_idx]
            cell.width = base_width
            if r_idx == 0:
                shade_cell(cell, "DCE3EF")
            p = cell.paragraphs[0]
            pf = p.paragraph_format
            pf.space_before = Pt(1)
            pf.space_after = Pt(1)
            pf.line_spacing = 1.1
            pf.alignment = WD_ALIGN_PARAGRAPH.LEFT
            add_inline(p, text, size=9.5)
            if r_idx == 0:
                for run in p.runs:
                    run.bold = True
            set_cell_margins(cell, top=50, bottom=50, left=90, right=90)

    # Jarak setelah tabel
    spacer = doc.add_paragraph()
    spacer.paragraph_format.space_before = Pt(0)
    spacer.paragraph_format.space_after = Pt(6)
    spacer.paragraph_format.line_spacing = 1.0


def add_body_footer(section):
    section.footer.is_linked_to_previous = False
    footer = section.footer
    p = footer.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(0)
    add_field(p, "PAGE", "1")
    for run in p.runs:
        run.font.name = FONT
        run.font.size = Pt(10)


def main():
    text = SOURCE.read_text(encoding="utf-8")
    lines = text.splitlines()

    # Badan dokumen dimulai pada KATA PENGANTAR; sisanya dibangun manual.
    start = next(
        idx for idx, line in enumerate(lines)
        if re.match(r"^#{1,3}\s+KATA PENGANTAR\s*$", line.strip())
    )
    body_lines = lines[start:]

    doc = Document()
    setup_styles(doc)

    section = doc.sections[0]
    setup_page(section)

    build_cover(doc)
    build_title_page(doc)
    build_toc_page(doc)

    # Bagian baru: nomor halaman mulai dari 1 pada KATA PENGANTAR.
    body_section = doc.add_section(WD_SECTION.NEW_PAGE)
    setup_page(body_section)
    add_body_footer(body_section)

    build_body(doc, body_lines)

    doc.core_properties.title = "Manual Book RapiMakalah"
    doc.core_properties.subject = (
        "Panduan instalasi, penggunaan, dan pemeliharaan aplikasi web RapiMakalah"
    )
    doc.core_properties.author = "RapiMakalah"
    doc.core_properties.keywords = "manual book, rapimakalah, docx, panduan"
    doc.core_properties.comments = "Dihasilkan dari docs/MANUAL-BOOK-RAPIMAKALAH.md"

    doc.save(TARGET)
    print(f"OK: {TARGET}")
    print(f"Paragraf: {len(doc.paragraphs)}  Tabel: {len(doc.tables)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
