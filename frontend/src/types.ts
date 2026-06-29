export type OutputFormat = "markdown" | "json";

export type ConvertOptions = {
  formats: OutputFormat[];
  ocr: boolean;
  tables: boolean;
  images: boolean;
};

export type FileStatus = "queued" | "converting" | "done" | "failed";

export type ConvertResult = {
  // markdown -> string, json -> object
  [format: string]: unknown;
};

export type QueuedFile = {
  id: string;
  file: File;
  status: FileStatus;
  error?: string;
  outputs?: ConvertResult;
};
