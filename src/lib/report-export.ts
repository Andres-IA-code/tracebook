import { reportBlocks, reportColor, REPORT_PALETTE, type FinalReport } from "./reports";

async function imageSize(dataUrl: string) {
  const img = new Image(); img.src = dataUrl; await img.decode();
  return { width: img.naturalWidth, height: img.naturalHeight };
}
function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob); const link = document.createElement("a");
  link.href = url; link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 10000);
}
export async function exportFinalReport(r: FinalReport, format: "pdf" | "docx") {
  const filename = `Informe-${r.project.name.replace(/[^\p{L}\p{N}-]+/gu, "_")}-${r.version.replace(/[^\w.-]/g, "_")}-${r.id.slice(0, 8)}.${format}`;
  const blocks = reportBlocks(r); const primary = reportColor(r.branding.latexPrimaryColor);
  if (format === "docx") {
    const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun, HeadingLevel, WidthType, ShadingType, Header, Footer, PageNumber, AlignmentType } = await import("docx");
    const children: (InstanceType<typeof Paragraph> | InstanceType<typeof Table>)[] = [];
    const para = (text: string) => new Paragraph({ children: [new TextRun(text)], spacing: { after: 120 } });
    for (const block of blocks) {
      if (block.kind === "break") { children.push(new Paragraph({ pageBreakBefore: true })); continue; }
      if (block.kind === "image") {
        const size = await imageSize(block.dataUrl); const scale = Math.min((block.logo ? 180 : 570) / size.width, (block.logo ? 100 : 650) / size.height, 1);
        const bytes = Uint8Array.from(atob(block.dataUrl.split(",")[1] ?? ""), c => c.charCodeAt(0));
        children.push(new Paragraph({ children: [new ImageRun({ type: block.dataUrl.startsWith("data:image/png") ? "png" : "jpg", data: bytes, transformation: { width: size.width * scale, height: size.height * scale }, altText: { title: block.caption || "Logo", description: block.caption, name: block.caption || "Logo" } })] }));
        if (block.caption) children.push(para(block.caption)); continue;
      }
      if (block.kind === "table") {
        const cols = block.rows[0]?.length ?? 1; const widths = Array.from({ length: cols }, (_, i) => Math.floor(9026 / cols) + (i === cols - 1 ? 9026 % cols : 0));
        children.push(new Table({ width: { size: 9026, type: WidthType.DXA }, columnWidths: widths, rows: block.rows.map((row, rowIndex) => new TableRow({ tableHeader: rowIndex === 0, children: row.map((cell, i) => new TableCell({ width: { size: widths[i] ?? 9026, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, shading: { fill: REPORT_PALETTE.paper, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: cell, bold: rowIndex === 0, size: 20 })] })] })) })) })); continue;
      }
      if (block.kind === "chart") {
        const { width, height, dataUrl } = await chartImage(block.counts, primary);
        children.push(new Paragraph({ children: [new ImageRun({ type: "png", data: Uint8Array.from(atob(dataUrl.split(",")[1] ?? ""), c => c.charCodeAt(0)), transformation: { width: width / 2, height: height / 2 }, altText: { title: "Hallazgos por severidad", description: block.counts.map(c => `${c.severity}: ${c.count}`).join(", "), name: "Severidades" } })] })); continue;
      }
      if (block.kind === "text") { block.text.split(/\r?\n/).forEach(line => children.push(para(line))); continue; }
      children.push(new Paragraph({ heading: block.kind === "title" ? HeadingLevel.TITLE : HeadingLevel.HEADING_1, children: [new TextRun(block.text)] }));
    }
    const doc = new Document({ styles: { default: { document: { run: { font: "Arial", size: 24, color: REPORT_PALETTE.ink } } }, paragraphStyles: [{ id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: "Arial", size: 30, bold: true, color: REPORT_PALETTE.ink }, paragraph: { outlineLevel: 0, spacing: { before: 240, after: 160 }, keepNext: true, border: { bottom: { color: primary, size: 6, space: 4, style: "single" } } } }, { id: "Title", name: "Title", basedOn: "Normal", run: { font: "Arial", size: 48, bold: true, color: REPORT_PALETTE.ink } }] }, sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } }, headers: { default: new Header({ children: [para(r.branding.organization)] }) }, footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun(`${r.confidentiality} · ${r.version} · `), new TextRun({ children: [PageNumber.CURRENT] })] })] }) }, children }] });
    saveBlob(await Packer.toBlob(doc), filename); return;
  }
  const { jsPDF } = await import("jspdf"); const pdf = new jsPDF({ format: "a4", unit: "mm" }); let y = 22;
  const page = () => { pdf.addPage(); y = 22; };
  const ensure = (height: number) => { if (y + height > 274) page(); };
  const write = (text: string, size = 11, bold = false) => {
    pdf.setFont("helvetica", bold ? "bold" : "normal"); pdf.setFontSize(size); pdf.setTextColor(`#${REPORT_PALETTE.ink}`);
    const lines: string[] = pdf.splitTextToSize(text, 170); const lineHeight = size * 0.48;
    for (const line of lines) { ensure(lineHeight); pdf.text(line, 20, y); y += lineHeight; } y += 3;
  };
  for (const block of blocks) {
    if (block.kind === "break") { page(); continue; }
    if (block.kind === "image") {
      const size = await imageSize(block.dataUrl); const width = Math.min(block.logo ? 50 : 170, size.width * .2646); const height = Math.min(block.logo ? 28 : 215, width * size.height / size.width); const w = height * size.width / size.height;
      ensure(height + 5); pdf.addImage(block.dataUrl, block.dataUrl.startsWith("data:image/png") ? "PNG" : "JPEG", 20, y, w, height); y += height + 5;
      if (block.caption) write(block.caption, 10); continue;
    }
    if (block.kind === "chart") {
      ensure(68); const image = await chartImage(block.counts, primary); pdf.addImage(image.dataUrl, "PNG", 20, y, 170, 62); y += 70; continue;
    }
    if (block.kind === "table") {
      const cols = block.rows[0]?.length ?? 1; const width = 170 / cols;
      const drawRow = (row: string[], header: boolean) => {
        pdf.setFont("helvetica", header ? "bold" : "normal"); pdf.setFontSize(9);
        const cells = row.map(cell => pdf.splitTextToSize(cell, width - 4) as string[]); const maxLines = Math.max(...cells.map(cell => cell.length));
        let offset = 0;
        while (offset < maxLines) {
          if (y + 10 > 274) page();
          const count = Math.min(maxLines - offset, Math.max(1, Math.floor((274 - y - 4) / 4.5))); const height = count * 4.5 + 4;
          pdf.setDrawColor(`#${REPORT_PALETTE.line}`); pdf.setTextColor(`#${REPORT_PALETTE.ink}`);
          cells.forEach((cell, i) => { pdf.rect(20 + i * width, y, width, height); pdf.text(cell.slice(offset, offset + count), 22 + i * width, y + 5); });
          y += height; offset += count;
        }
      };
      block.rows.forEach((row, index) => { if (y + 20 > 274) { page(); const head = block.rows[0]; if (index && head) drawRow(head, true); } drawRow(row, index === 0); }); y += 6; continue;
    }
    if (block.kind !== "text") { ensure(22); pdf.setDrawColor(`#${primary}`); pdf.line(20, y - 4, 190, y - 4); }
    write(block.text, block.kind === "title" ? 24 : block.kind === "heading" ? 15 : 11, block.kind !== "text");
  }
  for (let i = 1; i <= pdf.getNumberOfPages(); i++) { pdf.setPage(i); pdf.setFontSize(8); pdf.setTextColor(`#${REPORT_PALETTE.muted}`); pdf.text(`${r.confidentiality} · v${r.version} · ${i}/${pdf.getNumberOfPages()}`, 20, 286); }
  saveBlob(pdf.output("blob"), filename);
}
async function chartImage(counts: { severity: string; count: number }[], primary: string) {
  const canvas = document.createElement("canvas"); canvas.width = 1140; canvas.height = 416;
  const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("No se pudo generar el gráfico.");
  ctx.fillStyle = `#${REPORT_PALETTE.paper}`; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.font = "24px Arial";
  const max = Math.max(1, ...counts.map(c => c.count));
  counts.forEach((c, i) => { const y = i * 66 + 30; ctx.fillStyle = `#${REPORT_PALETTE.ink}`; ctx.fillText(c.severity, 0, y + 8); ctx.fillStyle = `#${primary}`; ctx.fillRect(220, y - 15, 790 * c.count / max, 28); ctx.fillStyle = `#${REPORT_PALETTE.ink}`; ctx.fillText(String(c.count), 1050, y + 8); });
  return { width: canvas.width, height: canvas.height, dataUrl: canvas.toDataURL("image/png") };
}