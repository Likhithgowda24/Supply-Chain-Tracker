import { useState } from "react";
import Joyride, { Step, CallBackProps, STATUS } from "react-joyride";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";

interface TutorialWrapperProps {
  children: React.ReactNode;
}

const tutorialSteps: Step[] = [
  {
    target: "[data-testid='button-sidebar-toggle']",
    content: "Toggle the sidebar to access different sections of the app",
    disableBeacon: true,
  },
  {
    target: "[data-testid='input-search']",
    content: "Search for products by their Product ID",
  },
  {
    target: "[data-testid='button-notifications']",
    content: "View all your notifications here - orders, support tickets, and more",
  },
  {
    target: "[data-testid='button-profile']",
    content: "Access your profile, settings, and logout options",
  },
  {
    target: "[data-testid='card-stat-active-products']",
    content: "Click on any stat card to view detailed information",
  },
  {
    target: "[data-testid='button-toggle-prime']",
    content: "Chat with Prime, your AI assistant, for instant help",
  },
];

export function TutorialWrapper({ children }: TutorialWrapperProps) {
  const [run, setRun] = useState(false);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];
    if (finishedStatuses.includes(status as any)) {
      setRun(false);
    }
  };

  return (
    <>
      <Joyride
        steps={tutorialSteps}
        run={run}
        continuous
        showProgress
        showSkipButton
        callback={handleJoyrideCallback}
        styles={{
          options: {
            primaryColor: "hsl(var(--primary))",
            zIndex: 10000,
          },
          spotlight: {
            backgroundColor: "transparent",
          },
          overlay: {
            backgroundColor: "rgba(0, 0, 0, 0.4)",
          },
          tooltip: {
            borderRadius: "8px",
          },
        }}
      />
      
      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-4 left-4 z-40 rounded-full shadow-lg"
        onClick={() => setRun(true)}
        data-testid="button-start-tutorial"
      >
        <HelpCircle className="h-5 w-5" />
      </Button>

      {children}
    </>
  );
}
