import type { Layout } from "@prisma/client";

export type SlotSpec = { key: string; type: "PHOTO" | "TEXT"; label: string };

// Single source of truth for which slots each layout defines.
// Both the editor (which slots to render as inputs) and the reader
// (how to place them) read from this map.
export const LAYOUTS: Record<Layout, { label: string; slots: SlotSpec[] }> = {
  COVER: {
    label: "Sampul",
    slots: [
      { key: "photo1", type: "PHOTO", label: "Foto sampul" },
      { key: "text1", type: "TEXT", label: "Judul / kutipan" },
    ],
  },
  SINGLE: {
    label: "Satu foto",
    slots: [{ key: "photo1", type: "PHOTO", label: "Foto" }],
  },
  DUO: {
    label: "Dua foto",
    slots: [
      { key: "photo1", type: "PHOTO", label: "Foto kiri" },
      { key: "photo2", type: "PHOTO", label: "Foto kanan" },
    ],
  },
  TRIO: {
    label: "Kolase tiga",
    slots: [
      { key: "photo1", type: "PHOTO", label: "Foto 1" },
      { key: "photo2", type: "PHOTO", label: "Foto 2" },
      { key: "photo3", type: "PHOTO", label: "Foto 3" },
    ],
  },
  PHOTO_TEXT: {
    label: "Foto + cerita",
    slots: [
      { key: "photo1", type: "PHOTO", label: "Foto" },
      { key: "text1", type: "TEXT", label: "Cerita" },
    ],
  },
  DUO_TEXT: {
    label: "Dua foto + cerita",
    slots: [
      { key: "photo1", type: "PHOTO", label: "Foto kiri" },
      { key: "photo2", type: "PHOTO", label: "Foto kanan" },
      { key: "text1", type: "TEXT", label: "Cerita" },
    ],
  },
  TEXT: {
    label: "Surat",
    slots: [{ key: "text1", type: "TEXT", label: "Isi surat" }],
  },
  QUOTE: {
    label: "Kutipan",
    slots: [{ key: "text1", type: "TEXT", label: "Kutipan" }],
  },
  CLOSING: {
    label: "Penutup",
    slots: [{ key: "text1", type: "TEXT", label: "Kata penutup" }],
  },
};
