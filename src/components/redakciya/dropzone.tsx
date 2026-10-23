"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";

/** Drag files onto it or click to pick them from the computer. */
export function Dropzone({
  accept,
  onFiles,
  title,
  hint,
  compact = false,
  disabled = false,
}: {
  accept: string;
  onFiles: (files: File[]) => void;
  title: string;
  hint?: string;
  compact?: boolean;
  disabled?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  // dragenter/dragleave also fire for child elements; count them so the highlight does not flicker.
  const depth = useRef(0);

  const take = (list: FileList | null) => {
    const files = list ? Array.from(list) : [];
    if (files.length && !disabled) onFiles(files);
  };

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      onClick={() => !disabled && input.current?.click()}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !disabled) {
          e.preventDefault();
          input.current?.click();
        }
      }}
      onDragEnter={(e) => {
        e.preventDefault();
        depth.current += 1;
        setOver(true);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={() => {
        depth.current -= 1;
        if (depth.current <= 0) setOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        depth.current = 0;
        setOver(false);
        take(e.dataTransfer.files);
      }}
      className={`flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed text-center transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
        over ? "border-primary bg-primary/5" : "border-border bg-white hover:border-primary/50"
      } ${compact ? "gap-2 px-3 py-3 text-sm" : "flex-col gap-2 px-6 py-10"} ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
    >
      <Upload size={compact ? 16 : 26} className="shrink-0 text-primary" aria-hidden />
      <div>
        <p className={compact ? "font-medium text-foreground" : "font-display text-lg font-bold text-[#111]"}>{title}</p>
        {hint ? <p className={`text-muted-foreground ${compact ? "text-xs" : "mt-1 text-sm"}`}>{hint}</p> : null}
      </div>
      <input
        ref={input}
        type="file"
        accept={accept}
        multiple
        hidden
        onChange={(e) => {
          take(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
