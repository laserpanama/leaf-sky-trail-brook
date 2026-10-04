import { useState } from "react";

/** Read-only star row. */
export function Stars({ value, size = "text-base", label }: { value: number; size?: string; label?: string }) {
  const full = Math.round(value * 2) / 2;
  return (
    <span className={`inline-flex tracking-[0.12em] ${size}`} role="img" aria-label={label ?? `${value} / 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} aria-hidden className={n <= full ? "text-brass" : n - 0.5 === full ? "text-brass/60" : "text-line"}>
          ★
        </span>
      ))}
    </span>
  );
}

/** Accessible 1–5 star picker (radio group, keyboard friendly). */
export function StarPicker({
  value,
  onChange,
  legend,
  starLabel,
}: {
  value: number;
  onChange: (n: number) => void;
  legend: string;
  starLabel: (n: number) => string;
}) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <fieldset className="grid gap-2">
      <legend className="text-sm text-muted">{legend}</legend>
      <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <label
            key={n}
            className="cursor-pointer"
            onMouseEnter={() => setHover(n)}
            title={starLabel(n)}
          >
            <input
              type="radio"
              name="stars"
              value={n}
              checked={value === n}
              onChange={() => onChange(n)}
              className="peer sr-only"
            />
            <span
              aria-hidden
              className={`flex h-12 w-12 items-center justify-center text-4xl leading-none transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-brass ${
                n <= shown ? "text-brass" : "text-line"
              }`}
            >
              ★
            </span>
            <span className="sr-only">{starLabel(n)}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
