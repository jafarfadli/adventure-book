"use client";

import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { TILE_ATTRIBUTION, TILE_MAX_ZOOM, TILE_URL } from "@/lib/mapTiles";

const DEFAULT_CENTER: [number, number] = [-6.2, 106.82]; // Jakarta
const DEFAULT_ZOOM = 11;

// A drawn pin instead of an emoji, in the book's ink colour.
const pinIcon = L.divIcon({
  className: "",
  html:
    '<svg width="30" height="36" viewBox="0 0 24 30" style="filter:drop-shadow(0 2px 2px rgba(0,0,0,.35))">' +
    '<path d="M12 29 C12 29 2.5 18.5 2.5 11 A9.5 9.5 0 0 1 21.5 11 C21.5 18.5 12 29 12 29Z" fill="#d6688a" stroke="#fffaf5" stroke-width="2"/>' +
    '<circle cx="12" cy="11" r="3.4" fill="#fffaf5"/></svg>',
  iconSize: [30, 36],
  iconAnchor: [15, 35],
});

function ClickToPin({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

export default function PinPicker({ lat, lng, onPick }: { lat: number | null; lng: number | null; onPick: (lat: number, lng: number) => void }) {
  const has = lat != null && lng != null;
  return (
    <MapContainer center={has ? [lat, lng] : DEFAULT_CENTER} zoom={has ? 14 : DEFAULT_ZOOM} maxZoom={TILE_MAX_ZOOM} scrollWheelZoom className="z-0 h-56 w-full rounded-2xl">
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} maxZoom={TILE_MAX_ZOOM} />
      <ClickToPin onPick={onPick} />
      {has && (
        <Marker
          position={[lat, lng]}
          icon={pinIcon}
          draggable
          eventHandlers={{
            dragend: (e) => {
              const p = (e.target as L.Marker).getLatLng();
              onPick(p.lat, p.lng);
            },
          }}
        />
      )}
    </MapContainer>
  );
}
