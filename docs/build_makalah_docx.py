# -*- coding: utf-8 -*-
"""Build the RapiMakalah manual-book paper as a formatted Word document."""

import re
import sys
from pathlib import Path

from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor, Twips

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "MAKALAH-MANUAL-BOOK-RAPIMAKALAH.md"
TARGET = ROOT / "MAKALAH-MANUAL-BOOK-RAPIMAKALAH.docx"
FONT = "Times New Roman"

# Marker and text positions aligned with server/src/docx/listIndent.js so the
# app's own formatter keeps our list indentation intact.
LIST_TEXT_START = 1159
LIST_MARKER_WIDTH = 450


def set_cell_shading(cell, color):
    shd = OxmlElement("w:shd")
    shd.set(qn("w:fill"), color)
    cell._tc.get_or_add_tcPr().append(shd)


def set_table_borders(table):
    borders = OxmlElement("w:tblBorders")
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        tag = OxmlElement(f"w:{edge}")
        tag.set(qn("w:val"), "single")
        tag.set(qn("w:sz"), "4")
        tag.set(qn("w:color"), "A6A6A6")
        borders.append(tag)
    table._tbl.tblPr.append(borders)


def _next_numbering_ids(numbering):
    abstract_ids = [
        int(node.get(qn("w:abstractNumId")))
        for node in numbering.findall(qn("w:abstractNum"))
    ]
    num_ids = [
        int(node.get(qn("w:numId")))
        for node in numbering.findall(qn("w:num"))
    ]
    return max(abstract_ids, default=-1) + 1, max(num_ids, default=0) + 1


def create_numbering(doc, start=1, kind="decimal"):
    """Create a dedicated abstractNum + num pair and return its numId.

    Every Markdown list gets its own numbering instance so Word restarts the
    counter at the label written in the source instead of continuing a shared
    built-in ``List Number`` sequence.
    """
    numbering = doc.part.numbering_part.element
    abstract_id, num_id = _next_numbering_ids(numbering)

    abstract = OxmlElement("w:abstractNum")
    abstract.set(qn("w:abstractNumId"), str(abstract_id))
    multi_level = OxmlElement("w:multiLevelType")
    multi_level.set(qn("w:val"), "singleLevel")
    abstract.append(multi_level)

    level = OxmlElement("w:lvl")
    level.set(qn("w:ilvl"), "0")
    start_node = OxmlElement("w:start")
    start_node.set(qn("w:val"), str(start))
    level.append(start_node)
    fmt = OxmlElement("w:numFmt")
    fmt.set(qn("w:val"), "bullet" if kind == "bullet" else "decimal")
    level.append(fmt)
    marker = OxmlElement("w:lvlText")
    marker.set(qn("w:val"), "\u2022" if kind == "bullet" else "%1.")
    level.append(marker)
    justify = OxmlElement("w:lvlJc")
    justify.set(qn("w:val"), "left")
    level.append(justify)

    ppr = OxmlElement("w:pPr")
    tabs = OxmlElement("w:tabs")
    tab = OxmlElement("w:tab")
    tab.set(qn("w:val"), "num")
    tab.set(qn("w:pos"), str(LIST_TEXT_START))
    tabs.append(tab)
    ppr.append(tabs)
    indent = OxmlElement("w:ind")
    indent.set(qn("w:left"), str(LIST_TEXT_START))
    indent.set(qn("w:hanging"), str(LIST_MARKER_WIDTH))
    ppr.append(indent)
    level.append(ppr)
    abstract.append(level)

    first_num = numbering.find(qn("w:num"))
    if first_num is not None:
        first_num.addprevious(abstract)
    else:
        numbering.append(abstract)

    num = OxmlElement("w:num")
    num.set(qn("w:numId"), str(num_id))
    abstract_ref = OxmlElement("w:abstractNumId")
    abstract_ref.set(qn("w:val"), str(abstract_id))
    num.append(abstract_ref)
    numbering.append(num)
    return num_id


def apply_numbering(paragraph, num_id, level=0):
    ppr = paragraph._p.get_or_add_pPr()
    num_pr = ppr.get_or_add_numPr()
    ilvl = OxmlElement("w:ilvl")
    ilvl.set(qn("w:val"), str(level))
    num_pr.append(ilvl)
    num_ref = OxmlElement("w:numId")
    num_ref.set(qn("w:val"), str(num_id))
    num_pr.append(num_ref)
    paragraph.paragraph_format.left_indent = Twips(LIST_TEXT_START)
    paragraph.paragraph_format.first_line_indent = Twips(-LIST_MARKER_WIDTH)


