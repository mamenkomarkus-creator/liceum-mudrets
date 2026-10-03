"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useDialogFocus } from "@/lib/use-dialog-focus";

export function ImageGallery({
  images,
  sharedCaption,
  title = "Галерея",
}: {
  images: { src: string; caption?: string }[];
  sharedCaption?: string;
  title?: string;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocus(dialogRef, openIndex !== null);

  const close = useCallback(() => setOpenIndex(null), []);
  const prev = useCallback(
    () => setOpenIndex((i) => (i === null ? null : (i - 1 + images.length) % images.length)),
    [images.length]
  );
  const next = useCallback(
    () => setOpenIndex((i) => (i === null ? null : (i + 1) % images.length)),
    [images.length]
  );

  useEffect(() => {
    if (openIndex === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openIndex, close, prev, next]);

  if (!images.length) return null;

  return (
    <div className="my-10">
      <h3 className="font-display text-lg font-semibold text-foreground mb-4">{title}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {images.map((img, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setOpenIndex(i)}
            aria-label={`Відкрити фото ${i + 1} із ${images.length}${img.caption ? `: ${img.caption}` : ""}`}
            className="relative aspect-square overflow-hidden rounded-lg bg-muted group"
          >
            <Image
              src={img.src}
              alt={img.caption ?? `Фото ${i + 1}`}
              fill
              sizes="(max-width: 640px) 50vw, 240px"
              className="object-cover transition-transform duration-200 ease-out group-hover:scale-110"
            />
          </button>
        ))}
      </div>
      {sharedCaption && !images.some((i) => i.caption) ? (
        <p className="mt-3 text-sm text-muted-foreground italic">{sharedCaption}</p>
      ) : null}

      <AnimatePresence>
        {openIndex !== null && (
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={`Перегляд фото ${openIndex + 1} із ${images.length}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            onClick={close}
          >
            <button
              type="button"
              onClick={close}
              className="absolute right-4 top-4 text-white/80 hover:text-white transition-colors duration-150"
              aria-label="Закрити"
            >
              <X size={28} />
            </button>
            {images.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                className="absolute left-2 md:left-6 text-white/80 hover:text-white transition-colors duration-150"
                aria-label="Попереднє"
              >
                <ChevronLeft size={36} />
              </button>
            )}
            <motion.div
              key={openIndex}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="relative max-h-[85vh] max-w-4xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative w-full h-[70vh]">
                <Image
                  src={images[openIndex].src}
                  alt={images[openIndex].caption ?? `Фото ${openIndex + 1}`}
                  fill
                  sizes="90vw"
                  className="object-contain"
                />
              </div>
              {(images[openIndex].caption || sharedCaption) && (
                <p className="mt-3 text-center text-sm text-white/80">{images[openIndex].caption ?? sharedCaption}</p>
              )}
            </motion.div>
            {images.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                className="absolute right-2 md:right-6 text-white/80 hover:text-white transition-colors duration-150"
                aria-label="Наступне"
              >
                <ChevronRight size={36} />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
