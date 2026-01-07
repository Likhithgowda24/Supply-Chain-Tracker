import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import logoImage from "@assets/generated_images/blockchain_supply_chain_logo.png";

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [phase, setPhase] = useState<"logo" | "transform" | "complete" | "fadeout">("logo");

  useEffect(() => {
    // Phase 1: Logo pops for 1.5s
    const timer1 = setTimeout(() => {
      setPhase("transform");
    }, 1500);

    // Phase 2: Transform and display text for 1.8s
    const timer2 = setTimeout(() => {
      setPhase("complete");
    }, 3300);

    // Phase 3: Fade out transition - starts at 3.5s, completes at 4.5s (1s fade)
    const timer3 = setTimeout(() => {
      setPhase("fadeout");
    }, 3500);

    // Phase 4: Move to login after fade completes
    const timer4 = setTimeout(() => {
      onComplete();
    }, 4500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center bg-black dark:bg-black overflow-hidden"
      initial={{ opacity: 1 }}
      animate={phase === "fadeout" ? { opacity: 0 } : { opacity: 1 }}
      transition={{
        duration: phase === "fadeout" ? 1 : 0,
        ease: "easeInOut",
      }}
    >
      {/* Full screen glowing background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-black to-black" />
      
      {/* Animated background glow orbs - Full Screen Coverage */}
      {/* Top Left Purple Glow */}
      <motion.div
        className="absolute -top-1/3 -left-1/4 w-full h-full rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(147, 51, 234, 0.5) 0%, transparent 60%)",
        }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.4, 0.8, 0.4],
          x: [-100, 100, -100],
          y: [-100, 100, -100],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Bottom Right Gold Glow */}
      <motion.div
        className="absolute -bottom-1/4 -right-1/3 w-full h-full rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(245, 158, 11, 0.45) 0%, transparent 60%)",
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.7, 0.3],
          x: [100, -100, 100],
          y: [100, -100, 100],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
      />

      {/* Center Top Purple Glow */}
      <motion.div
        className="absolute -top-1/2 left-1/3 w-screen h-screen rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(168, 85, 247, 0.35) 0%, transparent 70%)",
        }}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.2, 0.5, 0.2],
          x: [50, -50, 50],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />

      {/* Bottom Center Gold Glow */}
      <motion.div
        className="absolute -bottom-1/2 right-1/4 w-screen h-screen rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(217, 119, 6, 0.3) 0%, transparent 70%)",
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.25, 0.6, 0.25],
          y: [50, -50, 50],
        }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1.5,
        }}
      />

      {/* Main splash content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="relative z-10 flex flex-col items-center justify-center"
      >
        {/* Logo - Phase 1: Pop */}
        <motion.div
          className="relative flex items-center justify-center"
          initial={{ scale: 0, opacity: 0 }}
          animate={
            phase === "logo"
              ? {
                  scale: [0, 1.2, 1],
                  opacity: [0, 1, 1],
                }
              : phase === "transform"
              ? {
                  scale: 1,
                  opacity: 1,
                }
              : {
                  scale: 0.2,
                  opacity: 0,
                  y: -150,
                }
          }
          transition={{
            duration: phase === "logo" ? 0.9 : phase === "transform" ? 0.7 : 0.6,
            ease: "easeOut",
          }}
        >
          {/* Outer glow ring - animated circle */}
          <motion.div
            className="absolute rounded-full bg-gradient-to-r from-purple-500 via-purple-400 to-yellow-400"
            animate={
              phase === "logo"
                ? {
                    opacity: [0.4, 1, 0.6],
                    scale: [0.8, 1.4, 1.1],
                  }
                : {
                    opacity: 0.5,
                    scale: 1.1,
                  }
            }
            transition={{
              duration: phase === "logo" ? 0.9 : 0.5,
              ease: "easeOut",
            }}
            style={{
              width: "300px",
              height: "300px",
              filter: "blur(20px)",
            }}
          />

          {/* Circular background container */}
          <motion.div
            className="absolute rounded-full bg-gradient-to-br from-purple-900/40 to-purple-800/20 flex items-center justify-center"
            animate={{
              opacity: phase === "logo" ? [0.3, 0.7, 0.5] : 0.5,
            }}
            transition={{
              duration: phase === "logo" ? 0.9 : 0.5,
            }}
            style={{
              width: "280px",
              height: "280px",
            }}
          />

          {/* Circular border ring */}
          <motion.div
            className="absolute rounded-full border-4 border-purple-400/50"
            animate={{
              opacity: phase === "logo" ? [0.3, 0.8, 0.5] : 0.6,
            }}
            transition={{
              duration: phase === "logo" ? 0.9 : 0.5,
            }}
            style={{
              width: "280px",
              height: "280px",
            }}
          />

          {/* Logo image centered with glowing effect - Perfect Circle */}
          <motion.div
            className="relative rounded-full overflow-hidden z-10 flex items-center justify-center"
            style={{
              width: "220px",
              height: "220px",
              background: "radial-gradient(circle, rgba(147, 51, 234, 0.15), transparent)",
            }}
          >
            <motion.img
              src={logoImage}
              alt="Supply Chain Tracker Logo"
              className="drop-shadow-2xl"
              style={{
                width: "180px",
                height: "180px",
                objectFit: "contain",
              }}
            animate={
              phase === "logo"
                ? {
                    scale: [0.7, 1.3, 1],
                    rotate: [0, 360],
                    filter: [
                      "drop-shadow(0 0 20px rgba(147, 51, 234, 0.6))",
                      "drop-shadow(0 0 50px rgba(147, 51, 234, 1)) drop-shadow(0 0 30px rgba(245, 158, 11, 0.8))",
                      "drop-shadow(0 0 20px rgba(147, 51, 234, 0.6))",
                    ],
                  }
                : {
                    scale: 1,
                    rotate: 360,
                    filter: "drop-shadow(0 0 30px rgba(147, 51, 234, 0.7)) drop-shadow(0 0 15px rgba(245, 158, 11, 0.5))",
                  }
            }
              transition={{
                duration: phase === "logo" ? 0.9 : 0.6,
                ease: "easeOut",
                rotate: {
                  duration: phase === "logo" ? 1.2 : 0.8,
                },
              }}
            />
          </motion.div>
        </motion.div>

        {/* App name - Phase 2: Slides in and glows */}
        <motion.div
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 40 }}
          animate={
            phase === "transform" || phase === "complete"
              ? { opacity: 1, y: 0 }
              : { opacity: 0, y: 40 }
          }
          transition={{
            duration: 0.6,
            ease: "easeOut",
          }}
        >
          <motion.h1
            className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-purple-300 to-yellow-400 bg-clip-text text-transparent"
            animate={
              phase === "transform"
                ? {
                    opacity: [0, 0.7, 1],
                    scale: [0.8, 1.05, 1],
                  }
                : phase === "complete"
                ? {
                    opacity: 1,
                    scale: 1,
                  }
                : {
                    opacity: 0,
                    scale: 0.8,
                  }
            }
            transition={{
              duration: phase === "transform" ? 0.8 : 0.4,
              ease: "easeOut",
            }}
          >
            Supply Chain Tracker
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            className="text-sm text-muted-foreground mt-3"
            animate={
              phase === "transform" || phase === "complete"
                ? { opacity: [0, 0.6, 0.8], y: [10, 0] }
                : { opacity: 0, y: 10 }
            }
            transition={{
              duration: 0.8,
              ease: "easeOut",
              delay: phase === "transform" ? 0.2 : 0,
            }}
          >
            Blockchain-Powered Logistics
          </motion.p>
        </motion.div>

        {/* Fade out on complete */}
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={phase === "complete" ? { opacity: 1 } : { opacity: 0 }}
          transition={{
            duration: 0.5,
            delay: 0.5,
          }}
          style={{
            background: "linear-gradient(to bottom, transparent, rgba(0,0,0,0.5))",
          }}
        />
      </motion.div>
    </motion.div>
  );
}
