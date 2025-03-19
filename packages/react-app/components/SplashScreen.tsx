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

        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fillStyle =
          particle.color +
          Math.floor(particle.opacity * 255)
            .toString(16)
            .padStart(2, "0")
        ctx.fill()

        if (particle.opacity <= 0) {
          particles.splice(index, 1)
        }
      })

      if (particles.length > 0) {
        requestAnimationFrame(animate)
      }
    }

    animate()
  }, [showParticles])

  useEffect(() => {
    // Show logo first
    const logoTimer = setTimeout(() => {
      setShowText(true)
    }, 500)

    // Show particles
    const particlesTimer = setTimeout(() => {
      setShowParticles(true)
    }, 800)

    // After animation completes, trigger the onComplete callback
    const completeTimer = setTimeout(() => {
      setShowLogo(false)
      setTimeout(onComplete, 300) // Give a little time for exit animation
    }, 2500)

    return () => {
      clearTimeout(logoTimer)
      clearTimeout(particlesTimer)
      clearTimeout(completeTimer)
    }
  }, [onComplete])

  return (
    <AnimatePresence>
      {showLogo && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

          <motion.div
            className="relative z-10"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
          >
            <Logo size={180} variant="splash" animated />
          </motion.div>

          <AnimatePresence>
            {showText && (
              <motion.div
                className="mt-12 relative z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <motion.div
                  className="overflow-hidden"
                  initial={{ height: 0 }}
                  animate={{ height: "auto" }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  <motion.h1
                    className="text-7xl font-bold text-gray-900 relative"
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <motion.span
                      className="text-[#35D07F] inline-block"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: 0.2 }}
                    >
                      Sub
                    </motion.span>
                    <motion.span
                      className="inline-block"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: 0.3 }}
                    >
                      Pay
                    </motion.span>
                  </motion.h1>
                </motion.div>

                <motion.div
                  className="h-0.5 bg-gradient-to-r from-transparent via-[#35D07F] to-transparent"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: "100%", opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                />

                <motion.p
                  className="text-xl text-gray-500 mt-6 text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                >
                  The Future of Web3 Subscription Payments
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            className="absolute bottom-10 left-0 right-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex justify-center">
              <div className="w-64 h-1 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#35D07F] to-[#35D07F]/50"
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

