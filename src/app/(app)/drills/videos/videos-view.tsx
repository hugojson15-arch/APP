"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { deleteVideo } from "@/lib/actions/videos";
import type { Video } from "@/lib/database.types";

type VideoRow = Pick<Video, "id" | "title" | "video_url" | "created_at">;

export default function VideosView({
  teamId,
  videos,
  isAdmin,
}: {
  teamId: string;
  videos: VideoRow[];
  isAdmin: boolean;
}) {
  const [items, setItems] = useState(videos);
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progressLabel, setProgressLabel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file || !title.trim()) return;
    setUploading(true);
    setError(null);
    setProgressLabel("Laddar upp…");

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Du måste vara inloggad");

      // Uploaded straight from the browser to Supabase Storage - clips can be
      // large, and routing them through a Next.js server action would hit
      // its request body limit long before a typical video clip does.
      const ext = file.name.split(".").pop() ?? "mp4";
      const path = `${teamId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("videos")
        .upload(path, file, { contentType: file.type || "video/mp4" });
      if (uploadError) throw new Error(uploadError.message);

      const videoUrl = supabase.storage.from("videos").getPublicUrl(path).data.publicUrl;

      const { data: row, error: insertError } = await supabase
        .from("videos")
        .insert({ team_id: teamId, title: title.trim(), video_url: videoUrl, uploaded_by: user.id })
        .select("id, title, video_url, created_at")
        .single();
      if (insertError) throw new Error(insertError.message);

      setItems((prev) => [row, ...prev]);
      setTitle("");
      if (fileRef.current) fileRef.current.value = "";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kunde inte ladda upp klippet");
    } finally {
      setUploading(false);
      setProgressLabel(null);
    }
  }

  return (
    <div className="mt-4">
      <p className="text-sm text-[var(--muted)]">Videoklipp från träningar och matcher.</p>

      {isAdmin && (
        <div className="mt-3 space-y-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titel, t.ex. Powerplay period 2"
            className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
          />
          <input ref={fileRef} type="file" accept="video/*" className="w-full text-sm" />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            onClick={handleUpload}
            disabled={uploading || !title.trim()}
            className="btn-primary rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60"
          >
            {progressLabel ?? "Ladda upp klipp"}
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <p className="mt-10 text-center text-sm text-[var(--muted)]">Inga klipp än.</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {items.map((v) => (
            <li key={v.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="font-semibold">{v.title}</p>
                {isAdmin && (
                  <button
                    onClick={() => {
                      if (confirm(`Ta bort "${v.title}"?`)) {
                        setItems((prev) => prev.filter((x) => x.id !== v.id));
                        deleteVideo(v.id);
                      }
                    }}
                    className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                    aria-label="Ta bort"
                  >
                    🗑
                  </button>
                )}
              </div>
              <video src={v.video_url} controls preload="metadata" className="w-full rounded-lg" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
