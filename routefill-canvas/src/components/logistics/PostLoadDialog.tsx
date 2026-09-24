import React, { useState, useEffect } from 'react';
import { api, LoadModel, LocationModel, TruckTypeModel } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Package, IndianRupee, Weight, ArrowRight, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { LocationInput, VerifiedLocation } from './LocationInput';
import { useAuth } from '@/lib/authContext';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoadCreated: (load: LoadModel) => void;
  onRequireLogin?: () => void;
}

export const PostLoadDialog: React.FC<Props> = ({ open, onOpenChange, onLoadCreated, onRequireLogin }) => {
  const { user, isAuthenticated } = useAuth();
  const [cargoDescription, setCargoDescription] = useState<string>('Electronics & Consumer Appliances');
  const [weightTons, setWeightTons] = useState<number>(8.0);
  const [offeredPrice, setOfferedPrice] = useState<number>(25000);
  const [truckTypeId, setTruckTypeId] = useState<string>('1');
  const [pickupTimeWindow, setPickupTimeWindow] = useState<string>('Tomorrow before 7:00 PM');
  const [pickupLocation, setPickupLocation] = useState<VerifiedLocation | null>(null);
  const [destLocation, setDestLocation] = useState<VerifiedLocation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [hubs, setHubs] = useState<LocationModel[]>([]);
  const [truckTypes, setTruckTypes] = useState<TruckTypeModel[]>([]);

  const applyPreset = (preset: 'A' | 'B' | 'C') => {
    const mumbai = hubs.find((l) => l.city?.toLowerCase().includes('mumbai')) || hubs[0];
    const jaipur = hubs.find((l) => l.city?.toLowerCase().includes('jaipur'));
    const delhi = hubs.find((l) => l.city?.toLowerCase().includes('delhi'));
    const pune = hubs.find((l) => l.city?.toLowerCase().includes('pune'));

    if (mumbai) {
      setPickupLocation({
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

    if (preset === 'A' && jaipur) {
      setDestLocation({
        id: jaipur.id,
        name: jaipur.name,
        city: 'Jaipur',
        state: jaipur.state,
        country: 'India',
        latitude: parseFloat(String(jaipur.latitude)),
        longitude: parseFloat(String(jaipur.longitude)),
        isDbHub: true,
      });
      setCargoDescription('Electronics & Consumer Appliances');
      setWeightTons(8.0);
      setOfferedPrice(25000);
      setPickupTimeWindow('Tomorrow before 7:00 PM');
      toast.success('Option A Preset Loaded', { description: 'Mumbai → Jaipur · 8T · ₹25,000' });
    } else if (preset === 'B' && delhi) {
      setDestLocation({
        id: delhi.id,
        name: delhi.name,
        city: 'Delhi',
        state: delhi.state,
        country: 'India',
        latitude: parseFloat(String(delhi.latitude)),
        longitude: parseFloat(String(delhi.longitude)),
        isDbHub: true,
      });
      setCargoDescription('FMCG Retail Cartons (Navi Mumbai)');
      setWeightTons(9.0);
      setOfferedPrice(35000);
      setPickupTimeWindow('Day after tomorrow');
      toast.info('Option B Preset Loaded', { description: 'Mumbai → Delhi · 9T · ₹35,000' });
    } else if (preset === 'C' && pune) {
      setDestLocation({
        id: pune.id,
        name: pune.name,
        city: 'Pune',
        state: pune.state,
        country: 'India',
        latitude: parseFloat(String(pune.latitude)),
        longitude: parseFloat(String(pune.longitude)),
        isDbHub: true,
      });
      setCargoDescription('Automobile Spare Parts & Castings');
      setWeightTons(7.0);
      setOfferedPrice(18000);
      setPickupTimeWindow('Tomorrow before 6:00 PM');
      toast.info('Option C Preset Loaded', { description: 'Mumbai → Pune · 7T · ₹18,000' });
    }
  };

  useEffect(() => {
    if (open) {
      Promise.all([
        api.getLocations().catch(() => []),
        api.getTruckTypes().catch(() => []),
      ]).then(([locs, types]) => {
        setHubs(locs);
        setTruckTypes(types);

        const first = locs.find((l) => l.city?.toLowerCase().includes('mumbai')) || locs[0];
        const second = locs.find((l) => l.city?.toLowerCase().includes('jaipur')) || locs[1] || first;

        if (first && !pickupLocation) {
          setPickupLocation({
            id: first.id,
            name: first.name,
            city: first.city || 'Mumbai',
            state: first.state,
            country: first.country || 'India',
            latitude: parseFloat(String(first.latitude)),
            longitude: parseFloat(String(first.longitude)),
            isDbHub: true,
          });
        }

        if (second && !destLocation) {
          setDestLocation({
            id: second.id,
            name: second.name,
            city: second.city || 'Jaipur',
            state: second.state,
            country: second.country || 'India',
            latitude: parseFloat(String(second.latitude)),
            longitude: parseFloat(String(second.longitude)),
            isDbHub: true,
          });
        }

        const openType = types.find((t) => t.name?.toUpperCase().includes('OPEN')) || types[0];
        if (openType) {
          setTruckTypeId(String(openType.id));
        }
      });
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickupLocation || !destLocation) {
      toast.error('Please enter and verify both Pickup and Delivery locations.');
      return;
    }

    if (!isAuthenticated && !api.getToken()) {
      toast.error('Authentication Required', {
        description: 'Please sign in with a Shipper or Fleet Owner account to post loads.',
      });
      onOpenChange(false);
      onRequireLogin?.();
      return;
    }

    setIsSubmitting(true);
    try {
      let finalPickupId = pickupLocation.id;
      if (!finalPickupId) {
        const resPickup = await api.createOrResolveLocation({
          name: pickupLocation.name,
          city: pickupLocation.city,
          state: pickupLocation.state,
          country: pickupLocation.country,
          latitude: pickupLocation.latitude,
          longitude: pickupLocation.longitude,
        });
        finalPickupId = resPickup.id;
      }

      let finalDestId = destLocation.id;
      if (!finalDestId) {
        const resDest = await api.createOrResolveLocation({
          name: destLocation.name,
          city: destLocation.city,
          state: destLocation.state,
          country: destLocation.country,
          latitude: destLocation.latitude,
          longitude: destLocation.longitude,
        });
        finalDestId = resDest.id;
      }

      const newLoad = await api.createLoad({
        pickup_location_id: Number(finalPickupId),
        destination_location_id: Number(finalDestId),
        truck_type_id: Number(truckTypeId),
        weight_tons: Number(weightTons),
        cargo_description: cargoDescription.trim(),
        offered_price: Number(offeredPrice),
        pickup_end_time: new Date(Date.now() + 23 * 3600 * 1000).toISOString(),
      });

      toast.success('Freight Load Published to Marketplace!', {
        description: `Load #${newLoad.id} (${cargoDescription}) committed to PostgreSQL with map coordinates.`,
      });

      onLoadCreated(newLoad);
      onOpenChange(false);
    } catch (err: any) {
      if (
        err.status === 401 ||
        err.message?.includes('Authorization') ||
        err.message?.includes('401') ||
        err.message?.includes('Unauthorized')
      ) {
        toast.error('Authentication Required', {
          description: 'Your session has expired or you are not signed in. Opening sign-in dialog...',
        });
        onOpenChange(false);
        onRequireLogin?.();
      } else {
        toast.error('Failed to post load', { description: err.message });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] rounded-3xl border-border bg-card/95 backdrop-blur-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-1 text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary font-mono text-xs uppercase tracking-wider font-semibold">
              <Package className="h-4 w-4" /> 2️⃣ Load Poster Operations
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground uppercase font-bold">Presets:</span>
              <button
                type="button"
                onClick={() => applyPreset('A')}
                className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-lg hover:bg-emerald-500/25 cursor-pointer"
                title="Mumbai -> Jaipur 8T Rs 25,000"
              >
                Option A
              </button>
              <button
                type="button"
                onClick={() => applyPreset('B')}
                className="text-[10px] font-bold text-sky-400 bg-sky-500/15 border border-sky-500/30 px-2 py-0.5 rounded-lg hover:bg-sky-500/25 cursor-pointer"
                title="Mumbai -> Delhi 9T Rs 35,000"
              >
                Option B
              </button>
              <button
                type="button"
                onClick={() => applyPreset('C')}
                className="text-[10px] font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-lg hover:bg-amber-500/25 cursor-pointer"
                title="Mumbai -> Pune 7T Rs 18,000"
              >
                Option C
              </button>
            </div>
          </div>
          <DialogTitle className="font-display text-xl font-bold tracking-tight">
            Post Return Freight Load
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Publish available goods with required pickup time and rate offered for incoming trucks.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {!isAuthenticated ? (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-600 dark:text-amber-400 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 shrink-0 text-amber-500" />
                <span>You must sign in as a <strong>Shipper</strong> or <strong>Fleet Owner</strong> to publish loads.</span>
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
                Posting as: <strong className="text-foreground">{user.name}</strong>
              </span>
              <span className="font-mono text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold">
                {user.role || 'SHIPPER'}
              </span>
            </div>
          )}
          {/* Cargo Details */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Cargo Description</Label>
            <Input
              type="text"
              value={cargoDescription}
              onChange={(e) => setCargoDescription(e.target.value)}
              placeholder="e.g. FMCG Goods, Automotive Engine Blocks, Cotton Textiles"
              required
              className="rounded-xl h-9 text-xs"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Required Body</Label>
              <Select value={truckTypeId} onValueChange={setTruckTypeId}>
                <SelectTrigger className="rounded-xl h-9 text-xs">
                  <SelectValue placeholder="Truck Type" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {truckTypes.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)} className="text-xs">
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1">
                <Weight className="h-3 w-3 text-muted-foreground" /> Weight (T)
              </Label>
              <Input
                type="number"
                step="0.1"
                min="0.5"
                max="60"
                value={weightTons}
                onChange={(e) => setWeightTons(Number(e.target.value))}
                required
                className="rounded-xl h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1">
                <IndianRupee className="h-3 w-3 text-muted-foreground" /> Offered (₹)
              </Label>
              <Input
                type="number"
                step="500"
                min="1000"
                value={offeredPrice}
                onChange={(e) => setOfferedPrice(Number(e.target.value))}
                required
                className="rounded-xl h-9 text-xs font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Pickup Time Window</Label>
            <Input
              type="text"
              value={pickupTimeWindow}
              onChange={(e) => setPickupTimeWindow(e.target.value)}
              placeholder="e.g. Tomorrow before 7:00 PM"
              className="rounded-xl h-9 text-xs"
            />
            <p className="text-[10px] text-muted-foreground">
              RouteFill AI matches trucks that reach the pickup location before this deadline.
            </p>
          </div>

          {/* Map-Verified Locations */}
          <div className="space-y-3 pt-1 border-t border-border/60">
            <LocationInput
              label="Pickup Location"
              value={pickupLocation}
              onChange={setPickupLocation}
              knownLocations={hubs}
              placeholder="Type pickup city (e.g. Manesar, Surat, Pune)"
              required
              hint="Origin point where carrier picks up cargo"
            />

            <LocationInput
              label="Delivery / Destination Location"
              value={destLocation}
              onChange={setDestLocation}
              knownLocations={hubs}
              placeholder="Type delivery city (e.g. Mumbai, Indore, Jaipur)"
              required
              hint="Drop-off point where cargo is unloaded"
            />
          </div>

          <DialogFooter className="pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl cursor-pointer text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer text-xs font-semibold"
            >
              {isSubmitting ? 'Publishing to DB...' : 'Post Freight Load to DB'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
