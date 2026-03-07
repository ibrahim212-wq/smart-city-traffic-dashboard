"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap, Marker, Polyline } from "leaflet";
import { IntersectionData, RouteData } from "../hooks/useTrafficData";
import { WsTrafficData } from "../hooks/useWebSocketTraffic";

// Centered on King Fahd Road / Olaya Street intersection, Riyadh
const RIYADH_CENTER: [number, number] = [24.693, 46.688];

// ── King Fahd Road & Olaya Street static geometry ──────────────────────────
const INTERSECTION_POINT: [number, number] = [24.693, 46.688];

// Full road polylines for coloring
const KING_FAHD_ROAD: [number, number][] = [
  [24.715, 46.688],
  [24.705, 46.688],
  [24.693, 46.688],
  [24.681, 46.688],
  [24.670, 46.688],
];
const OLAYA_STREET: [number, number][] = [
  [24.693, 46.664],
  [24.693, 46.676],
  [24.693, 46.688],
  [24.693, 46.700],
  [24.693, 46.710],
];

// Road arms: each sub-array is a path that cars travel along toward the intersection
const WS_ROAD_ARMS: [number, number][][] = [
  [[24.715, 46.688], [24.705, 46.688], [24.693, 46.688]], // North → intersection
  [[24.670, 46.688], [24.681, 46.688], [24.693, 46.688]], // South → intersection
  [[24.693, 46.710], [24.693, 46.700], [24.693, 46.688]], // East  → intersection
  [[24.693, 46.664], [24.693, 46.676], [24.693, 46.688]], // West  → intersection
];
// How many cars per arm
const CARS_PER_ARM = [3, 3, 2, 2];

// ── Helpers ─────────────────────────────────────────────────────────────────
function interpolatePoint(
  p1: [number, number],
  p2: [number, number],
  t: number
): [number, number] {
  return [p1[0] + (p2[0] - p1[0]) * t, p1[1] + (p2[1] - p1[1]) * t];
}

function interpolateAlongPath(
  path: [number, number][],
  fraction: number
): [number, number] {
  if (path.length === 1) return path[0];
  let totalDist = 0;
  const segs: { p1: [number, number]; p2: [number, number]; dist: number }[] = [];
  for (let i = 0; i < path.length - 1; i++) {
    const p1 = path[i];
    const p2 = path[i + 1];
    const dist = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    segs.push({ p1, p2, dist });
    totalDist += dist;
  }
  const target = totalDist * Math.max(0, Math.min(1, fraction));
  let current = 0;
  for (const seg of segs) {
    if (current + seg.dist >= target) {
      const sub = seg.dist > 0 ? (target - current) / seg.dist : 0;
      return interpolatePoint(seg.p1, seg.p2, sub);
    }
    current += seg.dist;
  }
  return path[path.length - 1];
}

function getRoadColor(totalVehicles: number): string {
  if (totalVehicles > 1000) return "#ef4444";
  if (totalVehicles > 500) return "#f59e0b";
  return "#10b981";
}

function getCarColor(totalVehicles: number): string {
  if (totalVehicles > 1000) return "#ef4444";
  if (totalVehicles > 500) return "#f59e0b";
  return "#00d4ff";
}

function buildCarDotHtml(color: string): string {
  return `<div class="car-dot" style="
    width:10px; height:10px; border-radius:50%;
    background:${color};
    border:1.5px solid rgba(255,255,255,0.7);
    box-shadow:0 0 8px ${color},0 0 16px ${color}80;
    transition: background 0.5s ease;
  "></div>`;
}

function buildTlMarkerHtml(phase: number): string {
  const isGreen = phase === 1;
  const color = isGreen ? "#10b981" : "#ef4444";
  const label = isGreen ? "🟢 GREEN" : "🔴 RED";
  return `<div style="
    background:rgba(10,20,40,0.95);
    border:2px solid ${color};
    border-radius:20px;
    padding:5px 12px;
    color:${color};
    font-size:11px;
    font-weight:800;
    font-family:Inter,sans-serif;
    white-space:nowrap;
    box-shadow:0 0 20px ${color}80,0 0 40px ${color}30;
    letter-spacing:0.05em;
    pointer-events:none;
  ">${label}</div>`;
}

