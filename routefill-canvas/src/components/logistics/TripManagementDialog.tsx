import { useState, useEffect } from 'react';
import { api, TripModel, TruckModel, LocationModel, DeadMileageRisk } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Route, CheckCircle2, AlertTriangle, ArrowRight, Play, Check } from 'lucide-react';

import { LocationInput, VerifiedLocation } from './LocationInput';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trucks: TruckModel[];
  onTripCompleted?: (analysis: DeadMileageRisk) => void;
}

export const TripManagementDialog: React.FC<Props> = ({ open, onOpenChange, trucks, onTripCompleted }) => {
  const [trips, setTrips] = useState<TripModel[]>([]);
  const [hubs, setHubs] = useState<LocationModel[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedTruckId, setSelectedTruckId] = useState<string>(trucks[0]?.id ? String(trucks[0].id) : '1');
  const [originLocation, setOriginLocation] = useState<VerifiedLocation | null>(null);
  const [destLocation, setDestLocation] = useState<VerifiedLocation | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [completingId, setCompletingId] = useState<number | null>(null);

  const fetchTrips = async () => {
    setLoading(true);
    try {
      const [tripsData, locsData] = await Promise.all([
        api.getTrips().catch(() => []),
        api.getLocations().catch(() => []),
      ]);
      setTrips(tripsData);
      setHubs(locsData);

      const firstLoc = locsData[0];
      const secondLoc = locsData[1] || firstLoc;

      if (firstLoc) {
        setOriginLocation((prev) =>
          prev || {
            id: firstLoc.id,
            name: firstLoc.name,
            city: firstLoc.city || firstLoc.name.split(' ')[0] || 'Unknown',
            state: firstLoc.state,
            country: firstLoc.country || 'India',
            latitude: parseFloat(String(firstLoc.latitude)),
            longitude: parseFloat(String(firstLoc.longitude)),
            isDbHub: true,
          }
        );
      }
      if (secondLoc) {
        setDestLocation((prev) =>
          prev || {
            id: secondLoc.id,
            name: secondLoc.name,
            city: secondLoc.city || secondLoc.name.split(' ')[0] || 'Unknown',
            state: secondLoc.state,
            country: secondLoc.country || 'India',
            latitude: parseFloat(String(secondLoc.latitude)),
            longitude: parseFloat(String(secondLoc.longitude)),
            isDbHub: true,
          }
        );
      }
    } catch (err: any) {
      console.error('Failed to load trips data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchTrips();
    }
  }, [open]);

  const handleScheduleTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!originLocation || !destLocation) {
      toast.error('Please enter and verify both Origin and Destination locations.');
      return;
    }
    setIsCreating(true);
    try {
      let finalOriginId = originLocation.id;
      if (!finalOriginId) {
        const resOrigin = await api.createOrResolveLocation({
          name: originLocation.name,
          city: originLocation.city,
          state: originLocation.state,
          country: originLocation.country,
          latitude: originLocation.latitude,
          longitude: originLocation.longitude,
        });
        finalOriginId = resOrigin.id;
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

      const newTrip = await api.createTrip({
        truck_id: Number(selectedTruckId),
        origin_location_id: Number(finalOriginId),
        destination_location_id: Number(finalDestId),
      });

      toast.success('Line-Haul Trip Scheduled!', {
        description: `Trip #${newTrip.id} dispatched. Track status in fleet console.`,
      });
      fetchTrips();
    } catch (err: any) {
      toast.error('Failed to schedule trip', { description: err.message });
    } finally {
      setIsCreating(false);
    }
  };

  const handleCompleteTrip = async (tripId: number) => {
    setCompletingId(tripId);
    try {
      const res = await api.completeTrip(tripId);
      const analysis = res.dead_mileage_analysis;

      toast.success(`Trip #${tripId} Completed!`, {
        description: `Post-trip ML Analysis: ${analysis.risk_level} Deadhead Risk (${analysis.predicted_empty_distance_km} km estimated empty).`,
      });

      if (onTripCompleted) {
        onTripCompleted(analysis);
      }
      fetchTrips();
    } catch (err: any) {
      toast.error('Failed to complete trip', { description: err.message });
    } finally {
      setCompletingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-3xl border-border bg-card p-6 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
            <Route className="h-4 w-4" /> Phase 4 Line-Haul Trip Lifecycle
          </div>
          <DialogTitle className="font-display text-xl font-bold tracking-tight">
            Active Line-Haul Trips & Post-Trip Analysis
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Schedule trips and complete deliveries to trigger intelligent post-trip dead-mileage forecasts.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Schedule Form */}
          <form onSubmit={handleScheduleTrip} className="rounded-2xl border border-border bg-secondary/30 p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Play className="h-3.5 w-3.5 text-primary" /> Schedule New Line-Haul
            </h4>
            <div className="space-y-3">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-foreground">Assigned Truck</span>
                <Select value={selectedTruckId} onValueChange={setSelectedTruckId}>
                  <SelectTrigger className="rounded-xl h-9 text-xs">
                    <SelectValue placeholder="Select Truck" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {trucks.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)} className="text-xs">
                        {t.truck_number} ({t.capacity_tons}T, {t.truckType?.name || 'Standard'}) — Currently at {t.currentLocation?.name || 'Base'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <LocationInput
                  label="Origin Hub"
                  value={originLocation}
                  onChange={setOriginLocation}
                  knownLocations={hubs}
                  placeholder="Type origin city (e.g. Delhi, Mumbai)"
                  required
                />
                <LocationInput
                  label="Destination Hub"
                  value={destLocation}
                  onChange={setDestLocation}
                  knownLocations={hubs}
                  placeholder="Type destination city (e.g. Surat, Jaipur)"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <Button
                type="submit"
                size="sm"
                disabled={isCreating}
                className="rounded-xl text-xs bg-primary text-primary-foreground"
              >
                {isCreating ? 'Scheduling...' : 'Dispatch Trip'}
              </Button>
            </div>
          </form>

          {/* Active Trips List */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Current Trips ({trips.length})
            </h4>
            <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
              {trips.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">No line-haul trips found.</p>
              ) : (
                trips.map((trip) => {
                  const isCompleted = trip.status === 'COMPLETED';
                  return (
                    <div
                      key={trip.id}
                      className="flex items-center justify-between rounded-2xl border border-border bg-card p-3 shadow-sm text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold">{trip.truck?.truck_number || `Truck #${trip.truck_id}`}</span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${isCompleted
                                ? 'bg-success/15 text-success'
                                : 'bg-primary/15 text-primary'
                              }`}
                          >
                            {trip.status}
                          </span>
                        </div>
                        <p className="mt-1 text-muted-foreground truncate">
                          {trip.originLocation?.name?.split(' ')[0] || 'Origin'} →{' '}
                          {trip.destinationLocation?.name?.split(' ')[0] || 'Destination'}
                        </p>
                      </div>

                      {!isCompleted && (
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={completingId === trip.id}
                          onClick={() => handleCompleteTrip(trip.id)}
                          className="rounded-xl text-xs hover:bg-success hover:text-white"
                        >
                          {completingId === trip.id ? (
                            'Completing...'
                          ) : (
                            <>
                              <Check className="h-3 w-3 mr-1" /> Mark Delivered
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
