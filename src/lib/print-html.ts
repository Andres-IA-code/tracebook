/** Prints an HTML document from a hidden iframe in the current window (works in web and Electron). */
export function printHtml(html: string): boolean {
  try {
    const frame = document.createElement("iframe");
    frame.setAttribute("aria-hidden", "true");
    frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
    document.body.appendChild(frame);
    const doc = frame.contentDocument; const win = frame.contentWindow;
    if (!doc || !win) { frame.remove(); throw new Error("no frame"); }
    doc.open(); doc.write(html.replace(/<script>window\.onload=\(\)=>window\.print\(\)<\/script>/, "")); doc.close();
    const run = () => { try { win.focus(); win.print(); } catch { window.alert("No se pudo abrir la impresión."); } setTimeout(() => frame.remove(), 60000); };
    if (doc.readyState === "complete") setTimeout(run, 150); else frame.onload = () => setTimeout(run, 150);
    return true;
  } catch {
    window.alert("No se pudo abrir la impresión. Probá exportar en formato HTML y luego imprimir.");
    return false;
  }
}
