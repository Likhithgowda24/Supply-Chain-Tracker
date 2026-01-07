import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "./ThemeProvider";

interface BackgroundToggleProps {
  isAnimated: boolean;
  onToggle: (value: boolean) => void;
}

export function BackgroundToggle({ isAnimated, onToggle }: BackgroundToggleProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => onToggle(!isAnimated)}
      title={isAnimated ? "Disable animated background" : "Enable animated background"}
      data-testid="button-toggle-background"
    >
      <Sparkles className={`h-5 w-5 ${isAnimated ? "text-primary" : "text-muted-foreground"}`} />
    </Button>
  );
}
