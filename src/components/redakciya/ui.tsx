import { Loader2 } from "lucide-react";

export const inputClass =
  "w-full rounded-md border border-border bg-white px-3 py-2 text-[15px] text-foreground outline-none transition-shadow focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60";

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-foreground">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { pending?: boolean };

const base =
  "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60";

export function PrimaryButton({ pending, children, className = "", disabled, ...rest }: ButtonProps) {
  return (
    <button {...rest} disabled={disabled || pending} className={`${base} bg-primary text-white hover:bg-[#1d43a8] ${className}`}>
      {pending ? <Loader2 size={15} className="animate-spin" aria-hidden /> : null}
      {children}
    </button>
  );
}

export function SecondaryButton({ pending, children, className = "", disabled, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || pending}
      className={`${base} border border-border bg-white text-foreground hover:border-primary/40 hover:text-primary ${className}`}
    >
      {pending ? <Loader2 size={15} className="animate-spin" aria-hidden /> : null}
      {children}
    </button>
  );
}

export function Badge({ tone, children }: { tone: "gray" | "blue" | "green" | "red" | "amber"; children: React.ReactNode }) {
  const tones = {
    gray: "bg-muted text-muted-foreground",
    blue: "bg-primary/10 text-primary",
    green: "bg-emerald-100 text-emerald-800",
    red: "bg-red-100 text-red-800",
    amber: "bg-amber-100 text-amber-900",
  };
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("uk-UA", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Kyiv" });
}

export function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}
