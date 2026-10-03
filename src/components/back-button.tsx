"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function BackButton({
  label = "Назад до новин",
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  const router = useRouter();

  function handleClick() {
    if (window.history.length > 1) router.back();
    else router.push("/");
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary transition-transform duration-150 ease-out hover:-translate-x-0.5 ${className}`}
    >
      <ArrowLeft size={15} />
      {label}
    </button>
  );
}
