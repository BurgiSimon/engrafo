import JSZip from "jszip";
import type { ConvertResult, QueuedFile } from "./types";

function baseName(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot > 0 ? filename.slice(0, dot) : filename;
}

export function serializeOutput(format: string, value: unknown): string {
  if (format === "json") return JSON.stringify(value, null, 2);
  return String(value ?? "");
}

export function extensionFor(format: string): string {
  return format === "json" ? "json" : "md";
}

function triggerDownload(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function downloadSingle(
  filename: string,
  format: string,
  outputs: ConvertResult
): void {
  const content = serializeOutput(format, outputs[format]);
  const mime = format === "json" ? "application/json" : "text/markdown";
  triggerDownload(
    new Blob([content], { type: mime }),
    `${baseName(filename)}.${extensionFor(format)}`
  );
}

export async function downloadZip(files: QueuedFile[]): Promise<void> {
  const zip = new JSZip();
  for (const f of files) {
    if (f.status !== "done" || !f.outputs) continue;
    for (const [format, value] of Object.entries(f.outputs)) {
      const name = `${baseName(f.file.name)}.${extensionFor(format)}`;
      zip.file(name, serializeOutput(format, value));
    }
  }
  const blob = await zip.generateAsync({ type: "blob" });
  triggerDownload(blob, "docling-results.zip");
}
