import { TutorialWrapper } from "../TutorialWrapper";
import { Button } from "@/components/ui/button";

export default function TutorialWrapperExample() {
  return (
    <TutorialWrapper>
      <div className="p-8 space-y-4">
        <h2 className="text-2xl font-bold">Tutorial Example</h2>
        <p className="text-muted-foreground">
          Click the help icon in the bottom-left to start the tutorial
        </p>
        <div className="flex gap-4">
          <Button data-testid="button-sidebar-toggle">Toggle Sidebar</Button>
          <input type="text" data-testid="input-search" className="border rounded px-3" placeholder="Search" />
          <Button data-testid="button-notifications">Notifications</Button>
        </div>
      </div>
    </TutorialWrapper>
  );
}