def add_field(paragraph, instruction, placeholder="1"):
    for kind, text in (("begin", None), (None, instruction), ("separate", None), (None, placeholder), ("end", None)):
        run = paragraph.add_run()
        if kind:
            field = OxmlElement("w:fldChar")
            field.set(qn("w:fldCharType"), kind)
            run._r.append(field)
        elif text == instruction:
            node = OxmlElement("w:instrText")
            node.set(qn("xml:space"), "preserve")
            node.text = text
            run._r.append(node)
        else:
            run.text = text


def add_page_number(section):
    footer = section.footer.paragraphs[0]
    footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
    footer.paragraph_format.space_before = Pt(0)
    footer.paragraph_format.space_after = Pt(0)
    add_field(footer, "PAGE")
    for run in footer.runs:
        run.font.name = FONT
        run.font.size = Pt(10)
    numbering = OxmlElement("w:pgNumType")
    numbering.set(qn("w:start"), "1")
    section._sectPr.append(numbering)


def configure_document(doc):
    for section in doc.sections:
        section.page_width = Cm(21)
        section.page_height = Cm(29.7)
        section.top_margin = Cm(3)
        section.bottom_margin = Cm(3)
        section.left_margin = Cm(4)
        section.right_margin = Cm(3)
        section.header_distance = Cm(1.5)
        section.footer_distance = Cm(1.5)

    normal = doc.styles["Normal"]
    normal.font.name = FONT
    normal.font.size = Pt(12)
    normal.font.color.rgb = RGBColor(0, 0, 0)
    normal._element.rPr.rFonts.set(qn("w:eastAsia"), FONT)
    normal.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    normal.paragraph_format.line_spacing = 1.5
    normal.paragraph_format.space_after = Pt(6)
    normal.paragraph_format.widow_control = True

    specs = {
        "Heading 1": (16, WD_ALIGN_PARAGRAPH.CENTER, 16, 12),
        "Heading 2": (13, WD_ALIGN_PARAGRAPH.LEFT, 12, 5),
        "Heading 3": (12, WD_ALIGN_PARAGRAPH.LEFT, 9, 4),
    }
    for name, (size, align, before, after) in specs.items():
        style = doc.styles[name]
        style.font.name = FONT
        style.font.size = Pt(size)
        style.font.bold = True
        style.font.color.rgb = RGBColor(0, 0, 0)
        style._element.rPr.rFonts.set(qn("w:eastAsia"), FONT)
        style.paragraph_format.alignment = align
        style.paragraph_format.space_before = Pt(before)
        style.paragraph_format.space_after = Pt(after)
        style.paragraph_format.line_spacing = 1.15
        style.paragraph_format.keep_with_next = True
        style.paragraph_format.keep_together = True


def add_title_line(doc, text, size, bold=False, italic=False, after=6):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(after)
    r = p.add_run(text)
    r.font.name = FONT
    r.font.size = Pt(size)
    r.bold = bold
    r.italic = italic
    return p


def add_cover(doc):
    p = add_title_line(doc, "MAKALAH MANUAL BOOK", 20, bold=True, after=8)
    p.paragraph_format.space_before = Pt(54)
    add_title_line(doc, "RAPIMAKALAH", 32, bold=True, after=14)
    add_title_line(doc, "Panduan Instalasi dan Penggunaan Program", 15, italic=True, after=4)
    add_title_line(doc, "Aplikasi Web Perapi Format Dokumen Akademik", 14, after=20)
    p = add_title_line(doc, "Disusun untuk memenuhi dokumentasi program", 12, after=6)
    p.paragraph_format.space_before = Pt(72)
    add_title_line(doc, "Nama Penyusun: ................................................", 12, after=4)
    add_title_line(doc, "Institusi: ..............................................................", 12, after=4)
    add_title_line(doc, "Program Studi: ...................................................", 12, after=4)
    p = add_title_line(doc, "2026", 14, bold=True, after=0)
    p.paragraph_format.space_before = Pt(54)


