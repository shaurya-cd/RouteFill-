import React, { useState, useEffect } from 'react';
import { api, TruckModel, LocationModel, TruckTypeModel } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Truck, MapPin, Weight, ShieldCheck, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { LocationInput, VerifiedLocation } from './LocationInput';
import { useAuth } from '@/lib/authContext';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (newTruck: TruckModel) => void;
  onRequireLogin?: () => void;
}

export const CreateTruckDialog: React.FC<Props> = ({ open, onOpenChange, onCreated, onRequireLogin }) => {
  const { user, isAuthenticated } = useAuth();
  const [truckNumber, setTruckNumber] = useState<string>('DL01AB1234');
  const [truckTypeId, setTruckTypeId] = useState<string>('1');
  const [capacityTons, setCapacityTons] = useState<number>(10.0);
  const [selectedLocation, setSelectedLocation] = useState<VerifiedLocation | null>(null);
  const [originLocation, setOriginLocation] = useState<VerifiedLocation | null>(null);
  const [destLocation, setDestLocation] = useState<VerifiedLocation | null>(null);
  const [expectedArrivalTime, setExpectedArrivalTime] = useState<string>('Tomorrow, 4:00 PM');
  const [hasCurrentTrip, setHasCurrentTrip] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Real data loaded from PostgreSQL database
  const [hubs, setHubs] = useState<LocationModel[]>([]);
  const [truckTypes, setTruckTypes] = useState<TruckTypeModel[]>([]);

  useEffect(() => {
    if (open) {
      // Load locations and truck body types directly from PostgreSQL
      Promise.all([
        api.getLocations().catch(() => []),
        api.getTruckTypes().catch(() => []),
      ]).then(([locs, types]) => {
        setHubs(locs);
        setTruckTypes(types);

        const delhi = locs.find((l) => l.city?.toLowerCase().includes('delhi')) || locs[1] || locs[0];
        const mumbai = locs.find((l) => l.city?.toLowerCase().includes('mumbai')) || locs[0];

        if (delhi && !originLocation) {
          setOriginLocation({
            id: delhi.id,
            name: delhi.name,
            city: delhi.city || 'Delhi',
            state: delhi.state,
            country: delhi.country || 'India',
            latitude: parseFloat(String(delhi.latitude)),
            longitude: parseFloat(String(delhi.longitude)),
            isDbHub: true,
          });
        }

        if (mumbai) {
          if (!destLocation) {
            setDestLocation({
              id: mumbai.id,
              name: mumbai.name,
              city: mumbai.city || 'Mumbai',
              state: mumbai.state,
              country: mumbai.country || 'India',
              latitude: parseFloat(String(mumbai.latitude)),
              longitude: parseFloat(String(mumbai.longitude)),
              isDbHub: true,
            });
          }
          if (!selectedLocation) {
            setSelectedLocation({
              id: mumbai.id,
              name: mumbai.name,
              city: mumbai.city || 'Mumbai',
              state: mumbai.state,
              country: mumbai.country || 'India',
              latitude: parseFloat(String(mumbai.latitude)),
              longitude: parseFloat(String(mumbai.longitude)),
              isDbHub: true,
            });
          }
        }

        const openType = types.find((t) => t.name?.toUpperCase().includes('OPEN')) || types[0];
        if (openType) {
          setTruckTypeId(String(openType.id));
        }
      });
    }
  }, [open]);

  const handleApplyPreset = () => {
    setTruckNumber('DL01AB1234');
    setCapacityTons(10.0);
    const openType = truckTypes.find((t) => t.name?.toUpperCase().includes('OPEN')) || truckTypes[0];
    if (openType) setTruckTypeId(String(openType.id));

    const delhi = hubs.find((l) => l.city?.toLowerCase().includes('delhi')) || hubs[1];
    const mumbai = hubs.find((l) => l.city?.toLowerCase().includes('mumbai')) || hubs[0];

    if (delhi) {
      setOriginLocation({
        id: delhi.id,
        name: delhi.name,
        city: 'Delhi',
        state: delhi.state,
        country: 'India',
        latitude: parseFloat(String(delhi.latitude)),
        longitude: parseFloat(String(delhi.longitude)),
        isDbHub: true,
      });
    }
    if (mumbai) {
      setDestLocation({
        id: mumbai.id,
        name: mumbai.name,
        city: 'Mumbai',
        state: mumbai.state,
        country: 'India',
        latitude: parseFloat(String(mumbai.latitude)),
        longitude: parseFloat(String(mumbai.longitude)),
        isDbHub: true,
      });
      setSelectedLocation({
        id: mumbai.id,
        name: mumbai.name,
        city: 'Mumbai',
        state: mumbai.state,
        country: 'India',
        latitude: parseFloat(String(mumbai.latitude)),
        longitude: parseFloat(String(mumbai.longitude)),
        isDbHub: true,
      });
    }
    setExpectedArrivalTime('Tomorrow, 4:00 PM');
    setHasCurrentTrip(true);
    toast.success('Shaurya Transport Preset Loaded', {
      description: 'DL01AB1234 · 10T Open Truck · Delhi → Mumbai (Arrival: Tomorrow 4 PM)',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLocation && !destLocation) {
      toast.error('Please specify the destination or base hub location.');
      return;
    }
    if (!isAuthenticated && !api.getToken()) {
      toast.error('Authentication Required', {
        description: 'Please sign in as a Fleet Owner or Admin to register vehicles.',
      });
      onOpenChange(false);
      onRequireLogin?.();
      return;
    }

    setIsSubmitting(true);
    try {
      let finalOriginId = originLocation?.id;
      if (originLocation && !finalOriginId) {
        const resolved = await api.createOrResolveLocation({
          name: originLocation.name,
          city: originLocation.city,
          state: originLocation.state,
          country: originLocation.country,
          latitude: originLocation.latitude,
          longitude: originLocation.longitude,
        });
        finalOriginId = resolved.id;
      }

      let finalDestId = destLocation?.id || selectedLocation?.id;
      if (destLocation && !finalDestId) {
        const resolved = await api.createOrResolveLocation({
          name: destLocation.name,
          city: destLocation.city,
          state: destLocation.state,
          country: destLocation.country,
          latitude: destLocation.latitude,
          longitude: destLocation.longitude,
        });
        finalDestId = resolved.id;
      }

      const newTruck = await api.createTruck({
        truck_number: truckNumber.trim().toUpperCase(),
        truck_type_id: Number(truckTypeId),
        capacity_tons: Number(capacityTons),
        current_location_id: Number(finalDestId),
        origin_location_id: hasCurrentTrip ? Number(finalOriginId) : undefined,
        destination_location_id: hasCurrentTrip ? Number(finalDestId) : undefined,
        expected_arrival_time: new Date(Date.now() + 20 * 3600 * 1000).toISOString(),
      });

      toast.success('Truck Successfully Registered in DB!', {
        description: `Vehicle ${newTruck.truck_number} dispatched with destination Mumbai.`,
      });

      onCreated(newTruck);
      onOpenChange(false);
    } catch (err: any) {
      if (
        err.status === 401 ||
        err.message?.includes('Authorization') ||
        err.message?.includes('401') ||
        err.message?.includes('Unauthorized')
      ) {
        toast.error('Authentication Required', {
          description: 'Your session has expired or you are not signed in. Opening sign-in...',
        });
        onOpenChange(false);
        onRequireLogin?.();
      } else {
        toast.error('Failed to register truck', {
          description: err.message,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-3xl border-border bg-card p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
              <Truck className="h-4 w-4" /> 1️⃣ Truck Owner Registration
            </div>
            <button
              type="button"
              onClick={handleApplyPreset}
              className="text-[11px] font-bold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/30 px-2.5 py-1 rounded-xl transition-all cursor-pointer"
            >
              ⚡ Fill Shaurya Transport Preset
            </button>
          </div>
          <DialogTitle className="font-display text-xl font-bold tracking-tight mt-1">
            Register Truck & Current Trip
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Enter your truck information and current journey so RouteFill AI can find return loads before arrival.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isAuthenticated ? (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-600 dark:text-amber-400 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 shrink-0 text-amber-500" />
                <span>You must sign in as a <strong>Fleet Owner</strong> to register trucks.</span>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  onRequireLogin?.();
                }}
                className="h-7 text-xs rounded-lg border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 cursor-pointer shrink-0"
              >
                Sign In
              </Button>
            </div>
          ) : user && (
            <div className="flex items-center justify-between text-[11px] text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-xl border border-border/40">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                Fleet Owner: <strong className="text-foreground">{user.name}</strong>
              </span>
              <span className="font-mono text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold">
                {user.role || 'FLEET_OWNER'}
              </span>
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Registration / License Plate
            </Label>
            <Input
              type="text"
              value={truckNumber}
              onChange={(e) => setTruckNumber(e.target.value.toUpperCase())}
              placeholder="e.g. DL01AB1234"
              required
              className="rounded-xl font-mono uppercase"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Truck Body Type</Label>
              <Select value={truckTypeId} onValueChange={setTruckTypeId}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {truckTypes.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1">
                <Weight className="h-3.5 w-3.5 text-muted-foreground" /> Payload (Tons)
              </Label>
              <Input
                type="number"
                step="0.5"
                min="1"
                max="50"
                value={capacityTons}
                onChange={(e) => setCapacityTons(Number(e.target.value))}
                required
                className="rounded-xl"
              />
            </div>
          </div>

          {/* Current Trip Section */}
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> Current Trip Information
              </span>
              <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasCurrentTrip}
                  onChange={(e) => setHasCurrentTrip(e.target.checked)}
                  className="rounded text-primary focus:ring-0"
                />
                In Transit (Needs Return Load)
              </label>
            </div>

            {hasCurrentTrip && (
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <LocationInput
                    label="Going From"
                    value={originLocation}
                    onChange={setOriginLocation}
                    knownLocations={hubs}
                    placeholder="Origin (e.g. Delhi)"
                    required
                  />
                  <LocationInput
                    label="Going To"
                    value={destLocation}
                    onChange={(loc) => {
                      setDestLocation(loc);
                      setSelectedLocation(loc);
                    }}
                    knownLocations={hubs}
                    placeholder="Destination (e.g. Mumbai)"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-medium text-muted-foreground">
                    Expected Arrival Time
                  </Label>
                  <Input
                    type="text"
                    value={expectedArrivalTime}
                    onChange={(e) => setExpectedArrivalTime(e.target.value)}
                    placeholder="e.g. Tomorrow, 4:00 PM"
                    className="h-8 rounded-xl text-xs font-semibold"
                  />
                  <p className="text-[10px] text-primary/80 italic">
                    RouteFill AI will search return loads waiting near the destination around this arrival time.
                  </p>
                </div>
              </div>
            )}
          </div>

          {!hasCurrentTrip && (
            <LocationInput
              label="Starting Hub / Base Terminal"
              value={selectedLocation}
              onChange={setSelectedLocation}
              knownLocations={hubs}
              placeholder="Type city or terminal (e.g. Surat, Indore, Jaipur)"
              required
              hint="Type city name or select from verified Indian logistics hubs"
            />
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer font-bold"
            >
              {isSubmitting ? 'Registering...' : 'Register Truck & Journey'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
