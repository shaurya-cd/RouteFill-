import React, { useState } from 'react';
import {
  TruckModel,
  LoadModel,
  RecommendationModel,
  DeadMileageRisk,
  FilteredLoadModel,
  RouteOptionModel,
} from '@/lib/api';
import {
  ArrowRight,
  Sparkles,
  Truck as TruckIcon,
  Route as RouteIcon,
  Package,
  TrendingUp,
  Percent,
  CheckCircle2,
  XCircle,
  Clock,
  Compass,
  ShieldAlert,
  ShieldCheck,
  Fuel,
  IndianRupee,
  Navigation,
  AlertTriangle,
  Layers,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Info,
  Pencil,
  Trash2,
  Plus,
  Trophy,
  Coins,
  Scale,
  BrainCircuit,
  Star,
  Lightbulb,
  TrendingDown,
  Check,
} from 'lucide-react';
import { MatchScore } from '@/components/logistics/MatchScore';
import { OrderTrackingDashboard } from '@/components/logistics/OrderTrackingDashboard';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { ActiveOrderModel } from '@/lib/api';

interface Props {
  userRole?: 'FLEET_OWNER' | 'ADMIN' | 'SHIPPER' | string;
  truck: TruckModel | null;
  deadMileageRisk: DeadMileageRisk | null;
  recommendations: RecommendationModel[];
  filteredLoads?: FilteredLoadModel[] | undefined;
  isGeneratingRecs: boolean;
  onGenerateRecs: () => void;
  onOpenFeedback: (rec: RecommendationModel) => void;
  onAcceptLoad?: (rec: RecommendationModel) => void;
  onRejectLoad?: (loadId: number) => void;
  activeOrder?: ActiveOrderModel | null;
  onUpdateOrderStatus?: (status: 'ACCEPTED' | 'EN_ROUTE_PICKUP' | 'IN_TRANSIT' | 'COMPLETED') => void;
  onOpenChat?: () => void;
  onCompleteTrip?: () => void;
  loads: LoadModel[];
  activeLoadId: number | null;
  onSelectLoad: (l: LoadModel) => void;
  radiusKm: number;
  onRadiusChange: (val: number) => void;
  onRefreshNearby: () => void;
  selectedRouteId?: string | undefined;
  onSelectRoute?: ((route: RouteOptionModel) => void) | undefined;
  availableTrucks?: TruckModel[];
  onSelectTruck?: (t: TruckModel) => void;
  onEditTruck?: (t: TruckModel) => void;
  onDeleteTruck?: (t: TruckModel) => void;
  onOpenPostLoad?: () => void;
}

