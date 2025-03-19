"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import Header from "@/components/Layout/Header"
import Hero from "@/components/sections/Hero"
import Features from "@/components/sections/Features"
import HowItWorks from "@/components/sections/HowItWorks"
import UseCases from "@/components/sections/UsesCases"
import FAQ from "@/components/sections/FAQ"
import CTA from "@/components/sections/CTA"
import Contact from "@/components/sections/Contact"
import Footer from "@/components/Layout/Footer"
import SplashScreen from "@/components/SplashScreen"

export default function Home() {
  const [isMounted, setIsMounted] = useState(false)
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleSplashComplete = () => {
    setShowSplash(false)
  }

  if (!isMounted) {
    return null
  }

  return (
    <>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}

      <AnimatePresence>
        {!showSplash && (
          <motion.div
            className="min-h-screen flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <Header />
            <main className="flex-grow">
              <Hero />
              <Features />
              <HowItWorks />
              <UseCases />
              <FAQ />
              <CTA />
              <Contact />
            </main>
            <Footer />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

