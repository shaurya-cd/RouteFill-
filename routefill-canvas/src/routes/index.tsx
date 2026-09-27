import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { AuthProvider, useAuth } from "@/lib/authContext";
import {
  api,
  TruckModel,
  LoadModel,
  RecommendationModel,
  DeadMileageRisk,
  FilteredLoadModel,
  RouteOptionModel,
} from "@/lib/api";
import { TopNavigation } from "@/components/layout/TopNavigation";
import { LeftSidebar } from "@/components/layout/LeftSidebar";
import { StoryFlowBanner } from "@/components/layout/StoryFlowBanner";
import { RightPanel } from "@/components/logistics/RightPanel";
import { MapCanvas } from "@/components/map/MapCanvas";
import { OutcomeDialog } from "@/components/logistics/OutcomeDialog";
import { CreateTruckDialog } from "@/components/logistics/CreateTruckDialog";
import { EditTruckDialog } from "@/components/logistics/EditTruckDialog";
import { OrderChatDialog } from "@/components/logistics/OrderChatDialog";
import { TripManagementDialog } from "@/components/logistics/TripManagementDialog";
import { PostLoadDialog } from "@/components/logistics/PostLoadDialog";
import { AdminAnalyticsModal } from "@/components/admin/AdminAnalyticsModal";
import { LoginDialog } from "@/components/auth/LoginDialog";
import { ActiveOrderModel } from "@/lib/api";
import { toast } from "sonner";

const title = "RouteFill AI — 3-Role Return Load & Route Intelligence";
const description =
  "Connects truck owners with return loads and uses past trip data to predict which load and route reduce empty travel and maximize real profit.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AuthProvider>
      <Index />
    </AuthProvider>
  ),
});

