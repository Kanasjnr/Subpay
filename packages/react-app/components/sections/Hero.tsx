"use client"

import { useRef, useEffect, useState } from "react"
import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion"
import { ArrowRight, Shield, Zap } from "lucide-react"
import Logo from "@/components/ui/Logo"

export default function Hero() {
  const containerRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  })

  const y = useTransform(scrollYProgress, [0, 1], [0, 200])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  // Mouse parallax effect
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const springConfig = { damping: 50, stiffness: 300 }
  const mouseXSpring = useSpring(mouseX, springConfig)
  const mouseYSpring = useSpring(mouseY, springConfig)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e
      const { innerWidth, innerHeight } = window

      // Calculate mouse position as percentage of screen
      const x = clientX / innerWidth - 0.5
      const y = clientY / innerHeight - 0.5

      setMousePosition({ x, y })
      mouseX.set(x)
      mouseY.set(y)
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [mouseX, mouseY])

  // Canvas animation
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resizeCanvas = () => {
      const { innerWidth, innerHeight } = window
      const dpr = window.devicePixelRatio || 1

      canvas.width = innerWidth * dpr
      canvas.height = innerHeight * dpr

      ctx.scale(dpr, dpr)

      canvas.style.width = `${innerWidth}px`
      canvas.style.height = `${innerHeight}px`
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Create grid of dots
    const dots: {
      x: number
      y: number
      size: number
      originalX: number
      originalY: number
      vx: number
      vy: number
    }[] = []

    const spacing = 50
    const margin = 100

    for (let x = margin; x < window.innerWidth - margin; x += spacing) {
      for (let y = margin; y < window.innerHeight - margin; y += spacing) {
        dots.push({
          x,
          y,
          size: Math.random() * 1.5 + 0.5,
          originalX: x,
          originalY: y,
          vx: 0,
          vy: 0,
        })
      }
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw dots
      dots.forEach((dot) => {
        // Calculate distance from mouse
        const dx = dot.x - (window.innerWidth / 2 + mousePosition.x * 200)
        const dy = dot.y - (window.innerHeight / 2 + mousePosition.y * 200)
        const distance = Math.sqrt(dx * dx + dy * dy)
        const maxDistance = 300

        // Move dots away from mouse
        if (distance < maxDistance) {
          const angle = Math.atan2(dy, dx)
          const force = (maxDistance - distance) / maxDistance

          dot.vx += Math.cos(angle) * force * 0.2
          dot.vy += Math.sin(angle) * force * 0.2
        }

        // Move dots back to original position
        dot.vx += (dot.originalX - dot.x) * 0.05
        dot.vy += (dot.originalY - dot.y) * 0.05

        // Apply friction
        dot.vx *= 0.9
        dot.vy *= 0.9

        // Update position
        dot.x += dot.vx
        dot.y += dot.vy

        // Draw dot
        ctx.beginPath()
        ctx.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2)
        ctx.fillStyle = "rgba(53, 208, 127, 0.5)"
        ctx.fill()

        // Draw connections
        dots.forEach((otherDot) => {
          const dx = dot.x - otherDot.x
          const dy = dot.y - otherDot.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 100) {
            ctx.beginPath()
            ctx.moveTo(dot.x, dot.y)
            ctx.lineTo(otherDot.x, otherDot.y)
            ctx.strokeStyle = `rgba(53, 208, 127, ${0.2 * (1 - distance / 100)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        })
      })

      requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
    }
  }, [mousePosition])

  return (
    <section
      ref={containerRef}
      className="relative pt-32 pb-20 overflow-hidden bg-black text-white min-h-screen flex items-center"
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          {/* Left Content */}
          <motion.div
            className="w-full lg:w-1/2"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="max-w-lg">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                <motion.span
                  className="inline-block py-1 px-3 rounded-full bg-[#35D07F]/20 text-[#35D07F] text-sm font-medium mb-6"
                  animate={{
                    boxShadow: [
                      "0px 0px 0px rgba(53, 208, 127, 0)",
                      "0px 0px 15px rgba(53, 208, 127, 0.5)",
                      "0px 0px 0px rgba(53, 208, 127, 0)",
                    ],
                  }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatDelay: 1 }}
                >
                  Web3 Subscription Protocol
                </motion.span>
              </motion.div>
              <motion.h1
                className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                <span className="block">Revolutionize</span>
                <span className="block">
                  <motion.span
                    className="text-[#35D07F] relative inline-block"
                    animate={{
                      color: ["#35D07F", "#4EEAA0", "#35D07F"],
                    }}
                    transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
                  >
                    Subscription
                  </motion.span>{" "}
                  Payments
                </span>
              </motion.h1>
              <motion.p
                className="text-xl text-gray-400 mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
              >
                Seamless, automated recurring payments on the blockchain with full user control and transparency.
              </motion.p>
              <motion.div
                className="flex flex-wrap gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.6 }}
              >
                <motion.a
                  href="#get-started"
                  className="bg-[#35D07F] hover:bg-[#35D07F]/90 text-black font-medium rounded-lg px-6 py-3 inline-flex items-center transition-colors"
                  whileHover={{ scale: 1.05, x: 5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Get Started
                  <motion.span
                    initial={{ x: 0 }}
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                  >
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </motion.span>
                </motion.a>
                <motion.a
                  href="#demo"
                  className="bg-transparent hover:bg-white/10 text-white border border-white/30 font-medium rounded-lg px-6 py-3 inline-flex items-center transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  View Demo
                </motion.a>
              </motion.div>

              {/* Stats */}
              <motion.div
                className="mt-16 grid grid-cols-3 gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 0.6 }}
              >
                {[
                  { value: "95%", label: "Lower Fees" },
                  { value: "100%", label: "Transparency" },
                  { value: "24/7", label: "Automation" },
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    className="text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 + i * 0.2, duration: 0.5 }}
                  >
                    <motion.p
                      className="text-3xl font-bold text-[#35D07F]"
                      animate={{
                        textShadow: [
                          "0px 0px 0px rgba(53, 208, 127, 0)",
                          "0px 0px 10px rgba(53, 208, 127, 0.7)",
                          "0px 0px 0px rgba(53, 208, 127, 0)",
                        ],
                      }}
                      transition={{
                        duration: 2,
                        delay: i * 0.5,
                        repeat: Number.POSITIVE_INFINITY,
                        repeatDelay: 3,
                      }}
                    >
                      {stat.value}
                    </motion.p>
                    <p className="text-sm text-gray-400">{stat.label}</p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </motion.div>

          {/* Right Content - 3D Illustration */}
          <motion.div
            className="w-full lg:w-1/2 relative"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            {/* 3D Subscription Card */}
            <motion.div
              className="relative z-20"
              style={{
                transformStyle: "preserve-3d",
                transform: useTransform(mouseXSpring, [-0.5, 0.5], ["rotateY(-10deg)", "rotateY(10deg)"]) as any,
              }}
            >
              <motion.div
                className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-8 border border-gray-800 shadow-[0_0_50px_rgba(53,208,127,0.3)]"
                whileHover={{
                  boxShadow: "0 0 70px rgba(53, 208, 127, 0.5)",
                  transition: { duration: 0.3 },
                }}
              >
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full bg-[#35D07F]/20 flex items-center justify-center">
                      <Logo size={28} animated={false} darkMode />
                    </div>
                    <div className="ml-3">
                      <p className="text-lg font-medium text-white">SubPay Protocol</p>
                      <p className="text-sm text-gray-400">Smart Subscription</p>
                    </div>
                  </div>
                  <motion.div
                    className="bg-[#35D07F]/20 text-[#35D07F] text-xs font-medium px-3 py-1 rounded-full"
                    animate={{
                      boxShadow: [
                        "0px 0px 0px rgba(53, 208, 127, 0)",
                        "0px 0px 10px rgba(53, 208, 127, 0.5)",
                        "0px 0px 0px rgba(53, 208, 127, 0)",
                      ],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Number.POSITIVE_INFINITY,
                      repeatDelay: 1,
                    }}
                  >
                    Active
                  </motion.div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-3">Subscription Details</h4>
                    <div className="space-y-4">
                      {[
                        { label: "Next payment", value: "June 15, 2023" },
                        { label: "Amount", value: "10 cUSD" },
                        { label: "Billing cycle", value: "Monthly" },
                      ].map((item, i) => (
                        <motion.div
                          key={i}
                          className="flex justify-between items-center"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 + i * 0.2, duration: 0.5 }}
                        >
                          <p className="text-sm text-gray-400">{item.label}</p>
                          <p className="text-sm font-medium text-white">{item.value}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-800">
                    <div className="flex justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-400">Status</h4>
                      <motion.div
                        className="flex items-center"
                        animate={{
                          opacity: [1, 0.7, 1],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Number.POSITIVE_INFINITY,
                        }}
                      >
                        <span className="w-2 h-2 bg-[#35D07F] rounded-full mr-2"></span>
                        <p className="text-sm font-medium text-[#35D07F]">Auto-renewing</p>
                      </motion.div>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden mt-4">
                      <motion.div
                        className="h-full bg-gradient-to-r from-[#35D07F] to-[#4EEAA0]"
                        initial={{ width: 0 }}
                        animate={{ width: "75%" }}
                        transition={{ delay: 1.1, duration: 1, ease: "easeOut" }}
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-800">
                    <motion.button
                      className="w-full bg-[#35D07F]/10 hover:bg-[#35D07F]/20 text-[#35D07F] font-medium py-3 px-4 rounded-lg transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Manage Subscription
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Floating elements */}
            <motion.div
              className="absolute -top-6 -right-6 bg-[#35D07F] text-black p-4 rounded-xl shadow-lg z-10"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.9, duration: 0.5 }}
              animate={{
                y: [0, -10, 0],
                transition: {
                  duration: 4,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "reverse",
                },
              }}
            >
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-black/20 flex items-center justify-center">
                  <Zap className="h-4 w-4" />
                </div>
                <div className="ml-3">
                  <p className="text-xs font-medium">Save up to</p>
                  <p className="text-lg font-bold">95% on fees</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="absolute -bottom-6 -left-6 bg-gray-900 p-4 rounded-xl shadow-lg border border-gray-800 z-10"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.1, duration: 0.5 }}
              animate={{
                y: [0, 10, 0],
                transition: {
                  duration: 5,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "reverse",
                },
              }}
            >
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-[#35D07F]/20 flex items-center justify-center text-[#35D07F]">
                  <Shield className="h-4 w-4" />
                </div>
                <div className="ml-3">
                  <p className="text-xs font-medium text-gray-400">Payment Status</p>
                  <p className="text-sm font-bold text-white">Fully Secured</p>
                </div>
              </div>
            </motion.div>

            {/* Animated blockchain nodes */}
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-3 h-3 rounded-full bg-[#35D07F]/50"
                style={{
                  top: `${20 + i * 15}%`,
                  left: `${10 + i * 20}%`,
                  zIndex: 5,
                }}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5],
                  boxShadow: [
                    "0 0 0 rgba(53, 208, 127, 0)",
                    "0 0 20px rgba(53, 208, 127, 0.8)",
                    "0 0 0 rgba(53, 208, 127, 0)",
                  ],
                }}
                transition={{
                  duration: 3,
                  delay: i * 0.5,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "reverse",
                }}
              />
            ))}

            {/* Connection lines */}
            <svg className="absolute inset-0 w-full h-full z-0" viewBox="0 0 500 500" fill="none">
              {[...Array(4)].map((_, i) => (
                <motion.path
                  key={i}
                  d={`M${100 + i * 100},${100 + i * 50} L${150 + i * 50},${300 - i * 30}`}
                  stroke="#35D07F"
                  strokeWidth="1"
                  strokeDasharray="5,5"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.3 }}
                  transition={{ duration: 1.5, delay: 1.2 + i * 0.2 }}
                />
              ))}
            </svg>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

