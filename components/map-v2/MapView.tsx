"use client";

import L from "leaflet";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { MapContainer, Marker, TileLayer, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { TILE_ATTRIBUTION, TILE_MAX_ZOOM, TILE_URL } from "@/lib/mapTiles";

export type MapPin = {
  id: string;
  lat: number;
  lng: number;
  thumbUrl: string | null;
  caption: string | null;
  locationLabel: string | null;
  href: string;
  book: number;
};

const PIN_SVG =
  '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a5436a" stroke-width="2.2"><path d="M12 21 C12 21 5.5 14.8 5.5 9.8 A6.5 6.5 0 0 1 18.5 9.8 C18.5 14.8 12 21 12 21 Z"/><circle cx="12" cy="9.8" r="2.3"/></svg>';

/** A tiny polaroid of the photo itself, tilted like the ones in the book. */
function polaroid(thumbUrl: string | null, tilt: number): L.DivIcon {
  const inner = thumbUrl
    ? `<img src="${thumbUrl}" style="width:100%;height:38px;object-fit:cover;display:block" alt=""/>`
    : `<div style="width:100%;height:38px;background:#f4eef0;display:grid;place-items:center">${PIN_SVG}</div>`;
  return L.divIcon({
    className: "",
    html: `<div style="width:44px;padding:3px 3px 8px;background:#fffdf8;box-shadow:1px 3px 6px rgba(30,16,20,.35);transform:rotate(${tilt}deg)">${inner}</div>`,
    iconSize: [44, 52],
    iconAnchor: [22, 52],
    tooltipAnchor: [0, -52],
  });
}

function Fit({ pins, animate }: { pins: MapPin[]; animate: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (pins.length === 0) return;
    if (pins.length === 1) map.setView([pins[0].lat, pins[0].lng], 13, { animate });
    else map.fitBounds(L.latLngBounds(pins.map((p) => [p.lat, p.lng])), { padding: [56, 56], animate });
  }, [map, pins, animate]);
  return null;
}

export default function MapView({ pins, reduceMotion }: { pins: MapPin[]; reduceMotion: boolean }) {
  const router = useRouter();
  const icons = useMemo(() => new Map(pins.map((p, i) => [p.id, polaroid(p.thumbUrl, i % 2 ? 3 : -3)])), [pins]);
  return (
    // no zoom buttons: pinch / wheel zoom, and the corner stays free for the back button
    <MapContainer center={[-6.2, 106.82]} zoom={11} maxZoom={TILE_MAX_ZOOM} scrollWheelZoom zoomControl={false} className="z-0 h-dvh w-full">
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} maxZoom={TILE_MAX_ZOOM} />
      <Fit pins={pins} animate={!reduceMotion} />
      {pins.map((p) => (
        <Marker key={p.id} position={[p.lat, p.lng]} icon={icons.get(p.id)} eventHandlers={{ click: () => router.push(p.href) }}>
          <Tooltip direction="top" opacity={1} className="!border-0 !bg-transparent !p-0 !shadow-none">
            <div className="w-40 bg-[#fffdf8] p-2 pb-3 shadow-xl">
              {p.thumbUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.thumbUrl} alt={p.caption ?? "foto kenangan"} className="h-32 w-full object-cover" />
              )}
              {(p.caption || p.locationLabel) && (
                <p className="mt-1 text-center font-hand text-lg leading-tight text-[#4a2f38]">{p.caption ?? p.locationLabel}</p>
              )}
            </div>
          </Tooltip>
        </Marker>
      ))}
    </MapContainer>
  );
}
