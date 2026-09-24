import React, { useState, useEffect, useRef } from 'react';
import { LocationModel } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  MapPin,
  CheckCircle2,
  Loader2,
  Search,
  Crosshair,
  X,
} from 'lucide-react';

export interface VerifiedLocation {
  id?: number;
  name: string;
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  isDbHub?: boolean;
}

interface LocationInputProps {
  label: string;
  value: VerifiedLocation | null;
  onChange: (loc: VerifiedLocation | null) => void;
  knownLocations: LocationModel[];
  placeholder?: string;
  required?: boolean;
  hint?: string;
}

export const LocationInput: React.FC<LocationInputProps> = ({
  label,
  value,
  onChange,
  knownLocations = [],
  placeholder = 'Type city or transport hub (e.g. Pune, Jaipur, Surat)',
  required = false,
  hint,
}) => {
  const [query, setQuery] = useState<string>('');
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isLoadingGeocode, setIsLoadingGeocode] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<VerifiedLocation[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search logic: combines local PostgreSQL hubs + OpenStreetMap Nominatim geocoding
  useEffect(() => {
    if (!query.trim() || value) {
      setSuggestions([]);
      return;
    }

    const q = query.toLowerCase().trim();

    // 1. Match local PostgreSQL hubs first
    const localMatches: VerifiedLocation[] = knownLocations
      .filter((l) => {
        const nameMatch = l.name.toLowerCase().includes(q);
        const cityMatch = l.city ? l.city.toLowerCase().includes(q) : false;
        const stateMatch = l.state ? l.state.toLowerCase().includes(q) : false;
        return nameMatch || cityMatch || stateMatch;
      })
      .map((l) => ({
        id: l.id,
        name: l.name,
        city: l.city || l.name.split(' ')[0] || 'Unknown',
        state: l.state,
        country: l.country || 'India',
        latitude: parseFloat(String(l.latitude)),
        longitude: parseFloat(String(l.longitude)),
        isDbHub: true,
      }));

    setSuggestions(localMatches);
    setIsOpen(true);

    // 2. Fetch live OpenStreetMap Nominatim geocoding with 350ms debounce
    const timer = setTimeout(async () => {
      if (query.trim().length < 2) return;
      setIsLoadingGeocode(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            query
          )}&countrycodes=in&limit=5&addressdetails=1`
        );
        if (res.ok) {
          const data: any[] = await res.json();
          const nominatimMatches: VerifiedLocation[] = data
            .map((item): VerifiedLocation | null => {
              const addr = item.address || {};
              const city =
                addr.city ||
                addr.town ||
                addr.state_district ||
                addr.county ||
                addr.suburb ||
                item.display_name.split(',')[0];
              const state = addr.state || 'India';
              const lat = parseFloat(item.lat);
              const lon = parseFloat(item.lon);

              if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
                return null;
              }

              return {
                name: `${city} Logistics Point, ${state}`,
                city,
                state,
                country: addr.country || 'India',
                latitude: Math.round(lat * 10000) / 10000,
                longitude: Math.round(lon * 10000) / 10000,
                isDbHub: false,
              };
            })
            .filter((item): item is VerifiedLocation => item !== null);

          // Merge without exact duplicates
          setSuggestions((prev) => {
            const combined = [...prev];
            for (const nom of nominatimMatches) {
              const alreadyExists = combined.some(
                (c) =>
                  Math.abs(c.latitude - nom.latitude) < 0.05 &&
                  Math.abs(c.longitude - nom.longitude) < 0.05
              );
              if (!alreadyExists) {
                combined.push(nom);
              }
            }
            return combined;
          });
        }
      } catch (err) {
        // Geocode network fallback silent
      } finally {
        setIsLoadingGeocode(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query, knownLocations, value]);

  const handleSelect = (loc: VerifiedLocation) => {
    onChange(loc);
    setQuery('');
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setQuery('');
  };

  return (
    <div className="space-y-1.5" ref={containerRef}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-primary" />
          {label} {required && <span className="text-destructive">*</span>}
        </label>
        {hint && <span className="text-[10px] text-muted-foreground">{hint}</span>}
      </div>

      {value ? (
        // Verified Location Card Display
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 flex items-start justify-between gap-2 shadow-sm transition-all duration-200">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-xs font-bold text-foreground truncate">{value.name}</p>
              <Badge
                variant="outline"
                className="text-[9px] px-1.5 py-0 h-4 border-emerald-500/40 text-emerald-400 bg-emerald-500/10 font-mono flex items-center gap-1"
              >
                <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400" />
                Verified on Map
              </Badge>
              {value.isDbHub && (
                <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 font-mono">
                  PostgreSQL Hub
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-mono">
              <span className="flex items-center gap-1">
                <Crosshair className="h-3 w-3 text-emerald-400" />
                {value.latitude.toFixed(4)}° N, {value.longitude.toFixed(4)}° E
              </span>
              <span>•</span>
              <span className="text-muted-foreground">
                {value.city}, {value.state}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClear}
            className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-card transition-colors cursor-pointer"
            title="Change Location"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        // Input & Search Dropdown
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
                if (query.trim()) setIsOpen(true);
              }}
              placeholder={placeholder}
              className="pl-9 pr-9 h-10 text-xs bg-muted/40 border-border/80 rounded-xl focus-visible:ring-primary/40"
            />
            {isLoadingGeocode && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-primary animate-spin" />
            )}
          </div>

          {/* Autocomplete Suggestions Menu */}
          {isOpen && (
            <div className="absolute left-0 right-0 top-full mt-1.5 z-50 max-h-56 overflow-y-auto rounded-xl border border-border/80 bg-popover/95 backdrop-blur-xl p-1.5 shadow-2xl space-y-1 text-xs">
              {suggestions.length > 0 ? (
                suggestions.map((loc, idx) => (
                  <button
                    key={`${loc.name}-${loc.latitude}-${idx}`}
                    type="button"
                    onClick={() => handleSelect(loc)}
                    className="w-full text-left p-2 rounded-lg hover:bg-muted/70 transition-colors flex items-center justify-between gap-2 cursor-pointer group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                          {loc.name}
                        </span>
                        {loc.isDbHub ? (
                          <Badge variant="secondary" className="text-[9px] px-1 py-0 h-3.5 font-mono">
                            DB Hub
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 font-mono text-emerald-400 border-emerald-500/30">
                            OSM Geo
                          </Badge>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground font-mono flex items-center gap-1.5 mt-0.5">
                        <span>
                          {loc.city}, {loc.state}
                        </span>
                        <span>•</span>
                        <span>
                          [{loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}]
                        </span>
                      </p>
                    </div>
                    <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-emerald-400 transition-colors shrink-0" />
                  </button>
                ))
              ) : (
                <div className="p-3 text-center text-[11px] text-muted-foreground">
                  {isLoadingGeocode ? (
                    <span className="flex items-center justify-center gap-1.5">
                      <Loader2 className="h-3 w-3 animate-spin text-primary" />
                      Verifying location on map...
                    </span>
                  ) : (
                    <span>No verified locations found. Type city name in India.</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
