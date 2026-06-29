import type { QueuedFile } from "../types";
import { downloadSingle, extensionFor } from "../download";

type Props = {
  item: QueuedFile;
  onRemove: (id: string) => void;
};

const STATUS_LABEL: Record<QueuedFile["status"], string> = {
  queued: "Queued",
  converting: "Converting…",
  done: "Done",
  failed: "Failed",
};

export default function FileRow({ item, onRemove }: Props) {
  return (
    <li className="filerow">
      <div className="filerow__main">
        <span className="filerow__name" title={item.file.name}>
          {item.file.name}
        </span>
        <span className={`chip chip--${item.status}`}>
          {STATUS_LABEL[item.status]}
        </span>
      </div>

      {item.status === "failed" && item.error && (
        <p className="filerow__error">{item.error}</p>
      )}

      {item.status === "done" && item.outputs && (
        <div className="filerow__actions">
          {Object.keys(item.outputs).map((format) => (
            <button
              key={format}
              className="btn btn--ghost"
              onClick={() => downloadSingle(item.file.name, format, item.outputs!)}
            >
              .{extensionFor(format)}
            </button>
          ))}
        </div>
      )}

      {item.status === "queued" && (
        <button
          className="filerow__remove"
          onClick={() => onRemove(item.id)}
          aria-label="Remove file"
        >
          ×
        </button>
      )}
    </li>
  );
}
