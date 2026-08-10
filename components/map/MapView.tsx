"use client";

import L from "leaflet";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { MapContainer, Marker, TileLayer, Tooltip, useMap } from "react-leaflet";
import { useReducedMotion } from "framer-motion";
import "leaflet/dist/leaflet.css";
import { TILE_ATTRIBUTION, TILE_MAX_ZOOM, TILE_URL } from "@/lib/mapTiles";

export type MapMarkerData = {
  id: string;
  lat: number;
  lng: number;
  thumbUrl: string | null;
  caption: string | null;
  locationLabel: string | null;
  pageOrder: number;
};

function polaroidIcon(thumbUrl: string | null): L.DivIcon {
  const inner = thumbUrl
    ? `<img src="${thumbUrl}" style="width:100%;height:38px;object-fit:cover;display:block" alt=""/>`
    : '<div style="width:100%;height:38px;background:#e7e5e4;display:flex;align-items:center;justify-content:center;font-size:16px">📍</div>';
  return L.divIcon({
    className: "",
    html: `<div style="width:44px;padding:3px 3px 8px;background:#fff;box-shadow:0 2px 6px rgba(0,0,0,.35);transform:rotate(-3deg)">${inner}</div>`,
    iconSize: [44, 52],
    iconAnchor: [22, 52],
    tooltipAnchor: [0, -52],
  });
}

function FitToMarkers({
  markers,
  animate,
}: {
  markers: MapMarkerData[];
  animate: boolean;
}) {
  const map = useMap();
  useEffect(() => {
    if (markers.length === 0) return;
    if (markers.length === 1) {
      // fitBounds over-zooms on a single point (§7.5)
      map.setView([markers[0].lat, markers[0].lng], 13, { animate });
    } else {
      const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]));
      map.fitBounds(bounds, { padding: [48, 48], animate });
    }
  }, [map, markers, animate]);
  return null;
}

export default function MapView({
  markers,
  slug,
}: {
  markers: MapMarkerData[];
  slug: string;
}) {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const icons = useMemo(
    () => new Map(markers.map((m) => [m.id, polaroidIcon(m.thumbUrl)])),
    [markers],
  );

  return (
    <MapContainer
      center={[-2.5, 118]}
      zoom={4}
      maxZoom={TILE_MAX_ZOOM}
      scrollWheelZoom
      className="z-0 h-dvh w-full"
    >
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} maxZoom={TILE_MAX_ZOOM} />
      <FitToMarkers markers={markers} animate={!reducedMotion} />
      {markers.map((m) => (
        <Marker
          key={m.id}
          position={[m.lat, m.lng]}
          icon={icons.get(m.id)}
          eventHandlers={{
            // router.push already prefixes basePath
            click: () => router.push(`/book/${slug}?page=${m.pageOrder}`),
          }}
        >
          <Tooltip direction="top" opacity={1} className="!p-0 !border-0 !bg-transparent !shadow-none">
            <div className="w-40 bg-white p-2 pb-3 shadow-xl">
              {m.thumbUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={m.thumbUrl}
                  alt={m.caption ?? "foto kenangan"}
                  className="h-32 w-full object-cover"
                />
              ) : (
                <div className="flex h-32 w-full items-center justify-center bg-stone-100 text-2xl">
                  📍
                </div>
              )}
              <p className="mt-1 text-center font-hand text-lg leading-tight text-stone-700">
                {m.caption ?? m.locationLabel ?? `Halaman ${m.pageOrder + 1}`}
              </p>
              {m.locationLabel && m.caption && (
                <p className="text-center font-hand text-sm text-stone-400">
                  {m.locationLabel}
                </p>
              )}
            </div>
          </Tooltip>
        </Marker>
      ))}
    </MapContainer>
  );
}
