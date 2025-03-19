"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Logo from "@/components/ui/Logo"

interface SplashScreenProps {
  onComplete: () => void
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [showLogo, setShowLogo] = useState(true)
  const [showText, setShowText] = useState(false)

  useEffect(() => {
    // Show logo first
    const logoTimer = setTimeout(() => {
      setShowText(true)
    }, 1000)

    // After animation completes, trigger the onComplete callback
    const completeTimer = setTimeout(() => {
      setShowLogo(false)
      setTimeout(onComplete, 500) // Give a little time for exit animation
    }, 4000)

    return () => {
      clearTimeout(logoTimer)
      clearTimeout(completeTimer)
    }
  }, [onComplete])

  return (
    <AnimatePresence>
      {showLogo && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-green-50 to-white"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
          >
            <Logo size={150} variant="splash" />
          </motion.div>

          <AnimatePresence>
            {showText && (
              <motion.div
                className="mt-8 relative"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <motion.div
                  className="overflow-hidden h-20"
                  initial={{ width: 0 }}
                  animate={{ width: "auto" }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  <motion.h1
                    className="text-6xl font-bold text-gray-900 relative"
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    <motion.span
                      className="text-forest"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: 0.8 }}
                    >
                      Sub
                    </motion.span>
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: 1.1 }}
                    >
                      Pay
                    </motion.span>
                  </motion.h1>
                </motion.div>

                <motion.div
                  className="absolute -bottom-1 left-0 right-0 h-1 bg-forest"
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 0.8, delay: 1.4 }}
                />

                <motion.p
                  className="text-lg text-gray-600 mt-6 text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 1.6 }}
                >
                  The Future of Subscription Payments
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            className="absolute bottom-10 left-0 right-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 0.5 }}
          >
            <div className="flex justify-center">
              <div className="w-64 h-1 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-forest"
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1.5, delay: 2, ease: "easeInOut" }}
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

