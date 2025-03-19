"use client"

import { useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { ArrowRight, Shield, Zap, Globe } from "lucide-react"
import Logo from "@/components/ui/Logo"

export default function Hero() {
  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  })

  const y = useTransform(scrollYProgress, [0, 1], [0, 200])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <section
      ref={containerRef}
      className="relative pt-32 pb-20 overflow-hidden bg-gradient-to-b from-green-50 to-white"
    >
      {/* Animated background elements */}
      <motion.div className="absolute inset-0 z-0" style={{ y, opacity }}>
        <motion.div
          className="absolute top-20 left-10 w-64 h-64 rounded-full bg-green-200 opacity-20"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 20, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 15,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
          }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-80 h-80 rounded-full bg-blue-200 opacity-20"
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -30, 0],
            y: [0, -20, 0],
          }}
          transition={{
            duration: 18,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
          }}
        />
      </motion.div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col-reverse lg:flex-row items-center justify-between gap-12">
          {/* Left Content */}
          <motion.div className="w-full lg:w-1/2" initial="hidden" animate="visible" variants={containerVariants}>
            <div className="max-w-lg">
              <motion.div variants={itemVariants}>
                <motion.span
                  className="inline-block py-1 px-3 rounded-full bg-green-100 text-forest text-sm font-medium mb-6"
                  animate={{
                    boxShadow: [
                      "0px 0px 0px rgba(53, 208, 127, 0)",
                      "0px 0px 15px rgba(53, 208, 127, 0.5)",
                      "0px 0px 0px rgba(53, 208, 127, 0)",
                    ],
                  }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatDelay: 1 }}
                >
                  The Future of Subscription Payments
                </motion.span>
              </motion.div>
              <motion.h1
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6"
                variants={itemVariants}
              >
                Seamless Recurring{" "}
                <motion.span
                  className="text-forest relative inline-block"
                  animate={{
                    color: ["#35D07F", "#2EB873", "#35D07F"],
                  }}
                  transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
                >
                  Blockchain
                  <motion.div
                    className="absolute -bottom-2 left-0 right-0 h-1 bg-forest rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ delay: 1.2, duration: 0.8 }}
                  />
                </motion.span>{" "}
                Payments
              </motion.h1>
              <motion.p className="text-lg text-gray-600 mb-8" variants={itemVariants}>
                SubPay enables businesses to create flexible subscription models with automated payments on the
                blockchain, giving users complete control and transparency.
              </motion.p>
              <motion.div className="flex flex-wrap gap-4" variants={itemVariants}>
                <motion.a
                  href="#get-started"
                  className="bg-forest hover:bg-forest/90 text-white font-medium rounded-lg px-6 py-3 inline-flex items-center transition-colors"
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
                  className="bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 font-medium rounded-lg px-6 py-3 inline-flex items-center transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  View Demo
                </motion.a>
              </motion.div>

              {/* Trust indicators */}
              <motion.div className="mt-12" variants={itemVariants}>
                <p className="text-sm font-medium text-gray-500 mb-4">TRUSTED BY INNOVATIVE COMPANIES</p>
                <div className="flex flex-wrap items-center gap-8">
                  {[1, 2, 3, 4].map((i) => (
                    <motion.div
                      key={i}
                      className="h-8 w-auto grayscale opacity-70"
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 0.7 }}
                      transition={{ delay: 1.5 + i * 0.2, duration: 0.5 }}
                    >
                      <div className="h-8 bg-gray-300 rounded w-24"></div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Right Content - 3D Illustration */}
          <motion.div
            className="w-full lg:w-1/2"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Main illustration */}
            <div className="relative mx-auto max-w-md lg:max-w-full">
              <div className="relative">
                <motion.div
                  className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  whileHover={{ y: -5, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.1)" }}
                >
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <Logo size={24} animated={false} />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">SubPay Dashboard</p>
                        <p className="text-xs text-gray-500">Subscription Manager</p>
                      </div>
                    </div>
                    <motion.div
                      className="bg-green-50 text-green-700 text-xs font-medium px-2.5 py-0.5 rounded-full"
                      animate={{
                        scale: [1, 1.05, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Number.POSITIVE_INFINITY,
                      }}
                    >
                      Active
                    </motion.div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-500">Active Subscribers</p>
                      <motion.p
                        className="text-sm font-medium"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                      >
                        <motion.span
                          animate={{
                            opacity: [0, 1],
                            y: [20, 0],
                          }}
                          transition={{ duration: 0.5, delay: 0.5 }}
                        >
                          1,248
                        </motion.span>
                      </motion.p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-500">Monthly Revenue</p>
                      <motion.p
                        className="text-sm font-medium"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.7, duration: 0.5 }}
                      >
                        <motion.span
                          animate={{
                            opacity: [0, 1],
                            y: [20, 0],
                          }}
                          transition={{ duration: 0.5, delay: 0.7 }}
                        >
                          12,450 cUSD
                        </motion.span>
                      </motion.p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-500">Retention Rate</p>
                      <motion.p
                        className="text-sm font-medium"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.9, duration: 0.5 }}
                      >
                        <motion.span
                          animate={{
                            opacity: [0, 1],
                            y: [20, 0],
                          }}
                          transition={{ duration: 0.5, delay: 0.9 }}
                        >
                          94.2%
                        </motion.span>
                      </motion.p>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-forest rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: "84%" }}
                        transition={{ delay: 1.1, duration: 1, ease: "easeOut" }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mt-6">
                    {[
                      { icon: <Shield className="h-4 w-4" />, label: "Secure" },
                      { icon: <Zap className="h-4 w-4" />, label: "Fast" },
                      { icon: <Globe className="h-4 w-4" />, label: "Global" },
                    ].map((item, i) => (
                      <motion.div
                        key={i}
                        className="flex flex-col items-center p-2 bg-gray-50 rounded-lg"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.3 + i * 0.2, duration: 0.5 }}
                      >
                        <motion.div
                          className="text-forest mb-1"
                          animate={{
                            scale: [1, 1.2, 1],
                          }}
                          transition={{
                            duration: 2,
                            delay: i * 0.5,
                            repeat: Number.POSITIVE_INFINITY,
                            repeatDelay: 3,
                          }}
                        >
                          {item.icon}
                        </motion.div>
                        <p className="text-xs font-medium text-gray-600">{item.label}</p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Floating elements */}
                <motion.div
                  className="absolute -top-6 -right-6 bg-forest text-white p-4 rounded-xl shadow-lg"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                //   animate={{
                //     y: [0, -10, 0],
                //     transition: {
                //       duration: 4,
                //       repeat: Number.POSITIVE_INFINITY,
                //       repeatType: "reverse",
                //     },
                //   }}
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                      <Zap className="h-4 w-4" />
                    </div>
                    <div className="ml-3">
                      <p className="text-xs font-medium">Save up to</p>
                      <p className="text-lg font-bold">95% on fees</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-lg border border-gray-100"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7, duration: 0.5 }}
                //   animate={{
                //     y: [0, 10, 0],
                //     transition: {
                //       duration: 5,
                //       repeat: Number.POSITIVE_INFINITY,
                //       repeatType: "reverse",
                //     },
                //   }}
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-forest">
                      <Shield className="h-4 w-4" />
                    </div>
                    <div className="ml-3">
                      <p className="text-xs font-medium text-gray-500">Payment Status</p>
                      <p className="text-sm font-bold text-gray-900">Fully Secured</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

