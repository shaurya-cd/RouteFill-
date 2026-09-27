import React, { useEffect, useRef, useState } from 'react';
import { TruckModel, LoadModel, LocationModel, RouteOptionModel } from '@/lib/api';
import { Locate, Maximize2, Layers } from 'lucide-react';

interface Props {
  selectedTruck: TruckModel | null;
  onSelectTruck: (t: TruckModel) => void;
  trucks: TruckModel[];
  activeLoad: LoadModel | null;
  onSelectLoad: (l: LoadModel) => void;
  loads: LoadModel[];
  locations?: LocationModel[];
  activeRoute?: RouteOptionModel | null;
  allRoutes?: RouteOptionModel[];
  onSelectRoute?: (route: RouteOptionModel) => void;
  userRole?: 'FLEET_OWNER' | 'ADMIN' | 'SHIPPER';
}

const TILE_LAYERS = {
  dark: {
    name: 'Dark Canvas',
    url: 'https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    refUrl: 'https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
  },
  satellite: {
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    refUrl: null,
    attribution: '&copy; Esri',
  },
  streets: {
    name: 'Streets',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    refUrl: null,
    attribution: '&copy; OpenStreetMap contributors',
  },
};

export const MapCanvas: React.FC<Props> = ({
  selectedTruck,
  onSelectTruck,
  trucks,
  activeLoad,
  onSelectLoad,
  loads,
  locations = [],
  activeRoute,
  allRoutes = [],
  onSelectRoute,
  userRole = 'FLEET_OWNER',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileLayersRef = useRef<any[]>([]);
  const layerGroupRef = useRef<any>(null);
  const [activeTileType, setActiveTileType] = useState<'dark' | 'satellite' | 'streets'>('streets');
  const [isLeafletReady, setIsLeafletReady] = useState<boolean>(false);
  const leafletModuleRef = useRef<any>(null);

  const displayLocations = locations;

  const applyTileLayer = (L: any, map: any, type: 'dark' | 'satellite' | 'streets') => {
    tileLayersRef.current.forEach((layer) => layer.remove());
    tileLayersRef.current = [];

    const config = TILE_LAYERS[type];
    const baseLayer = L.tileLayer(config.url, { maxZoom: 19 }).addTo(map);
    baseLayer.bringToBack();
    tileLayersRef.current.push(baseLayer);

    if (config.refUrl) {
      const refLayer = L.tileLayer(config.refUrl, { maxZoom: 19 }).addTo(map);
      tileLayersRef.current.push(refLayer);
    }
  };

  useEffect(() => {
    let isCancelled = false;
    async function initMap() {
      if (typeof window === 'undefined' || !mapContainerRef.current || mapInstanceRef.current) return;
      const L = await import('leaflet');
      if (isCancelled) return;
      leafletModuleRef.current = L;

      const map = L.map(mapContainerRef.current, {
        center: [21.8, 79.5],
        zoom: 5.2,
        zoomControl: false,
        attributionControl: false,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);
      applyTileLayer(L, map, activeTileType);

      const layerGroup = L.layerGroup().addTo(map);
      layerGroupRef.current = layerGroup;
      mapInstanceRef.current = map;
      setIsLeafletReady(true);
    }
    initMap();
    return () => {
      isCancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !leafletModuleRef.current) return;
    applyTileLayer(leafletModuleRef.current, mapInstanceRef.current, activeTileType);
  }, [activeTileType]);

  useEffect(() => {
    if (!mapInstanceRef.current || !leafletModuleRef.current || !layerGroupRef.current) return;
    const L = leafletModuleRef.current;
    const layerGroup = layerGroupRef.current;
    layerGroup.clearLayers();

    displayLocations.forEach((hub) => {
      const lat = Number(hub.latitude);
      const lng = Number(hub.longitude);
      if (isNaN(lat) || isNaN(lng)) return;

      const cityName = hub.name.split(' ')[0];
      const hubIcon = L.divIcon({
        className: 'hub-div-marker',
        html: `
          <div style="display: flex; flex-direction: column; align-items: center; pointer-events: auto; cursor: pointer;">
            <div style="width: 8px; height: 8px; border-radius: 50%; background: #38bdf8; border: 2px solid #0f172a; box-shadow: 0 0 8px #38bdf8;"></div>
            <span style="font-size: 9px; font-weight: 600; color: #94a3b8; text-shadow: 0 1px 3px rgba(0,0,0,0.9); margin-top: 2px; white-space: nowrap;">
              ${cityName}
            </span>
          </div>
        `,
        iconSize: [50, 24],
        iconAnchor: [25, 4],
      });

      const hubMarker = L.marker([lat, lng], { icon: hubIcon });
      hubMarker.bindPopup(`<div style="font-size: 12px;"><b>${hub.name}</b></div>`);
      layerGroup.addLayer(hubMarker);
    });

    // Group co-located trucks so all fleet vehicles are distinct and clearly clickable
    const coordCounts: Record<string, number> = {};

    trucks.forEach((t) => {
      let lat = t.currentLocation ? Number(t.currentLocation.latitude) : 19.076;
      let lng = t.currentLocation ? Number(t.currentLocation.longitude) : 72.8777;
      if (isNaN(lat) || isNaN(lng)) return;

      const coordKey = `${lat.toFixed(2)},${lng.toFixed(2)}`;
      const occurrence = coordCounts[coordKey] || 0;
      coordCounts[coordKey] = occurrence + 1;

      if (occurrence > 0) {
        // Offset subsequent co-located vehicles slightly (~3-4 km) in different directions
        const angle = (occurrence * 2 * Math.PI) / 4;
        lat += 0.035 * Math.sin(angle);
        lng += 0.035 * Math.cos(angle);
      }

      const isSelected = selectedTruck?.id === t.id;
      const truckIcon = L.divIcon({
        className: 'truck-3d-div-marker',
        html: `
          <div class="pin-float-hover" style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
            <div style="
              display: flex;
              align-items: center;
              gap: 6px;
              padding: 5px 10px;
              border-radius: 12px;
              background: linear-gradient(135deg, ${isSelected ? '#6366f1, #4338ca' : 'rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95)'});
              color: white;
              border: 1.5px solid ${isSelected ? '#c7d2fe' : 'rgba(255, 255, 255, 0.22)'};
              box-shadow: 0 14px 24px -4px rgba(0, 0, 0, 0.8), 0 0 16px ${isSelected ? 'rgba(99, 102, 241, 0.7)' : 'rgba(0,0,0,0.3)'}, inset 0 1px 1px rgba(255,255,255,0.35);
              transform: translateY(-10px) perspective(350px) rotateX(8deg);
            ">
              <span style="display: grid; place-items: center; width: 22px; height: 22px; border-radius: 7px; background: ${isSelected ? '#312e81' : 'rgba(255,255,255,0.12)'}; box-shadow: inset 0 1px 2px rgba(255,255,255,0.25);">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>
              </span>
              <div style="display: flex; flex-direction: column;">
                <span style="font-size: 11px; font-family: monospace; font-weight: 800; letter-spacing: -0.02em; line-height: 1.1;">${t.truck_number}</span>
                <span style="font-size: 9px; opacity: 0.9; color: ${isSelected ? '#e0e7ff' : '#94a3b8'};">${t.capacity_tons}T · ${t.truckType?.name || 'TRUCK'}</span>
              </div>
            </div>
            <div style="width: 2px; height: 12px; background: linear-gradient(to bottom, ${isSelected ? '#818cf8' : 'rgba(255,255,255,0.45)'}, transparent); margin-top: -10px;"></div>
            <div style="position: relative; width: 20px; height: 8px; margin-top: 1px;">
              <div style="position: absolute; inset: 0; border-radius: 50%; background: radial-gradient(ellipse at center, rgba(0,0,0,0.85) 0%, transparent 75%);"></div>
              <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 5px; height: 5px; border-radius: 50%; background: ${isSelected ? '#6366f1' : '#38bdf8'}; box-shadow: 0 0 8px ${isSelected ? '#818cf8' : '#38bdf8'};"></div>
            </div>
          </div>
        `,
        iconSize: [115, 48],
        iconAnchor: [57, 46],
      });

      const marker = L.marker([lat, lng], { icon: truckIcon, zIndexOffset: isSelected ? 1000 : 100 });
      marker.on('click', () => onSelectTruck(t));
      marker.bindPopup(`
        <div style="font-size: 12px; min-width: 140px;">
          <div style="font-family: monospace; font-weight: bold; color: #818cf8; font-size: 13px;">${t.truck_number}</div>
          <div style="color: #cbd5e1; margin-top: 2px;">${t.truckType?.name || 'FREIGHT TRUCK'} · ${t.capacity_tons} Tons</div>
          <div style="margin-top: 4px; color: #94a3b8; font-size: 11px;">Base Hub: ${t.currentLocation?.name || 'In Transit'}</div>
          <div style="margin-top: 2px; color: #64748b; font-size: 10px;">Owner: ${t.owner?.name || 'Fleet Operator'}</div>
        </div>
      `);
      layerGroup.addLayer(marker);
    });

    loads.forEach((l) => {
      const pLat = l.pickupLocation ? Number(l.pickupLocation.latitude) : null;
      const pLng = l.pickupLocation ? Number(l.pickupLocation.longitude) : null;
      if (!pLat || !pLng || isNaN(pLat) || isNaN(pLng)) return;

      const isActive = activeLoad?.id === l.id;
      const pickupCity = (l.pickupLocation?.city || l.pickupLocation?.name || 'Pickup').split(' ')[0];
      const destCity = (l.destinationLocation?.city || l.destinationLocation?.name || 'Drop').split(' ')[0];

      const loadIcon = L.divIcon({
        className: 'load-3d-div-marker',
        html: `
          <div class="pin-float-hover" style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
            <div style="
              display: flex;
              align-items: center;
              gap: 5px;
              padding: 4px 9px;
              border-radius: 11px;
              background: linear-gradient(135deg, ${isActive ? '#059669, #047857' : 'rgba(15, 23, 42, 0.92), rgba(30, 41, 59, 0.92)'});
              color: white;
              border: 1.5px solid ${isActive ? '#6ee7b7' : 'rgba(16, 185, 129, 0.45)'};
              box-shadow: 0 12px 22px -4px rgba(0, 0, 0, 0.75), 0 0 14px ${isActive ? 'rgba(16, 185, 129, 0.6)' : 'rgba(0,0,0,0.25)'}, inset 0 1px 1px rgba(255,255,255,0.25);
              transform: translateY(-8px) perspective(350px) rotateX(8deg);
            ">
              <span style="display: grid; place-items: center; width: 20px; height: 20px; border-radius: 6px; background: ${isActive ? '#065f46' : 'rgba(16,185,129,0.18)'}; color: #34d399;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
              </span>
              <div style="display: flex; flex-direction: column;">
                <span style="font-size: 10px; font-weight: 800; color: #f8fafc; line-height: 1.1;">${pickupCity} → ${destCity}</span>
                <span style="font-size: 9px; font-weight: 700; color: ${isActive ? '#a7f3d0' : '#10b981'};">₹${Number(l.offered_price).toLocaleString('en-IN')} · ${l.weight_tons}T</span>
              </div>
            </div>
            <div style="width: 1.5px; height: 10px; background: linear-gradient(to bottom, ${isActive ? '#34d399' : '#10b981'}, transparent); margin-top: -8px;"></div>
            <div style="position: relative; width: 16px; height: 6px; margin-top: 1px;">
              <div style="position: absolute; inset: 0; border-radius: 50%; background: radial-gradient(ellipse at center, rgba(0,0,0,0.8) 0%, transparent 75%);"></div>
              <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 4.5px; height: 4.5px; border-radius: 50%; background: #10b981; box-shadow: 0 0 6px #10b981;"></div>
            </div>
          </div>
        `,
        iconSize: [110, 42],
        iconAnchor: [55, 40],
      });

      const loadMarker = L.marker([pLat, pLng], { icon: loadIcon, zIndexOffset: isActive ? 900 : 50 });
      loadMarker.on('click', () => onSelectLoad(l));
      loadMarker.bindPopup(`
        <div style="font-size: 12px; min-width: 150px;">
          <div style="font-weight: bold; color: #10b981; font-size: 13px;">${l.cargo_description || 'Commercial Freight'}</div>
          <div style="color: #cbd5e1; margin-top: 2px;">${pickupCity} → ${destCity} (${l.weight_tons} Tons)</div>
          <div style="margin-top: 4px; font-weight: bold; color: #34d399; font-size: 12px;">Payout: ₹${Number(l.offered_price).toLocaleString('en-IN')}</div>
        </div>
      `);
      layerGroup.addLayer(loadMarker);
    });

    const inboundTrip = selectedTruck?.trips?.[0];
    if (inboundTrip && inboundTrip.originLocation && inboundTrip.destinationLocation) {
      const oLat = Number(inboundTrip.originLocation.latitude);
      const oLng = Number(inboundTrip.originLocation.longitude);
      const dLat = Number(inboundTrip.destinationLocation.latitude);
      const dLng = Number(inboundTrip.destinationLocation.longitude);
      if (!isNaN(oLat) && !isNaN(oLng) && !isNaN(dLat) && !isNaN(dLng)) {
        const inboundLine = L.polyline([[oLat, oLng], [dLat, dLng]], { color: '#38bdf8', weight: 3.5, dashArray: '8, 8', opacity: 0.85 });
        inboundLine.bindTooltip(`Current Line-Haul: ${inboundTrip.originLocation.city || 'Delhi'} → ${inboundTrip.destinationLocation.city || 'Mumbai'}`, { sticky: true });
        layerGroup.addLayer(inboundLine);
      }
    }

    if (activeLoad && activeLoad.pickupLocation && activeLoad.destinationLocation) {
      const pLat = Number(activeLoad.pickupLocation.latitude);
      const pLng = Number(activeLoad.pickupLocation.longitude);
      const dLat = Number(activeLoad.destinationLocation.latitude);
      const dLng = Number(activeLoad.destinationLocation.longitude);

      if (!isNaN(pLat) && !isNaN(pLng) && !isNaN(dLat) && !isNaN(dLng)) {
        const tLat = selectedTruck?.currentLocation ? Number(selectedTruck.currentLocation.latitude) : pLat;
        const tLng = selectedTruck?.currentLocation ? Number(selectedTruck.currentLocation.longitude) : pLng;
        if (tLat !== pLat || tLng !== pLng) {
          const deadheadLine = L.polyline([[tLat, tLng], [pLat, pLng]], { color: '#ef4444', weight: 3, dashArray: '5, 8', opacity: 0.85 });
          deadheadLine.bindTooltip('Empty Transit to Pickup', { sticky: true });
          layerGroup.addLayer(deadheadLine);
        }

        if (allRoutes && allRoutes.length > 0) {
          allRoutes.forEach((route) => {
            const isSelected = (activeRoute?.route_id === route.route_id);
            const routePoints = route.waypoints && route.waypoints.length > 1 ? route.waypoints : [[pLat, pLng], [dLat, dLng]];
            const polyline = L.polyline(routePoints, {
              color: route.ai_recommended ? '#10b981' : '#f59e0b',
              weight: isSelected ? 6 : 3.5,
              opacity: isSelected ? 0.95 : 0.65,
              dashArray: route.ai_recommended ? undefined : '6, 6',
            });
            polyline.on('click', () => onSelectRoute?.(route));

            const tooltipContent = route.ai_recommended
              ? `AI Recommended Route: ${route.name} (${route.distance_km} km · ${route.estimated_hours}h · ₹${route.toll_cost} tolls)`
              : `Alternative Route: ${route.name} (+3.5h slower, +₹1,000 tolls). Click for AI diagnosis.`;
            polyline.bindTooltip(tooltipContent, { sticky: true });

            polyline.bindPopup(`
              <div style="font-size: 12px; min-width: 170px;">
                <div style="font-weight: bold; color: ${route.ai_recommended ? '#10b981' : '#f59e0b'};">
                  ${route.ai_recommended ? 'AI Recommended Route' : 'Alternative Route (Not Recommended)'}
                </div>
                <div style="color: #cbd5e1; margin-top: 2px;">${route.name}</div>
                <div style="margin-top: 4px; font-size: 11px; color: #94a3b8;">
                  Distance: <b>${route.distance_km} km</b> · Time: <b>${route.estimated_hours}h</b> · Tolls: <b>₹${route.toll_cost}</b>
                </div>
                ${!route.ai_recommended ? `
                  <div style="margin-top: 6px; padding: 4px; background: rgba(245,158,11,0.15); border-radius: 6px; border: 1px solid rgba(245,158,11,0.3); font-size: 10px; color: #f59e0b;">
                    <b>Why Not This Route:</b> Slower by 3.5h due to Bharuch bottlenecks & ₹1,000 higher tolls.
                  </div>
                ` : ''}
              </div>
            `);

            layerGroup.addLayer(polyline);
          });
        } else {
          const loadCorridor = L.polyline([[pLat, pLng], [dLat, dLng]], { color: '#10b981', weight: 4.5, opacity: 0.95 });
          layerGroup.addLayer(loadCorridor);
        }

        const pickupName = (activeLoad.pickupLocation?.name || 'Pickup').split(' ')[0];
        const destName = (activeLoad.destinationLocation?.name || 'Delivery').split(' ')[0];

        const pickupIcon = L.divIcon({
          className: 'pickup-3d-badge',
          html: `<div style="background: linear-gradient(135deg, #ef4444, #b91c1c); color: white; padding: 4px 10px; border-radius: 9999px; font-size: 10px; font-weight: 800; display: flex; align-items: center; gap: 5px; border: 1.5px solid #fca5a5; box-shadow: 0 10px 20px rgba(239,68,68,0.5), 0 0 12px rgba(239,68,68,0.6); transform: perspective(300px) rotateX(10deg);"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg> Pickup: ${pickupName}</div>`,
          iconSize: [115, 26], iconAnchor: [57, 13],
        });
        layerGroup.addLayer(L.marker([pLat, pLng], { icon: pickupIcon, zIndexOffset: 950 }));

        const dropIcon = L.divIcon({
          className: 'drop-3d-badge',
          html: `<div style="background: linear-gradient(135deg, #10b981, #047857); color: white; padding: 4px 10px; border-radius: 9999px; font-size: 10px; font-weight: 800; display: flex; align-items: center; gap: 5px; border: 1.5px solid #6ee7b7; box-shadow: 0 10px 20px rgba(16,185,129,0.5), 0 0 12px rgba(16,185,129,0.6); transform: perspective(300px) rotateX(10deg);"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/></svg> Delivery: ${destName}</div>`,
          iconSize: [115, 26], iconAnchor: [57, 13],
        });
        layerGroup.addLayer(L.marker([dLat, dLng], { icon: dropIcon, zIndexOffset: 950 }));
      }
    }
  }, [trucks, selectedTruck, activeLoad, loads, displayLocations, isLeafletReady, allRoutes, activeRoute]);

  const handleLocateTruck = () => {
    if (!mapInstanceRef.current || !selectedTruck || !selectedTruck.currentLocation) return;
    const lat = Number(selectedTruck.currentLocation.latitude);
    const lng = Number(selectedTruck.currentLocation.longitude);
    if (!isNaN(lat) && !isNaN(lng)) mapInstanceRef.current.flyTo([lat, lng], 8, { duration: 1.2 });
  };

  const handleResetView = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([21.8, 79.5], 5.2, { duration: 1.0 });
  };

  return (
    <div className="relative h-full w-full overflow-hidden select-none bg-background">
      {/* Interactive Leaflet Map Container */}
      <div ref={mapContainerRef} className="h-full w-full z-10" />

      {/* Unified Map Control Toolbar (Bottom-right above zoom buttons) */}
      <div className="absolute bottom-20 right-4 sm:right-6 z-20 flex items-center gap-1 rounded-2xl border border-card/60 bg-card/85 p-1 shadow-xl backdrop-blur-xl pointer-events-auto">
        {/* Layer Style Switcher */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setActiveTileType('dark')}
            className={`rounded-xl px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
              activeTileType === 'dark'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Dark
          </button>
          <button
            onClick={() => setActiveTileType('satellite')}
            className={`rounded-xl px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
              activeTileType === 'satellite'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Satellite
          </button>
          <button
            onClick={() => setActiveTileType('streets')}
            className={`rounded-xl px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
              activeTileType === 'streets'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Streets
          </button>
        </div>

        {/* Subtle Divider */}
        <div className="h-4 w-px bg-border/80 mx-1" />

        {/* View Controls */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={handleLocateTruck}
            title="Focus Selected Vehicle"
            className="grid h-7 w-7 place-items-center rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
          >
            <Locate className="h-4 w-4 text-primary" />
          </button>
          <button
            onClick={handleResetView}
            title="Fit Pan-India View"
            className="grid h-7 w-7 place-items-center rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Map Legend Overlay */}
      <div className="pointer-events-none absolute bottom-6 left-6 z-20 hidden items-center gap-4 rounded-2xl border border-card/60 bg-card/85 px-4 py-2 text-[11px] text-muted-foreground shadow-xl backdrop-blur-xl sm:flex">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#38bdf8] shadow-[0_0_6px_#38bdf8]" />
          <span>Freight Hub ({displayLocations.length})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#818cf8]" />
          <span>Fleet Vehicle ({trucks.length})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-4 rounded-full bg-[#10b981]" />
          <span>Return Load Corridor</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-4 rounded-full bg-[#ef4444]" />
          <span>Deadhead Connector</span>
        </div>
      </div>
    </div>
  );
};
