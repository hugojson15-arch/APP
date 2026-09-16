"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { deleteDrill, postDrillToChat } from "@/lib/actions/drills";
import type { Drill } from "@/lib/database.types";

type DrillRow = Pick<Drill, "id" | "title" | "thumbnail_url" | "created_at">;

export default function DrillsList({ drills, isAdmin }: { drills: DrillRow[]; isAdmin: boolean }) {
  const [pending, startTransition] = useTransition();
  const [posted, setPosted] = useState<string | null>(null);
  const [preview, setPreview] = useState<DrillRow | null>(null);

  if (drills.length === 0) {
    return (
      <p className="mt-10 text-center text-sm text-[var(--muted)]">
        Inga övningar än.{isAdmin ? " Skapa den första!" : ""}
      </p>
    );
  }

  return (
    <>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {drills.map((d) => (
          <div key={d.id} className="overflow-hidden rounded-xl border border-[var(--border)]">
            <button onClick={() => setPreview(d)} className="block w-full">
              <Image
                src={d.thumbnail_url}
                alt={d.title}
                width={300}
                height={300}
                unoptimized
                className="aspect-square w-full object-cover"
              />
            </button>
            <div className="p-2">
              <p className="truncate text-xs font-semibold">{d.title}</p>
              <div className="mt-1 flex gap-1">
                <button
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      await postDrillToChat(d.id);
                      setPosted(d.id);
                      setTimeout(() => setPosted(null), 2000);
                    })
                  }
                  className="flex-1 rounded-md bg-black/5 px-2 py-1 text-[11px] font-semibold hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20"
                >
                  {posted === d.id ? "Postat!" : "Posta i chatten"}
                </button>
                {isAdmin && (
                  <button
                    disabled={pending}
                    onClick={() => {
                      if (confirm(`Ta bort "${d.title}"?`)) startTransition(() => deleteDrill(d.id));
                    }}
                    className="rounded-md px-2 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                  >
                    🗑
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setPreview(null)}
        >
          <Image
            src={preview.thumbnail_url}
            alt={preview.title}
            width={640}
            height={640}
            unoptimized
            className="max-h-[85vh] w-auto rounded-xl object-contain"
          />
        </div>
      )}
    </>
  );
}
