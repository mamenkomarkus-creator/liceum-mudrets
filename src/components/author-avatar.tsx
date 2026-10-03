import Image from "next/image";

export function initials(name: string): string {
  const parts = name.split(/[\s,]+/).filter(Boolean);
  const picked = parts.length > 2 ? [parts[0], parts[parts.length - 1]] : parts;
  return picked.map((part) => part[0]?.toUpperCase()).join("");
}

/** Round author picture; falls back to initials, or to the newspaper mark for the editorial desk. */
export function AuthorAvatar({
  name,
  photo,
  position,
  size,
}: {
  name?: string;
  photo?: string;
  position?: string;
  size: number;
}) {
  return (
    <span
      className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#e8eefc] font-display font-bold text-primary"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {photo ? (
        <Image
          src={photo}
          alt=""
          fill
          sizes={`${size}px`}
          style={{ objectPosition: position ?? "center 20%" }}
          className="object-cover"
        />
      ) : name ? (
        <span aria-hidden>{initials(name)}</span>
      ) : (
        <Image src="/images/logo-lm-left-VS6TsaPJ.png" alt="" width={size} height={size} className="p-1.5" />
      )}
    </span>
  );
}
