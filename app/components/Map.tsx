"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, Marker, Polyline } from "leaflet";
import { IntersectionData, RouteData } from "../hooks/useTrafficData";

const RIYADH_CENTER: [number, number] = [24.6853, 46.7029];

// Math helper to interpolate between two [lat, lng] points
function interpolatePoint(p1: [number, number], p2: [number, number], fraction: number): [number, number] {
    return [
        p1[0] + (p2[0] - p1[0]) * fraction,
        p1[1] + (p2[1] - p1[1]) * fraction,
    ];
}

interface MapViewProps {
    intersections?: IntersectionData[];
    routes?: RouteData[];
}

export default function MapView({ intersections = [], routes = [] }: MapViewProps) {
    const mapRef = useRef<LeafletMap | null>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);

    // Web maps state refs to allow hot swap on updates
    const markersRef = useRef<Marker[]>([]);
    const polylinesRef = useRef<Polyline[]>([]);
    const carsRef = useRef<Marker[]>([]);
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
                weight: 12,
                opacity: 0.35,
                lineCap: "round",
                lineJoin: "round",
                interactive: false
            }).addTo(map);

            // Inner Line (Solid)
            const inner = L.polyline(route.path, {
                color,
                weight: 4,
                opacity: 0.9,
                lineCap: "round",
                lineJoin: "round",
            }).addTo(map).bindTooltip(`Route Congestion: ${route.congestion}`, { sticky: true });

            polylinesRef.current.push(outer, inner);
        });
    }, [routes]);

    // Effect for Cars Visualization (Snapped to Routes)
    useEffect(() => {
        if (!mapRef.current || !leafletLibRef.current) return;
        const L = leafletLibRef.current;
        const map = mapRef.current;

        carsRef.current.forEach(c => c.remove());
        carsRef.current = [];

        routes.forEach(route => {
            if (route.path.length < 2) return;

            // Logic determines if the route ends at a Red or Green intersection bounds to simulate queue or flow
            const destCoord = route.path[route.path.length - 1];

            // Find matching intersection closest to route endpoint to dictate car logic
            const matchedIntersection = intersections.find(i =>
                Math.abs(i.lat - destCoord[0]) < 0.005 &&
                Math.abs(i.lng - destCoord[1]) < 0.005
            );

            const isStoppedStack = matchedIntersection?.light_state.toLowerCase() === "red";
            const numCars = isStoppedStack ? Math.floor(6 + Math.random() * 4) : 4; // Dense cluster on red, scattered on green/none

            const carIcon = L.divIcon({
                className: "car-marker",
                html: `<div style="font-size:14px;filter:drop-shadow(0 0 5px rgba(255,255,255,0.8)); transform: rotate(${Math.random() * 20 - 10}deg);">🚘</div>`,
                iconSize: [18, 18],
                iconAnchor: [9, 9],
            });

            for (let i = 0; i < numCars; i++) {
                let fraction;
                if (isStoppedStack) {
                    // Stack heavily at the end (0.85 to 0.99 fraction along the route path) to simulate red light jam
                    fraction = 0.85 + (Math.random() * 0.14);
                } else {
                    // Distribute safely scattered along the path roughly evenly
                    fraction = (i + 1) / (numCars + 1) + (Math.random() * 0.1 - 0.05);
                }

                fraction = Math.max(0, Math.min(1, fraction)); // Clamp 0-1

                // Basic approach mapping fraction 0-1 across the entire multi-point path Array
                const segmentsAndLengths = [];
                let totalDist = 0;
                for (let j = 0; j < route.path.length - 1; j++) {
                    const p1 = route.path[j];
                    const p2 = route.path[j + 1];
                    const dist = Math.sqrt(Math.pow(p2[0] - p1[0], 2) + Math.pow(p2[1] - p1[1], 2));
                    segmentsAndLengths.push({ p1, p2, dist });
                    totalDist += dist;
                }

                if (totalDist > 0) {
                    const targetDist = totalDist * fraction;
                    let currentDist = 0;
                    for (const seg of segmentsAndLengths) {
                        if (currentDist + seg.dist >= targetDist) {
                            const remaining = targetDist - currentDist;
                            const subFraction = remaining / seg.dist;
                            const point = interpolatePoint(seg.p1, seg.p2, subFraction);

                            const marker = L.marker(point, { icon: carIcon, interactive: false }).addTo(map);
                            carsRef.current.push(marker);
                            break;
                        }
                        currentDist += seg.dist;
                    }
                }
            }
        });
    }, [routes, intersections]);


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
                            box-shadow: 0 0 16px ${color}, 0 0 32px ${color};
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
                             top: -18px;
                             left: 20px;
                             background: rgba(10,20,40,0.95);
                             border: 1px solid ${color}BB;
                             border-radius: 12px;
                             padding: 4px 10px;
                             color: white;
                             font-size: 13px;
                             font-weight: 800;
                             white-space: nowrap;
                             display: flex;
                             align-items: center;
                             gap: 6px;
                             box-shadow: 0 4px 16px rgba(0,0,0,0.8);
                             pointer-events: none;
                             z-index: 20;
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
