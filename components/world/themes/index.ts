import type { ThemeKey } from "@/lib/v2/themes";
import { laut } from "./laut";
import { lavender } from "./lavender";
import { matcha } from "./matcha";
import { senja } from "./senja";
import { stroberi } from "./stroberi";
import type { ThemeKit } from "./types";

export const KITS: Record<ThemeKey, ThemeKit> = { stroberi, senja, matcha, laut, lavender };

export type { LayerArt, Mount, Span, Sticker, ThemeKit } from "./types";
