import { Truck, Shield, Menu, Search, LogIn, LogOut, Package, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/lib/authContext';
import { NotificationDropdown } from './NotificationDropdown';

interface Props {
  onOpenSidebar: () => void;
  onOpenLogin: () => void;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  onOpenAddTruck?: (() => void) | undefined;
  onOpenPostLoad?: (() => void) | undefined;
  onOpenTrips?: (() => void) | undefined;
  onOpenAdmin?: (() => void) | undefined;
  onOpenChat?: ((loadId: number, receiverId: number, partnerName: string) => void) | undefined;
  onOpenOrder?: ((loadId: number) => void) | undefined;
}

export const TopNavigation: React.FC<Props> = ({
  onOpenSidebar,
  onOpenLogin,
  searchQuery,
  onSearchChange,
  onOpenAddTruck,
  onOpenPostLoad,
  onOpenChat,
  onOpenOrder,
}) => {
  const { user, role, logout, isAuthenticated } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully', {
        description: 'You are now browsing in guest mode.',
      });
    } catch (err: any) {
      toast.error('Logout failed', { description: err.message });
    }
  };

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-between gap-2 p-3 sm:p-4 max-w-full">
      {/* Brand & Left Hidden Sidebar Trigger */}
      <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2.5 min-w-0">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="flex shrink-0 items-center gap-2.5 rounded-2xl border border-card/60 bg-card/85 px-3 py-1.5 shadow-xl backdrop-blur-xl hover:bg-card hover:border-primary/40 hover:shadow-2xl transition-all duration-200 cursor-pointer group"
          title="Open Fleet Operations & Menu"
        >
          <div className="relative">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-md group-hover:scale-105 transition-transform">
              <Truck className="h-4 w-4" />
            </span>
            <span className="absolute -bottom-1 -right-1 grid h-3.5 w-3.5 place-items-center rounded-full bg-background border border-border text-foreground shadow-sm">
              <Menu className="h-2 w-2 text-primary" />
            </span>
          </div>
          <div className="text-left hidden sm:block">
            <div className="flex items-center gap-1.5">
              <p className="font-display text-xs sm:text-sm font-bold tracking-tight group-hover:text-primary transition-colors">
                RouteFill AI
              </p>
              <span className="rounded-md bg-primary/15 text-primary px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider">
                Menu
              </span>
            </div>
          </div>
        </button>

        {/* Search Bar */}
        <div className="flex items-center gap-1.5 rounded-2xl border border-card/60 bg-card/85 px-3 py-2 shadow-xl backdrop-blur-xl min-w-0">
          <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search trucks, routes..."
            className="w-24 sm:w-32 md:w-40 lg:w-28 xl:w-44 focus:w-36 sm:focus:w-44 md:focus:w-52 lg:focus:w-40 xl:focus:w-56 transition-all bg-transparent text-xs outline-none placeholder:text-muted-foreground text-foreground"
          />
        </div>

        {/* Quick Action Buttons for Load Poster & Truck Owner */}
        {onOpenPostLoad && (
          <button
            type="button"
            onClick={onOpenPostLoad}
            className="hidden md:flex items-center gap-1.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/15 hover:bg-emerald-500/25 px-2.5 py-2 text-xs font-bold text-emerald-400 shadow-xl backdrop-blur-xl transition-all duration-200 cursor-pointer shrink-0"
            title="Post a new Freight Load (Load Poster)"
          >
            <Package className="h-3.5 w-3.5" />
            <span className="hidden xl:inline">Post Load</span>
          </button>
        )}

        {onOpenAddTruck && (
          <button
            type="button"
            onClick={onOpenAddTruck}
            className="hidden md:flex items-center gap-1.5 rounded-2xl border border-primary/30 bg-primary/15 hover:bg-primary/25 px-2.5 py-2 text-xs font-bold text-primary shadow-xl backdrop-blur-xl transition-all duration-200 cursor-pointer shrink-0"
            title="Register a new Truck (Truck Owner)"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden xl:inline">Add Truck</span>
          </button>
        )}
      </div>

      {/* Right User & Role Indicator OR Login Option */}
      <div className="pointer-events-auto flex items-center gap-1.5 shrink-0 ml-auto">
        <NotificationDropdown onOpenChat={onOpenChat} onOpenOrder={onOpenOrder} />

        {isAuthenticated && user ? (
          <div className="flex items-center gap-2 rounded-2xl border border-card/60 bg-card/85 p-1 pl-2.5 sm:pl-3 shadow-xl backdrop-blur-xl">
            <div className="text-right hidden sm:block leading-tight">
              <p className="text-xs font-semibold truncate max-w-[90px] xl:max-w-[120px]">
                {user.name}
              </p>
              <div className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                <Shield className="h-2.5 w-2.5 text-primary" />
                <span className="font-mono text-primary font-semibold text-[10px]">
                  {role === 'ADMIN' ? 'Admin' : role === 'SHIPPER' ? 'Shipper' : 'Fleet Owner'}
                </span>
              </div>
            </div>

            <span className="grid h-7 w-7 sm:h-8 sm:w-8 place-items-center rounded-xl bg-primary font-display text-xs font-bold text-primary-foreground shadow-sm">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </span>

            <button
              type="button"
              onClick={handleLogout}
              className="grid h-6 w-6 sm:h-7 sm:w-7 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/15 hover:text-destructive transition-colors cursor-pointer"
              title="Log out"
            >
              <LogOut className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </button>
          </div>
        ) : (
          <Button
            onClick={onOpenLogin}
            size="sm"
            className="rounded-2xl border border-primary/30 bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground shadow-xl backdrop-blur-xl hover:bg-primary/90 flex items-center gap-1.5 cursor-pointer"
          >
            <LogIn className="h-3.5 w-3.5" />
            <span>Sign In</span>
          </Button>
        )}
      </div>
    </header>
  );
};
