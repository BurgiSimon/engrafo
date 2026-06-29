import type { ConvertOptions, ConvertResult } from "./types";

export type FormatsInfo = {
  input_extensions: string[];
  output_formats: string[];
};

export async function fetchFormats(): Promise<FormatsInfo> {
  const res = await fetch("/api/formats");
  if (!res.ok) throw new Error("Failed to load formats");
  return res.json();
}

export async function convertFile(
  file: File,
  options: ConvertOptions
): Promise<ConvertResult> {
  const form = new FormData();
  form.append("file", file);
  form.append("formats", options.formats.join(","));
  form.append("ocr", String(options.ocr));
  form.append("tables", String(options.tables));
  form.append("images", String(options.images));

  const res = await fetch("/api/convert", { method: "POST", body: form });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || `Conversion failed (${res.status})`);
  }
  return data.outputs as ConvertResult;
}
