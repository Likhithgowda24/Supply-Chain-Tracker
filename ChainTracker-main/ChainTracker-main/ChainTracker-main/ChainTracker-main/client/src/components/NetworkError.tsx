import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, RefreshCw, WifiOff, AlertCircle, Link as LinkIcon, Box, Unlink, Link2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface NetworkErrorProps {
    onRetry: () => void;
    onOffline: () => void;
    isRetrying?: boolean;
    lastSync?: Date;
}

export const NetworkError: React.FC<NetworkErrorProps> = ({
    onRetry,
    onOffline,
    isRetrying = false,
    lastSync,
}) => {
    const [retryCount, setRetryCount] = useState(0);
    const [countdown, setCountdown] = useState(10);
    const [autoRetryActive, setAutoRetryActive] = useState(true);

    // Auto-retry logic
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (autoRetryActive && retryCount < 5) {
            if (countdown > 0) {
                timer = setTimeout(() => setCountdown(c => c - 1), 1000);
            } else {
                handleRetry();
            }
        }
        return () => clearTimeout(timer);
    }, [countdown, autoRetryActive, retryCount]);

    const handleRetry = () => {
        setRetryCount(c => c + 1);
        setCountdown(10); // Reset countdown
        onRetry();
    };

    const handleManualRetry = () => {
        setCountdown(10); // Reset countdown
        setAutoRetryActive(true); // Keep auto retry active
        handleRetry();
    };

    const handleGoOffline = () => {
        setAutoRetryActive(false);
        onOffline();
    };

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.3 } },
        exit: { opacity: 0, transition: { duration: 0.2 } }
    };

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden text-slate-200 bg-[#0f0518]"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
            >
                {/* Custom Background - Purple Theme with Diagonal Sweeping Glow */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {/* Deep Purple Base */}
                    <div className="absolute inset-0 bg-[#0f0518]" />

                    {/* Primary Diagonal Sweeping Beam */}
                    <motion.div
                        className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] opacity-30"
                        style={{
                            background: "linear-gradient(45deg, transparent 45%, rgba(147, 51, 234, 0.4) 50%, rgba(245, 158, 11, 0.2) 55%, transparent 60%)",
                            filter: "blur(60px)",
                        }}
                        animate={{
                            transform: ["translate(-50%, -50%)", "translate(50%, 50%)"]
                        }}
                        transition={{
                            duration: 8,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                    />

                    {/* Secondary Delayed Beam for Continuity */}
                    <motion.div
                        className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] opacity-20"
                        style={{
                            background: "linear-gradient(45deg, transparent 45%, rgba(147, 51, 234, 0.3) 50%, rgba(245, 158, 11, 0.1) 55%, transparent 60%)",
                            filter: "blur(80px)",
                        }}
                        animate={{
                            transform: ["translate(-50%, -50%)", "translate(50%, 50%)"]
                        }}
                        transition={{
                            duration: 8,
                            repeat: Infinity,
                            ease: "linear",
                            delay: 4
                        }}
                    />
                </div>

                {/* Supply Chain Truck Animation - Moved to Top Level for Visibility */}
                <motion.div
                    className="absolute top-[30%] left-0 z-[60] pointer-events-none"
                    initial={{ x: "-20vw", opacity: 0 }}
                    animate={{
                        x: "120vw",
                        opacity: [0, 1, 1, 0]
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "linear",
                        delay: 0.5
                    }}
                >
                    <div className="relative transform scale-150">
                        {/* Glowing Trail */}
                        <div className="absolute top-1/2 right-full w-48 h-2 bg-gradient-to-r from-transparent to-[#f59e0b]/60 blur-md" />

                        {/* Realistic Truck SVG - Theme Adapted */}
                        <svg viewBox="0 0 240 120" className="w-48 h-24 drop-shadow-[0_0_30px_rgba(147,51,234,0.4)]" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <linearGradient id="truckBodyGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#2e1065" stopOpacity="1" /> {/* Dark Purple */}
                                    <stop offset="50%" stopColor="#1e1b4b" stopOpacity="1" /> {/* Indigo/Black */}
                                    <stop offset="100%" stopColor="#0f0518" stopOpacity="1" /> {/* Deep Background */}
                                </linearGradient>
                                <linearGradient id="windowGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#000000" />
                                    <stop offset="50%" stopColor="#1e1e1e" />
                                    <stop offset="100%" stopColor="#000000" />
                                </linearGradient>
                                <linearGradient id="chromeGradient" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#4c1d95" />
                                    <stop offset="50%" stopColor="#a855f7" />
                                    <stop offset="100%" stopColor="#4c1d95" />
                                </linearGradient>
                            </defs>

                            {/* Trailer Body */}
                            <path d="M10 20 H160 V90 H10 V20 Z" fill="url(#truckBodyGradient)" stroke="#9333ea" strokeWidth="1" />
                            {/* Trailer Ribs - Subtle Purple */}
                            <path d="M30 20 V90 M50 20 V90 M70 20 V90 M90 20 V90 M110 20 V90 M130 20 V90 M150 20 V90" stroke="#9333ea" strokeWidth="0.5" strokeOpacity="0.3" />

                            {/* Website Logo on Trailer - Official Hexagon Design - Fitted & Centered */}
                            <g transform="translate(85, 52) scale(1.4)">
                                {/* Container Group to Center (Width ~96, Center ~48) */}
                                <g transform="translate(-48, -10)">
                                    {/* Hexagon Icon */}
                                    <g transform="translate(0, -2.5)">
                                        {/* Hexagon Shape */}
                                        <path d="M10 0 L20 5 L20 15 L10 20 L0 15 L0 5 Z" fill="none" stroke="#f59e0b" strokeWidth="1.5" />
                                        {/* Corner Nodes */}
                                        <circle cx="10" cy="0" r="1.5" fill="#f59e0b" />
                                        <circle cx="20" cy="5" r="1.5" fill="#f59e0b" />
                                        <circle cx="20" cy="15" r="1.5" fill="#f59e0b" />
                                        <circle cx="10" cy="20" r="1.5" fill="#f59e0b" />
                                        <circle cx="0" cy="15" r="1.5" fill="#f59e0b" />
                                        <circle cx="0" cy="5" r="1.5" fill="#f59e0b" />

                                        {/* Chain Link Inside - Centered & Bold */}
                                        <g transform="translate(10, 10) scale(0.6) translate(-12, -12)">
                                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </g>
                                    </g>

                                    {/* Text Group */}
                                    <g transform="translate(25, 0)">
                                        <text x="0" y="5" textAnchor="start" fill="#a855f7" fontSize="10" fontFamily="sans-serif" fontWeight="bold" letterSpacing="0.5">Supply Chain</text>
                                        <text x="0" y="16" textAnchor="start" fill="#f59e0b" fontSize="11" fontFamily="sans-serif" fontWeight="bold" letterSpacing="1">TRACKER</text>
                                    </g>
                                </g>
                            </g>

                            {/* Chassis Connector */}
                            <rect x="160" y="75" width="20" height="8" fill="#18181b" />

                            {/* Cab Body - Streamlined */}
                            <path d="M175 45 H200 L225 65 V90 H175 V45 Z" fill="url(#truckBodyGradient)" stroke="#9333ea" strokeWidth="1" />
                            {/* Roof Fairing */}
                            <path d="M175 45 L160 25 H175 V45 Z" fill="#1e1b4b" stroke="#9333ea" strokeWidth="0.5" />

                            {/* Windshield */}
                            <path d="M200 48 L220 62 H178 V48 H200 Z" fill="url(#windowGradient)" stroke="#9333ea" strokeWidth="0.5" strokeOpacity="0.5" />

                            {/* Grille - Neon Gold Accent */}
                            <rect x="220" y="65" width="5" height="20" fill="#f59e0b" />
                            <path d="M221 66 H224 M221 70 H224 M221 74 H224 M221 78 H224 M221 82 H224" stroke="#78350f" strokeWidth="0.5" />

                            {/* Headlight - Bright Gold */}
                            <rect x="215" y="80" width="8" height="4" rx="1" fill="#fef3c7" className="animate-pulse" style={{ filter: "drop-shadow(0 0 5px #f59e0b)" }} />

                            {/* Wheels - Rear Trailer */}
                            <g transform="translate(40, 90)">
                                <circle cx="0" cy="0" r="14" fill="#0f0518" stroke="#581c87" strokeWidth="2" />
                                <circle cx="0" cy="0" r="8" fill="none" stroke="#9333ea" strokeWidth="1" strokeDasharray="2 2" />
                                <circle cx="0" cy="0" r="3" fill="#f59e0b" />
                            </g>
                            <g transform="translate(75, 90)">
                                <circle cx="0" cy="0" r="14" fill="#0f0518" stroke="#581c87" strokeWidth="2" />
                                <circle cx="0" cy="0" r="8" fill="none" stroke="#9333ea" strokeWidth="1" strokeDasharray="2 2" />
                                <circle cx="0" cy="0" r="3" fill="#f59e0b" />
                            </g>

                            {/* Wheels - Cab Rear */}
                            <g transform="translate(190, 90)">
                                <circle cx="0" cy="0" r="14" fill="#0f0518" stroke="#581c87" strokeWidth="2" />
                                <circle cx="0" cy="0" r="8" fill="none" stroke="#9333ea" strokeWidth="1" strokeDasharray="2 2" />
                                <circle cx="0" cy="0" r="3" fill="#f59e0b" />
                            </g>

                            {/* Side Skirt/Fuel Tank */}
                            <rect x="180" y="80" width="20" height="8" rx="2" fill="url(#chromeGradient)" stroke="#9333ea" strokeWidth="0.5" />

                            {/* Dust/Smoke Effect - Rear Trailer Wheels */}
                            <g transform="translate(40, 105)">
                                <circle cx="0" cy="0" r="4" fill="#a855f7" className="animate-smoke" style={{ opacity: 0.6 }} />
                                <circle cx="-5" cy="2" r="3" fill="#7e22ce" className="animate-smoke-delay-1" style={{ opacity: 0.5 }} />
                                <circle cx="-10" cy="-2" r="5" fill="#581c87" className="animate-smoke-delay-2" style={{ opacity: 0.4 }} />
                            </g>
                            <g transform="translate(75, 105)">
                                <circle cx="0" cy="0" r="4" fill="#a855f7" className="animate-smoke" style={{ opacity: 0.6 }} />
                                <circle cx="-5" cy="2" r="3" fill="#7e22ce" className="animate-smoke-delay-1" style={{ opacity: 0.5 }} />
                            </g>

                            {/* Dust/Smoke Effect - Cab Wheels */}
                            <g transform="translate(190, 105)">
                                <circle cx="0" cy="0" r="4" fill="#a855f7" className="animate-smoke" style={{ opacity: 0.6 }} />
                                <circle cx="-5" cy="2" r="3" fill="#7e22ce" className="animate-smoke-delay-1" style={{ opacity: 0.5 }} />
                            </g>
                        </svg>

                        {/* Headlight Beam */}
                        <div className="absolute top-2/3 left-full w-40 h-12 bg-gradient-to-r from-[#f59e0b]/40 to-transparent blur-lg transform -rotate-12 origin-top-left" />
                    </div>
                </motion.div>


                {/* Main Content - Full Screen Centered */}
                <div className="relative z-10 flex flex-col items-center max-w-lg w-full px-6">

                    {/* Modern Animated Icon Container */}
                    <div className="relative mb-12 w-32 h-32 flex items-center justify-center">
                        {/* Rotating Outer Ring - Purple */}
                        <motion.div
                            className="absolute inset-0 rounded-full border border-[#9333ea]/30"
                            style={{ width: '100%', height: '100%' }}
                            animate={{ rotate: 360 }}
                            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                        />

                        {/* Counter-Rotating Inner Ring with Dashes - Gold Accent */}
                        <motion.div
                            className="absolute inset-[-10px] rounded-full border-2 border-dashed border-[#f59e0b]/20"
                            style={{ width: 'calc(100% + 20px)', height: 'calc(100% + 20px)' }}
                            animate={{ rotate: -360 }}
                            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                        />

                        {/* Main Glow Circle with Float Animation */}
                        <motion.div
                            className="w-32 h-32 rounded-full flex items-center justify-center relative z-10 shadow-[0_0_50px_-10px_rgba(147,51,234,0.3)]"
                            animate={{
                                y: [-5, 5, -5],
                                boxShadow: [
                                    "0 0 20px -5px rgba(147, 51, 234, 0.2)",
                                    "0 0 50px -10px rgba(147, 51, 234, 0.5)",
                                    "0 0 20px -5px rgba(147, 51, 234, 0.2)"
                                ]
                            }}
                            transition={{
                                y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                                boxShadow: { duration: 3, repeat: Infinity, ease: "easeInOut" }
                            }}
                        >

                            {/* Inner Icon with "Breathing" and "Glitch" effect - Purple */}
                            <motion.div
                                className="relative z-10"
                                animate={{
                                    scale: [1, 1.05, 1],
                                    filter: [
                                        "drop-shadow(0 0 0px rgba(147,51,234,0))",
                                        "drop-shadow(0 0 15px rgba(147,51,234,0.6))",
                                        "drop-shadow(0 0 0px rgba(147,51,234,0))"
                                    ]
                                }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <LinkIcon className="w-14 h-14 text-[#9333ea]" />
                            </motion.div>

                        </motion.div>

                        {/* Ambient Background Blur Pulse - Purple/Gold Mix */}
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-tr from-[#9333ea]/10 to-[#f59e0b]/10 blur-3xl rounded-full -z-10"
                            animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        />
                    </div>

                    {/* Text Content */}
                    <motion.div
                        className="text-center space-y-4 mb-10"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <h2 className="text-4xl font-bold tracking-tight text-white font-sans drop-shadow-lg glowing-text">
                            Connection Lost
                        </h2>
                        <p className="text-slate-300 text-lg font-medium max-w-md mx-auto leading-relaxed">
                            We’re trying to reconnect to the blockchain network.
                            <br />
                            <span className="text-slate-400 text-base">Your data is safe.</span>
                        </p>

                        {autoRetryActive && (
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1e1e1e]/50 border border-slate-700/50 mt-2">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#9333ea] opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#9333ea]"></span>
                                </span>
                                <p className="text-slate-400 text-sm font-mono">
                                    Attempt {retryCount + 1} of 5
                                </p>
                            </div>
                        )}
                    </motion.div>

                    {/* Auto Retry Countdown Ring (Larger and Centered) */}
                    {autoRetryActive && !isRetrying && (
                        <div className="relative w-24 h-24 mb-10 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle
                                    cx="48"
                                    cy="48"
                                    r="44"
                                    stroke="#1e1e1e"
                                    strokeWidth="4"
                                    fill="none"
                                />
                                <motion.circle
                                    cx="48"
                                    cy="48"
                                    r="44"
                                    stroke="#9333ea"
                                    strokeWidth="4"
                                    fill="none"
                                    strokeDasharray="276.46"
                                    strokeDashoffset={276.46 * (1 - countdown / 10)}
                                    transition={{ duration: 1, ease: "linear" }}
                                />
                            </svg>
                            <span className="absolute text-2xl font-bold text-[#9333ea] font-mono">{countdown}s</span>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col w-full max-w-xs gap-4">
                        <Button
                            onClick={handleManualRetry}
                            disabled={isRetrying}
                            className="w-full bg-[#9333ea] hover:bg-[#7e22ce] text-white font-bold h-14 text-lg rounded-xl shadow-[0_0_20px_rgba(147,51,234,0.4)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(147,51,234,0.6)]"
                        >
                            {isRetrying ? (
                                <span className="flex items-center gap-2">
                                    <RefreshCw className="w-5 h-5 animate-spin" /> Reconnecting...
                                </span>
                            ) : "Retry Now"}
                        </Button>

                        <Button
                            variant="ghost"
                            onClick={handleGoOffline}
                            className="w-full text-slate-400 hover:text-white hover:bg-white/5 h-12 rounded-xl transition-colors"
                        >
                            Go Offline
                        </Button>
                    </div>

                    {/* Footer Status */}
                    <div className="absolute bottom-8 flex items-center gap-3 text-sm text-slate-500">
                        <LinkIcon className="w-4 h-4" />
                        <span className="font-mono">Last synced: {lastSync ? lastSync.toLocaleTimeString() : "Unknown"}</span>
                        <div className="w-1 h-1 bg-slate-700 rounded-full" />
                        <button className="text-[#9333ea] hover:text-[#7e22ce] hover:underline transition-colors">View Status</button>
                    </div>

                </div>
            </motion.div>
        </AnimatePresence>
    );
};