def add_title_page(doc):
    doc.add_page_break()
    p = add_title_line(doc, "HALAMAN JUDUL", 16, bold=True, after=30)
    p.paragraph_format.space_before = Pt(54)
    add_title_line(doc, "MAKALAH MANUAL BOOK RAPIMAKALAH", 18, bold=True, after=12)
    add_title_line(doc, "Sistematika Instalasi dan Penggunaan Program", 14, italic=True, after=30)
    rows = [
        ("Nama penyusun", "................................................"),
        ("Institusi", "................................................"),
        ("Program studi", "................................................"),
        ("Tahun", "2026"),
    ]
    table = doc.add_table(rows=0, cols=2)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    table.columns[0].width = Cm(4.5)
    table.columns[1].width = Cm(9.5)
    set_table_borders(table)
    for left, right in rows:
        cells = table.add_row().cells
        cells[0].width, cells[1].width = Cm(4.5), Cm(9.5)
        set_cell_shading(cells[0], "E8EDF5")
        for index, value in enumerate((left, right)):
            p = cells[index].paragraphs[0]
            p.paragraph_format.line_spacing = 1.15
            p.paragraph_format.space_after = Pt(2)
            run = p.add_run(value)
            run.font.name = FONT
            run.font.size = Pt(11)
            run.bold = index == 0
    note = doc.add_paragraph("Makalah disusun dengan merujuk pada dokumentasi README proyek RapiMakalah.")
    note.alignment = WD_ALIGN_PARAGRAPH.CENTER
    note.paragraph_format.space_before = Pt(36)


def add_preliminary(doc, heading, body):
    doc.add_page_break()
    p = doc.add_paragraph(heading, style="Title")
    p.paragraph_format.page_break_before = False
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(18)
    for run in p.runs:
        run.font.name = FONT
        run.font.size = Pt(16)
        run.bold = True
        run.font.color.rgb = RGBColor(0, 0, 0)
    for paragraph in body:
        p = doc.add_paragraph(paragraph)
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY


def add_toc_page(doc):
    doc.add_page_break()
    title = doc.add_paragraph("DAFTAR ISI", style="Title")
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    title.paragraph_format.space_after = Pt(18)
    for run in title.runs:
        run.font.name = FONT
        run.font.size = Pt(16)
        run.bold = True
        run.font.color.rgb = RGBColor(0, 0, 0)
    p = doc.add_paragraph()
    add_field(p, 'TOC \\o "1-3" \\h \\z \\u', "Klik kanan dan pilih Update Field untuk membuat daftar isi.")
    note = doc.add_paragraph("Daftar isi menggunakan field Word. Setelah membuka dokumen, pilih Update entire table agar nomor halaman diperbarui.")
    note.paragraph_format.space_before = Pt(12)
    for run in note.runs:
        run.italic = True


def _title_paragraph(doc, text):
    title = doc.add_paragraph(text, style="Title")
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    title.paragraph_format.space_after = Pt(18)
    for run in title.runs:
        run.font.name = FONT
        run.font.size = Pt(16)
        run.bold = True
        run.font.color.rgb = RGBColor(0, 0, 0)
    return title


def add_figure_list(doc):
    """Daftar gambar berbasis field TOC yang membaca caption SEQ Gambar."""
    doc.add_page_break()
    _title_paragraph(doc, "DAFTAR GAMBAR")
    p = doc.add_paragraph()
    add_field(p, 'TOC \\h \\z \\c "Gambar"', "Daftar gambar akan muncul setelah field diperbarui di Microsoft Word.")
    note = doc.add_paragraph(
        "Daftar gambar memakai field Word. Saat dokumen dibuka, Word memperbarui field "
        "secara otomatis; bila belum, tekan Ctrl+A lalu F9 untuk menampilkan judul dan nomor halaman."
    )
    note.paragraph_format.space_before = Pt(12)
    for run in note.runs:
        run.italic = True
        run.font.name = FONT
        run.font.size = Pt(10)


def add_figure(doc, image_path, caption, number):
    paragraph = doc.add_paragraph()
    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    paragraph.paragraph_format.space_before = Pt(10)
    paragraph.paragraph_format.space_after = Pt(4)
    paragraph.paragraph_format.keep_with_next = True
    paragraph.add_run().add_picture(str(image_path), width=Cm(13.2))

    try:
        cap = doc.add_paragraph(style="Caption")
    except KeyError:
        cap = doc.add_paragraph()
    cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    cap.paragraph_format.space_after = Pt(12)
    cap.add_run("Gambar ")
    add_field(cap, "SEQ Gambar \\* ARABIC", str(number))
    cap.add_run(f". {caption}")
    for run in cap.runs:
        run.font.name = FONT
        run.font.size = Pt(10)
        run.italic = False


