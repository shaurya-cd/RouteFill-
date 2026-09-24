import React, { useState } from "react";
import { useAuth } from "@/lib/authContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  Shield,
  Truck,
  Package,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const LoginDialog: React.FC<LoginDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { login, register, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("login");

  // Login form state
  const [loginEmail, setLoginEmail] = useState<string>("owner@fleet.in");
  const [loginPassword, setLoginPassword] = useState<string>("password123");
  const [showLoginPassword, setShowLoginPassword] = useState<boolean>(false);

  // Register form state
  const [regName, setRegName] = useState<string>("");
  const [regEmail, setRegEmail] = useState<string>("");
  const [regPhone, setRegPhone] = useState<string>("");
  const [regPassword, setRegPassword] = useState<string>("");
  const [regRole, setRegRole] = useState<"TRUCK_OWNER" | "ADMIN" | "LOAD_POSTER">("TRUCK_OWNER");
  const [showRegPassword, setShowRegPassword] = useState<boolean>(false);

  // Error state
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDemoSelect = (role: "owner" | "admin" | "shipper") => {
    setErrorMessage(null);
    if (role === "owner") {
      setLoginEmail("owner@fleet.in");
      setLoginPassword("password123");
    } else if (role === "shipper") {
      setLoginEmail("shipper@cargo.in");
      setLoginPassword("password123");
    } else {
      setLoginEmail("admin@routefill.ai");
      setLoginPassword("password123");
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    try {
      const user = await login(loginEmail.trim(), loginPassword);
      toast.success(`Welcome back, ${user.name}!`, {
        description: `Signed in as ${user.role || 'FLEET_OWNER'}.`,
      });
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      const msg = err.message || "Invalid credentials. Please check your email and password.";
      setErrorMessage(msg);
      toast.error("Sign in failed", { description: msg });
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!regName.trim() || !regEmail.trim() || !regPhone.trim() || !regPassword.trim()) {
      setErrorMessage("All registration fields are required.");
      return;
    }

    try {
      const user = await register({
        name: regName.trim(),
        email: regEmail.trim(),
        phone: regPhone.trim(),
        password: regPassword,
        role: regRole,
      });
      toast.success("Account created successfully!", {
        description: `Welcome to RouteFill AI, ${user.name}!`,
      });
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      const msg = err.message || "Failed to create account. Please try again.";
      setErrorMessage(msg);
      toast.error("Registration failed", { description: msg });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-border/80 bg-card/95 backdrop-blur-2xl shadow-2xl">
        {/* Modal Banner */}
        <div className="bg-gradient-to-r from-primary/15 via-primary/10 to-transparent p-6 pb-4 border-b border-border/60">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
              <Truck className="h-5 w-5" />
            </span>
            <div>
              <DialogTitle className="font-display text-lg font-bold tracking-tight">
                RouteFill AI Platform
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Indian freight intelligence & return load optimization
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="p-6 pt-4 space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-xl p-1 bg-muted/50">
              <TabsTrigger value="login" className="rounded-lg text-xs font-semibold">
                Sign In
              </TabsTrigger>
              <TabsTrigger value="register" className="rounded-lg text-xs font-semibold">
                Create Account
              </TabsTrigger>
            </TabsList>

            {/* Error banner */}
            {errorMessage && (
              <div className="mt-3 rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-2 text-xs text-destructive flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-destructive shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Sign In Tab */}
            <TabsContent value="login" className="space-y-4 pt-3">
              {/* Demo Account Quick Pick */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="font-medium flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-amber-500" />
                    Quick Demo Credentials
                  </span>
                  <span>Click to autofill</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleDemoSelect("owner")}
                    className={`text-left p-2 rounded-xl border transition-all cursor-pointer ${
                      loginEmail === "owner@fleet.in"
                        ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary/40"
                        : "border-border/70 bg-muted/20 hover:bg-muted/40 text-muted-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <Truck className="h-3.5 w-3.5 text-primary shrink-0" />
                      <p className="text-xs font-bold text-foreground truncate">Fleet Owner</p>
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate mt-0.5">owner@fleet.in</p>
                    <p className="text-[9px] text-primary/80 font-medium truncate mt-0.5">Own truck & loads</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDemoSelect("shipper")}
                    className={`text-left p-2 rounded-xl border transition-all cursor-pointer ${
                      loginEmail === "shipper@cargo.in"
                        ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary/40"
                        : "border-border/70 bg-muted/20 hover:bg-muted/40 text-muted-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <Package className="h-3.5 w-3.5 text-primary shrink-0" />
                      <p className="text-xs font-bold text-foreground truncate">Shipper</p>
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate mt-0.5">shipper@cargo.in</p>
                    <p className="text-[9px] text-emerald-400 font-medium truncate mt-0.5">Find nearest trucks</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDemoSelect("admin")}
                    className={`text-left p-2 rounded-xl border transition-all cursor-pointer ${
                      loginEmail === "admin@routefill.ai"
                        ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary/40"
                        : "border-border/70 bg-muted/20 hover:bg-muted/40 text-muted-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <Shield className="h-3.5 w-3.5 text-primary shrink-0" />
                      <p className="text-xs font-bold text-foreground truncate">Admin</p>
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate mt-0.5">admin@routefill.ai</p>
                    <p className="text-[9px] text-indigo-400 font-medium truncate mt-0.5">All trucks & loads</p>
                  </button>
                </div>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-3 pt-1">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="pl-9 h-10 text-xs rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type={showLoginPassword ? "text" : "password"}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-9 pr-9 h-10 text-xs rounded-xl"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-10 rounded-xl text-xs font-bold shadow-md cursor-pointer mt-2 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                      Authenticating...
                    </span>
                  ) : (
                    <>
                      Sign In to Console
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* Create Account Tab */}
            <TabsContent value="register" className="space-y-3 pt-2">
              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Full Name</Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Ramesh Yadav"
                      className="pl-9 h-9 text-xs rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="owner@fleet.in"
                        className="pl-8.5 h-9 text-xs rounded-xl"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        type="tel"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="+919876543210"
                        className="pl-8.5 h-9 text-xs rounded-xl"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type={showRegPassword ? "text" : "password"}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="pl-9 pr-9 h-9 text-xs rounded-xl"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {showRegPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium">Role on Platform</Label>
                  <div className="grid grid-cols-3 gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => setRegRole("TRUCK_OWNER")}
                      className={`text-left p-2 rounded-xl border text-xs cursor-pointer transition-colors ${
                        regRole === "TRUCK_OWNER"
                          ? "border-primary bg-primary/10 text-primary font-bold ring-1 ring-primary/30"
                          : "border-border/70 bg-muted/20 text-muted-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <Truck className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">Fleet Owner</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRegRole("LOAD_POSTER")}
                      className={`text-left p-2 rounded-xl border text-xs cursor-pointer transition-colors ${
                        regRole === "LOAD_POSTER"
                          ? "border-primary bg-primary/10 text-primary font-bold ring-1 ring-primary/30"
                          : "border-border/70 bg-muted/20 text-muted-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <Package className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">Shipper</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRegRole("ADMIN")}
                      className={`text-left p-2 rounded-xl border text-xs cursor-pointer transition-colors ${
                        regRole === "ADMIN"
                          ? "border-primary bg-primary/10 text-primary font-bold ring-1 ring-primary/30"
                          : "border-border/70 bg-muted/20 text-muted-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <Shield className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">Admin</span>
                      </div>
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-10 rounded-xl text-xs font-bold shadow-md cursor-pointer mt-2"
                >
                  {isLoading ? "Creating Account..." : "Create Account & Sign In"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
