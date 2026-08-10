import { withBase } from "./basePath";

// Module-level singleton so playback survives client-side route changes
// (reader ↔ map ↔ editor). Only ever touched from client components.

const MUSIC_SRC = withBase("/audio/paper-lanterns.mp3");
const VOLUME = 0.35;

let audio: HTMLAudioElement | null = null;
let playing = false;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function ensureAudio(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio(MUSIC_SRC);
    audio.loop = true;
    audio.volume = VOLUME;
    // Let the element's own events drive state (covers OS media keys too).
    audio.addEventListener("play", () => {
      playing = true;
      emit();
    });
    audio.addEventListener("pause", () => {
      playing = false;
      emit();
    });
  }
  return audio;
}

export function subscribeMusic(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function isMusicPlaying(): boolean {
  return playing;
}

export async function toggleMusic(): Promise<void> {
  const el = ensureAudio();
  if (playing) {
    el.pause();
    return;
  }
  try {
    await el.play();
  } catch {
    // autoplay blocked or file unavailable — state stays off
  }
}
