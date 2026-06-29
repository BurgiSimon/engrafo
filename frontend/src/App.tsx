import { useEffect, useMemo, useState } from "react";
import Dropzone from "./components/Dropzone";
import OptionsPanel from "./components/OptionsPanel";
import FileRow from "./components/FileRow";
import { convertFile, fetchFormats } from "./api";
import { downloadZip } from "./download";
import type { ConvertOptions, QueuedFile } from "./types";

const MAX_CONCURRENCY = 2;

const DEFAULT_OPTIONS: ConvertOptions = {
  formats: ["markdown"],
  ocr: false,
  tables: true,
  images: false,
};

let idCounter = 0;
function nextId(): string {
  idCounter += 1;
  return `f${idCounter}`;
}

export default function App() {
  const [acceptedExtensions, setAcceptedExtensions] = useState<string[]>([]);
  const [options, setOptions] = useState<ConvertOptions>(DEFAULT_OPTIONS);
  const [files, setFiles] = useState<QueuedFile[]>([]);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    fetchFormats()
      .then((info) => setAcceptedExtensions(info.input_extensions))
      .catch(() => setAcceptedExtensions([]));
  }, []);

  const queuedCount = files.filter((f) => f.status === "queued").length;
  const doneCount = files.filter((f) => f.status === "done").length;
  const canConvert =
    !running && queuedCount > 0 && options.formats.length > 0;

  const hasResults = useMemo(
    () => files.some((f) => f.status === "done" && f.outputs),
    [files]
  );

  function addFiles(incoming: File[]) {
    setFiles((prev) => [
      ...prev,
      ...incoming.map((file) => ({
        id: nextId(),
        file,
        status: "queued" as const,
      })),
    ]);
  }

  function removeFile(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  function clearAll() {
    setFiles([]);
  }

  function patch(id: string, update: Partial<QueuedFile>) {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...update } : f))
    );
  }

  async function runConversion() {
    setRunning(true);
    const queue = files.filter((f) => f.status === "queued").map((f) => f.id);

    let cursor = 0;
    async function worker() {
      while (cursor < queue.length) {
        const id = queue[cursor++];
        const item = files.find((f) => f.id === id);
        if (!item) continue;
        patch(id, { status: "converting", error: undefined });
        try {
          const outputs = await convertFile(item.file, options);
          patch(id, { status: "done", outputs });
        } catch (err) {
          patch(id, {
            status: "failed",
            error: err instanceof Error ? err.message : "Conversion failed",
          });
        }
      }
    }

    const workers = Array.from(
      { length: Math.min(MAX_CONCURRENCY, queue.length) },
      () => worker()
    );
    await Promise.all(workers);
    setRunning(false);
  }

  return (
    <div className="app">
      <header className="app__header">
        <h1>Docling File Converter</h1>
        <p>Convert documents to Markdown or lossless JSON, right in your browser.</p>
      </header>

      <Dropzone acceptedExtensions={acceptedExtensions} onFiles={addFiles} />

      <OptionsPanel options={options} disabled={running} onChange={setOptions} />

      <div className="toolbar">
        <button className="btn btn--primary" disabled={!canConvert} onClick={runConversion}>
          {running ? "Converting…" : `Convert ${queuedCount || ""}`.trim()}
        </button>
        <button
          className="btn"
          disabled={!hasResults || running}
          onClick={() => downloadZip(files)}
        >
          Download all (ZIP)
        </button>
        <button className="btn btn--ghost" disabled={!files.length || running} onClick={clearAll}>
          Clear
        </button>
        {files.length > 0 && (
          <span className="toolbar__status">
            {doneCount}/{files.length} done
          </span>
        )}
      </div>

      {files.length > 0 && (
        <ul className="filelist">
          {files.map((item) => (
            <FileRow key={item.id} item={item} onRemove={removeFile} />
          ))}
        </ul>
      )}
    </div>
  );
}
