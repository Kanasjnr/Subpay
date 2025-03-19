"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface LogoProps {
  size?: number
  className?: string
  animated?: boolean
  variant?: "default" | "splash"
}

export default function Logo({ size = 40, className, animated = true, variant = "default" }: LogoProps) {
  // More unique and creative logo design
  return (
    <motion.div
      className={cn("relative", className)}
      style={{ width: size, height: size }}
      whileHover={variant === "default" ? { rotate: 5 } : undefined}
    >
      {/* Base circle */}
      <motion.div
        className="absolute inset-0 rounded-full bg-forest"
        initial={animated ? { scale: 0 } : { scale: 1 }}
        animate={animated ? { scale: 1 } : { scale: 1 }}
        transition={{ type: "spring", duration: 0.8 }}
      />

      {/* Animated rings */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute inset-0 rounded-full border-2 border-white opacity-30"
          initial={animated ? { scale: 0.5, opacity: 0 } : { scale: 1 + i * 0.15, opacity: 0.3 - i * 0.1 }}
          animate={
            animated
              ? {
                  scale: [0.5, 1 + i * 0.15],
                  opacity: [0, 0.3 - i * 0.1],
                }
              : { scale: 1 + i * 0.15, opacity: 0.3 - i * 0.1 }
          }
          transition={{
            delay: i * 0.2,
            duration: 1.5,
            repeat: variant === "splash" ? Number.POSITIVE_INFINITY : 0,
            repeatDelay: 2,
          }}
        />
      ))}

      {/* "S" letter */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        initial={animated ? { opacity: 0, scale: 0.5 } : { opacity: 1, scale: 1 }}
        animate={animated ? { opacity: 1, scale: 1 } : { opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <motion.svg
          width={size * 0.6}
          height={size * 0.6}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <motion.path
            d="M17 9.2C17 11.3 15.3 13 13.2 13H10.8C8.7 13 7 14.7 7 16.8C7 18.9 8.7 20.6 10.8 20.6H13.2C15.3 20.6 17 18.9 17 16.8"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={animated ? { pathLength: 0 } : { pathLength: 1 }}
            animate={animated ? { pathLength: 1 } : { pathLength: 1 }}
            transition={{ delay: 0.7, duration: 1 }}
          />
          <motion.path
            d="M7 14.8C7 12.7 8.7 11 10.8 11H13.2C15.3 11 17 9.3 17 7.2C17 5.1 15.3 3.4 13.2 3.4H10.8C8.7 3.4 7 5.1 7 7.2"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={animated ? { pathLength: 0 } : { pathLength: 1 }}
            animate={animated ? { pathLength: 1 } : { pathLength: 1 }}
            transition={{ delay: 0.9, duration: 1 }}
          />
        </motion.svg>
      </motion.div>

      {/* Animated dots */}
      {variant === "splash" &&
        [...Array(4)].map((_, i) => (
          <motion.div
            key={`dot-${i}`}
            className="absolute w-2 h-2 bg-white rounded-full"
            initial={{
              x: 0,
              y: 0,
              opacity: 0,
            }}
            animate={{
              x: [0, Math.cos((i * Math.PI) / 2) * size * 0.7],
              y: [0, Math.sin((i * Math.PI) / 2) * size * 0.7],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 2,
              delay: 1 + i * 0.2,
              repeat: Number.POSITIVE_INFINITY,
              repeatDelay: 3,
            }}
          />
        ))}
    </motion.div>
  )
}

