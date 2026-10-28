import { describe, expect, test } from "vitest";
import { chunkSizes, groupUploads, type Uploaded } from "./bulk";

let n = 0;
function photo(takenAt: string | null, w = 1200, h = 1600): Uploaded {
  n++;
  return { id: `u${n}`, kind: "photo", width: w, height: h, takenAt, imageUrl: `/adventure/api/media/p${n}.webp`, thumbUrl: null, videoUrl: null, lat: null, lng: null };
}
function video(takenAt: string | null, w = 720, h = 1280): Uploaded {
  n++;
  return { id: `u${n}`, kind: "video", width: w, height: h, takenAt, imageUrl: `/adventure/api/media/v${n}.webp`, thumbUrl: null, videoUrl: `/adventure/api/media/v${n}.mp4`, lat: null, lng: null };
}

describe("chunkSizes", () => {
  test("threes, but never a lonely one after a three", () => {
    expect(chunkSizes(1)).toEqual([1]);
    expect(chunkSizes(2)).toEqual([2]);
    expect(chunkSizes(3)).toEqual([3]);
    expect(chunkSizes(4)).toEqual([2, 2]);
    expect(chunkSizes(5)).toEqual([3, 2]);
    expect(chunkSizes(7)).toEqual([3, 2, 2]);
    expect(chunkSizes(9)).toEqual([3, 3, 3]);
  });
});

describe("groupUploads", () => {
  test("one group per day in Jakarta, in time order", () => {
    const groups = groupUploads([
      photo("2026-09-07T03:00:00Z"),
      photo("2026-09-06T03:00:00Z"),
      photo("2026-09-06T16:30:00Z"), // 23:30 WIB, still the 6th
      photo("2026-09-06T17:30:00Z"), // 00:30 WIB on the 7th
    ]);
    expect(groups.map((g) => g.day)).toEqual(["2026-09-06", "2026-09-07"]);
    expect(groups.map((g) => g.stops.reduce((a, s) => a + s.items.length, 0))).toEqual([2, 2]);
  });

  test("templates follow count and shape", () => {
    const g = groupUploads([
      photo("2026-09-06T01:00:00Z", 1600, 1200),
      photo("2026-09-06T02:00:00Z", 1600, 1200),
      photo("2026-09-07T01:00:00Z", 1200, 1600),
      photo("2026-09-07T02:00:00Z", 1600, 1200),
      photo("2026-09-08T01:00:00Z", 1600, 1200),
      photo("2026-09-09T01:00:00Z", 1200, 1600),
      photo("2026-09-09T02:00:00Z", 1600, 1200),
      photo("2026-09-09T03:00:00Z", 1200, 1600),
    ]);
    expect(g.flatMap((x) => x.stops.map((s) => s.template))).toEqual(["duo-stack", "duo-side", "single-wide", "trio"]);
    // the trio puts its most landscape photo in the wide frame
    const trio = g[3].stops[0];
    expect(trio.items[0].width! > trio.items[0].height!).toBe(true);
  });

  test("each video is a stop of its own, by its shape", () => {
    const g = groupUploads([video("2026-09-08T01:00:00Z"), photo("2026-09-08T02:00:00Z"), video("2026-09-08T03:00:00Z", 1280, 720)]);
    expect(g[0].stops.map((s) => s.template)).toEqual(["video-tall", "video-wide", "single-tall"]);
  });

  test("undated files keep pick order in a last group", () => {
    const a = photo(null);
    const b = photo("2026-09-06T01:00:00Z");
    const c = photo(null);
    const g = groupUploads([a, b, c]);
    expect(g.map((x) => x.day)).toEqual(["2026-09-06", null]);
    expect(g[1].stops[0].items.map((i) => i.id)).toEqual([a.id, c.id]);
  });
});
