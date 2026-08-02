"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import type { LatLng } from "@/lib/location";

export type { LatLng };

type LocationMapPickerProps = {
  value: LatLng;
  onChange: (next: LatLng) => void;
  className?: string;
  error?: string;
};

const LocationMap = dynamic(() => import("@/components/location-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 items-center justify-center text-sm text-muted">Loading map…</div>
  ),
});

export function LocationMapPicker({
  value,
  onChange,
  className,
  error,
}: LocationMapPickerProps) {
  const [geoError, setGeoError] = useState<string | null>(null);

  function useMyLocation() {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        setGeoError("Could not read your location. Allow location access or tap the map.");
      },
      { enableHighAccuracy: true, timeout: 12_000 },
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-ink">Map pin</p>
          <p className="text-xs text-muted">Tap the map or drag the pin to set the court location.</p>
        </div>
        <Button type="button" variant="secondary" onClick={useMyLocation}>
          <MapPin className="mr-1.5 h-3.5 w-3.5" />
          Use my location
        </Button>
      </div>

      <div className="neu-inset overflow-hidden rounded-[20px]">
        <LocationMap value={value} onChange={onChange} />
      </div>

      <p className="text-xs text-muted">
        {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
      </p>
      {error ? <p className="text-xs text-red-600 dark:text-red-400">{error}</p> : null}
      {geoError ? <p className="text-xs text-red-600 dark:text-red-400">{geoError}</p> : null}
    </div>
  );
}
