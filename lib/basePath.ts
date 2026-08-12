// next/link, next/image, and the router handle basePath automatically —
// manual fetch calls and stored media paths do not. Use withBase for those.
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "/adventure";

export const withBase = (p: string) => `${BASE_PATH}${p}`;

/** Validates a stored image path, e.g. "/adventure/api/media/<id>.webp". */
export const MEDIA_PATH_RE = new RegExp(
  `^${BASE_PATH}/api/media/[A-Za-z0-9-]+(\\.thumb)?\\.webp$`,
);

/** Validates a stored video path, e.g. "/adventure/api/media/<id>.mp4". */
export const VIDEO_PATH_RE = new RegExp(
  `^${BASE_PATH}/api/media/[A-Za-z0-9-]+\\.mp4$`,
);
