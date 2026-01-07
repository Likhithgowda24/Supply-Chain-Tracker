import { MapPin, Package, Truck, CheckCircle, Copy, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface TrackingEvent {
  id: string;
  status: string;
  location: string;
  timestamp: string;
  txHash?: string;
  metadata?: string;
  isActive?: boolean;
}

interface TrackingTimelineProps {
  events: TrackingEvent[];
}

const statusIcons = {
  ordered: Package,
  "in-transit": Truck,
  shipped: Truck,
  delivered: CheckCircle,
  default: MapPin,
};

const routeStages = ["ordered", "in-transit", "shipped", "delivered"];
const stageLabels = {
  ordered: "Order Placed",
  "in-transit": "In Transit",
  shipped: "Shipped",
  delivered: "Delivered",
};

export function TrackingTimeline({ events }: TrackingTimelineProps) {
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Transaction hash copied to clipboard",
    });
  };

  // Determine current stage index based on active event only
  const currentStageIndex = (() => {
    // First priority: check for explicit isActive marker
    const activeEvent = events.find(e => e.isActive);
    if (activeEvent) {
      const index = routeStages.findIndex(stage =>
        activeEvent.status.toLowerCase() === stage.toLowerCase()
      );
      if (index >= 0) return index;
    }

    // Second priority: find the last event's stage
    if (events.length > 0) {
      const lastEvent = events[events.length - 1];
      const index = routeStages.findIndex(stage =>
        lastEvent.status.toLowerCase() === stage.toLowerCase()
      );
      return index >= 0 ? index : 0;
    }

    return 0;
  })();

  return (
    <div className="space-y-8" data-testid="timeline-tracking">
      {/* Route Map */}
      <div className="bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-accent/10 dark:from-blue-950/20 dark:via-purple-950/10 dark:to-accent/10 rounded-xl p-12 border border-primary/10 relative overflow-hidden">
        {/* Background map pattern */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.3) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }} />
        </div>

        <div className="relative z-10">
          <h3 className="text-xs font-bold mb-8 text-muted-foreground tracking-widest">📍 DELIVERY ROUTE</h3>

          {/* SVG Path for curved route */}
          <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ height: "200px" }}>
            {/* Curved paths between stages */}
            {routeStages.map((stage, index) => {
              if (index === routeStages.length - 1) return null;

              const isCompleted = index < currentStageIndex;
              const isActive = index === currentStageIndex;
              const startX = (index * 25) + 12.5;
              const endX = ((index + 1) * 25) + 12.5;

              return (
                <path
                  key={`path-${index}`}
                  d={`M ${startX}% 50 Q ${(startX + endX) / 2}% 20, ${endX}% 50`}
                  stroke={isCompleted ? "#22c55e" : isActive ? "url(#routeGradient)" : "#d1d5db"}
                  strokeWidth={isCompleted || isActive ? 3 : 2}
                  fill="none"
                  strokeLinecap="round"
                  className={isCompleted || isActive ? "transition-all duration-300" : ""}
                />
              );
            })}

            {/* Gradient for active path */}
            <defs>
              <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="currentColor" className="text-primary" />
                <stop offset="100%" stopColor="currentColor" className="text-accent" />
              </linearGradient>
            </defs>
          </svg>

          {/* Stage Markers */}
          <div className="flex items-center justify-between gap-2 relative z-20" style={{ paddingTop: "40px" }}>
            {routeStages.map((stage, index) => {
              const Icon = statusIcons[stage as keyof typeof statusIcons] || statusIcons.default;
              const isCompleted = index < currentStageIndex;
              const isCurrentStage = index === currentStageIndex;
              const isActive = index <= currentStageIndex;

              // Special case: If the current stage is "delivered", it should look completed (green)
              const isDeliveredAndCurrent = isCurrentStage && stage === 'delivered';
              const showAsCompleted = isCompleted || isDeliveredAndCurrent;
              const showAsInProgress = isCurrentStage && !isDeliveredAndCurrent;

              return (
                <div key={stage} className="flex flex-col items-center flex-1">
                  {/* Map Pin Marker */}
                  <div className="relative mb-4">
                    <div
                      className={`transition-all duration-300 transform ${showAsInProgress ? "scale-125" : "scale-100"
                        }`}
                    >
                      {/* Pin shadow */}
                      <div
                        className={`absolute inset-0 rounded-full blur-lg transition-all duration-300 ${showAsInProgress
                          ? "bg-primary shadow-lg scale-150"
                          : showAsCompleted
                            ? "bg-green-500 scale-125"
                            : "bg-gray-300 scale-100"
                          }`}
                      />

                      {/* Main pin */}
                      <div
                        className={`relative w-14 h-14 rounded-full border-4 border-background flex items-center justify-center transition-all duration-300 ${showAsInProgress
                          ? "bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-xl"
                          : showAsCompleted
                            ? "bg-gradient-to-br from-green-400 to-green-500 text-white"
                            : "bg-muted text-muted-foreground"
                          }`}
                        data-testid={`route-stage-${stage}`}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                    </div>

                    {/* Active pulse ring - only for in-progress stages, not delivered */}
                    {showAsInProgress && (
                      <div className="absolute inset-0 rounded-full border-2 border-primary animate-pulse" style={{ width: "56px", height: "56px" }} />
                    )}
                  </div>

                  {/* Stage Label and Status */}
                  <div className="text-center">
                    <p
                      className={`text-sm font-bold transition-colors duration-300 ${isActive
                        ? "text-primary dark:text-primary"
                        : "text-muted-foreground"
                        }`}
                    >
                      {stageLabels[stage as keyof typeof stageLabels]}
                    </p>
                    {showAsInProgress && (
                      <p className="text-xs text-primary font-semibold mt-1">In Progress</p>
                    )}
                    {showAsCompleted && (
                      <p className="text-xs text-green-600 dark:text-green-400 font-semibold mt-1">Completed</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Google Maps Style Tracking Details */}
      <div>
        <h3 className="text-sm font-semibold mb-4 text-muted-foreground">🗺️ ROUTE DETAILS</h3>

        {/* Maps Container */}
        <div className="relative rounded-xl overflow-hidden border border-primary/20 bg-blue-50 dark:bg-blue-950/30">
          {/* SVG Map Route */}
          <svg className="w-full absolute top-0 left-0" style={{ height: `${Math.max(300, events.length * 120)}px` }}>
            {/* Status Gradients */}
            <defs>
              <linearGradient id="routeLineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="1" />
                <stop offset="50%" stopColor="#3b82f6" stopOpacity="1" />
                <stop offset="100%" stopColor="#22c55e" stopOpacity="1" />
              </linearGradient>
              <linearGradient id="gradient-completed" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#22c55e" stopOpacity="1" />
                <stop offset="100%" stopColor="#4ade80" stopOpacity="1" />
              </linearGradient>
            </defs>

            {/* Curved route line segments */}
            {events.map((_, index) => {
              if (index === events.length - 1) return null;

              const startY = 60 + index * 120;
              const endY = 60 + (index + 1) * 120;
              const controlY = endY - 60;

              // Find index of active event
              const activeEventIndex = events.findIndex(e => e.isActive);
              const effectiveActiveIndex = activeEventIndex >= 0 ? activeEventIndex : events.length - 1;

              // Determine segment status
              const targetIndex = index + 1;
              const isCompleted = targetIndex < effectiveActiveIndex;
              const isActive = targetIndex === effectiveActiveIndex;

              let strokeColor = "#e2e8f0"; // Default gray

              if (isCompleted) {
                strokeColor = "url(#gradient-completed)";
              } else if (isActive) {
                strokeColor = "url(#routeLineGradient)";
              }

              return (
                <path
                  key={`segment-${index}`}
                  d={`M 40 ${startY} Q 100 ${controlY}, 40 ${endY}`}
                  stroke={strokeColor}
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
              );
            })}

            {/* Waypoint circles */}
            {events.map((event, index) => {
              const y = 60 + index * 120;
              const isActive = event.isActive;
              return (
                <g key={`waypoint-${index}`}>
                  {/* Outer glow */}
                  <circle cx="40" cy={y} r={isActive ? "16" : "12"} fill={isActive ? "#3b82f6" : "#60a5fa"} opacity="0.2" />
                  {/* Main circle */}
                  <circle
                    cx="40"
                    cy={y}
                    r={isActive ? "10" : "8"}
                    fill={isActive ? "#3b82f6" : "#60a5fa"}
                    className={isActive ? "animate-pulse" : ""}
                  />
                </g>
              );
            })}
          </svg>

          {/* Event Details with Map positioning */}
          <div className="relative z-10 pl-32 pr-6 py-6 space-y-0">
            {events.map((event, index) => {
              const Icon = statusIcons[event.status as keyof typeof statusIcons] || statusIcons.default;

              return (
                <div
                  key={event.id}
                  className="py-8 px-6 border-l-4 border-primary/30 hover:border-primary transition-all duration-300 relative group"
                  data-testid={`timeline-event-${event.id}`}
                  style={{ minHeight: "120px" }}
                >
                  {/* Hover background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-r-lg -z-10" />

                  {/* Event Content */}
                  <div className="space-y-2 relative z-20">
                    {/* Header with icon and status */}
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex-shrink-0 p-2 rounded-lg transition-all duration-300 ${event.isActive
                          ? "bg-primary text-primary-foreground"
                          : "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400"
                          }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-lg capitalize text-foreground">{event.status}</p>
                        <p className="text-xs font-mono text-muted-foreground">
                          {event.timestamp}
                        </p>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-start gap-3 pl-11">
                      <Navigation className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                      <p className="text-sm font-semibold text-foreground">{event.location}</p>
                    </div>

                    {/* Metadata */}
                    {event.metadata && (
                      <p className="text-xs text-muted-foreground pl-11 italic">{event.metadata}</p>
                    )}

                    {/* TX Hash */}
                    {event.txHash && (
                      <div className="flex items-center gap-2 mt-3 pl-11 p-2 bg-background/50 rounded border border-primary/20 hover:bg-background/80 transition-colors duration-300">
                        <p className="text-xs font-mono truncate flex-1" title={event.txHash}>
                          {event.txHash}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 flex-shrink-0"
                          onClick={() => copyToClipboard(event.txHash!)}
                          data-testid={`button-copy-tx-${event.id}`}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
