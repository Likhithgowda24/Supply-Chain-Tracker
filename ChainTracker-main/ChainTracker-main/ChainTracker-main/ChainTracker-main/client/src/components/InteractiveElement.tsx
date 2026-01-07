import { ReactNode, useState, useRef } from "react";

interface InteractiveElementProps {
  children: ReactNode;
  className?: string;
  onPress?: () => void;
}

export function InteractiveElement({ children, className = "", onPress }: InteractiveElementProps) {
  const [isPressed, setIsPressed] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const handleMouseDown = () => {
    setIsPressed(true);
  };

  const handleMouseUp = () => {
    timeoutRef.current = setTimeout(() => {
      setIsPressed(false);
    }, 100);
    onPress?.();
  };

  const handleMouseLeave = () => {
    setIsPressed(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  return (
    <div
      className={`${className} transition-all duration-300 ${
        isPressed ? "scale-110 brightness-150" : ""
      }`}
      style={{
        boxShadow: isPressed 
          ? "0 0 60px rgba(147, 51, 234, 1), 0 0 120px rgba(245, 158, 11, 0.8), inset 0 0 20px rgba(147, 51, 234, 0.5)"
          : "none",
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
}
