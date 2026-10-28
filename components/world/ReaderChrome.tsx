"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { Icon, IconButton, type IconName } from "@/components/v2/Icon";
import { isMusicPlaying, subscribeMusic, toggleMusic } from "@/lib/musicPlayer";

// Icon-only chrome floating over the world.

const chip =
  "inline-grid h-10 w-10 place-items-center rounded-full bg-[#fffaf5]/95 text-[#2b2326] shadow-[0_2px_8px_rgba(40,10,30,0.2)] transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2b2326]";

function IconLink({ href, icon, label }: { href: string; icon: IconName; label: string }) {
  return (
    <Link href={href} aria-label={label} title={label} className={chip}>
      <Icon name={icon} />
    </Link>
  );
}

export function TopChrome({
  mapHref,
  wishlistHref,
  shelfHref,
  shareTitle,
}: {
  mapHref: string;
  wishlistHref: string;
  shelfHref?: string;
  shareTitle: string;
}) {
  const [copied, setCopied] = useState(false);
  async function share() {
    // the shared link follows the site's default version, whatever this preview uses
    const u = new URL(window.location.href);
    u.searchParams.delete("v");
    const url = u.toString();
    try {
      if (navigator.share) {
        await navigator.share({ title: shareTitle, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // share sheet dismissed
    }
  }
  return (
    <>
    {shelfHref && (
      <div className="pointer-events-none absolute top-3 left-3 z-30 [&>*]:pointer-events-auto">
        <IconLink href={shelfHref} icon="shelf" label="Rak buku" />
      </div>
    )}
    <div className="pointer-events-none absolute top-3 right-3 z-30 flex gap-2 [&>*]:pointer-events-auto">
      <IconLink href={mapHref} icon="map" label="Peta kenangan" />
      <IconLink href={wishlistHref} icon="spark" label="Wishlist" />
      <IconButton icon={copied ? "check" : "share"} label={copied ? "Link tersalin" : "Bagikan"} onClick={share} />
    </div>
    </>
  );
}

export function MusicButton() {
  const playing = useSyncExternalStore(subscribeMusic, isMusicPlaying, () => false);
  return <IconButton icon={playing ? "music" : "music-off"} label={playing ? "Matikan musik" : "Putar musik"} onClick={() => void toggleMusic()} />;
}

export function EditLink({ href }: { href: string }) {
  return <IconLink href={href} icon="pencil" label="Edit buku" />;
}
