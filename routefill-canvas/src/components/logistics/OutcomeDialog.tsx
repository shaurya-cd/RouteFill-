import React, { useState } from 'react';
import { RecommendationModel, api } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { CheckCircle2, DollarSign, Clock, Fuel, Sparkles, Navigation } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recommendation: RecommendationModel | null;
  onSuccess?: () => void;
}

export const OutcomeDialog: React.FC<Props> = ({ open, onOpenChange, recommendation, onSuccess }) => {
  const [actualProfit, setActualProfit] = useState<number>(14500);
  const [actualFuelCost, setActualFuelCost] = useState<number>(6200);
  const [actualTollCost, setActualTollCost] = useState<number>(1150);
  const [actualWaitingTime, setActualWaitingTime] = useState<number>(90);
  const [actualDistanceKm, setActualDistanceKm] = useState<number>(480);
  const [delayMinutes, setDelayMinutes] = useState<number>(15);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!recommendation) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.recordOutcome(recommendation.id, {
        was_accepted: true,
        was_completed: true,
        actual_profit: Number(actualProfit),
        actual_fuel_cost: Number(actualFuelCost),
        actual_toll_cost: Number(actualTollCost),
        actual_waiting_time_minutes: Number(actualWaitingTime),
        actual_distance_km: Number(actualDistanceKm),
        completion_delay_minutes: Number(delayMinutes),
      });

      toast.success('Real-World Feedback Loop Recorded!', {
        description: `Outcome ID: ${res.outcome?.id || 'Saved'} | Profit: ₹${actualProfit.toLocaleString('en-IN')}. Model will learn from this trip!`,
      });

      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast.error('Failed to submit outcome feedback', {
        description: err.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-3xl border-border bg-card p-6 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
            <Sparkles className="h-4 w-4" /> Phase 7 Feedback Loop
          </div>
          <DialogTitle className="font-display text-xl font-bold tracking-tight">
            Complete Trip & Record Outcome
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Feeds real-world execution metrics back into the Machine Learning engine for continuous retraining.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground">
              {recommendation.load.pickup_location} → {recommendation.load.destination_location}
            </span>
            <span className="rounded-full bg-primary/20 px-2.5 py-0.5 text-[10px] font-bold text-primary">
              ML Score: {recommendation.final_score}/100
            </span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Predicted Profit: ₹{Math.round(recommendation.predicted_profit).toLocaleString('en-IN')} (Model {recommendation.model_version})
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5 text-success" /> Actual Net Profit (₹)
              </Label>
              <Input
                type="number"
                value={actualProfit}
                onChange={(e) => setActualProfit(Number(e.target.value))}
                required
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1">
                <Fuel className="h-3.5 w-3.5 text-warning" /> Fuel Cost (₹)
              </Label>
              <Input
                type="number"
                value={actualFuelCost}
                onChange={(e) => setActualFuelCost(Number(e.target.value))}
                required
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Toll Expense (₹)</Label>
              <Input
                type="number"
                value={actualTollCost}
                onChange={(e) => setActualTollCost(Number(e.target.value))}
                required
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1">
                <Navigation className="h-3.5 w-3.5 text-primary" /> Actual Distance (km)
              </Label>
              <Input
                type="number"
                value={actualDistanceKm}
                onChange={(e) => setActualDistanceKm(Number(e.target.value))}
                required
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" /> Wait Time (mins)
              </Label>
              <Input
                type="number"
                value={actualWaitingTime}
                onChange={(e) => setActualWaitingTime(Number(e.target.value))}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Delay Penalty (mins)</Label>
              <Input
                type="number"
                value={delayMinutes}
                onChange={(e) => setDelayMinutes(Number(e.target.value))}
                className="rounded-xl"
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSubmitting ? 'Recording...' : 'Commit Feedback to ML'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