def add_inline(paragraph, text):
    # Preserve simple bold, italic, and inline-code styling from the Markdown source.
    pattern = re.compile(r"(\*\*.+?\*\*|\*[^*]+\*|`[^`]+`)")
    for token in pattern.split(text):
        if not token:
            continue
        if token.startswith("**") and token.endswith("**"):
            run = paragraph.add_run(token[2:-2])
            run.bold = True
        elif token.startswith("*") and token.endswith("*"):
            run = paragraph.add_run(token[1:-1])
            run.italic = True
        elif token.startswith("`") and token.endswith("`"):
            run = paragraph.add_run(token[1:-1])
            run.font.name = "Consolas"
            run.font.size = Pt(10)
        else:
            paragraph.add_run(token)
    for run in paragraph.runs:
        if not run.font.name:
            run.font.name = FONT


def add_markdown_table(doc, lines):
    rows = []
    for line in lines:
        if re.match(r"^\|[\s:\-|]+\|$", line.strip()):
            continue
        rows.append([cell.strip() for cell in line.strip().strip("|").split("|")])
    if not rows:
        return
    cols = max(len(row) for row in rows)
    table = doc.add_table(rows=0, cols=cols)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = True
    set_table_borders(table)
    for ridx, row in enumerate(rows):
        cells = table.add_row().cells
        for cidx in range(cols):
            cell = cells[cidx]
            if ridx == 0:
                set_cell_shading(cell, "DCE3EF")
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            p.paragraph_format.line_spacing = 1.1
            p.paragraph_format.space_after = Pt(2)
            add_inline(p, row[cidx] if cidx < len(row) else "")
            for run in p.runs:
                run.font.size = Pt(9.5)
                if ridx == 0:
                    run.bold = True
    doc.add_paragraph().paragraph_format.space_after = Pt(4)


def add_body(doc, markdown):
    lines = markdown.splitlines()
    i = 0
    first_chapter = True
    figure_number = 0
    ordered_state = {"num_id": None, "next": None}
    bullet_num_id = None

    def reset_lists():
        ordered_state["num_id"] = None
        ordered_state["next"] = None

    def next_content_line(index):
        while index < len(lines) and not lines[index].strip():
            index += 1
        return lines[index].strip() if index < len(lines) else ""

    def add_list_boundary_if_needed(index, ordered):
        following = next_content_line(index + 1)
        if ordered and re.match(r"^\d+\.\s+", following):
            return
        if not ordered and re.match(r"^[-*]\s+", following):
            return
        # Preserve a real Markdown block boundary so the formatter won't mistake
        # the next prose paragraph for a continuation of the last list item.
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)

    while i < len(lines):
        text = lines[i].strip()
        if not text or text == "---":
            i += 1
            continue
        image = re.match(r"^!\[(.+?)\]\((.+?)\)\s*$", text)
        if image:
            reset_lists()
            caption, relative = image.groups()
            image_path = (SOURCE.parent / relative).resolve()
            if image_path.exists():
                figure_number += 1
                add_figure(doc, image_path, caption, figure_number)
            else:
                print(f"[warn] gambar tidak ditemukan: {image_path}")
            i += 1
            continue
        heading = re.match(r"^(#{1,3})\s+(.+)$", text)
        if heading:
            reset_lists()
            level = len(heading.group(1))
            title = heading.group(2)
            if title in {"PRAKATA", "DAFTAR GAMBAR", "DAFTAR TABEL", "DAFTAR ISI"}:
                i += 1
                continue
            p = doc.add_paragraph(title, style=f"Heading {min(level, 3)}")
            if level == 1 and title.upper().startswith("BAB "):
                if first_chapter:
                    first_chapter = False
                else:
                    p.paragraph_format.page_break_before = True
            elif level == 1:
                p.paragraph_format.page_break_before = True
            i += 1
            continue
        if text.startswith("|"):
            reset_lists()
            table_lines = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                table_lines.append(lines[i].strip())
                i += 1
            add_markdown_table(doc, table_lines)
            continue
        if text.startswith("```"):
            reset_lists()
            i += 1
            block = []
            while i < len(lines) and not lines[i].strip().startswith("```"):
                block.append(lines[i])
                i += 1
            i += 1
            p = doc.add_paragraph()
            p.paragraph_format.left_indent = Cm(0.4)
            p.paragraph_format.right_indent = Cm(0.2)
            p.paragraph_format.line_spacing = 1.0
            for n, code_line in enumerate(block):
                run = p.add_run(code_line)
                run.font.name = "Consolas"
                run.font.size = Pt(9)
                if n < len(block) - 1:
                    run.add_break()
            continue
        if text.startswith("> "):
            reset_lists()
            p = doc.add_paragraph()
            p.paragraph_format.left_indent = Cm(0.8)
            p.paragraph_format.right_indent = Cm(0.4)
            p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT
            add_inline(p, text[2:])
            i += 1
            continue
        bullet = re.match(r"^[-*]\s+(.+)$", text)
        number = re.match(r"^(\d+)\.\s+(.+)$", text)
        if bullet:
            if bullet_num_id is None:
                bullet_num_id = create_numbering(doc, start=1, kind="bullet")
            p = doc.add_paragraph()
            p.paragraph_format.line_spacing = 1.3
            apply_numbering(p, bullet_num_id)
            add_inline(p, bullet.group(1))
            add_list_boundary_if_needed(i, ordered=False)
            i += 1
            continue
        if number:
            label = int(number.group(1))
            if ordered_state["num_id"] is not None and ordered_state["next"] == label:
                num_id = ordered_state["num_id"]
            else:
                num_id = create_numbering(doc, start=label)
                ordered_state["num_id"] = num_id
            ordered_state["next"] = label + 1
            p = doc.add_paragraph()
            p.paragraph_format.line_spacing = 1.3
            apply_numbering(p, num_id)
            add_inline(p, number.group(2))
            add_list_boundary_if_needed(i, ordered=True)
            i += 1
            continue
        reset_lists()
        p = doc.add_paragraph()
        add_inline(p, text)
        i += 1