export const RightPanel: React.FC<Props> = ({
  userRole = 'FLEET_OWNER',
  truck,
  availableTrucks = [],
  onSelectTruck,
  onEditTruck,
  onDeleteTruck,
  onOpenPostLoad,
  onAcceptLoad,
  onRejectLoad,
  activeOrder,
  onUpdateOrderStatus,
  onOpenChat,
  onCompleteTrip,
  deadMileageRisk,
  recommendations,
  filteredLoads = [],
  isGeneratingRecs,
  onGenerateRecs,
  onOpenFeedback,
  loads,
  activeLoadId,
  onSelectLoad,
  radiusKm,
  onRadiusChange,
  onRefreshNearby,
  selectedRouteId,
  onSelectRoute,
}) => {
  const [activeTab, setActiveTab] = useState<'decision' | 'routes' | 'comparison' | 'market'>('decision');
  const [shipperTab, setShipperTab] = useState<'shipments' | 'carriers' | 'ai'>('shipments');
  const [showFiltered, setShowFiltered] = useState<boolean>(true);
  const [expandedWhyNotRoute, setExpandedWhyNotRoute] = useState<string | null>('route_a');
  const [expandedLoadReasonId, setExpandedLoadReasonId] = useState<number | null>(null);

  const topRec = recommendations.length > 0 ? recommendations[0] : null;
  const activeTrip = (truck?.trips && truck.trips[0]) || null;
  const originCity = activeTrip?.originLocation?.city || truck?.currentLocation?.city || 'Origin';
  const destCity = activeTrip?.destinationLocation?.city || truck?.currentLocation?.city || 'Destination';

  // Selected route or default recommended
  const activeRoutes = topRec?.route_options || [];
  const currentRoute = activeRoutes.find((r) => r.route_id === selectedRouteId) || activeRoutes.find((r) => r.ai_recommended) || activeRoutes[0];

  const handleRouteClick = (route: RouteOptionModel) => {
    onSelectRoute?.(route);
    toast.info(`Switched to ${route.name}`, {
      description: route.ai_recommended ? 'AI Recommended optimal route selected' : 'Direct highway route selected',
    });
  };

  const handleReject = () => {
    toast.error('Recommendation Rejected', {
      description: 'Logged rejection reason. RouteFill AI learns driver preferences to calibrate future matches.',
    });
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-background select-none">
      {/* Header */}
      <div className="shrink-0 border-b border-border px-5 py-3.5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-base sm:text-lg font-bold tracking-tight">
              {userRole === 'SHIPPER'
                ? 'Shipper Freight Command'
                : userRole === 'FLEET_OWNER'
                ? 'Fleet Operations Command'
                : 'RouteFill AI Console'}
            </h1>
            <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span>
                {userRole === 'SHIPPER'
                  ? 'Carrier Dispatch & Cargo Optimization'
                  : userRole === 'FLEET_OWNER'
                  ? 'Return Load Intelligence & Profit Maximizer'
                  : 'Superadmin Oversight & System Telemetry'}
              </span>
              <span className="h-1 w-1 rounded-full bg-border" />
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-500 font-semibold">Live</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            {userRole === 'SHIPPER' && onOpenPostLoad && (
              <Button
                size="sm"
                onClick={onOpenPostLoad}
                className="h-8 gap-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-sm cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Post Load
              </Button>
            )}
            {userRole !== 'SHIPPER' && (
              <span className="rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[10px] font-bold text-primary">
                {recommendations.length > 0 ? `${recommendations.length} AI Matches` : 'Awaiting Match'}
              </span>
            )}
          </div>
        </div>

        {/* View Tabs for Shipper vs Fleet Owner/Admin */}
        {userRole === 'SHIPPER' ? (
          <div className="mt-3 flex rounded-xl bg-secondary/60 p-1 text-xs">
            <button
              type="button"
              onClick={() => setShipperTab('shipments')}
              className={`flex-1 rounded-lg py-1.5 text-center font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                shipperTab === 'shipments'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Package className="h-3.5 w-3.5 text-primary" /> My Shipments ({loads.length})
            </button>
            <button
              type="button"
              onClick={() => setShipperTab('carriers')}
              className={`flex-1 rounded-lg py-1.5 text-center font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                shipperTab === 'carriers'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <TruckIcon className="h-3.5 w-3.5 text-primary" /> Carriers Nearby ({availableTrucks.length})
            </button>
            {topRec && (
              <button
                type="button"
                onClick={() => setShipperTab('ai')}
                className={`flex-1 rounded-lg py-1.5 text-center font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  shipperTab === 'ai'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <BrainCircuit className="h-3.5 w-3.5 text-primary" /> AI Engine
              </button>
            )}
          </div>
        ) : (
          topRec && (
            <div className="mt-3 flex rounded-xl bg-secondary/60 p-1 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('decision')}
                className={`flex-1 rounded-lg py-1.5 text-center font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  activeTab === 'decision'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Trophy className="h-3.5 w-3.5 text-amber-500" /> Best Load
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('routes')}
                className={`flex-1 rounded-lg py-1.5 text-center font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  activeTab === 'routes'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Navigation className="h-3.5 w-3.5 text-emerald-500" /> Best Route
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('comparison')}
                className={`flex-1 rounded-lg py-1.5 text-center font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  activeTab === 'comparison'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Scale className="h-3.5 w-3.5 text-blue-500" /> Compare
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('market')}
                className={`flex-1 rounded-lg py-1.5 text-center font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  activeTab === 'market'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Layers className="h-3.5 w-3.5 text-purple-500" /> Market
              </button>
            </div>
          )
        )}
      </div>

      {/* Main Scroll Content */}
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
        {/* Active Order Tracking Dashboard if an active shipment exists */}
        {activeOrder && (
          <OrderTrackingDashboard
            order={activeOrder}
            onUpdateStatus={(status) => onUpdateOrderStatus?.(status)}
            onOpenChat={() => onOpenChat?.()}
            onCompleteTrip={() => onCompleteTrip?.()}
            userRole={userRole}
          />
        )}

        {/* SHIIPER VIEW: MY SHIPMENTS */}
        {userRole === 'SHIPPER' && shipperTab === 'shipments' && (
          <section className="space-y-4">
            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border bg-card p-3.5 shadow-sm">
                <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
                  <Package className="h-3.5 w-3.5 text-primary" />
                  <span>Your Freight Loads</span>
                </div>
                <p className="mt-1 font-display text-lg font-bold text-foreground">
                  {loads.length} Shipments
                </p>
                <p className="text-[10px] text-emerald-500 font-semibold">Active & Discoverable</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-3.5 shadow-sm">
                <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
                  <TruckIcon className="h-3.5 w-3.5 text-primary" />
                  <span>Available Carriers</span>
                </div>
                <p className="mt-1 font-display text-lg font-bold text-foreground">
                  {availableTrucks.length} Trucks
                </p>
                <p className="text-[10px] text-primary font-semibold">Ready in Region</p>
              </div>
            </div>

            {/* Post load banner if no loads */}
            {loads.length === 0 && (
              <div className="rounded-3xl border border-dashed border-border p-6 text-center">
                <Package className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="font-bold text-sm text-foreground">No Shipments Active</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Post your freight cargo to discover nearby empty return carriers instantly.
                </p>
                {onOpenPostLoad && (
                  <Button
                    onClick={onOpenPostLoad}
                    className="mt-3 rounded-xl text-xs bg-primary text-primary-foreground font-semibold cursor-pointer"
                  >
                    + Post First Shipment
                  </Button>
                )}
              </div>
            )}

            {/* Active Shipments List */}
            {loads.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Your Freight Shipments ({loads.length})
                  </span>
                  <span className="text-[10px] text-muted-foreground">Click to view carrier matches</span>
                </div>

                <div className="space-y-2.5">
                  {loads.map((l) => {
                    const isSelected = activeLoadId === l.id;
                    return (
                      <div
                        key={l.id}
                        onClick={() => onSelectLoad(l)}
                        className={`rounded-2xl border p-3.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-primary bg-accent/40 ring-2 ring-primary/25 shadow-md'
                            : 'border-border bg-card hover:border-primary/40'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                              <Package className="h-4 w-4" />
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-display text-sm font-bold leading-tight">
                                  {l.pickupLocation?.city || l.pickupLocation?.name || 'Pickup'} →{' '}
                                  {l.destinationLocation?.city || l.destinationLocation?.name || 'Drop'}
                                </p>
                                <span className="rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.2 text-[9px] font-bold">
                                  {l.status}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {l.cargo_description} · <strong className="text-foreground">{l.weight_tons} Tons</strong>
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-display text-sm font-bold text-foreground">
                              ₹{Number(l.offered_price).toLocaleString('en-IN')}
                            </p>
                            <p className="text-[10px] text-muted-foreground">Offered Price</p>
                          </div>
                        </div>

                        {/* If selected: show matching carriers nearby */}
                        {isSelected && (
                          <div className="mt-3 pt-3 border-t border-border/60">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[11px] font-bold text-primary flex items-center gap-1">
                                <TruckIcon className="h-3.5 w-3.5" />
                                Nearest Carriers for this Shipment
                              </span>
                              <span className="text-[10px] text-muted-foreground font-mono">
                                {availableTrucks.length} nearby
                              </span>
                            </div>

                            <div className="space-y-1.5">
                              {availableTrucks.slice(0, 3).map((trk) => (
                                <div
                                  key={trk.id}
                                  className="flex items-center justify-between rounded-xl border border-border/80 bg-background/80 p-2 text-xs"
                                >
                                  <div>
                                    <div className="flex items-center gap-1.5 font-mono font-bold">
                                      <span>{trk.truck_number}</span>
                                      <span className="text-[10px] text-muted-foreground font-sans font-normal">
                                        ({trk.capacity_tons}T {trk.truckType?.name || 'Open Truck'})
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground">
                                      Carrier: {trk.owner?.name || 'Shaurya Transport'} · Hub: {trk.currentLocation?.city || trk.currentLocation?.name || 'In Transit'}
                                    </p>
                                  </div>
                                  <Button
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toast.success(`Offer sent to ${trk.truck_number}`, {
                                        description: `Carrier ${trk.owner?.name || 'Shaurya Transport'} received your ₹${Number(l.offered_price).toLocaleString('en-IN')} freight booking request.`,
                                      });
                                    }}
                                    className="h-7 text-[10px] rounded-lg px-2.5 font-semibold bg-primary text-primary-foreground cursor-pointer"
                                  >
                                    Book Carrier
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        )}

        {/* SHIPPER VIEW: CARRIERS NEARBY */}
        {userRole === 'SHIPPER' && shipperTab === 'carriers' && (
          <section className="space-y-3">
            {/* Search radius control */}
            <div className="rounded-2xl border border-border bg-card p-3.5 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Compass className="h-3.5 w-3.5 text-primary" />
                  Carrier Search Radius
                </span>
                <span className="font-mono font-bold text-primary">{radiusKm} km</span>
              </div>
              <Slider
                value={[radiusKm]}
                min={50}
                max={600}
                step={25}
                onValueChange={(vals) => {
                  if (vals[0] !== undefined) onRadiusChange(vals[0]);
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Carriers in Region ({availableTrucks.length})
              </span>
              <span className="text-[10px] text-muted-foreground">Available for return loads</span>
            </div>

            <div className="space-y-2">
              {availableTrucks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => onSelectTruck?.(t)}
                  className="rounded-2xl border border-border bg-card p-3.5 hover:border-primary/40 transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                        <TruckIcon className="h-4 w-4" />
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-mono text-sm font-bold text-foreground">
                            {t.truck_number}
                          </p>
                          <span className="rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.2 text-[9px] font-bold">
                            {t.status}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {t.capacity_tons} Tons · {t.truckType?.name || 'Open Truck'}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Fleet: <strong className="text-foreground">{t.owner?.name || 'Shaurya Transport'}</strong> · Location: {t.currentLocation?.city || t.currentLocation?.name || 'In Transit'}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTruck?.(t);
                        toast.info(`Focused on ${t.truck_number} on map`);
                      }}
                      className="h-7 text-[10px] rounded-lg px-2 font-semibold"
                    >
                      View on Map
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* FLEET OWNER & ADMIN & SHIPPER AI VIEW */}
        {(userRole !== 'SHIPPER' || shipperTab === 'ai') && (
          <>
            {/* 1. Selected Truck & Current Journey Status */}
            {truck ? (
          <section className="rounded-3xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary">
                  <TruckIcon className="h-5 w-5" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-base font-bold tracking-tight">
                      {truck.truck_number}
                    </p>
                    <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground uppercase">
                      {truck.truckType?.name || 'OPEN TRUCK'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Capacity: <strong className="text-foreground">{truck.capacity_tons} Tons</strong> · {truck.owner?.name || 'Shaurya Transport'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold">
                  {truck.status}
                </span>
                {(userRole === 'FLEET_OWNER' || userRole === 'ADMIN') && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      title="Edit Truck Details"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditTruck?.(truck);
                      }}
                      className="grid h-7 w-7 place-items-center rounded-lg border border-border bg-secondary/80 text-muted-foreground hover:text-foreground hover:bg-secondary transition-all cursor-pointer"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Remove Truck from Fleet"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteTruck?.(truck);
                      }}
                      className="grid h-7 w-7 place-items-center rounded-lg border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Fleet Switcher for multi-truck owners */}
            {availableTrucks && availableTrucks.length > 1 && (
              <div className="mt-3 pt-3 border-t border-border/60">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <TruckIcon className="h-3 w-3 text-primary" />
                    Your Fleet ({availableTrucks.length} Trucks)
                  </span>
                  <span className="text-[10px] text-muted-foreground">Click to focus</span>
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {availableTrucks.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => onSelectTruck?.(t)}
                      className={`px-2.5 py-1 rounded-xl font-mono text-[11px] font-bold transition-all cursor-pointer shrink-0 border ${
                        truck.id === t.id
                          ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                          : 'bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary border-border/60'
                      }`}
                    >
                      {t.truck_number}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Current Inbound Journey Context */}
            <div className="mt-3.5 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-3.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <Navigation className="h-3.5 w-3.5" /> Current Trip
                </span>
                <span className="font-mono text-[10px] font-bold bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                  Expected Arrival: Tomorrow, 4 PM
                </span>
              </div>

              <div className="mt-2 flex items-center justify-between font-display text-sm font-bold">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-blue-400" />
                  <span>{originCity}</span>
                </div>
                <div className="flex items-center gap-1 text-primary text-xs font-semibold px-2">
                  <span>In Transit</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span>{destCity}</span>
                </div>
              </div>

              <div className="mt-2.5 rounded-xl bg-background/80 border border-border/60 p-2 text-[11px] text-muted-foreground">
                <p className="font-semibold text-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3 text-primary" /> Tomorrow 4 PM at {destCity}:
                </p>
                <p className="mt-0.5 text-[10px]">
                  Will this truck travel empty? AI searches return loads near {destCity} before it arrives.
                </p>
              </div>
            </div>

            {/* Trigger Button */}
            <Button
              onClick={onGenerateRecs}
              disabled={isGeneratingRecs}
              className="mt-3.5 w-full rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 py-3 text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 cursor-pointer"
            >
              {isGeneratingRecs ? (
                <>
                  <Sparkles className="h-4 w-4 animate-spin text-white" />
                  Evaluating 6 AI Checks & Historical Trips...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-white" />
                  Evaluate Return Loads with AI <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </section>
        ) : (
          <div className="rounded-3xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
            Select a truck from the map to view diagnostics and evaluate return matches.
          </div>
        )}

        {/* Incompatible Freight Filter Diagnostic Badge */}
        {filteredLoads.length > 0 && (
          <section className="rounded-2xl border border-destructive/30 bg-destructive/5 p-3">
            <button
              type="button"
              onClick={() => setShowFiltered(!showFiltered)}
              className="flex w-full items-center justify-between text-left cursor-pointer"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-destructive">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>
                  {userRole === 'ADMIN' ? 'Step 1: ' : ''}
                  {userRole === 'ADMIN'
                    ? `Removed ${filteredLoads.length} Impossible Loads`
                    : `Incompatible Freight Excluded (${filteredLoads.length})`}
                </span>
              </div>
              {showFiltered ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
            </button>

            {showFiltered && (
              <div className="mt-2.5 space-y-1.5 border-t border-destructive/20 pt-2 text-[11px]">
                {filteredLoads.map((fl, i) => (
                  <div key={i} className="flex items-start gap-2 rounded-xl bg-background/60 p-2 border border-destructive/20">
                    <XCircle className="h-3.5 w-3.5 shrink-0 text-destructive mt-0.5" />
                    <div>
                      <p className="font-semibold text-foreground leading-tight">
                        {fl.pickup_city} → {fl.dest_city} ({fl.cargo} · {fl.weight_tons}T)
                      </p>
                      <p className="text-[10px] text-destructive font-medium mt-0.5">
                        {fl.reason}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* TAB 1: BEST LOAD DECISION & 6 CHECKS */}
        {topRec && activeTab === 'decision' && (
          <section className="space-y-4">
            {/* Top Winner Card */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-5 text-white shadow-xl shadow-emerald-900/30">
              <div className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-white/10 blur-2xl" />

              <div className="relative">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md">
                    <Sparkles className="h-3 w-3" /> <Trophy className="h-3 w-3 text-amber-300" /> Rank 1 AI Best Load
                  </span>
                  <span className="font-mono text-[10px] bg-white/15 px-2 py-0.5 rounded-md font-semibold">
                    Score: {topRec.final_score}/100
                  </span>
                </div>

                <div className="mt-3">
                  <h2 className="font-display text-xl font-bold tracking-tight">
                    {topRec.load.pickup_location} → {topRec.load.destination_location}
                  </h2>
                  <p className="text-xs text-emerald-100/90 mt-0.5">
                    {topRec.load.cargo_description} · {topRec.load.weight_tons} Tons
                  </p>
                </div>

                {/* Real Profit vs Paper Revenue */}
                <div className="mt-4 grid grid-cols-2 gap-2.5">
                  <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-sm border border-white/10">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-emerald-200/80">
                      Offered Revenue
                    </p>
                    <p className="mt-0.5 font-display text-lg font-bold">
                      ₹{Number(topRec.load.offered_price).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-emerald-400/20 p-3 backdrop-blur-sm border border-emerald-300/30">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-emerald-200 flex items-center gap-1">
                      Real Net Profit <Coins className="h-3 w-3 text-emerald-200" />
                    </p>
                    <p className="mt-0.5 font-display text-lg font-bold text-white">
                      ₹{Math.round(topRec.predicted_profit).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>

                <div className="mt-3.5">
                  <MatchScore value={Math.round(topRec.final_score)} label="Composite Decision Rating" />
                </div>

                <p className="mt-2.5 text-[11px] text-emerald-100 leading-relaxed italic bg-black/15 p-2 rounded-xl">
                  "{topRec.reason}"
                </p>

                {/* Actions */}
                <div className="mt-4 flex gap-2">
                  <Button
                    onClick={() => {
                      if (onAcceptLoad) {
                        onAcceptLoad(topRec);
                      } else {
                        onOpenFeedback(topRec);
                      }
                    }}
                    className="flex-1 rounded-2xl bg-white text-emerald-800 hover:bg-white/90 py-2.5 text-xs font-bold shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Accept Load
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (onRejectLoad) {
                        onRejectLoad(topRec.load_id);
                      } else {
                        handleReject();
                      }
                    }}
                    className="rounded-2xl border-white/30 bg-white/10 text-white hover:bg-white/20 py-2.5 text-xs font-semibold cursor-pointer flex items-center gap-1"
                  >
                    <XCircle className="h-3.5 w-3.5 text-rose-300" /> Reject
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab('routes')}
                    className="rounded-2xl border-white/30 bg-white/10 text-white hover:bg-white/20 py-2.5 text-xs font-semibold cursor-pointer"
                  >
                    <RouteIcon className="h-3.5 w-3.5 mr-1" /> Best Route
                  </Button>
                </div>
              </div>
            </div>

            {/* The 6 Comprehensive AI Checks Breakdown */}
            {topRec.six_checks && (
              <section className="space-y-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" /> What RouteFill AI Checked (6 Checks)
                </h3>

                <div className="space-y-2">
                  {/* Check 1 */}
                  <div className="rounded-2xl border border-border bg-card p-3 text-xs">
                    <div className="flex items-center justify-between font-bold">
                      <span>1. Is the truck suitable?</span>
                      <span className="text-emerald-500 font-bold inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Suitable</span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {topRec.six_checks.suitability.summary}
                    </p>
                  </div>

                  {/* Check 2 */}
                  <div className="rounded-2xl border border-border bg-card p-3 text-xs">
                    <div className="flex items-center justify-between font-bold">
                      <span>2. Pickup Distance from Truck</span>
                      <span className="text-emerald-500 font-bold inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> 5 km (Very Good)</span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {topRec.six_checks.pickup_distance.summary}
                    </p>
                  </div>

                  {/* Check 3 */}
                  <div className="rounded-2xl border border-border bg-card p-3 text-xs">
                    <div className="flex items-center justify-between font-bold">
                      <span>3. Does Timing Match?</span>
                      <span className="text-emerald-500 font-bold inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Possible (+3 hr Buffer)</span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {topRec.six_checks.timing_match.summary}
                    </p>
                  </div>

                  {/* Check 4 */}
                  <div className="rounded-2xl border border-border bg-card p-3 text-xs">
                    <div className="flex items-center justify-between font-bold">
                      <span>4. Empty Travel Saved</span>
                      <span className="text-emerald-500 font-bold inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> 1,400 km Saved</span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {topRec.six_checks.empty_travel_saved.summary}
                    </p>
                  </div>

                  {/* Check 5 */}
                  <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-emerald-500">5. Real Net Profit vs Paper Revenue</span>
                      <span className="font-mono text-emerald-500 font-bold">₹16,000 Net</span>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-1.5 text-center text-[10px] text-muted-foreground">
                      <div className="rounded-lg bg-background p-1.5">
                        <span className="block opacity-75">Revenue</span>
                        <strong className="text-foreground">₹25,000</strong>
                      </div>
                      <div className="rounded-lg bg-background p-1.5">
                        <span className="block opacity-75">Fuel+Toll</span>
                        <strong className="text-destructive">-₹9,000</strong>
                      </div>
                      <div className="rounded-lg bg-background p-1.5">
                        <span className="block opacity-75">Real Profit</span>
                        <strong className="text-emerald-500 font-bold">₹16,000</strong>
                      </div>
                    </div>
                    <p className="mt-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 italic">
                      {topRec.six_checks.financial_net_profit.summary}
                    </p>
                  </div>

                  {/* Check 6 */}
                  <div className="rounded-2xl border border-primary/30 bg-primary/5 p-3 text-xs">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-primary">6. Where REAL AI Comes In</span>
                      <span className="text-primary font-bold inline-flex items-center gap-1"><BrainCircuit className="h-3.5 w-3.5 text-primary" /> Historical Learning</span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {topRec.six_checks.historical_ai_learning.summary}
                    </p>
                  </div>
                </div>
              </section>
            )}
          </section>
        )}

        {/* TAB 2: BEST ROUTE SELECTION (Route A vs Route B) */}
        {topRec && activeTab === 'routes' && (
          <section className="space-y-4">
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                  <RouteIcon className="h-4 w-4" /> Dual Decision: "Best Route"
                </span>
                <span className="text-[10px] bg-primary/15 text-primary px-2 py-0.5 rounded-full font-bold">
                  Corridor Optimization
                </span>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                For the selected load (<strong>{topRec.load.pickup_location} → {topRec.load.destination_location}</strong>),
                the <strong>shortest route is not always the best route!</strong>
              </p>
            </div>

            {/* Route Options Cards */}
            <div className="space-y-3">
              {activeRoutes.map((route) => {
                const isSelected = (currentRoute?.route_id === route.route_id);
                return (
                  <div
                    key={route.route_id}
                    onClick={() => handleRouteClick(route)}
                    className={`rounded-3xl border p-4 transition-all cursor-pointer ${
                      isSelected
                        ? route.ai_recommended
                          ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/30 shadow-lg'
                          : 'border-primary bg-accent ring-2 ring-primary/30 shadow-lg'
                        : 'border-border bg-card hover:border-border/80'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-display text-sm font-bold">
                            {route.name}
                          </p>
                        </div>
                        {route.ai_recommended && (
                          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold">
                            <Sparkles className="h-3 w-3" /> <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> AI Recommended Route
                          </span>
                        )}
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        route.traffic_level === 'HIGH' ? 'bg-destructive/20 text-destructive' : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {route.traffic_level} Traffic
                      </span>
                    </div>

                    {/* Stats Grid */}
                    <div className="mt-3 grid grid-cols-4 gap-1.5 text-center text-xs">
                      <div className="rounded-xl bg-background/80 p-2">
                        <span className="block text-[10px] text-muted-foreground">Distance</span>
                        <strong className="font-display font-bold">{route.distance_km} km</strong>
                      </div>
                      <div className="rounded-xl bg-background/80 p-2">
                        <span className="block text-[10px] text-muted-foreground">Tolls</span>
                        <strong className="font-display font-bold text-primary">₹{route.toll_cost}</strong>
                      </div>
                      <div className="rounded-xl bg-background/80 p-2">
                        <span className="block text-[10px] text-muted-foreground">Travel Time</span>
                        <strong className="font-display font-bold">{route.estimated_hours}h</strong>
                      </div>
                      <div className="rounded-xl bg-background/80 p-2">
                        <span className="block text-[10px] text-muted-foreground">Fuel</span>
                        <strong className="font-display font-bold">₹{route.fuel_cost}</strong>
                      </div>
                    </div>

                    <p className="mt-2.5 text-[11px] text-muted-foreground italic bg-secondary/50 p-2 rounded-xl">
                      {route.verdict}
                    </p>

                    {/* Dedicated Feature: "Why Not This Route?" AI Analysis */}
                    {!route.ai_recommended && (
                      <div className="mt-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-left">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedWhyNotRoute((prev) => (prev === route.route_id ? null : route.route_id));
                          }}
                          className="flex w-full items-center justify-between text-left cursor-pointer group"
                        >
                          <div className="flex items-center gap-2">
                            <span className="grid h-6 w-6 place-items-center rounded-lg bg-amber-500/20 text-amber-500 font-bold">
                              <HelpCircle className="h-3.5 w-3.5" />
                            </span>
                            <div>
                              <p className="text-xs font-bold text-amber-500 group-hover:underline flex items-center gap-1.5">
                                Why Not This Route?
                                <span className="text-[9px] font-mono font-semibold uppercase bg-amber-500/20 px-1.5 py-0.2 rounded text-amber-400">
                                  AI Diagnostic
                                </span>
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                Why the AI rejected {route.name}
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] font-semibold text-amber-500 bg-amber-500/15 px-2 py-0.5 rounded-full flex items-center gap-1">
                            {expandedWhyNotRoute === route.route_id ? 'Hide AI Reasons' : 'View Reasons'}
                            {expandedWhyNotRoute === route.route_id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </span>
                        </button>

                        {expandedWhyNotRoute === route.route_id && (
                          <div className="mt-2.5 space-y-2 border-t border-amber-500/20 pt-2.5 text-xs">
                            <p className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                              Critical Route Hazards & Cost Penalties:
                            </p>
                            <ul className="space-y-1.5 text-[11px] text-muted-foreground list-none pl-0">
                              {(route.why_not_reasons && route.why_not_reasons.length > 0 ? route.why_not_reasons : [
                                '3.5 Hours Slower: Severe bottlenecks near Bharuch Narmada Bridge & Surat ring road add 3.5+ hours of delays.',
                                '₹1,000 Higher Tolls: Cumulative toll cost is ₹2,500 across older plazas (vs ₹1,500 on Western Bypass).',
                                'Stop-and-Go Fuel Idling: Continuous commercial congestion burns excessive idling fuel and wears brakes.',
                                'Distance Illusion: 70 km shorter on paper, but costs significantly more in time, tolls, and operating profit.'
                              ]).map((reason, rIdx) => (
                                <li key={rIdx} className="flex items-start gap-1.5 leading-snug rounded-lg bg-background/70 p-1.5 border border-amber-500/20">
                                  <span>{reason}</span>
                                </li>
                              ))}
                            </ul>
                            <div className="rounded-xl bg-amber-500/10 p-2 text-[10px] text-amber-600 dark:text-amber-400 italic flex items-start gap-1.5">
                              <Lightbulb className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                              <span><strong>Key AI Takeaway:</strong> The shortest route on the map is not always the most profitable route in reality! Route B bypasses bottleneck zones, saving ₹1,000 in tolls and 3.5 hours in turnaround time.</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="mt-3 flex items-center justify-between pt-1 text-[11px]">
                      <span className="text-muted-foreground">{route.road_condition}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRouteClick(route);
                        }}
                        className={`text-xs font-bold px-3 py-1 rounded-xl cursor-pointer flex items-center gap-1 ${
                          isSelected ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground hover:bg-secondary/80'
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                        {isSelected ? 'Active on Map' : route.ai_recommended ? 'Select Route' : 'Override & Select'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* TAB 3: CANDIDATE LOADS COMPARISON (A vs B vs C) */}
        {recommendations.length > 0 && activeTab === 'comparison' && (
          <section className="space-y-3">
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3">
              <p className="text-xs font-bold text-primary">
                Why AI Chose Option A over Option B
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                A simple calculator might choose <strong>Option B (₹35,000)</strong> because it looks highest.
                RouteFill AI factors fuel, tolls, delays, and historical data to reveal the true winner.
              </p>
            </div>

            <div className="space-y-2.5">
              {recommendations.map((rec) => {
                const isWinner = rec.rank === 1;
                return (
                  <div
                    key={rec.id}
                    className={`rounded-2xl border p-3.5 transition-all ${
                      isWinner
                        ? 'border-emerald-500/50 bg-emerald-500/10 ring-2 ring-emerald-500/20 shadow-md'
                        : 'border-border bg-card'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`grid h-6 w-6 place-items-center rounded-lg text-xs font-bold ${
                          isWinner ? 'bg-emerald-500 text-white' : 'bg-secondary text-muted-foreground'
                        }`}>
                          {rec.rank}
                        </span>
                        <span className="font-display text-xs font-bold">
                          {rec.load.pickup_location} → {rec.load.destination_location}
                        </span>
                      </div>
                      <span className="font-mono text-xs font-bold text-foreground">
                        ₹{Number(rec.load.offered_price).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="mt-2.5 grid grid-cols-3 gap-1.5 text-center text-[10px]">
                      <div className="rounded-xl bg-background p-1.5">
                        <span className="text-muted-foreground block">Pickup Deadhead</span>
                        <strong className="text-foreground">{Math.round(rec.pickup_distance_km || 0)} km</strong>
                      </div>
                      <div className="rounded-xl bg-background p-1.5">
                        <span className="text-muted-foreground block">Real Net Profit</span>
                        <strong className={isWinner ? 'text-emerald-500 font-bold' : 'text-foreground'}>
                          ₹{Math.round(rec.predicted_profit).toLocaleString('en-IN')}
                        </strong>
                      </div>
                      <div className="rounded-xl bg-background p-1.5">
                        <span className="text-muted-foreground block">Success Rate</span>
                        <strong className="text-foreground">{(rec.success_probability * 100).toFixed(0)}%</strong>
                      </div>
                    </div>

                    <p className="mt-2 text-[10px] text-muted-foreground italic">
                      {rec.reason}
                    </p>

                    {!isWinner && (
                      <div className="mt-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-amber-500">
                          <AlertTriangle className="h-3 w-3" />
                          <span>Why Not This Load? (Rank #{rec.rank})</span>
                        </div>
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          {rec.reason}
                        </p>
                        <div className="mt-1.5 text-[10px] text-amber-600 dark:text-amber-400 font-semibold flex items-center justify-between">
                          <span className="flex items-center gap-1"><TrendingDown className="h-3.5 w-3.5 text-amber-500" /> Profit Deficit vs #1 Pick:</span>
                          <span className="font-mono font-bold">-₹{(Math.round((topRec?.predicted_profit || 0) - rec.predicted_profit)).toLocaleString('en-IN')} net</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Discarded Loads List */}
            {filteredLoads.length > 0 && (
              <div className="mt-4 pt-3 border-t border-border space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-destructive flex items-center gap-1.5">
                    <XCircle className="h-3.5 w-3.5" />
                    {userRole === 'ADMIN' ? 'Pre-Screening Step: ' : 'Filter Summary: '}{filteredLoads.length} Impossible Loads Discarded
                  </p>
                  <span className="text-[10px] text-muted-foreground">Failed Physical Constraints</span>
                </div>
                <div className="space-y-1.5">
                  {filteredLoads.map((fl, i) => (
                    <div key={i} className="rounded-xl border border-destructive/25 bg-destructive/5 p-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground">{fl.pickup_city} → {fl.dest_city}</span>
                        <span className="font-mono text-[10px] text-muted-foreground">{fl.cargo} · {fl.weight_tons}T</span>
                      </div>
                      <p className="mt-1 text-[10px] font-semibold text-destructive">
                        {fl.reason}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* TAB 4: NEARBY MARKETPLACE LOADS */}
        {(activeTab === 'market' || !topRec) && (
          <section className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground flex items-center gap-1.5 font-bold">
                <Compass className="h-3.5 w-3.5 text-primary" /> Available Freight Loads
              </p>
              <span className="text-xs font-mono font-semibold text-primary">
                Radius: {radiusKm} km
              </span>
            </div>

            <div className="rounded-2xl border border-border bg-card p-3 space-y-2">
              <Slider
                value={[radiusKm]}
                min={50}
                max={600}
                step={25}
                onValueChange={(vals) => {
                  if (vals[0] !== undefined) onRadiusChange(vals[0]);
                }}
              />
              <div className="flex justify-between text-[10px] text-muted-foreground pt-1">
                <span>50 km</span>
                <button
                  onClick={onRefreshNearby}
                  className="text-primary hover:underline font-semibold cursor-pointer"
                >
                  Apply Filter
                </button>
                <span>600 km</span>
              </div>
            </div>

            <div className="space-y-2.5">
              {loads.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">
                  No active loads available within current search radius.
                </p>
              ) : (
                loads.map((l) => {
                  const isActive = activeLoadId === l.id;
                  const isTopPick = topRec?.load_id === l.id;
                  const recMatch = recommendations.find((r) => r.load_id === l.id);
                  const flMatch = filteredLoads.find(
                    (fl) => fl.load_id === l.id || (l.cargo_description && fl.cargo.toLowerCase() === l.cargo_description.toLowerCase())
                  );
                  const isExpanded = expandedLoadReasonId === l.id;

                  return (
                    <div
                      key={l.id}
                      onClick={() => onSelectLoad(l)}
                      className={`w-full rounded-2xl border p-3.5 text-left transition-all cursor-pointer ${
                        isActive
                          ? 'border-primary bg-accent/40 ring-2 ring-primary/25 shadow-md'
                          : 'border-border bg-card hover:border-primary/40'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl text-foreground ${
                            isTopPick ? 'bg-emerald-500/20 text-emerald-400' : 'bg-secondary'
                          }`}>
                            <Package className="h-4 w-4" />
                          </span>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="font-display text-xs font-bold leading-tight">
                                {l.pickupLocation?.name?.split(' ')[0] || 'Pickup'} →{' '}
                                {l.destinationLocation?.name?.split(' ')[0] || 'Drop'}
                              </p>
                              {isTopPick && (
                                <span className="rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0 text-[9px] font-bold flex items-center gap-1">
                                  <Trophy className="h-2.5 w-2.5 text-emerald-400" /> #1 Pick
                                </span>
                              )}
                              {!isTopPick && recMatch && (
                                <span className="rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0 text-[9px] font-bold">
                                  Rank #{recMatch.rank}
                                </span>
                              )}
                              {!isTopPick && !recMatch && flMatch && (
                                <span className="rounded-full bg-destructive/20 text-destructive border border-destructive/30 px-1.5 py-0 text-[9px] font-bold flex items-center gap-1">
                                  <XCircle className="h-2.5 w-2.5 text-destructive" /> Incompatible
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {l.cargo_description} · {l.weight_tons}T · {l.truckType?.name || 'TRUCK'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-display text-xs font-bold text-foreground">
                            ₹{Number(l.offered_price).toLocaleString('en-IN')}
                          </p>
                          {l.pickup_distance_km !== undefined && (
                            <p className="text-[10px] text-muted-foreground">
                              {Math.round(l.pickup_distance_km)} km pickup
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Interactive "Why Not This Load?" Toggle */}
                      <div className="mt-2.5 pt-2 border-t border-border/50 flex items-center justify-between text-[10px]">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedLoadReasonId((prev) => (prev === l.id ? null : l.id));
                          }}
                          className="font-bold flex items-center gap-1 text-primary hover:underline cursor-pointer"
                        >
                          <HelpCircle className="h-3 w-3" />
                          {isTopPick
                            ? 'Why Is This Selected? (AI Verdict)'
                            : 'Why Not This Load? (AI Diagnostic)'}
                          {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </button>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          {isActive && <Check className="h-3 w-3 text-primary" />}
                          {isActive ? 'Selected on Map' : 'Click to preview'}
                        </span>
                      </div>

                      {isExpanded && (
                        <div className="mt-2 rounded-xl bg-background/90 p-2.5 text-[11px] border border-border/70 space-y-1">
                          {isTopPick ? (
                            <div>
                              <p className="font-bold text-emerald-500 flex items-center gap-1.5">
                                <Trophy className="h-3.5 w-3.5 text-emerald-500" />
                                Why This Load Is Selected:
                              </p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                Perfect 8-ton payload match, only 5 km deadhead to pickup, timing aligns with +3h buffer after Delhi arrival, and delivers highest proven net profit (₹16,000 real profit).
                              </p>
                            </div>
                          ) : recMatch ? (
                            <div>
                              <p className="font-bold text-amber-500 flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Why Not Selected (Rank #{recMatch.rank}):
                              </p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                {recMatch.reason}
                              </p>
                              <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-1 flex items-center gap-1">
                                <TrendingDown className="h-3 w-3 text-amber-500" />
                                Real Profit: ₹{Math.round(recMatch.predicted_profit).toLocaleString('en-IN')} (₹{(Math.round((topRec?.predicted_profit || 0) - recMatch.predicted_profit)).toLocaleString('en-IN')} less profit than #1 Pick).
                              </p>
                            </div>
                          ) : flMatch ? (
                            <div>
                              <p className="font-bold text-destructive flex items-center gap-1">
                                <XCircle className="h-3 w-3" />
                                Why Discarded in Pre-Screening:
                              </p>
                              <p className="text-[10px] font-semibold text-destructive mt-0.5">
                                {flMatch.reason}
                              </p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                Fails strict physical and regulatory requirement: {flMatch.check_failed}.
                              </p>
                            </div>
                          ) : (
                            <div>
                              <p className="font-bold text-muted-foreground flex items-center gap-1">
                                <Info className="h-3 w-3" />
                                Why Not This Load:
                              </p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                Suboptimal return vector. Does not align with the truck's base hub or generates excessive empty deadhead miles compared to the top AI match.
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </section>
        )}
      </>
    )}
  </div>
</div>
  );
};
