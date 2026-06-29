import { useRef, useState } from "react";

type Props = {
  acceptedExtensions: string[];
  onFiles: (files: File[]) => void;
};

export default function Dropzone({ acceptedExtensions, onFiles }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const accept = acceptedExtensions.join(",");

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) onFiles(files);
  }

  function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length) onFiles(files);
    e.target.value = "";
  }

  return (
    <div
      className={`dropzone${dragOver ? " dropzone--over" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept}
        onChange={handleSelect}
        hidden
      />
      <p className="dropzone__title">Drag &amp; drop files here</p>
      <p className="dropzone__hint">or click to browse</p>
      {acceptedExtensions.length > 0 && (
        <p className="dropzone__exts">{acceptedExtensions.join("  ")}</p>
      )}
    </div>
  );
}
