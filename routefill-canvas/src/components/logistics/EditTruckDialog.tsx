import React, { useState, useEffect } from 'react';
import { api, TruckModel, LocationModel, TruckTypeModel } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Truck, Weight, CheckCircle2, ShieldCheck, MapPin } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  truck: TruckModel | null;
  onUpdated: (updatedTruck: TruckModel) => void;
}

export const EditTruckDialog: React.FC<Props> = ({ open, onOpenChange, truck, onUpdated }) => {
  const [truckNumber, setTruckNumber] = useState<string>('');
  const [truckTypeId, setTruckTypeId] = useState<string>('1');
  const [capacityTons, setCapacityTons] = useState<number>(10.0);
  const [status, setStatus] = useState<string>('AVAILABLE');
  const [currentLocationId, setCurrentLocationId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [locations, setLocations] = useState<LocationModel[]>([]);
  const [truckTypes, setTruckTypes] = useState<TruckTypeModel[]>([]);

  useEffect(() => {
    if (open && truck) {
      setTruckNumber(truck.truck_number || '');
      setTruckTypeId(String(truck.truck_type_id || '1'));
      setCapacityTons(Number(truck.capacity_tons) || 10.0);
      setStatus(truck.status || 'AVAILABLE');
      setCurrentLocationId(truck.current_location_id ? String(truck.current_location_id) : '');

      // Load reference data
      Promise.all([
        api.getLocations().catch(() => []),
        api.getTruckTypes().catch(() => []),
      ]).then(([locs, types]) => {
        setLocations(locs);
        setTruckTypes(types);
      });
    }
  }, [open, truck]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!truck) return;

    if (!truckNumber.trim()) {
      toast.error('Truck Registration is required');
      return;
    }

    if (capacityTons <= 0 || isNaN(capacityTons)) {
      toast.error('Valid truck capacity in tons is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: {
        truck_number?: string;
        truck_type_id?: number;
        capacity_tons?: number;
        status?: string;
        current_location_id?: number;
      } = {
        truck_number: truckNumber.trim().toUpperCase(),
        truck_type_id: parseInt(truckTypeId, 10),
        capacity_tons: capacityTons,
        status: status,
      };

      if (currentLocationId) {
        payload.current_location_id = parseInt(currentLocationId, 10);
      }

      const updated = await api.updateTruck(truck.id, payload);
      toast.success(`Truck ${updated.truck_number} updated successfully!`, {
        description: `Capacity: ${updated.capacity_tons}T · Status: ${updated.status}`,
      });
      onUpdated(updated);
      onOpenChange(false);
    } catch (err: any) {
      toast.error('Failed to update truck', {
        description: err.message || 'Please check backend logs',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!truck) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl border-border bg-card shadow-2xl">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="bg-gradient-to-r from-primary/15 via-primary/10 to-transparent p-6 border-b border-border/60">
            <DialogHeader className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-primary/20 text-primary">
                  <Truck className="h-5 w-5" />
                </span>
                <div>
                  <DialogTitle className="text-xl font-bold tracking-tight">
                    Edit Truck Details
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Update registration, body type, tonnage, and live status.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Registration Number */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-truck-num" className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Truck className="h-3.5 w-3.5 text-primary" />
                Registration Number
              </Label>
              <Input
                id="edit-truck-num"
                value={truckNumber}
                onChange={(e) => setTruckNumber(e.target.value.toUpperCase())}
                placeholder="e.g. DL01AB1234"
                className="font-mono text-sm uppercase rounded-xl border-border/80 bg-background/50 h-10"
                required
              />
            </div>

            {/* Truck Body Type */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Truck Body Type
              </Label>
              <Select value={truckTypeId} onValueChange={setTruckTypeId}>
                <SelectTrigger className="w-full rounded-xl border-border/80 bg-background/50 h-10">
                  <SelectValue placeholder="Select Body Type" />
                </SelectTrigger>
                <SelectContent>
                  {truckTypes.map((type) => (
                    <SelectItem key={type.id} value={String(type.id)}>
                      {type.name}
                    </SelectItem>
                  ))}
                  {truckTypes.length === 0 && (
                    <>
                      <SelectItem value="1">Open Truck</SelectItem>
                      <SelectItem value="2">Container</SelectItem>
                      <SelectItem value="3">Trailer</SelectItem>
                      <SelectItem value="4">Flatbed</SelectItem>
                      <SelectItem value="5">Tanker</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Capacity (Tons) & Status */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-capacity" className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Weight className="h-3 w-3 text-primary" />
                  Capacity (Tons)
                </Label>
                <Input
                  id="edit-capacity"
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="100"
                  value={capacityTons}
                  onChange={(e) => setCapacityTons(parseFloat(e.target.value) || 0)}
                  className="rounded-xl border-border/80 bg-background/50 h-10 font-mono text-sm"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3 text-primary" />
                  Status
                </Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-full rounded-xl border-border/80 bg-background/50 h-10">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AVAILABLE">AVAILABLE (Idle)</SelectItem>
                    <SelectItem value="IN_TRANSIT">IN TRANSIT</SelectItem>
                    <SelectItem value="AT_RISK">AT RISK (Deadhead)</SelectItem>
                    <SelectItem value="MAINTENANCE">MAINTENANCE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Current Hub Location */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                Current City / Hub
              </Label>
              <Select value={currentLocationId} onValueChange={setCurrentLocationId}>
                <SelectTrigger className="w-full rounded-xl border-border/80 bg-background/50 h-10">
                  <SelectValue placeholder="Select City / Hub" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={String(loc.id)}>
                      {loc.city ? `${loc.city}, ${loc.state}` : loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="p-4 border-t border-border/60 bg-secondary/20 flex items-center justify-between sm:justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl text-xs bg-primary text-primary-foreground font-semibold px-5"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
