// Extracts the text layer of a PDF as line-reconstructed plain text.
// This module is dynamically imported so pdf.js only loads when a PDF is used.
import * as pdfjs from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

export async function extractPdfText(file) {
  const data = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data }).promise;
  const out = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const tc = await page.getTextContent();
    // Group text items into visual lines by their y position (with tolerance),
    // then order lines top→bottom and items left→right.
    const buckets = [];
    for (const it of tc.items) {
      const s = (it.str || "").trim();
      if (!s) continue;
      const y = it.transform[5], x = it.transform[4];
      let b = buckets.find((bk) => Math.abs(bk.y - y) <= 2.5);
      if (!b) { b = { y, items: [] }; buckets.push(b); }
      b.items.push({ x, s });
    }
    buckets.sort((a, b) => b.y - a.y);
    for (const b of buckets) {
      b.items.sort((a, c) => a.x - c.x);
      out.push(b.items.map((i) => i.s).join(" "));
    }
    out.push("");
  }
  try { doc.destroy(); } catch (e) {}
  return out.join("\n");
}
