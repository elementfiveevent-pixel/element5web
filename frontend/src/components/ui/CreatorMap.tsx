"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";

type Creator = { id: string; name: string; location: string; latitude?: number; longitude?: number };

const CITY_POINTS: Record<string, [number, number]> = {
  Ahmedabad: [23.0225, 72.5714],
  Surat: [21.1702, 72.8311],
  Vadodara: [22.3072, 73.1812],
  Rajkot: [22.3039, 70.8022],
  Gandhinagar: [23.2156, 72.6369],
};

function cityFor(creator: Creator) {
  return Object.keys(CITY_POINTS).find((city) => creator.location.toLowerCase().includes(city.toLowerCase())) || "Ahmedabad";
}

export default function CreatorMap({ creators, onCitySelect, onVisibleCities }: {
  creators: Creator[];
  onCitySelect: (city: string) => void;
  onVisibleCities: (cities: string[]) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hostRef.current) return;
    const map = L.map(hostRef.current, { zoomControl: true, scrollWheelZoom: true }).setView([22.45, 72.55], 7);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    const grouped = creators.reduce<Record<string, Creator[]>>((groups, creator) => {
      const city = cityFor(creator);
      (groups[city] ||= []).push(creator);
      return groups;
    }, {});

    Object.entries(grouped).forEach(([city, members]) => {
      const point = CITY_POINTS[city] || CITY_POINTS.Ahmedabad;
      const icon = L.divIcon({
        className: "",
        html: `<button aria-label="View creators in ${city}" style="width:32px;height:32px;border:2px solid #121212;border-radius:50%;background:#D80032;color:#fff;font:800 11px sans-serif;cursor:pointer">${members.length}</button>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
      const names = members.slice(0, 3).map((member) => member.name).join("<br />");
      L.marker(point, { icon }).addTo(map)
        .bindPopup(`<strong>${city}</strong><br />${members.length} creator${members.length === 1 ? "" : "s"}<br /><small>${names}</small>`)
        .on("click", () => onCitySelect(city));
    });

    const updateVisibleCities = () => {
      const bounds = map.getBounds();
      onVisibleCities(Object.entries(CITY_POINTS).filter(([, point]) => bounds.contains(point)).map(([city]) => city));
    };
    map.on("moveend", updateVisibleCities);
    updateVisibleCities();

    return () => { map.remove(); };
  }, [creators, onCitySelect, onVisibleCities]);

  return <div ref={hostRef} className="h-[360px] sm:h-[460px] w-full overflow-hidden border-3 border-[#121212] rounded bg-[#FAF8F5]" />;
}
