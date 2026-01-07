import logoImage from "@assets/generated_images/blockchain_supply_chain_logo.png";
import { useState, useRef } from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export function Logo({ size = "md", showText = true }: LogoProps) {
  const [isPressed, setIsPressed] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-24 w-24",
  };

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
  };

  const handleMouseDown = () => {
    setIsPressed(true);
  };

  const handleMouseUp = () => {
    timeoutRef.current = setTimeout(() => {
      setIsPressed(false);
    }, 100);
  };

  const handleMouseLeave = () => {
    setIsPressed(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  return (
    <div className="flex items-center gap-3">
      <div 
        className={`relative transition-all duration-300 cursor-pointer ${
          isPressed ? "scale-110 brightness-150" : "hover:scale-105"
        }`}
        style={{
          boxShadow: isPressed 
            ? "0 0 60px rgba(147, 51, 234, 1), 0 0 120px rgba(245, 158, 11, 0.8), inset 0 0 20px rgba(147, 51, 234, 0.5)"
            : "0 0 30px rgba(147, 51, 234, 0.5), 0 0 60px rgba(245, 158, 11, 0.3)",
        }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <img
          src={logoImage}
          alt="Supply Chain Tracker Logo"
          className={`${sizeClasses[size]} object-contain drop-shadow-lg`}
        />
      </div>
      {showText && (
        <div 
          className={`flex flex-col gap-0.5 transition-all duration-300 ${
            isPressed ? "scale-105 brightness-125" : ""
          }`}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        >
          <span className={`font-bold ${textSizeClasses[size]} bg-gradient-to-r from-primary via-purple-500 to-accent bg-clip-text text-transparent`}>
            Supply Chain
          </span>
          <span className={`font-semibold text-xs tracking-widest bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent`}>
            TRACKER
          </span>
        </div>
      )}
    </div>
  );
}
