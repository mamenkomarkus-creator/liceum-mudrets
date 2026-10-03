import Image from "next/image";
import Link from "next/link";
import { User, Users } from "lucide-react";
import type { AuthorProfile } from "@/lib/types";
import { initials } from "./author-avatar";

function Photo({ profile, className }: { profile: AuthorProfile; className: string }) {
  return (
    <div className={`relative shrink-0 overflow-hidden rounded-lg bg-muted ${className}`}>
      {profile.photo ? (
        <Image
          src={profile.photo}
          alt={profile.name}
          fill
          sizes="148px"
          style={{ objectPosition: profile.photoPosition ?? "center 20%" }}
          className="object-cover"
        />
      ) : (
        <span
          aria-hidden
          className="flex h-full w-full items-center justify-center font-display text-4xl font-bold text-primary/60"
        >
          {initials(profile.name)}
        </span>
      )}
    </div>
  );
}

const PHOTO_SIZE = "h-36 w-32 sm:h-[168px] sm:w-[148px]";

/** Large author card shown right under the article header; one card per person for co-authored pieces. */
export function AuthorCard({
  profiles,
  label,
  href,
}: {
  profiles: AuthorProfile[];
  label?: string;
  href?: string;
}) {
  const multiple = profiles.length > 1;
  const feminine = /авторк/i.test(label ?? "");
  const Icon = multiple ? Users : User;

  return (
    <section aria-label="Автор статті" className="rounded-r-xl border-l-4 border-l-primary bg-[#f6f8fc] p-5 sm:p-6">
      <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
        <Icon size={14} aria-hidden />
        {label ?? "Автор статті"}
      </p>

      {multiple ? (
        <ul className="mt-5 grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-6 sm:divide-x sm:divide-border">
          {profiles.map((profile) => (
            <li key={profile.name} className="flex flex-col items-center text-center sm:px-3">
              <Photo profile={profile} className={PHOTO_SIZE} />
              <p className="mt-4 break-words font-display text-xl font-bold text-foreground">{profile.name}</p>
              {profile.description ? (
                <p className="mt-2 break-words text-sm leading-relaxed text-muted-foreground">{profile.description}</p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-4 flex flex-col items-start gap-4 sm:flex-row sm:gap-6">
          <Photo profile={profiles[0]} className={PHOTO_SIZE} />
          <div className="min-w-0">
            <p className="break-words font-display text-xl font-bold text-foreground md:text-2xl">{profiles[0].name}</p>
            {profiles[0].description ? (
              <p className="mt-2 break-words text-sm leading-relaxed text-muted-foreground md:text-base">
                {profiles[0].description}
              </p>
            ) : null}
          </div>
        </div>
      )}

      {href ? (
        <Link
          href={href}
          className={`mt-4 inline-block text-sm font-semibold text-primary transition-opacity hover:opacity-75 ${
            multiple ? "w-full text-center" : ""
          }`}
        >
          Усі матеріали {multiple ? "авторів" : feminine ? "авторки" : "автора"} →
        </Link>
      ) : null}
    </section>
  );
}
