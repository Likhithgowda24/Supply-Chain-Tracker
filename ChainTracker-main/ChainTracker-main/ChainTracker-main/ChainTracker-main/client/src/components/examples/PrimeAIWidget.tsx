import { PrimeAIWidget } from "../PrimeAIWidget";

export default function PrimeAIWidgetExample() {
  return (
    <div className="min-h-screen bg-background p-8">
      <p className="text-muted-foreground text-center">
        Click the AI button in the bottom-right corner to open Prime
      </p>
      <PrimeAIWidget />
    </div>
  );
}