interface AnimatedCar {
    marker: Marker;
    path: [number, number][];
    fraction: number;
}

interface MapViewProps {
    intersections?: IntersectionData[];
    routes?: RouteData[];
    wsData?: WsTrafficData | null;
}

export default function MapView({ intersections = [], routes = [], wsData }: MapViewProps) {
    const mapRef = useRef<LeafletMap | null>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);

    // Existing refs for HTTP-API-driven layers
    const markersRef = useRef<Marker[]>([]);
    const polylinesRef = useRef<Polyline[]>([]);
    const carsRef = useRef<Marker[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const leafletLibRef = useRef<any>(null);

    // New refs for WS-driven King Fahd Road layers
    const wsRoadsRef = useRef<Polyline[]>([]);
    const wsCarsRef = useRef<AnimatedCar[]>([]);
    const wsTlMarkerRef = useRef<Marker | null>(null);
    const animIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const wsDataRef = useRef<WsTrafficData | null>(null);
    const wsLayersReadyRef = useRef(false);

    // Initial Map Setup
    useEffect(() => {
        if (typeof window === "undefined") return;
        if (mapRef.current) return;

        import("leaflet").then((L) => {
            if (!mapContainerRef.current || mapRef.current) return;
            leafletLibRef.current = L;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            delete (L.Icon.Default.prototype as any)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
                iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
                shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
            });

            const map = L.map(mapContainerRef.current, {
                center: RIYADH_CENTER,
                zoom: 15,
                zoomControl: false,
                attributionControl: false,
            });

            L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
                maxZoom: 19,
                attribution: "© OpenStreetMap, © CartoDB",
            }).addTo(map);

            mapRef.current = map;

            // ── Static WS King Fahd Road layers ──────────────────────────
            const defaultColor = "#10b981";

            // Glow outer line for King Fahd Road
            const kfOuter = L.polyline(KING_FAHD_ROAD, {
                color: defaultColor, weight: 16, opacity: 0.18,
                lineCap: "round", lineJoin: "round", interactive: false,
            }).addTo(map);
            const kfInner = L.polyline(KING_FAHD_ROAD, {
                color: defaultColor, weight: 5, opacity: 0.9,
                lineCap: "round", lineJoin: "round", interactive: false,
            }).addTo(map);

            // Glow outer line for Olaya Street
            const olOuter = L.polyline(OLAYA_STREET, {
                color: defaultColor, weight: 16, opacity: 0.18,
                lineCap: "round", lineJoin: "round", interactive: false,
            }).addTo(map);
            const olInner = L.polyline(OLAYA_STREET, {
                color: defaultColor, weight: 5, opacity: 0.9,
                lineCap: "round", lineJoin: "round", interactive: false,
            }).addTo(map);

            wsRoadsRef.current = [kfOuter, kfInner, olOuter, olInner];

            // ── Animated vehicle dots ─────────────────────────────────────
            const animCars: AnimatedCar[] = [];
            WS_ROAD_ARMS.forEach((armPath, armIdx) => {
                const count = CARS_PER_ARM[armIdx];
                for (let i = 0; i < count; i++) {
                    const startFraction = (i + 1) / (count + 1);
                    const startPos = interpolateAlongPath(armPath, startFraction);
                    const icon = L.divIcon({
                        className: "car-marker",
                        html: buildCarDotHtml(defaultColor),
                        iconSize: [10, 10],
                        iconAnchor: [5, 5],
                    });
                    const marker = L.marker(startPos, { icon, interactive: false, zIndexOffset: 500 }).addTo(map);
                    animCars.push({ marker, path: armPath, fraction: startFraction });
                }
            });
            wsCarsRef.current = animCars;

            // ── Traffic light marker at intersection ──────────────────────
            const tlIcon = L.divIcon({
                className: "intersection-marker",
                html: buildTlMarkerHtml(0),
                iconSize: [90, 32],
                iconAnchor: [45, 16],
            });
            wsTlMarkerRef.current = L.marker(INTERSECTION_POINT, { icon: tlIcon, interactive: false, zIndexOffset: 1000 }).addTo(map);

            // ── Intersection label ────────────────────────────────────────
            L.divIcon({});
            const labelIcon = L.divIcon({
                className: "intersection-marker",
                html: `<div style="
                    background:rgba(10,20,40,0.85); border:1px solid rgba(0,212,255,0.35);
                    border-radius:8px; padding:4px 9px;
                    color:#94a3b8; font-size:10px; font-family:Inter,sans-serif;
                    white-space:nowrap; pointer-events:none;
                    box-shadow:0 4px 12px rgba(0,0,0,0.5);
                ">King Fahd Rd × Olaya St</div>`,
                iconSize: [170, 26],
                iconAnchor: [85, -16],
            });
            L.marker(INTERSECTION_POINT, { icon: labelIcon, interactive: false }).addTo(map);

            wsLayersReadyRef.current = true;
        });

        return () => {
            if (animIntervalRef.current) clearInterval(animIntervalRef.current);
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
            wsLayersReadyRef.current = false;
        };
    }, []);

    // ── Animation loop: runs continuously, reads wsDataRef to avoid stale closure ──
    useEffect(() => {
        const TICK_MS = 80;

        const tick = () => {
            const wd = wsDataRef.current;
            if (!wd || !wsLayersReadyRef.current) return;

            const isGreen = wd.current_phase === 1;
            const speed = wd.total_vehicles > 1000 ? 0.0010
                : wd.total_vehicles > 500 ? 0.0022
                : 0.0038;

            wsCarsRef.current.forEach((car) => {
                const stoppedByRed = !isGreen && car.fraction >= 0.86;
                if (!stoppedByRed) {
                    car.fraction += speed + Math.random() * 0.0004;
                    if (car.fraction > 1.02) car.fraction = 0;
                }
                const clipped = Math.min(car.fraction, isGreen ? 1.0 : 0.86);
                const pos = interpolateAlongPath(car.path, Math.min(clipped, 1.0));
                car.marker.setLatLng(pos);
            });
        };

        animIntervalRef.current = setInterval(tick, TICK_MS);
        return () => {
            if (animIntervalRef.current) clearInterval(animIntervalRef.current);
        };
    }, []);

    // ── React to live WS data: update road colors, car colors, TL marker ──
    useEffect(() => {
        wsDataRef.current = wsData ?? null;

        if (!wsLayersReadyRef.current || !leafletLibRef.current) return;
        const L = leafletLibRef.current;
        const totalVehicles = wsData?.total_vehicles ?? 0;
        const phase = wsData?.current_phase ?? 0;

        const roadColor = getRoadColor(totalVehicles);
        const carColor = getCarColor(totalVehicles);

        // Update road polyline colors imperatively
        wsRoadsRef.current.forEach((poly, idx) => {
            poly.setStyle({ color: roadColor });
            poly.setStyle({ opacity: idx % 2 === 0 ? 0.18 : 0.9 });
        });

        // Update car dot colors
        wsCarsRef.current.forEach((car) => {
            const el = car.marker.getElement();
            const dot = el?.querySelector(".car-dot") as HTMLElement | null;
            if (dot) {
                dot.style.background = carColor;
                dot.style.boxShadow = `0 0 8px ${carColor},0 0 16px ${carColor}80`;
            }
        });

        // Update traffic light marker
        if (wsTlMarkerRef.current) {
            const newIcon = L.divIcon({
                className: "intersection-marker",
                html: buildTlMarkerHtml(phase),
                iconSize: [90, 32],
                iconAnchor: [45, 16],
            });
            wsTlMarkerRef.current.setIcon(newIcon);
        }
    }, [wsData]);

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
