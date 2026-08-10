"use client";

import { useSyncExternalStore } from "react";
import { IconMusic, IconMusicOff } from "@/components/ui/icons";
import { isMusicPlaying, subscribeMusic, toggleMusic } from "@/lib/musicPlayer";

// Controls the shared module-level player, so any instance (reader, map,
// editor) reflects and drives the same playback. Starts off — browsers only
// allow sound from a user gesture anyway.
export function MusicToggle({ className = "" }: { className?: string }) {
  const playing = useSyncExternalStore(subscribeMusic, isMusicPlaying, () => false);

  return (
    <button
      type="button"
      onClick={() => void toggleMusic()}
      aria-pressed={playing}
      aria-label={playing ? "Matikan musik latar" : "Putar musik latar"}
      className={`inline-flex items-center gap-1.5 font-hand text-lg transition focus-visible:opacity-100 ${
        playing ? "opacity-90" : "opacity-40 hover:opacity-100"
      } ${className}`}
    >
      {playing ? (
        <IconMusic className="h-4 w-4" />
      ) : (
        <IconMusicOff className="h-4 w-4" />
      )}
      musik
    </button>
  );
}
