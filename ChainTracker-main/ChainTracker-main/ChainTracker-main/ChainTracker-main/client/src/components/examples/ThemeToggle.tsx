import { ThemeProvider } from "../ThemeProvider";
import { ThemeToggle } from "../ThemeToggle";

export default function ThemeToggleExample() {
  return (
    <ThemeProvider>
      <div className="p-8 flex items-center justify-center gap-4">
        <p className="text-sm text-muted-foreground">Toggle theme:</p>
        <ThemeToggle />
      </div>
    </ThemeProvider>
  );
}
