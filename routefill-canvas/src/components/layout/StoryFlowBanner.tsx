import React from 'react';
import { Truck, Package, BrainCircuit, Play, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  activeStep: 1 | 2 | 3;
  onSelectStep: (step: 1 | 2 | 3) => void;
  onPlaySimulation: () => void;
  isSimulating: boolean;
}

export const StoryFlowBanner: React.FC<Props> = ({
  activeStep,
  onSelectStep,
  onPlaySimulation,
  isSimulating,
}) => {
  return (
    <div className="pointer-events-auto absolute inset-x-2 top-14 sm:top-16 z-20 flex justify-center px-1 sm:px-2">
      <div className="flex w-auto max-w-full items-center justify-between gap-1.5 sm:gap-2 rounded-2xl border border-card/60 bg-card/85 p-1 sm:p-1.5 shadow-2xl backdrop-blur-xl transition-all overflow-x-auto no-scrollbar">
        {/* Step Indicators */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Step 1: Truck Owner */}
          <button
            type="button"
            onClick={() => onSelectStep(1)}
            className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer shrink-0 ${
              activeStep === 1
                ? 'bg-primary text-primary-foreground shadow-md scale-[1.02]'
                : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
            }`}
            title="Shaurya Transport has a 10T truck going from Delhi to Mumbai"
          >
            <span className="grid h-4.5 w-4.5 place-items-center rounded-md bg-background/20 text-[10px] font-bold">
              1
            </span>
            <Truck className="h-3.5 w-3.5" />
            <span className="hidden 2xl:inline text-muted-foreground/80">Owner:</span>
            <span className="font-mono font-bold">Shaurya Transport</span>
          </button>

          <span className="text-muted-foreground/40 text-[10px] hidden xl:inline">→</span>

          {/* Step 2: Load Poster */}
          <button
            type="button"
            onClick={() => onSelectStep(2)}
            className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer shrink-0 ${
              activeStep === 2
                ? 'bg-primary text-primary-foreground shadow-md scale-[1.02]'
                : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
            }`}
            title="Shippers post loads waiting in Mumbai (Jaipur, Delhi, Pune)"
          >
            <span className="grid h-4.5 w-4.5 place-items-center rounded-md bg-background/20 text-[10px] font-bold">
              2
            </span>
            <Package className="h-3.5 w-3.5" />
            <span className="hidden 2xl:inline text-muted-foreground/80">Shipper:</span>
            <span>Available Loads</span>
          </button>

          <span className="text-muted-foreground/40 text-[10px] hidden xl:inline">→</span>

          {/* Step 3: RouteFill AI */}
          <button
            type="button"
            onClick={() => onSelectStep(3)}
            className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer shrink-0 ${
              activeStep === 3
                ? 'bg-primary text-primary-foreground shadow-md scale-[1.02]'
                : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
            }`}
            title="AI evaluates 6 checks, historical trips, Best Load & Best Route"
          >
            <span className="grid h-4.5 w-4.5 place-items-center rounded-md bg-background/20 text-[10px] font-bold">
              3
            </span>
            <BrainCircuit className="h-3.5 w-3.5 text-emerald-400" />
            <span className="hidden 2xl:inline text-muted-foreground/80">AI:</span>
            <span className="text-emerald-300 font-bold">Best Load & Route</span>
          </button>
        </div>

        {/* 1-Click Simulation Trigger */}
        <Button
          size="sm"
          onClick={onPlaySimulation}
          disabled={isSimulating}
          className="h-7 rounded-xl bg-gradient-to-r from-emerald-500 to-primary px-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 hover:opacity-95 cursor-pointer ml-1.5 shrink-0 flex items-center gap-1"
        >
          {isSimulating ? (
            <>
              <Sparkles className="h-3 w-3 animate-spin" />
              <span>Simulating...</span>
            </>
          ) : (
            <>
              <Play className="h-2.5 w-2.5 fill-current" />
              <span>Play Full Flow</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
