import React from "react";
import { useAuth } from "@/lib/authContext";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { RouteFillLogo } from "@/components/common/RouteFillLogo";
import {
  Truck,
  Plus,
  Route,
  Cpu,
  Shield,
  Sparkles,
  ChevronRight,
  Database,
  Package,
  LogIn,
  LogOut,
  Clock,
} from "lucide-react";

interface LeftSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenLogin: () => void;
  onOpenAddTruck: () => void;
  onOpenTrips: () => void;
  onOpenPostLoad: () => void;
  onOpenAdmin: () => void;
  trucksCount: number;
  loadsCount: number;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  open,
  onOpenChange,
  onOpenLogin,
  onOpenAddTruck,
  onOpenTrips,
  onOpenPostLoad,
  onOpenAdmin,
  trucksCount,
  loadsCount,
}) => {
  const { user, role, logout, isLoading, isAuthenticated } = useAuth();

  const handleAction = (callback: () => void) => {
    onOpenChange(false);
    callback();
  };

  const handleLogout = async () => {
    onOpenChange(false);
    try {
      await logout();
      toast.success("Logged out successfully");
    } catch (err: any) {
      toast.error("Logout failed", { description: err.message });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="w-[320px] sm:w-[380px] p-0 flex flex-col bg-card/95 backdrop-blur-2xl border-r border-border/80 shadow-2xl z-50 overflow-hidden"
      >
        {/* Header */}
        <SheetHeader className="p-5 pb-4 border-b border-border/60 bg-muted/20 text-left">
          <div className="flex items-center gap-3">
            <RouteFillLogo size="md" showText={false} />
            <div className="min-w-0 flex-1">
              <SheetTitle className="font-display text-base font-bold tracking-tight flex items-center gap-2">
                Route<span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Fill</span>
                {/* <Badge variant="secondary" className="text-[10px] font-mono font-medium px-1.5 py-0 h-4 bg-primary/10 text-primary border-primary/30">
                  AI v1.0
                </Badge> */}
              </SheetTitle>
              {/* <SheetDescription className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                Live 3NF PostgreSQL + FastAPI ML
              </SheetDescription> */}
            </div>
          </div>
        </SheetHeader>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Operations & Management Section */}
          <div className="space-y-3">
            {/* LOAD POSTER PERSONA */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-400 flex items-center gap-1.5">
                  <Package className="h-3 w-3 text-emerald-400" />
                  Load Poster
                </p>
                <span className="text-[9px] font-mono text-muted-foreground/80">Shipper / Broker</span>
              </div>

              {/* Post Return Load Button */}
              <button
                type="button"
                onClick={() => handleAction(onOpenPostLoad)}
                className="w-full group text-left flex items-center justify-between p-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/15 hover:border-emerald-500/50 transition-all duration-200 cursor-pointer shadow-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-500 text-white shadow-sm group-hover:scale-105 transition-transform">
                    <Package className="h-4.5 w-4.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground group-hover:text-emerald-400 transition-colors">
                      Post Freight Load
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      Publish cargo with map coordinates
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>

            {/* TRUCK OWNER PERSONA */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between px-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary flex items-center gap-1.5">
                  <Truck className="h-3 w-3 text-primary" />
                  Truck Owner
                </p>
                <span className="text-[9px] font-mono text-muted-foreground/80">Carrier / Fleet</span>
              </div>

              <div className="space-y-2">
                {/* Add Truck Button */}
                <button
                  type="button"
                  onClick={() => handleAction(onOpenAddTruck)}
                  className="w-full group text-left flex items-center justify-between p-3 rounded-2xl border border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/40 transition-all duration-200 cursor-pointer shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm group-hover:scale-105 transition-transform">
                      <Plus className="h-4.5 w-4.5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                        Register Truck
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        Vehicle & verified base station
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </button>

                {/* Trip Management Button */}
                <button
                  type="button"
                  onClick={() => handleAction(onOpenTrips)}
                  className="w-full group text-left flex items-center justify-between p-3 rounded-2xl border border-border/70 bg-card hover:bg-muted/50 hover:border-border transition-all duration-200 cursor-pointer shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground group-hover:scale-105 transition-transform">
                      <Route className="h-4.5 w-4.5 text-primary" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                        Trip Management
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        Schedule trips & predict empty miles
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </button>
              </div>
            </div>

            {/* PLATFORM AI / ADMIN */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between px-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground flex items-center gap-1.5">
                  <Cpu className="h-3 w-3 text-amber-500" />
                  System Intelligence
                </p>
                <span className="text-[9px] font-mono text-muted-foreground/80">ML & Admin</span>
              </div>

              {/* Admin AI Console Button */}
              <button
                type="button"
                onClick={() => handleAction(onOpenAdmin)}
                className="w-full group text-left flex items-center justify-between p-3 rounded-2xl border border-border/70 bg-card hover:bg-muted/50 hover:border-border transition-all duration-200 cursor-pointer shadow-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground group-hover:scale-105 transition-transform">
                    <Cpu className="h-4.5 w-4.5 text-primary" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                        Admin AI Console
                      </p>
                      <Sparkles className="h-3 w-3 text-amber-500" />
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">
                      Model weights, retrain & telemetry
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>
          </div>

          {/* Live Fleet Telemetry Stats */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground px-1">
              Live Network Metrics
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-2xl border border-border/70 bg-muted/20 p-3">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Truck className="h-3.5 w-3.5 text-primary" />
                  <span className="text-[10px] font-medium uppercase tracking-wider">Fleet</span>
                </div>
                <p className="text-lg font-bold font-display">{trucksCount}</p>
                <p className="text-[10px] text-muted-foreground">Active Trucks</p>
              </div>

              <div className="rounded-2xl border border-border/70 bg-muted/20 p-3">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Package className="h-3.5 w-3.5 text-primary" />
                  <span className="text-[10px] font-medium uppercase tracking-wider">Market</span>
                </div>
                <p className="text-lg font-bold font-display">{loadsCount}</p>
                <p className="text-[10px] text-muted-foreground">Available Loads</p>
              </div>
            </div>
          </div>

          {/* Architecture Details */}
          {/* <div className="rounded-2xl border border-border/60 bg-muted/10 p-3.5 space-y-2 text-xs">
            <p className="font-semibold text-foreground text-[11px] flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5 text-primary" />
              System Architecture
            </p>
            <div className="space-y-1 text-[11px] text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Database</span>
                <span className="font-mono text-[10px] text-foreground font-medium">PostgreSQL (3NF)</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Inference Engine</span>
                <span className="font-mono text-[10px] text-foreground font-medium">FastAPI Python ML</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Scoring Pipeline</span>
                <span className="font-mono text-[10px] text-success font-medium flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-success inline-block" /> Calibrated
                </span>
              </div>
            </div>
          </div> */}
        </div>

        {/* Footer: User Account & Role Switch / Login Options */}
        <div className="p-4 border-t border-border/60 bg-muted/20 space-y-3">
          {isAuthenticated && user ? (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary font-display text-xs font-bold text-primary-foreground">
                    {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate leading-tight">
                      {user.name}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-mono">
                        {role}
                      </Badge>
                      {user.last_login_at && (
                        <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                          <Clock className="h-2.5 w-2.5" />
                          {new Date(user.last_login_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Log Out Button */}
              <Button
                onClick={handleLogout}
                disabled={isLoading}
                variant="ghost"
                size="sm"
                className="w-full text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out of Platform
              </Button>
            </>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground text-center">
                Sign in to manage vehicles, simulate routes, and access AI telemetry.
              </p>
              <Button
                onClick={() => {
                  onOpenChange(false);
                  onOpenLogin();
                }}
                className="w-full text-xs font-bold h-9 rounded-xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogIn className="h-3.5 w-3.5" />
                Sign In / Register
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
