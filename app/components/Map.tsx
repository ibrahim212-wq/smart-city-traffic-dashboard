"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, Marker, Polyline } from "leaflet";
import { IntersectionData, RouteData } from "../hooks/useTrafficData";

const RIYADH_CENTER: [number, number] = [24.6853, 46.7029];

const generateCars = () =>
    Array.from({ length: 15 }, (_, i) => ({
        id: i,
        lat: 24.66 + Math.random() * 0.06,
        lng: 46.68 + Math.random() * 0.05,
        speed: 0.0001 + Math.random() * 0.0003,
        dx: (Math.random() - 0.5) * 2,
        dy: (Math.random() - 0.5) * 2,
    }));

interface MapViewProps {
    intersections?: IntersectionData[];
    routes?: RouteData[];
}

export default function MapView({ intersections = [], routes = [] }: MapViewProps) {
    const mapRef = useRef<LeafletMap | null>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const [, setCars] = useState(generateCars());

    // Web maps state refs to allow hot swap on updates
    const markersRef = useRef<Marker[]>([]);
    const polylinesRef = useRef<Polyline[]>([]);
    const leafletLibRef = useRef<any>(null);

    // Initial Map Setup
    useEffect(() => {
        if (typeof window === "undefined") return;
        if (mapRef.current) return;

        import("leaflet").then((L) => {
            if (!mapContainerRef.current || mapRef.current) return;
            leafletLibRef.current = L;

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

            L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
                maxZoom: 19,
                attribution: "© OpenStreetMap, © CartoDB",
            }).addTo(map);

            mapRef.current = map;

            // Add background dummy car markers
            const carMarkers: L.Marker[] = [];
            generateCars().forEach((car) => {
                const carIcon = L.divIcon({
                    className: "car-marker",
                    html: `<div style="font-size:16px;filter:drop-shadow(0 0 4px rgba(0,212,255,0.8));">🚗</div>`,
                    iconSize: [20, 20],
                    iconAnchor: [10, 10],
                });
                const marker = L.marker([car.lat, car.lng], { icon: carIcon, interactive: false }).addTo(map);
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

    // Effect for Routes Visualization
    useEffect(() => {
        if (!mapRef.current || !leafletLibRef.current) return;
        const L = leafletLibRef.current;
        const map = mapRef.current;

        // Clear existing polylines
        polylinesRef.current.forEach(p => p.remove());
        polylinesRef.current = [];

        routes.forEach(route => {
            const isHigh = route.congestion.toLowerCase() === "high";
            const isLow = route.congestion.toLowerCase() === "low";
            const color = isHigh ? "#ef4444" : isLow ? "#10b981" : "#f59e0b";

            // Outer Line (Glowing)
            const outer = L.polyline(route.path, {
                color,
                weight: 14,
                opacity: 0.25,
                lineCap: "round",
                lineJoin: "round",
                interactive: false
            }).addTo(map);

            // Inner Line (Solid)
            const inner = L.polyline(route.path, {
                color,
                weight: 4,
                opacity: 1.0,
                lineCap: "round",
                lineJoin: "round",
            }).addTo(map).bindTooltip(`Route Congestion: ${route.congestion}`, { sticky: true });

            polylinesRef.current.push(outer, inner);
        });
    }, [routes]);


    // Effect for Intersections Visualization
    useEffect(() => {
        if (!mapRef.current || !leafletLibRef.current) return;
        const L = leafletLibRef.current;
        const map = mapRef.current;

        // Clear existing markers
        markersRef.current.forEach(m => m.remove());
        markersRef.current = [];

        intersections.forEach(inter => {
            const isGreen = inter.light_state.toLowerCase() === "green";
            const isRed = inter.light_state.toLowerCase() === "red";
            const color = isGreen ? "#10b981" : isRed ? "#ef4444" : "#f59e0b";
            const emoji = isGreen ? "🟢" : isRed ? "🔴" : "🟡";

            const pulseIcon = L.divIcon({
                className: "intersection-marker",
                html: `
                    <div style="position:relative; width:28px; height:28px;">
                        <div style="
                            position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
                            width:18px; height:18px; border-radius:50%;
                            background:${color}; border:2px solid rgba(255,255,255,0.9);
                            box-shadow: 0 0 12px ${color}, 0 0 24px ${color};
                            z-index:10;
                        "></div>
                        <div style="
                            position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
                            width:28px; height:28px; border-radius:50%;
                            border:2px solid ${color}90;
                            animation: ping 1.5s cubic-bezier(0,0,0.2,1) infinite;
                        "></div>

                        <!-- Permanent Timer Tooltip Badge -->
                        <div style="
                             position: absolute;
                             top: -12px;
                             left: 22px;
                             background: rgba(10,20,40,0.95);
                             border: 1px solid ${color}80;
                             border-radius: 12px;
                             padding: 2px 8px;
                             color: white;
                             font-size: 11px;
                             font-weight: bold;
                             white-space: nowrap;
                             display: flex;
                             align-items: center;
                             gap: 5px;
                             box-shadow: 0 4px 12px rgba(0,0,0,0.6);
                             pointer-events: none;
                        ">
                            ${emoji} ${inter.timer}s
                        </div>
                    </div>
                    <style>
                        @keyframes ping {
                            75%, 100% { transform: translate(-50%,-50%) scale(1.8); opacity: 0; }
                        }
                    </style>
                 `,
                iconSize: [28, 28],
                iconAnchor: [14, 14],
            });

            const tooltipHtml = `
                    <div style="
                        background:rgba(10,20,40,0.95); border:1px solid ${color}60;
                        padding:10px; border-radius:8px; font-size:12px;
                        color:#e2e8f0; font-family:Inter,sans-serif;
                        width: max-content;
                        max-width: 250px;
                    ">
                        <div style="font-weight:700;color:${color}">${inter.name}</div>
                        <div style="color:#94a3b8;margin-top:4px;">State: <span style="color:${color}; font-weight: 600;">${inter.light_state}</span></div>
                        <div style="color:#cbd5e1;margin-top:8px;font-size:11px;line-height:1.4;">
                            <span style="color:#94a3b8;font-weight:600;">AI Reasoning:</span><br/>
                            ${inter.reasoning}
                        </div>
                    </div>
             `;

            const marker = L.marker([inter.lat, inter.lng], { icon: pulseIcon })
                .addTo(map)
                .bindTooltip(tooltipHtml, { permanent: false, direction: "top", offset: [0, -10], className: "custom-dark-tooltip" });

            markersRef.current.push(marker);
        });

    }, [intersections]);

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
