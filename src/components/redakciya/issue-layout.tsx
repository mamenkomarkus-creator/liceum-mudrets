"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, GripVertical, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { reorderArticlesAction } from "@/app/redakciya/actions";

export interface LayoutItem {
  id: string;
  title: string;
  category: string;
  subcategory: string;
  description: string;
  /** Cover from the drafts storage, if the article has one. */
  cover: string | null;
  ready: boolean;
}

/**
 * The issue as readers will see it on the home page: a grid of cards, three to a row on a wide screen.
 * Drag a card (or use the arrows) to change the order; it is saved as soon as you let go.
 */
export function IssueLayout({ issue, items }: { issue: number; items: LayoutItem[] }) {
  const router = useRouter();
  const [order, setOrder] = useState(items);
  const [dragging, setDragging] = useState<string | null>(null);
  const [saving, start] = useTransition();
  const saved = useRef(items.map((i) => i.id).join());

  const save = (next: LayoutItem[]) => {
    const ids = next.map((i) => i.id);
    if (ids.join() === saved.current) return;
    start(async () => {
      const result = await reorderArticlesAction(issue, ids);
      if (!result.ok) {
        toast.error(result.error);
        setOrder(items);
        return;
      }
      saved.current = ids.join();
      toast.success("Порядок збережено");
      router.refresh();
    });
  };

  const moveTo = (list: LayoutItem[], id: string, index: number) => {
    const from = list.findIndex((i) => i.id === id);
    if (from < 0 || index < 0 || index >= list.length || from === index) return list;
    const next = [...list];
    const [item] = next.splice(from, 1);
    next.splice(index, 0, item);
    return next;
  };

  return (
    <ol className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3" aria-label="Порядок статей на сайті">
      {order.map((item, index) => (
        <li
          key={item.id}
          draggable={!saving}
          onDragStart={(e) => {
            setDragging(item.id);
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", item.id);
          }}
          onDragEnter={(e) => {
            e.preventDefault();
            if (dragging && dragging !== item.id) setOrder((list) => moveTo(list, dragging, index));
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => e.preventDefault()}
          onDragEnd={() => {
            setDragging(null);
            save(order);
          }}
          className={`group relative flex cursor-grab flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition-[box-shadow,opacity,border-color] active:cursor-grabbing ${
            dragging === item.id ? "border-primary opacity-50" : "border-border hover:border-primary/40 hover:shadow-md"
          }`}
        >
          <div className="relative aspect-[3/2] bg-muted">
            {item.cover ? (
              // eslint-disable-next-line @next/next/no-img-element -- private draft file, not optimisable
              <img src={item.cover} alt="" draggable={false} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Без фото</div>
            )}
            <span className="absolute left-3 top-3 flex h-8 min-w-8 items-center justify-center rounded-full bg-navy px-2 text-sm font-bold text-white shadow">
              {index + 1}
            </span>
            <span className="absolute right-3 top-3 rounded-md bg-white/90 p-1 text-muted-foreground shadow-sm" aria-hidden>
              <GripVertical size={16} />
            </span>
          </div>
          <div className="flex flex-1 flex-col p-4">
            <span className="self-start rounded-full bg-primary px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
              {item.category}
            </span>
            <p className="mt-2 line-clamp-3 font-display text-base font-bold leading-snug text-[#111]">{item.title}</p>
            <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
              {item.ready ? item.description : "Стаття ще не оброблена"}
            </p>
            <div className="mt-auto flex items-center justify-between gap-2 pt-3 text-xs text-muted-foreground">
              <span>На сайті: №{issue * 100 + index + 1}</span>
              <span className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label={`Перемістити «${item.title}» раніше`}
                  disabled={index === 0 || saving}
                  onClick={() => {
                    const next = moveTo(order, item.id, index - 1);
                    setOrder(next);
                    save(next);
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted hover:text-foreground disabled:opacity-30"
                >
                  <ArrowLeft size={15} />
                </button>
                <button
                  type="button"
                  aria-label={`Перемістити «${item.title}» пізніше`}
                  disabled={index === order.length - 1 || saving}
                  onClick={() => {
                    const next = moveTo(order, item.id, index + 1);
                    setOrder(next);
                    save(next);
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted hover:text-foreground disabled:opacity-30"
                >
                  <ArrowRight size={15} />
                </button>
              </span>
            </div>
          </div>
          {saving ? (
            <span className="absolute inset-0 flex items-center justify-center bg-white/40" aria-hidden>
              <Loader2 size={20} className="animate-spin text-primary" />
            </span>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
