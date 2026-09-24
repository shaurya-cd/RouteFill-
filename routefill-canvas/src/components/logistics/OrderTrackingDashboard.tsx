import React from 'react';
import { ActiveOrderModel } from '@/lib/api';
import {
  Truck,
  Package,
  Navigation,
  CheckCircle2,
  Clock,
  ArrowRight,
  MessageSquare,
  Sparkles,
  IndianRupee,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Props {
  order: ActiveOrderModel;
  onUpdateStatus: (nextStatus: 'ACCEPTED' | 'EN_ROUTE_PICKUP' | 'IN_TRANSIT' | 'COMPLETED') => void;
  onOpenChat: () => void;
  onCompleteTrip: () => void;
  userRole?: string;
}

const STAGES: Array<{
  key: 'ACCEPTED' | 'EN_ROUTE_PICKUP' | 'IN_TRANSIT' | 'COMPLETED';
  label: string;
  desc: string;
  icon: any;
}> = [
  { key: 'ACCEPTED', label: 'Accepted', desc: 'Carrier confirmed', icon: CheckCircle2 },
  { key: 'EN_ROUTE_PICKUP', label: 'To Pickup', desc: 'En route to hub', icon: Navigation },
  { key: 'IN_TRANSIT', label: 'In Transit', desc: 'Cargo loaded', icon: Truck },
  { key: 'COMPLETED', label: 'Delivered', desc: 'Trip completed', icon: Sparkles },
];

export const OrderTrackingDashboard: React.FC<Props> = ({
  order,
  onUpdateStatus,
  onOpenChat,
  onCompleteTrip,
  userRole,
}) => {
  const currentStageIndex = STAGES.findIndex((s) => s.key === order.status);

  const handleAdvance = () => {
    if (order.status === 'ACCEPTED') {
      onUpdateStatus('EN_ROUTE_PICKUP');
      toast.info('Truck dispatched!', {
        description: 'Status updated to En Route to Pickup Hub.',
      });
    } else if (order.status === 'EN_ROUTE_PICKUP') {
      onUpdateStatus('IN_TRANSIT');
      toast.info('Cargo loaded!', {
        description: 'Status updated to In Transit towards delivery.',
      });
    } else if (order.status === 'IN_TRANSIT') {
      onUpdateStatus('COMPLETED');
      toast.success('Trip Completed & Delivered!', {
        description: 'Launching ML feedback form to record actual profits.',
      });
      onCompleteTrip();
    }
  };

  return (
    <section className="rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card p-4 shadow-md space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/20 text-primary">
            <Package className="h-5 w-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-foreground">
                Order #RF-{order.load_id}
              </span>
              <span className="rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.2 text-[9px] font-bold">
                ACTIVE ORDER
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Carrier: <strong className="text-foreground">{order.carrier_name}</strong> ({order.truck_number})
            </p>
          </div>
        </div>

        <Button
          size="sm"
          onClick={onOpenChat}
          className="rounded-xl h-8 text-xs font-semibold bg-secondary hover:bg-secondary/80 text-foreground border border-border/80 gap-1.5 cursor-pointer"
        >
          <MessageSquare className="h-3.5 w-3.5 text-primary" />
          Chat
        </Button>
      </div>

      {/* 4-Stage Visual Lifecycle Progress Bar */}
      <div className="pt-2">
        <div className="relative flex items-center justify-between">
          {/* Progress track line */}
          <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 h-1 bg-border rounded-full -z-0">
            <div
              className="h-full bg-primary transition-all duration-500 rounded-full"
              style={{
                width: `${(currentStageIndex / (STAGES.length - 1)) * 100}%`,
              }}
            />
          </div>

          {STAGES.map((s, idx) => {
            const isDone = idx <= currentStageIndex;
            const isCurrent = idx === currentStageIndex;
            const Icon = s.icon;
            return (
              <div key={s.key} className="relative z-10 flex flex-col items-center">
                <div
                  className={`grid h-8 w-8 place-items-center rounded-full border-2 transition-all ${
                    isCurrent
                      ? 'bg-primary border-primary text-primary-foreground shadow-md ring-4 ring-primary/20 animate-pulse'
                      : isDone
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'bg-card border-border text-muted-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <span className={`text-[10px] font-bold mt-1.5 ${isCurrent ? 'text-primary' : isDone ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {s.label}
                </span>
                <span className="text-[8px] text-muted-foreground hidden sm:block">
                  {s.desc}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Shipment & Revenue Specs */}
      <div className="grid grid-cols-2 gap-2.5 rounded-2xl bg-background/80 p-3 border border-border/60 text-xs">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Corridor Route
          </span>
          <p className="font-display font-bold text-foreground mt-0.5">
            {order.pickup_city} → {order.drop_city}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {order.cargo} · {order.weight_tons}T
          </p>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Freight Revenue
          </span>
          <p className="font-display font-bold text-foreground mt-0.5 text-sm text-emerald-500">
            ₹{Number(order.agreed_price).toLocaleString('en-IN')}
          </p>
          {order.predicted_profit && (
            <p className="text-[10px] text-muted-foreground">
              Est. Profit: ₹{Math.round(order.predicted_profit).toLocaleString('en-IN')}
            </p>
          )}
        </div>
      </div>

      {/* Lifecycle Action Button */}
      {order.status !== 'COMPLETED' ? (
        <Button
          onClick={handleAdvance}
          className="w-full h-10 rounded-2xl bg-primary text-primary-foreground font-bold text-xs gap-2 shadow-md cursor-pointer hover:bg-primary/90"
        >
          {order.status === 'ACCEPTED' && (
            <>
              <Navigation className="h-4 w-4" /> Start En Route to Pickup Hub <ArrowRight className="h-4 w-4" />
            </>
          )}
          {order.status === 'EN_ROUTE_PICKUP' && (
            <>
              <Truck className="h-4 w-4" /> Mark Loaded & In Transit <ArrowRight className="h-4 w-4" />
            </>
          )}
          {order.status === 'IN_TRANSIT' && (
            <>
              <CheckCircle2 className="h-4 w-4" /> Complete Trip & Submit ML Feedback <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      ) : (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-center text-xs font-bold text-emerald-500 flex items-center justify-center gap-2">
          <Sparkles className="h-4 w-4" /> Trip Completed · ML Feedback Recorded
        </div>
      )}
    </section>
  );
};
