"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface LogoProps {
  size?: number
  className?: string
  animated?: boolean
  variant?: "default" | "splash" | "header"
  darkMode?: boolean
}

export default function Logo({
  size = 40,
  className,
  animated = true,
  variant = "default",
  darkMode = false,
}: LogoProps) {
  const baseColor = darkMode ? "#ffffff" : "#111111"
  const accentColor = "#35D07F"
  const glowColor = "rgba(53, 208, 127, 0.6)"

  return (
    <motion.div
      className={cn("relative", className)}
      style={{ width: size, height: size }}
      initial={animated ? { opacity: 0 } : { opacity: 1 }}
      animate={animated ? { opacity: 1 } : { opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Hexagon base */}
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <motion.path
          d="M50 0L93.3 25V75L50 100L6.7 75V25L50 0Z"
          fill={accentColor}
          initial={animated ? { scale: 0.8, opacity: 0 } : { scale: 1, opacity: 1 }}
          animate={animated ? { scale: 1, opacity: 1 } : { scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
          filter={variant === "splash" ? "url(#glow)" : "none"}
        />

        {/* Glowing filter */}
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
            <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor={glowColor} floodOpacity="1" />
          </filter>
        </defs>
      </svg>

      {/* Inner circuit lines */}
      <svg
        className="absolute inset-0"
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <motion.path
          d="M50 20L70 30V50L50 60L30 50V30L50 20Z"
          stroke="white"
          strokeWidth="2"
          fill="none"
          initial={animated ? { pathLength: 0, opacity: 0 } : { pathLength: 1, opacity: 0.8 }}
          animate={animated ? { pathLength: 1, opacity: 0.8 } : { pathLength: 1, opacity: 0.8 }}
          transition={{ duration: 1.2, delay: 0.3 }}
        />

        <motion.path
          d="M50 30L60 35V45L50 50L40 45V35L50 30Z"
          stroke="white"
          strokeWidth="2"
          fill="none"
          initial={animated ? { pathLength: 0, opacity: 0 } : { pathLength: 1, opacity: 0.8 }}
          animate={animated ? { pathLength: 1, opacity: 0.8 } : { pathLength: 1, opacity: 0.8 }}
          transition={{ duration: 1, delay: 0.6 }}
        />

        {/* Connection lines */}
        {[...Array(3)].map((_, i) => (
          <motion.line
            key={`line-${i}`}
            x1="50"
            y1="60"
            x2={50 + Math.cos((Math.PI * 2 * i) / 3) * 30}
            y2={60 + Math.sin((Math.PI * 2 * i) / 3) * 30}
            stroke="white"
            strokeWidth="2"
            strokeDasharray="3 3"
            initial={animated ? { pathLength: 0, opacity: 0 } : { pathLength: 1, opacity: 0.6 }}
            animate={animated ? { pathLength: 1, opacity: 0.6 } : { pathLength: 1, opacity: 0.6 }}
            transition={{ duration: 0.8, delay: 0.9 + i * 0.2 }}
          />
        ))}

        {/* Animated dots */}
        {variant === "splash" &&
          [...Array(3)].map((_, i) => (
            <motion.circle
              key={`dot-${i}`}
              cx="50"
              cy="60"
              r="2"
              fill="white"
              animate={{
                cx: [50, 50 + Math.cos((Math.PI * 2 * i) / 3) * 30],
                cy: [60, 60 + Math.sin((Math.PI * 2 * i) / 3) * 30],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 2,
                delay: 1.5 + i * 0.3,
                repeat: Number.POSITIVE_INFINITY,
                repeatDelay: 3,
              }}
            />
          ))}
      </svg>

      {/* "S" symbol */}
      <svg
        className="absolute inset-0"
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <motion.path
          d="M40 35C40 32.2386 42.2386 30 45 30H55C57.7614 30 60 32.2386 60 35C60 37.7614 57.7614 40 55 40H45C42.2386 40 40 42.2386 40 45C40 47.7614 42.2386 50 45 50H55C57.7614 50 60 52.2386 60 55C60 57.7614 57.7614 60 55 60H45C42.2386 60 40 57.7614 40 55"
          stroke="white"
          strokeWidth="4"
          strokeLinecap="round"
          initial={animated ? { pathLength: 0, opacity: 0 } : { pathLength: 1, opacity: 1 }}
          animate={animated ? { pathLength: 1, opacity: 1 } : { pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.5, delay: 0.8 }}
        />
      </svg>

      {/* Pulsing rings for splash variant */}
      {variant === "splash" && (
        <svg
          className="absolute inset-0"
          width={size}
          height={size}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {[...Array(3)].map((_, i) => (
            <motion.path
              key={`ring-${i}`}
              d="M50 0L93.3 25V75L50 100L6.7 75V25L50 0Z"
              stroke={accentColor}
              strokeWidth="2"
              fill="none"
              initial={{ scale: 1, opacity: 0 }}
              animate={{
                scale: [1, 1.2 + i * 0.1],
                opacity: [0, 0.5, 0],
              }}
              transition={{
                duration: 3,
                delay: i * 0.8,
                repeat: Number.POSITIVE_INFINITY,
                repeatDelay: 1,
              }}
            />
          ))}
        </svg>
      )}

      {/* Rotating particles for splash variant */}
      {variant === "splash" && (
        <svg
          className="absolute inset-0"
          width={size}
          height={size}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {[...Array(6)].map((_, i) => (
            <motion.circle
              key={`particle-${i}`}
              cx={50 + 40 * Math.cos((Math.PI * 2 * i) / 6)}
              cy={50 + 40 * Math.sin((Math.PI * 2 * i) / 6)}
              r="2"
              fill="white"
              animate={{
                cx: [
                  50 + 40 * Math.cos((Math.PI * 2 * i) / 6),
                  50 + 40 * Math.cos((Math.PI * 2 * (i + 1)) / 6),
                  50 + 40 * Math.cos((Math.PI * 2 * (i + 2)) / 6),
                  50 + 40 * Math.cos((Math.PI * 2 * i) / 6),
                ],
                cy: [
                  50 + 40 * Math.sin((Math.PI * 2 * i) / 6),
                  50 + 40 * Math.sin((Math.PI * 2 * (i + 1)) / 6),
                  50 + 40 * Math.sin((Math.PI * 2 * (i + 2)) / 6),
                  50 + 40 * Math.sin((Math.PI * 2 * i) / 6),
                ],
                opacity: [0.8, 1, 0.8],
              }}
              transition={{
                duration: 8,
                delay: i * 0.5,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
              }}
            />
          ))}
        </svg>
      )}
    </motion.div>
  )
}

