"use client";

import { useEffect, useMemo } from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { LatLng } from "@/lib/location";

// Leaflet's default marker assets break under Next bundling.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function ClickHandler({ onPick }: { onPick: (next: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function Recenter({ position }: { position: LatLng }) {
  const map = useMap();
  useEffect(() => {
    map.panTo([position.lat, position.lng]);
  }, [map, position.lat, position.lng]);
  return null;
}

export default function LocationMap({
  value,
  onChange,
}: {
  value: LatLng;
  onChange: (next: LatLng) => void;
}) {
  const icon = useMemo(
    () =>
      L.divIcon({
        className: "sportiv-map-pin",
        html: `<div style="
          width:28px;height:28px;border-radius:999px;
          background:linear-gradient(145deg,#ff7a1a,#ff6b00);
          box-shadow:0 4px 12px rgba(255,107,0,0.45);
          border:3px solid #fff;
        "></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      }),
    [],
  );

  return (
    <MapContainer
      center={[value.lat, value.lng]}
      zoom={14}
      scrollWheelZoom
      className="h-64 w-full"
      style={{ height: "16rem", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onPick={onChange} />
      <Recenter position={value} />
      <Marker
        position={[value.lat, value.lng]}
        draggable
        icon={icon}
        eventHandlers={{
          dragend: (e) => {
            const marker = e.target as L.Marker;
            const p = marker.getLatLng();
            onChange({ lat: p.lat, lng: p.lng });
          },
        }}
      />
    </MapContainer>
  );
}
