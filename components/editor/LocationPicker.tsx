"use client";

import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { TILE_ATTRIBUTION, TILE_MAX_ZOOM, TILE_URL } from "@/lib/mapTiles";

const DEFAULT_CENTER: [number, number] = [-2.5, 118]; // Indonesia overview
const DEFAULT_ZOOM = 4;

const pinIcon = L.divIcon({
  className: "",
  html: '<div style="font-size:26px;line-height:1;filter:drop-shadow(0 2px 2px rgba(0,0,0,.4))">📍</div>',
  iconSize: [26, 26],
  iconAnchor: [13, 24],
});

function ClickToPin({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => onPick(e.latlng.lat, e.latlng.lng),
  });
  return null;
}

export default function LocationPicker({
  lat,
  lng,
  onPick,
}: {
  lat: number | null;
  lng: number | null;
  onPick: (lat: number, lng: number) => void;
}) {
  const has = lat != null && lng != null;
  return (
    <MapContainer
      center={has ? [lat, lng] : DEFAULT_CENTER}
      zoom={has ? 13 : DEFAULT_ZOOM}
      maxZoom={TILE_MAX_ZOOM}
      scrollWheelZoom
      className="z-0 h-48 w-full rounded-md"
    >
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
