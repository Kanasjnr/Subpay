"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Logo from "@/components/ui/Logo"

interface SplashScreenProps {
  onComplete: () => void
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [showLogo, setShowLogo] = useState(true)
  const [showText, setShowText] = useState(false)
  const [showParticles, setShowParticles] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Particle animation
  useEffect(() => {
    if (!showParticles) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const particles: {
      x: number
      y: number
      size: number
      speedX: number
      speedY: number
      color: string
      opacity: number
      fadeSpeed: number
    }[] = []

    const createParticles = () => {
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2

      for (let i = 0; i < 100; i++) {
        const angle = Math.random() * Math.PI * 2
        const distance = Math.random() * 50 + 100

        particles.push({
          x: centerX,
          y: centerY,
          size: Math.random() * 3 + 1,
          speedX: Math.cos(angle) * (Math.random() * 2 + 1),
          speedY: Math.sin(angle) * (Math.random() * 2 + 1),
          color: i % 3 === 0 ? "#35D07F" : "#111111",
          opacity: 1,
          fadeSpeed: Math.random() * 0.02 + 0.005,
        })
      }
    }

    createParticles()

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.forEach((particle, index) => {
        particle.x += particle.speedX
        particle.y += particle.speedY
        particle.opacity -= particle.fadeSpeed

        if (particle.opacity <= 0) {
          particles.splice(index, 1)
          return
        }

        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fillStyle = particle.color
        ctx.globalAlpha = particle.opacity
        ctx.fill()
      })

      if (particles.length > 0) {
        requestAnimationFrame(animate)
      } else {
        onComplete()
      }
    }

    animate()

    return () => {
      particles.length = 0
    }
  }, [showParticles, onComplete])

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLogo(false)
      setShowText(true)
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (showText) {
      const timer = setTimeout(() => {
        setShowParticles(true)
      }, 500)

      return () => clearTimeout(timer)
    }
  }, [showText])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ zIndex: 1 }}
      />
      <AnimatePresence>
        {showLogo && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.5 }}
            className="relative z-10"
          >
            <Logo className="h-24 w-24" />
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showText && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 text-center"
          >
            <h1 className="text-4xl font-bold text-white mb-4">Welcome to SubPay</h1>
            <p className="text-lg text-gray-300">Your decentralized subscription platform</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 