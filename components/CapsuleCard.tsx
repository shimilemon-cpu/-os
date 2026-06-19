import Link from "next/link";
import { Eye, Music } from "lucide-react";
import type { CapsuleDoc } from "@/lib/types";

function eraFilter(year: number | null | undefined): string {
  if (!year || year < 1990) return "img-era-80s";
  if (year < 2000) return "img-era-90s";
  if (year < 2010) return "img-era-00s";
  return "img-era-modern";
}

export default function CapsuleCard({ capsule }: { capsule: CapsuleDoc }) {
  const image = capsule.images?.[0];
  const age = capsule.userBirthYear
    ? new Date().getFullYear() - capsule.userBirthYear
    : null;

  return (
    <Link href={`/capsule/${capsule.id}`} className="block group">
      <div className="relative rounded-xl overflow-hidden bg-[var(--surface)] border border-[var(--border)]">
        <div className="relative aspect-[3/4] overflow-hidden">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt=""
              className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ${eraFilter(capsule.memoryYear)}`}
            />
          ) : (
            <div className="w-full h-full bg-[var(--surface-2)]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-[var(--bg)]/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <div className="flex items-center gap-2">
              <Music size={11} className="text-[var(--accent)] shrink-0" />
              <div className="min-w-0">
                <p className="text-[var(--text)] text-xs font-medium truncate leading-tight">
                  {capsule.songTitle ?? "—"}
                </p>
                <p className="text-[var(--accent-2)] text-[10px] truncate leading-tight">
                  {capsule.artistName ?? ""}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-3 space-y-2">
          <p className="serif text-[var(--text)] text-xs leading-relaxed line-clamp-2">
            {capsule.memoryText}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-[var(--muted)] text-[10px]">
              {age ? `${age}歳` : ""}
              {age && capsule.userGender ? "・" : ""}
              {capsule.userGender ?? ""}
            </span>
            <div className="flex items-center gap-1 text-[var(--muted)]">
              <Eye size={10} />
              <span className="text-[10px]">{(capsule.views ?? 0).toLocaleString()}</span>
            </div>
          </div>
          {capsule.memoryYear && (
            <p className="text-[var(--muted)] text-[10px]">
              {capsule.memoryYear}年・{capsule.lifeStage ?? ""}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
