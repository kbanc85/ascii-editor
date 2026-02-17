import type { ExportMeta, AsciiExport } from "@/lib/types";

/**
 * Builds an AsciiExport object from metadata and frames.
 */
export function buildExport(
  meta: ExportMeta,
  frames: string[]
): AsciiExport {
  return { meta, frames };
}

/**
 * Triggers a browser download for the given content.
 */
function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exports ASCII data as a JSON file and triggers download.
 */
export function exportJSON(data: AsciiExport, filename: string) {
  downloadBlob(JSON.stringify(data, null, 2), filename, "application/json");
}

/**
 * Exports ASCII data as a TypeScript file with a typed const export.
 */
export function exportTypeScript(data: AsciiExport, filename: string) {
  const content = `export const asciiData = ${JSON.stringify(data, null, 2)} as const;\n`;
  downloadBlob(content, filename, "text/typescript");
}

/**
 * Wraps a single frame into an AsciiExport and triggers download.
 */
export function exportSingleFrame(
  meta: ExportMeta,
  frame: string,
  filename: string
) {
  const data = buildExport(meta, [frame]);
  exportJSON(data, filename);
}

/**
 * Generates a filename based on columns and FPS.
 */
export function generateFilename(
  cols: number,
  fps: number,
  ext: "json" | "ts"
): string {
  return `ascii-${cols}col-${fps}fps.${ext}`;
}
