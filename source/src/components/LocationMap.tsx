import { useEffect, useRef } from "react";
import { MAP_CENTER, MAP_ZOOM } from "@/lib/bulan";

// Small click-to-pin map centered on Bulan, Sorsogon. Leaflet is loaded
// dynamically so nothing browser-only runs during SSR.
export function LocationMap({ lat, lng, onPick }: { lat: number | null; lng: number | null; onPick: (lat: number, lng: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markerRef = useRef<import("leaflet").CircleMarker | null>(null);
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");
      if (cancelled || !ref.current || mapRef.current) return;
      const map = L.map(ref.current, { center: MAP_CENTER, zoom: MAP_ZOOM, scrollWheelZoom: false });
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);
      map.on("click", (e) => onPickRef.current(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6))));
      mapRef.current = map;
      if (lat != null && lng != null) {
        markerRef.current = L.circleMarker([lat, lng], { radius: 9, color: "#b3552e", weight: 3, fillColor: "#b3552e", fillOpacity: 0.35 }).addTo(map);
        map.setView([lat, lng], 15);
      }
    })();
    return () => { cancelled = true; mapRef.current?.remove(); mapRef.current = null; markerRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (lat == null || lng == null) return;
    (async () => {
      const L = await import("leaflet");
      const map = mapRef.current;
      if (!map) return;
      if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
      else markerRef.current = L.circleMarker([lat, lng], { radius: 9, color: "#b3552e", weight: 3, fillColor: "#b3552e", fillOpacity: 0.35 }).addTo(map);
    })();
  }, [lat, lng]);

  return <div ref={ref} className="h-64 w-full rounded-2xl border" aria-label="Map centered on Bulan, Sorsogon" />;
}
