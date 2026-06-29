import type { ConvertOptions, OutputFormat } from "../types";

type Props = {
  options: ConvertOptions;
  disabled: boolean;
  onChange: (options: ConvertOptions) => void;
};

const OUTPUT_LABELS: Record<OutputFormat, string> = {
  markdown: "Markdown",
  json: "JSON (lossless)",
};

export default function OptionsPanel({ options, disabled, onChange }: Props) {
  function toggleFormat(format: OutputFormat) {
    const has = options.formats.includes(format);
    const formats = has
      ? options.formats.filter((f) => f !== format)
      : [...options.formats, format];
    onChange({ ...options, formats });
  }

  return (
    <div className="options">
      <fieldset className="options__group" disabled={disabled}>
        <legend>Output formats</legend>
        {(Object.keys(OUTPUT_LABELS) as OutputFormat[]).map((format) => (
          <label key={format} className="options__item">
            <input
              type="checkbox"
              checked={options.formats.includes(format)}
              onChange={() => toggleFormat(format)}
            />
            {OUTPUT_LABELS[format]}
          </label>
        ))}
      </fieldset>

      <fieldset className="options__group" disabled={disabled}>
        <legend>Processing</legend>
        <label className="options__item">
          <input
            type="checkbox"
            checked={options.ocr}
            onChange={(e) => onChange({ ...options, ocr: e.target.checked })}
          />
          OCR (scanned docs / images)
        </label>
        <label className="options__item">
          <input
            type="checkbox"
            checked={options.tables}
            onChange={(e) => onChange({ ...options, tables: e.target.checked })}
          />
          Table structure
        </label>
        <label className="options__item">
          <input
            type="checkbox"
            checked={options.images}
            onChange={(e) => onChange({ ...options, images: e.target.checked })}
          />
          Export figures
        </label>
      </fieldset>
    </div>
  );
}
