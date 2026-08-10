"use client";

import { useEffect, useRef, useState } from "react";
import { IconMusic, IconMusicOff } from "@/components/ui/icons";
import { withBase } from "@/lib/basePath";

const MUSIC_SRC = withBase("/audio/paper-lanterns.mp3");
const VOLUME = 0.35;

// Background music starts OFF — browsers block autoplay with sound anyway,
// so playback only ever begins from this user gesture.
export function MusicToggle({ className = "" }: { className?: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  async function toggle() {
    let audio = audioRef.current;
    if (!audio) {
      audio = new Audio(MUSIC_SRC);
      audio.loop = true;
      audio.volume = VOLUME;
      audioRef.current = audio;
    }
    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }
    try {
      await audio.play();
      setPlaying(true);
    } catch {
      // playback blocked or file unavailable — stay muted
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
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
