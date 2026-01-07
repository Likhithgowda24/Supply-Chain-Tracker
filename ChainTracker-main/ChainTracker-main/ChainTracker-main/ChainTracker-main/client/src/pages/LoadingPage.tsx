import { useEffect } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";

export default function LoadingPage() {
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const encodedRedirect = params.get("redirect") || "/";
  const redirectTo = decodeURIComponent(encodedRedirect);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLocation(redirectTo);
    }, 2800);

    return () => clearTimeout(timer);
  }, [redirectTo, setLocation]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-background via-background to-background overflow-hidden">
      {/* Multiple animated background glow orbs */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(147, 51, 234, 0.4) 0%, transparent 70%)",
        }}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.4, 0.6, 0.4],
          x: [-50, 50, -50],
          y: [-50, 50, -50],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(245, 158, 11, 0.35) 0%, transparent 70%)",
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
          x: [50, -50, 50],
          y: [50, -50, 50],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
      />

      <motion.div
        className="absolute top-1/3 right-1/3 w-72 h-72 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(147, 51, 234, 0.25) 0%, transparent 70%)",
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.2, 0.4, 0.2],
          x: [30, -30, 30],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="relative flex items-center justify-center gap-8 z-10"
      >
        <div className="relative flex flex-col items-center justify-center gap-8">
          {/* Logo container with glow */}
          <motion.div
            className="relative"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            {/* Outer glow ring */}
            <motion.div
              className="absolute inset-0 rounded-full blur-xl bg-gradient-to-r from-purple-500 via-purple-400 to-yellow-400"
              animate={{
                opacity: [0.4, 0.8, 0.4],
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{
                width: "140px",
                height: "140px",
              }}
            />

            {/* Logo circle background */}
            <motion.div
              className="relative w-32 h-32 rounded-full bg-gradient-to-br from-purple-600 to-purple-900 flex items-center justify-center border-2 border-purple-400/30 shadow-2xl"
              animate={{
                boxShadow: [
                  "0 0 20px rgba(147, 51, 234, 0.5), 0 0 40px rgba(245, 158, 11, 0.3)",
                  "0 0 40px rgba(147, 51, 234, 0.8), 0 0 80px rgba(245, 158, 11, 0.6)",
                  "0 0 20px rgba(147, 51, 234, 0.5), 0 0 40px rgba(245, 158, 11, 0.3)",
                ],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              {/* Logo text/icon */}
              <motion.div
                className="text-center"
                animate={{
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <div className="text-4xl font-bold bg-gradient-to-r from-purple-200 via-purple-100 to-yellow-200 bg-clip-text text-transparent">
                  ⚡
                </div>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Website name with fade animation */}
          <motion.div
            className="text-center space-y-3"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <motion.h1
              className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-purple-500 to-yellow-500 bg-clip-text text-transparent"
              animate={{
                opacity: [0.7, 1, 0.7],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              Supply Chain Tracker
            </motion.h1>
            <motion.p
              className="text-sm text-muted-foreground"
              animate={{
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.2,
              }}
            >
              Powered by Prime AI
            </motion.p>
          </motion.div>

          {/* Loading dots */}
          <motion.div className="flex gap-2 mt-4">
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-yellow-500"
                animate={{
                  y: [0, -8, 0],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.4,
                  repeat: Infinity,
                  delay: index * 0.2,
                }}
              />
            ))}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
