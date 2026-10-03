export function TridentWatermark() {
  return (
    <div className="trident-watermark flex items-center justify-center gap-3 py-2 text-primary">
      <svg width="28" height="36" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <path
          d="M14 2c0 4-3 5-3 9s3 5 3 9M14 2c0 4 3 5 3 9s-3 5-3 9M14 2v9M9 10c0-3 2-6 2-6M19 10c0-3-2-6-2-6M11 20h6v4a3 3 0 0 1-3 3 3 3 0 0 1-3-3v-4Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Слава Україні! Героям слава!
      </span>
    </div>
  );
}