function Index() {
  const { user, role } = useAuth();

  // Fleet & Marketplace State
  const [trucks, setTrucks] = useState<TruckModel[]>([]);
  const [selectedTruck, setSelectedTruck] = useState<TruckModel | null>(null);
  const [loads, setLoads] = useState<LoadModel[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [activeLoad, setActiveLoad] = useState<LoadModel | null>(null);
  const [radiusKm, setRadiusKm] = useState<number>(300);

  // Story & Role Simulation State
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // AI & ML Prediction State
  const [deadMileageRisk, setDeadMileageRisk] = useState<DeadMileageRisk | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationModel[]>([]);
  const [filteredLoads, setFilteredLoads] = useState<FilteredLoadModel[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<RouteOptionModel | null>(null);
  const [isGeneratingRecs, setIsGeneratingRecs] = useState<boolean>(false);
  const [selectedFeedbackRec, setSelectedFeedbackRec] = useState<RecommendationModel | null>(null);

  // Dialog & Sidebar State
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [loginOpen, setLoginOpen] = useState<boolean>(false);
  const [createTruckOpen, setCreateTruckOpen] = useState<boolean>(false);
  const [editTruckOpen, setEditTruckOpen] = useState<boolean>(false);
  const [truckToEdit, setTruckToEdit] = useState<TruckModel | null>(null);
  const [postLoadOpen, setPostLoadOpen] = useState<boolean>(false);
  const [tripsOpen, setTripsOpen] = useState<boolean>(false);
  const [adminOpen, setAdminOpen] = useState<boolean>(false);
  const [feedbackOpen, setFeedbackOpen] = useState<boolean>(false);

  // Active Order, Chat & Dismissal State
  const [activeOrder, setActiveOrder] = useState<ActiveOrderModel | null>(null);
  const [chatOpen, setChatOpen] = useState<boolean>(false);
  const [chatLoadId, setChatLoadId] = useState<number | null>(null);
  const [chatReceiverId, setChatReceiverId] = useState<number>(2);
  const [chatPartnerName, setChatPartnerName] = useState<string>('Partner');
  const [chatOrderContext, setChatOrderContext] = useState<any>(null);
  const [dismissedLoadIds, setDismissedLoadIds] = useState<Set<number>>(new Set());

  // Search
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Fetch initial fleet and market data
  const fetchData = useCallback(async () => {
    try {
      const [trucksData, loadsData, locsData] = await Promise.all([
        api.getTrucks().catch(() => []),
        api.getLoads().catch(() => []),
        api.getLocations().catch(() => []),
      ]);

      setTrucks(trucksData);
      setLoads(loadsData);
      setLocations(locsData);

      // Prioritize Shaurya Transport's truck DL01AB1234 if present
      const shauryaTruck = trucksData.find((t) => t.truck_number.toUpperCase().includes('DL01AB1234'));
      if (shauryaTruck) {
        setSelectedTruck(shauryaTruck);
      } else if (trucksData[0]) {
        setSelectedTruck((prev) => prev ?? trucksData[0] ?? null);
      }

      // Prioritize Mumbai -> Jaipur load if present
      const jaipurLoad = loadsData.find((l) => (l.destinationLocation?.city || '').toLowerCase().includes('jaipur'));
      if (jaipurLoad) {
        setActiveLoad(jaipurLoad);
      } else if (loadsData[0]) {
        setActiveLoad((prev) => prev ?? loadsData[0] ?? null);
      }
    } catch (err: any) {
      console.error("Failed to load platform data:", err);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData, user]);

  // Proactively pop up login modal if an API call responds with 401 Unauthorized
  useEffect(() => {
    const handleUnauthorized = () => {
      setLoginOpen(true);
    };
    window.addEventListener('routefill:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('routefill:unauthorized', handleUnauthorized);
    };
  }, []);

  // Evaluate Dead Mileage Risk & AI Recommendations whenever selected truck changes
  useEffect(() => {
    if (!selectedTruck) return;

    let isMounted = true;
    api
      .predictDeadMileage(selectedTruck.id)
      .then((risk) => {
        if (isMounted) {
          setDeadMileageRisk(risk);
        }
      })
      .catch((err) => {
        console.error("Dead mileage prediction failed:", err);
      });

    // Automatically load candidate recommendations, discarded loads, and route options
    api
      .generateRecommendations(selectedTruck.id)
      .then((res) => {
        if (!isMounted) return;
        setRecommendations(res.recommendations || []);
        setFilteredLoads(res.filtered_loads || []);
        if (res.recommendations && res.recommendations[0]) {
          const topRec = res.recommendations[0];
          const recRoute = topRec.route_options?.find((r) => r.ai_recommended) || topRec.route_options?.[0];
          if (recRoute) setSelectedRoute(recRoute);
        }
      })
      .catch((err) => {
        console.error("Auto recommendation failed:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedTruck]);

  // Fetch nearby loads based on truck location and radius
  const handleRefreshNearby = async () => {
    if (!selectedTruck || !selectedTruck.currentLocation) {
      toast.info("Selected truck has no coordinates for geo-search.");
      return;
    }

    try {
      const lat = Number(selectedTruck.currentLocation.latitude);
      const lng = Number(selectedTruck.currentLocation.longitude);
      const nearby = await api.getNearbyLoads(lat, lng, radiusKm);
      setLoads(nearby);
      toast.success(`Found ${nearby.length} loads within ${radiusKm} km of ${selectedTruck.currentLocation.name}`);
    } catch (err: any) {
      toast.error("Failed to fetch nearby loads", { description: err.message });
    }
  };

  // Run AI Recommendation pipeline for current truck
  const handleGenerateRecommendations = async () => {
    if (!selectedTruck) return;
    setIsGeneratingRecs(true);
    try {
      const res = await api.generateRecommendations(selectedTruck.id);
      setRecommendations(res.recommendations);
      setFilteredLoads(res.filtered_loads || []);

      if (res.dead_mileage_risk) {
        setDeadMileageRisk({
          dead_mileage_probability: res.dead_mileage_risk.probability,
          risk_level: res.dead_mileage_risk.level,
          predicted_empty_distance_km: res.dead_mileage_risk.predicted_empty_distance_km,
        });
      }

      const topRec = res.recommendations[0];
      if (topRec) {
        toast.success(`Generated ${res.recommendations.length} Intelligent Return Loads!`, {
          description: `Best Load: ${topRec.load.pickup_location} → ${topRec.load.destination_location} (Expected Net Profit: ₹${Math.round(topRec.predicted_profit).toLocaleString('en-IN')})`,
        });

        // Set active load on the map
        const matched = loads.find((l) => l.id === topRec.load_id);
        if (matched) {
          setActiveLoad(matched);
        }

        // Set recommended route as active on the map
        if (topRec.route_options) {
          const recRoute = topRec.route_options.find((r) => r.ai_recommended) || topRec.route_options[0];
          if (recRoute) setSelectedRoute(recRoute);
        }
      } else {
        toast.info(res.message || "No feasible return loads matching truck capacity or route corridor.");
      }
    } catch (err: any) {
      toast.error("Recommendation pipeline failed", { description: err.message });
    } finally {
      setIsGeneratingRecs(false);
    }
  };

  // 1-Click Interactive Full Flow Simulation
  const handlePlaySimulation = async () => {
    setIsSimulating(true);
    try {
      // Step 1: Truck Owner (Shaurya Transport)
      setActiveStep(1);
      const shaurya = trucks.find((t) => t.truck_number.toUpperCase().includes('DL01AB1234')) || trucks[0];
      if (shaurya) {
        setSelectedTruck(shaurya);
        toast.info('Step 1: Truck Owner', {
          description: 'Shaurya Transport (DL01AB1234, 10T Open Truck) is en route from Delhi to Mumbai, arriving tomorrow at 4 PM.',
        });
      }

      await new Promise((r) => setTimeout(r, 2000));

      // Step 2: Load Poster (Loads waiting in Mumbai)
      setActiveStep(2);
      toast.info('Step 2: Load Poster', {
        description: 'Multiple shippers posted freight loads in Mumbai (Jaipur: ₹25k, Delhi: ₹35k, Pune: ₹18k). RouteFill AI will evaluate them.',
      });

      await new Promise((r) => setTimeout(r, 2000));

      // Step 3: RouteFill AI Decision Engine
      setActiveStep(3);
      if (shaurya) {
        setIsGeneratingRecs(true);
        const res = await api.generateRecommendations(shaurya.id);
        setRecommendations(res.recommendations);
        setFilteredLoads(res.filtered_loads || []);

        if (res.dead_mileage_risk) {
          setDeadMileageRisk({
            dead_mileage_probability: res.dead_mileage_risk.probability,
            risk_level: res.dead_mileage_risk.level,
            predicted_empty_distance_km: res.dead_mileage_risk.predicted_empty_distance_km,
          });
        }

        const top = res.recommendations[0];
        if (top) {
          const matched = loads.find((l) => l.id === top.load_id);
          if (matched) setActiveLoad(matched);

          const recRoute = top.route_options?.find((r) => r.ai_recommended) || top.route_options?.[0];
          if (recRoute) setSelectedRoute(recRoute);

          toast.success('Step 3: RouteFill AI Decision', {
            description: 'Best Load: Mumbai → Jaipur (₹16k net profit). Best Route: Route B (Western Bypass: saves ₹1,000 in tolls and 3.5h traffic!).',
          });
        }
      }
    } catch (err: any) {
      console.error('Simulation error:', err);
    } finally {
      setIsGeneratingRecs(false);
      setIsSimulating(false);
    }
  };

  const handleStepSelect = (step: 1 | 2 | 3) => {
    setActiveStep(step);
    if (step === 1) {
      const shaurya = trucks.find((t) => t.truck_number.toUpperCase().includes('DL01AB1234')) || trucks[0];
      if (shaurya) setSelectedTruck(shaurya);
    } else if (step === 2) {
      setPostLoadOpen(true);
    } else if (step === 3) {
      handleGenerateRecommendations();
    }
  };

  const handleOpenFeedback = (rec: RecommendationModel) => {
    setSelectedFeedbackRec(rec);
    setFeedbackOpen(true);
  };

  const handleTruckCreated = (newTruck: TruckModel) => {
    fetchData();
    setSelectedTruck(newTruck);
  };

  const handleLoadCreated = (newLoad: LoadModel) => {
    setLoads((prev) => [newLoad, ...prev]);
    setActiveLoad(newLoad);
    toast.success("New load posted to marketplace!", {
      description: `${newLoad.weight_tons}T cargo from ${newLoad.pickupLocation?.city || 'Origin'} to ${newLoad.destinationLocation?.city || 'Destination'} (₹${newLoad.offered_price})`,
    });
  };

  const handleOpenEditTruck = (t: TruckModel) => {
    setTruckToEdit(t);
    setEditTruckOpen(true);
  };

  const handleTruckUpdated = (updated: TruckModel) => {
    setTrucks((prev) => prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)));
    if (selectedTruck?.id === updated.id) {
      setSelectedTruck((prev) => (prev ? { ...prev, ...updated } : updated));
    }
  };

  const handleDeleteTruck = async (t: TruckModel) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to remove truck "${t.truck_number}" from your fleet?\n\nThis will remove the vehicle from active operations.`
    );
    if (!confirmDelete) return;

    try {
      await api.deleteTruck(t.id);
      toast.success(`Truck ${t.truck_number} removed from fleet`, {
        description: 'Vehicle decommissioned and removed successfully.',
      });
      setTrucks((prev) => prev.filter((item) => item.id !== t.id));
      if (selectedTruck?.id === t.id) {
        const remaining = trucks.filter((item) => item.id !== t.id);
        setSelectedTruck(remaining[0] ?? null);
      }
    } catch (err: any) {
      toast.error('Failed to remove truck', {
        description: err.message || 'Please check permissions or server status',
      });
    }
  };

  const handleOpenChat = (loadId: number, receiverId?: number, partnerName?: string, context?: any) => {
    setChatLoadId(loadId);
    setChatReceiverId(receiverId || (role === 'FLEET_OWNER' ? 1 : 2));
    setChatPartnerName(partnerName || (role === 'FLEET_OWNER' ? 'Shipper (Priya Sharma)' : 'Carrier (Shaurya Transport)'));
    setChatOrderContext(context || (activeOrder ? {
      pickup_city: activeOrder.pickup_city,
      drop_city: activeOrder.drop_city,
      cargo: activeOrder.cargo,
      agreed_price: activeOrder.agreed_price,
    } : null));
    setChatOpen(true);
  };

  const handleAcceptLoad = async (rec: RecommendationModel) => {
    try {
      const truckId = selectedTruck?.id || 1;
      await api.acceptLoad(rec.load_id, {
        truck_id: truckId,
        recommendation_id: rec.id,
      });

      const pickupCity = rec.load.pickupLocation?.city || rec.load.pickup_location || 'Pickup';
      const dropCity = rec.load.destinationLocation?.city || rec.load.destination_location || 'Destination';
      const posterId = (rec.load as any).poster_id || (rec.load as any).poster?.id || 1;
      const posterName = (rec.load as any).poster?.name || 'Shipper (Priya Sharma)';

      const order: ActiveOrderModel = {
        load_id: rec.load_id,
        truck_id: truckId,
        truck_number: selectedTruck?.truck_number || 'DL01AB1234',
        carrier_id: user?.id || 2,
        carrier_name: user?.name || 'Shaurya Transport',
        poster_id: posterId,
        status: 'ACCEPTED',
        pickup_city: pickupCity,
        drop_city: dropCity,
        cargo: rec.load.cargo_description,
        weight_tons: Number(rec.load.weight_tons),
        agreed_price: Number(rec.load.offered_price),
        predicted_profit: Number(rec.predicted_profit),
        recommendation_id: rec.id,
        accepted_at: new Date().toISOString(),
      };

      setActiveOrder(order);
      setLoads((prev) =>
        prev.map((l) => (l.id === rec.load_id ? { ...l, status: 'ASSIGNED' as any } : l))
      );

      toast.success(`Load Accepted! Order #RF-${rec.load_id} Active`, {
        description: `Shipper notified! Direct dispatch chat is live for ${pickupCity} → ${dropCity}.`,
        action: {
          label: 'Open Chat',
          onClick: () => handleOpenChat(rec.load_id, posterId, posterName, order),
        },
      });
    } catch (err: any) {
      toast.error('Failed to accept load', { description: err.message });
    }
  };

  const handleRejectLoad = (loadId: number) => {
    setDismissedLoadIds((prev) => new Set(prev).add(loadId));
    setRecommendations((prev) => prev.filter((r) => r.load_id !== loadId));
    if (activeLoad?.id === loadId) {
      setActiveLoad(null);
    }
    toast.info('Load Rejected', {
      description: 'Removed from active recommendations and map canvas.',
    });
  };

  const handleUpdateOrderStatus = (nextStatus: 'ACCEPTED' | 'EN_ROUTE_PICKUP' | 'IN_TRANSIT' | 'COMPLETED') => {
    if (activeOrder) {
      setActiveOrder({ ...activeOrder, status: nextStatus });
    }
  };

  const handleCompleteTrip = () => {
    if (activeOrder) {
      setActiveOrder({ ...activeOrder, status: 'COMPLETED' });
      const rec = recommendations.find((r) => r.id === activeOrder.recommendation_id) || recommendations[0];
      if (rec) {
        setSelectedFeedbackRec(rec);
      }
      setFeedbackOpen(true);
    }
  };

  const filteredTrucks = trucks.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.truck_number.toLowerCase().includes(q) ||
      t.currentLocation?.name.toLowerCase().includes(q) ||
      t.truckType?.name.toLowerCase().includes(q)
    );
  });

  // Role-based visibility scoping:
  // - ADMIN: Sees ALL trucks and ALL loads across India
  // - FLEET_OWNER: Sees ALL trucks owned by them (and NO trucks owned by other fleet owners)
  // - SHIPPER: Sees nearest/available trucks on the map to haul freight, plus posted loads
  const roleTrucks = filteredTrucks.filter((t) => {
    if (role === 'ADMIN') return true;
    if (role === 'FLEET_OWNER') {
      // Show ALL trucks owned by the logged-in user, and NO trucks owned by other owners
      const currentOwnerId = user?.id || 2; // Defaults to primary demo fleet owner (Shaurya Transport) if guest
      return t.owner?.id === currentOwnerId || (t as any).owner_id === currentOwnerId;
    }
    if (role === 'SHIPPER') {
      // Shipper can see nearest available trucks on the map for booking
      return t.status === 'AVAILABLE' || t.status === 'IN_TRANSIT';
    }
    return true;
  });

  const roleLoads = loads.filter((l) => {
    if (dismissedLoadIds.has(l.id)) return false;
    if (role === 'ADMIN') return true;
    if (role === 'FLEET_OWNER') {
      if (l.status !== 'AVAILABLE') return false;
      // Filter to nearest return loads around truck's destination/current hub
      if (selectedTruck?.currentLocation && l.pickupLocation) {
        const tLat = Number(selectedTruck.currentLocation.latitude);
        const tLng = Number(selectedTruck.currentLocation.longitude);
        const lLat = Number(l.pickupLocation.latitude);
        const lLng = Number(l.pickupLocation.longitude);
        if (!isNaN(tLat) && !isNaN(tLng) && !isNaN(lLat) && !isNaN(lLng)) {
          const dLat = (lLat - tLat) * 111;
          const dLng = (lLng - tLng) * 111 * Math.cos((tLat * Math.PI) / 180);
          const dist = Math.sqrt(dLat * dLat + dLng * dLng);
          return dist <= 600; // Nearest return loads within 600km
        }
      }
      return true;
    }
    return true;
  });

  const panel = (
    <RightPanel
      userRole={role}
      truck={selectedTruck}
      availableTrucks={roleTrucks}
      onSelectTruck={setSelectedTruck}
      onEditTruck={handleOpenEditTruck}
      onDeleteTruck={handleDeleteTruck}
      onOpenPostLoad={() => setPostLoadOpen(true)}
      onAcceptLoad={handleAcceptLoad}
      onRejectLoad={handleRejectLoad}
      activeOrder={activeOrder}
      onUpdateOrderStatus={handleUpdateOrderStatus}
      onOpenChat={() => {
        if (activeOrder) {
          handleOpenChat(activeOrder.load_id, activeOrder.poster_id, 'Shipper (Priya Sharma)', activeOrder);
        }
      }}
      onCompleteTrip={handleCompleteTrip}
      deadMileageRisk={deadMileageRisk}
      recommendations={recommendations}
      filteredLoads={filteredLoads}
      isGeneratingRecs={isGeneratingRecs}
      onGenerateRecs={handleGenerateRecommendations}
      onOpenFeedback={handleOpenFeedback}
      loads={roleLoads}
      activeLoadId={activeLoad ? activeLoad.id : null}
      onSelectLoad={setActiveLoad}
      radiusKm={radiusKm}
      onRadiusChange={setRadiusKm}
      onRefreshNearby={handleRefreshNearby}
      selectedRouteId={selectedRoute?.route_id}
      onSelectRoute={setSelectedRoute}
    />
  );

  return (
    <main className="relative h-screen w-full overflow-hidden bg-background">
      <div className="relative h-full w-full lg:grid lg:grid-cols-[minmax(0,1fr)_40%] xl:grid-cols-[minmax(0,1fr)_34%]">
        {/* Interactive Map Canvas */}
        <div className="relative h-full w-full overflow-hidden">
          <MapCanvas
            selectedTruck={selectedTruck}
            onSelectTruck={setSelectedTruck}
            trucks={roleTrucks}
            activeLoad={activeLoad}
            onSelectLoad={setActiveLoad}
            loads={roleLoads}
            locations={locations}
            activeRoute={selectedRoute}
            allRoutes={recommendations[0]?.route_options || []}
            onSelectRoute={setSelectedRoute}
            userRole={role}
          />

          <TopNavigation
            onOpenSidebar={() => setSidebarOpen(true)}
            onOpenLogin={() => setLoginOpen(true)}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onOpenAddTruck={() => setCreateTruckOpen(true)}
            onOpenPostLoad={() => setPostLoadOpen(true)}
            onOpenChat={(loadId, receiverId, partnerName) => handleOpenChat(loadId, receiverId, partnerName)}
            onOpenOrder={(loadId) => {
              if (activeOrder?.load_id === loadId) {
                toast.info(`Order #RF-${loadId} is currently active in the console`);
              }
            }}
          />

          {/* Interactive 3-Role Story Flow Banner - ONLY visible to ADMIN */}
          {role === 'ADMIN' && (
            <StoryFlowBanner
              activeStep={activeStep}
              onSelectStep={handleStepSelect}
              onPlaySimulation={handlePlaySimulation}
              isSimulating={isSimulating}
            />
          )}

          {/* Telemetry pill - neatly stacked above map legend */}
          <div className="pointer-events-none absolute bottom-18 left-6 z-20 hidden items-center gap-2 rounded-2xl border border-card/60 bg-card/85 px-3.5 py-1.5 text-[10px] uppercase tracking-[0.16em] text-muted-foreground shadow-lg backdrop-blur-xl sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {role === 'ADMIN' ? (
              <span>{trucks.length} trucks registered · {loads.length} marketplace loads (Admin)</span>
            ) : role === 'FLEET_OWNER' ? (
              <span>{roleTrucks.length} {roleTrucks.length === 1 ? 'assigned truck' : 'active trucks'} · {roleLoads.length} return loads nearby</span>
            ) : (
              <span>{roleTrucks.length} carriers nearby · {roleLoads.length} freight shipments</span>
            )}
          </div>
        </div>

        {/* Desktop Sidebar Panel */}
        <aside className="relative z-30 hidden h-full min-h-0 overflow-hidden rounded-l-[2.5rem] border-l border-border bg-background shadow-[-12px_0_40px_-20px_rgba(0,0,0,0.35)] lg:block">
          {panel}
        </aside>
      </div>

      {/* Mobile Bottom Sheet */}
      <div className="absolute inset-x-0 bottom-0 z-40 h-[64vh] rounded-t-[2.5rem] border-t border-border bg-background shadow-[0_-12px_40px_-20px_rgba(0,0,0,0.45)] lg:hidden">
        <div className="flex h-full flex-col">
          <div className="flex shrink-0 cursor-grab justify-center py-2.5 active:cursor-grabbing">
            <span className="h-1.5 w-12 rounded-full bg-border" />
          </div>
          <div className="min-h-0 flex-1">{panel}</div>
        </div>
      </div>

      {/* Action Dialogs */}
      <CreateTruckDialog
        open={createTruckOpen}
        onOpenChange={setCreateTruckOpen}
        onCreated={handleTruckCreated}
        onRequireLogin={() => setLoginOpen(true)}
      />

      <EditTruckDialog
        open={editTruckOpen}
        onOpenChange={setEditTruckOpen}
        truck={truckToEdit}
        onUpdated={handleTruckUpdated}
      />

      <OrderChatDialog
        open={chatOpen}
        onOpenChange={setChatOpen}
        loadId={chatLoadId}
        receiverId={chatReceiverId}
        partnerName={chatPartnerName}
        orderContext={chatOrderContext}
      />

      <TripManagementDialog
        open={tripsOpen}
        onOpenChange={setTripsOpen}
        trucks={trucks}
        onTripCompleted={(analysis) => {
          setDeadMileageRisk(analysis);
          fetchData();
        }}
      />

      <PostLoadDialog
        open={postLoadOpen}
        onOpenChange={setPostLoadOpen}
        onLoadCreated={handleLoadCreated}
        onRequireLogin={() => setLoginOpen(true)}
      />

      <OutcomeDialog
        open={feedbackOpen}
        onOpenChange={setFeedbackOpen}
        recommendation={selectedFeedbackRec}
        onSuccess={() => {
          handleGenerateRecommendations();
        }}
      />

      <AdminAnalyticsModal
        open={adminOpen}
        onOpenChange={setAdminOpen}
      />

      {/* Left Hidden Operations Sidebar */}
      <LeftSidebar
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
        onOpenLogin={() => setLoginOpen(true)}
        onOpenAddTruck={() => setCreateTruckOpen(true)}
        onOpenTrips={() => setTripsOpen(true)}
        onOpenPostLoad={() => setPostLoadOpen(true)}
        onOpenAdmin={() => setAdminOpen(true)}
        trucksCount={roleTrucks.length}
        loadsCount={roleLoads.length}
      />

      {/* Authentication Login / Register Modal */}
      <LoginDialog
        open={loginOpen}
        onOpenChange={setLoginOpen}
        onSuccess={() => fetchData()}
      />
    </main>
  );
}
