"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap } from "leaflet";

const RIYADH_CENTER: [number, number] = [24.6853, 46.7029];

const INTERSECTIONS = [
    { id: 1, name: "King Fahd Rd / Olaya St", lat: 24.6877, lng: 46.6863, congestion: "high" },
    { id: 2, name: "King Abdullah Rd", lat: 24.6953, lng: 46.7129, congestion: "medium" },
    { id: 3, name: "Tahlia St Junction", lat: 24.6803, lng: 46.6929, congestion: "low" },
    { id: 4, name: "Exit 7 - Makkah Rd", lat: 24.6703, lng: 46.7229, congestion: "high" },
    { id: 5, name: "Prince Sultan Rd", lat: 24.7003, lng: 46.6829, congestion: "medium" },
    { id: 6, name: "Uruba Rd / Anas St", lat: 24.6753, lng: 46.7129, congestion: "low" },
    { id: 7, name: "Airport Rd North", lat: 24.7153, lng: 46.7029, congestion: "medium" },
];

const generateCars = () =>
    Array.from({ length: 10 }, (_, i) => ({
        id: i,
        lat: 24.66 + Math.random() * 0.06,
        lng: 46.68 + Math.random() * 0.05,
        speed: 0.0001 + Math.random() * 0.0003,
        dx: (Math.random() - 0.5) * 2,
        dy: (Math.random() - 0.5) * 2,
    }));

export default function MapView() {
    const mapRef = useRef<LeafletMap | null>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const [cars, setCars] = useState(generateCars());

    useEffect(() => {
        if (typeof window === "undefined") return;
        if (mapRef.current) return;

        import("leaflet").then((L) => {
            if (!mapContainerRef.current || mapRef.current) return;

            // Fix default icon path issue
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            delete (L.Icon.Default.prototype as any)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
                iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
                shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
            });

            const map = L.map(mapContainerRef.current, {
                center: RIYADH_CENTER,
                zoom: 13,
                zoomControl: false,
                attributionControl: false,
            });

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                maxZoom: 19,
                attribution: "© OpenStreetMap",
            }).addTo(map);

            mapRef.current = map;

            // Add intersection markers
            INTERSECTIONS.forEach((inter) => {
                const color =
                    inter.congestion === "high"
                        ? "#ff4444"
                        : inter.congestion === "medium"
                            ? "#ffaa00"
                            : "#00ff88";

                const pulseIcon = L.divIcon({
                    className: "intersection-marker",
                    html: `
            <div style="position:relative; width:24px; height:24px;">
              <div style="
                position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
                width:14px; height:14px; border-radius:50%;
                background:${color}; border:2px solid rgba(255,255,255,0.6);
                box-shadow: 0 0 12px ${color}, 0 0 24px ${color}50;
                z-index:10;
              "></div>
              <div style="
                position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
                width:24px; height:24px; border-radius:50%;
                border:1.5px solid ${color}60;
                animation: ping 1.5s cubic-bezier(0,0,0.2,1) infinite;
              "></div>
            </div>
            <style>
              @keyframes ping {
                75%, 100% { transform: translate(-50%,-50%) scale(1.8); opacity: 0; }
              }
            </style>
          `,
                    iconSize: [24, 24],
                    iconAnchor: [12, 12],
                });

                const tooltip = `
          <div style="
            background:rgba(10,20,40,0.95); border:1px solid ${color}60;
            padding:6px 10px; border-radius:8px; font-size:11px;
            color:#e2e8f0; font-family:Inter,sans-serif;
          ">
            <div style="font-weight:600;color:${color}">${inter.name}</div>
            <div style="color:#94a3b8;margin-top:2px;">Congestion: <span style="color:${color};text-transform:capitalize;">${inter.congestion}</span></div>
          </div>
        `;

                L.marker([inter.lat, inter.lng], { icon: pulseIcon })
                    .addTo(map)
                    .bindTooltip(tooltip, { permanent: false, direction: "top", className: "custom-tooltip" });
            });

            // Add car markers
            const carMarkers: L.Marker[] = [];
            generateCars().forEach((car) => {
                const carIcon = L.divIcon({
                    className: "car-marker",
                    html: `<div style="font-size:16px;filter:drop-shadow(0 0 4px rgba(0,212,255,0.8));">🚗</div>`,
                    iconSize: [20, 20],
                    iconAnchor: [10, 10],
                });
                const marker = L.marker([car.lat, car.lng], { icon: carIcon }).addTo(map);
                carMarkers.push(marker);
            });

            // Animate cars
            let animCars = generateCars();
            const animInterval = setInterval(() => {
                animCars = animCars.map((car, i) => {
                    const newLat = car.lat + car.dy * car.speed;
                    const newLng = car.lng + car.dx * car.speed;
                    const clampedLat = Math.max(24.65, Math.min(24.73, newLat));
                    const clampedLng = Math.max(24.67, Math.min(46.75, newLng));
                    if (newLat !== clampedLat) car = { ...car, dy: -car.dy };
                    if (newLng !== clampedLng) car = { ...car, dx: -car.dx };
                    if (carMarkers[i]) {
                        carMarkers[i].setLatLng([clampedLat, car.lng + car.dx * car.speed]);
                    }
                    return { ...car, lat: clampedLat, lng: car.lng + car.dx * car.speed };
                });
                setCars([...animCars]);
            }, 500);

            return () => {
                clearInterval(animInterval);
                carMarkers.forEach((m) => m.remove());
            };
        });

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    return (
        <div
            ref={mapContainerRef}
            style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                zIndex: 0,
            }}
        />
    );
}
