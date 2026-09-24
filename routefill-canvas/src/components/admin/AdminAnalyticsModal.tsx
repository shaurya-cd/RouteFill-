import React, { useState, useEffect } from 'react';
import { api, AnalyticsOverview, AiImpactAnalytics, RetrainMetrics } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Cpu,
  TrendingUp,
  RefreshCw,
  Users,
  Truck,
  Package,
  CheckCircle2,
  DollarSign,
  Compass,
  Gauge,
  Sparkles,
} from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AdminAnalyticsModal: React.FC<Props> = ({ open, onOpenChange }) => {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [impact, setImpact] = useState<AiImpactAnalytics | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [retraining, setRetraining] = useState<boolean>(false);
  const [latestMetrics, setLatestMetrics] = useState<RetrainMetrics | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.getAnalytics();
      setOverview(res.overview);
      setImpact(res.ai_impact);
    } catch (err: any) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchAnalytics();
    }
  }, [open]);

  const handleRetrain = async () => {
    setRetraining(true);
    try {
      const res = await api.triggerRetraining();
      setLatestMetrics(res.metrics);
      toast.success('ML Model Retrained Successfully!', {
        description: `Upgraded to version ${res.metrics.model_version} (R² Score: ${res.metrics.profit_r2})`,
      });
      fetchAnalytics();
    } catch (err: any) {
      toast.error('Retraining failed', { description: err.message });
    } finally {
      setRetraining(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-3xl border-border bg-card p-6 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
            <Cpu className="h-4 w-4" /> Phase 8 Continuous Retraining & Analytics
          </div>
          <DialogTitle className="font-display text-xl font-bold tracking-tight">
            Platform AI Intelligence & Model Lifecycle
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Monitors platform deadhead savings, algorithm adoption, and triggers active Scikit-learn continuous learning.
          </DialogDescription>
        </DialogHeader>

        {loading && !overview ? (
          <div className="py-12 text-center text-xs text-muted-foreground">
            Loading real-time platform telemetry...
          </div>
        ) : (
          <div className="space-y-5">
            {/* Impact Metric Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3.5">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <DollarSign className="h-3 w-3 text-success" /> Total Profit Generated
                </p>
                <p className="mt-1 font-display text-lg font-bold text-foreground">
                  ₹{impact ? Math.round(impact.total_profit_generated_inr).toLocaleString('en-IN') : '—'}
                </p>
              </div>

              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3.5">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Compass className="h-3 w-3 text-primary" /> Deadhead Km Eliminated
                </p>
                <p className="mt-1 font-display text-lg font-bold text-foreground">
                  {impact ? `${impact.estimated_empty_km_eliminated.toLocaleString('en-IN')} km` : '—'}
                </p>
              </div>

              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3.5">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-warning" /> Recommendations Evaluated
                </p>
                <p className="mt-1 font-display text-lg font-bold text-foreground">
                  {impact ? impact.total_recommendations_evaluated : '—'}
                </p>
              </div>
            </div>

            {/* Platform Overview */}
            <div className="grid grid-cols-4 gap-2.5 rounded-2xl bg-secondary/40 p-3 text-center">
              <div>
                <p className="text-[10px] text-muted-foreground">Users</p>
                <p className="font-display text-sm font-bold">{overview?.total_users ?? '—'}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Trucks</p>
                <p className="font-display text-sm font-bold">{overview?.registered_trucks ?? '—'}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Market Loads</p>
                <p className="font-display text-sm font-bold">{overview?.active_loads ?? '—'}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Trips Run</p>
                <p className="font-display text-sm font-bold">{overview?.completed_trips ?? '—'}</p>
              </div>
            </div>

            {/* Retraining Console */}
            <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    <RefreshCw className="h-3.5 w-3.5 text-primary" /> Continuous Retraining Pipeline
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Pulls latest feedback records from PostgreSQL and retrains Dead-Mileage, Acceptance, Success, and Profit regressors.
                  </p>
                </div>
                <Button
                  onClick={handleRetrain}
                  disabled={retraining}
                  className="rounded-xl text-xs bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
                >
                  {retraining ? (
                    <>
                      <RefreshCw className="h-3 w-3 mr-1.5 animate-spin" /> Retraining...
                    </>
                  ) : (
                    <>
                      <Cpu className="h-3 w-3 mr-1.5" /> Retrain ML Engine
                    </>
                  )}
                </Button>
              </div>

              {latestMetrics && (
                <div className="mt-3 rounded-xl border border-success/30 bg-success/10 p-3 text-xs space-y-1.5">
                  <div className="flex items-center justify-between font-semibold text-success">
                    <span>Active Version: {latestMetrics.model_version}</span>
                    <span>Status: Deployed to FastAPI Memory</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 pt-1 text-[11px]">
                    <div>
                      <span className="text-muted-foreground">Acceptance Acc:</span>{' '}
                      <span className="font-mono font-bold">{(latestMetrics.acceptance_accuracy * 100).toFixed(1)}%</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Success Acc:</span>{' '}
                      <span className="font-mono font-bold">{(latestMetrics.success_accuracy * 100).toFixed(1)}%</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Profit MAE:</span>{' '}
                      <span className="font-mono font-bold">₹{Math.round(latestMetrics.profit_mae)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Profit R²:</span>{' '}
                      <span className="font-mono font-bold">{latestMetrics.profit_r2.toFixed(3)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
