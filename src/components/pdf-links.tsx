import { FileText } from "lucide-react";
import type { LinkRef } from "@/lib/types";

export function PdfLinks({ links }: { links: LinkRef[] }) {
  if (!links.length) return null;
  return (
    <div className="my-8 flex flex-col gap-2">
      {links.map((link) => (
        <a
          key={link.url}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium text-foreground transition-colors duration-150 ease-out hover:border-primary hover:text-primary"
        >
          <FileText size={20} className="shrink-0 text-primary" />
          <span>{link.title}</span>
          <span className="ml-auto text-xs text-muted-foreground">PDF</span>
        </a>
      ))}
    </div>
  );
}