def main():
    target = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else TARGET
    markdown = SOURCE.read_text(encoding="utf-8")
    doc = Document()
    configure_document(doc)
    add_cover(doc)
    add_title_page(doc)

    add_preliminary(doc, "PRAKATA", [
        "Puji syukur ke hadirat Tuhan Yang Maha Esa. Makalah manual book ini disusun sebagai panduan untuk mengenal, memasang, dan menggunakan RapiMakalah, yaitu aplikasi web yang membantu memeriksa dan merapikan format dokumen akademik Microsoft Word (.docx). Materi disarikan dan diperbarui dari README proyek RapiMakalah.",
        "RapiMakalah memproses struktur OOXML pada dokumen Word asli agar isi, tabel, gambar, hyperlink, dan catatan kaki tetap dapat digunakan. Aplikasi menyediakan pemeriksaan format, penerapan aturan melalui template, pratinjau dokumen, pengelolaan dokumen, galeri template, serta workspace untuk menulis dan mengekspor draft.",
        "Makalah ini ditujukan terutama kepada pengguna dan operator aplikasi. Penjelasan instalasi ditujukan kepada operator yang memiliki akses ke source code. Setiap institusi dapat memiliki pedoman penulisan berbeda; oleh sebab itu, template dan hasil pemformatan tetap perlu dicocokkan dengan pedoman resmi institusi dan diperiksa kembali di Microsoft Word.",
        "Penyusun menyadari makalah ini masih dapat disempurnakan. Kolom identitas pada cover dan halaman judul sengaja disediakan agar dapat dilengkapi oleh penyusun.",
    ])
    add_figure_list(doc)
    add_preliminary(doc, "DAFTAR TABEL", [])
    add_toc_page(doc)

    body_section = doc.add_section(WD_SECTION.NEW_PAGE)
    body_section.page_width = Cm(21)
    body_section.page_height = Cm(29.7)
    body_section.top_margin = Cm(3)
    body_section.bottom_margin = Cm(3)
    body_section.left_margin = Cm(4)
    body_section.right_margin = Cm(3)
    body_section.footer.is_linked_to_previous = False
    add_page_number(body_section)

    # Body begins at BAB I; front matter is built explicitly above.
    start = markdown.index("# BAB I PENDAHULUAN")
    body = markdown[start:]
    body = re.sub(
        r"(### 3\.12\.[12] [^\n]+\n)\n(?=### |# DAFTAR PUSTAKA)",
        r"\1",
        body,
    )
    add_body(doc, body)

    doc.core_properties.title = "Makalah Manual Book RapiMakalah"
    doc.core_properties.subject = "Sistematika instalasi dan penggunaan program RapiMakalah"
    doc.core_properties.author = "RapiMakalah"
    doc.core_properties.keywords = "makalah, manual book, RapiMakalah, DOCX"

    # Minta Word memperbarui field (daftar isi dan daftar gambar) saat dokumen dibuka.
    update_fields = OxmlElement("w:updateFields")
    update_fields.set(qn("w:val"), "true")
    doc.settings.element.append(update_fields)

    doc.save(target)
    print(f"Created {target} ({target.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()
