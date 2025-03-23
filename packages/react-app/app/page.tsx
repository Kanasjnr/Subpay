"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import Header from "@/components/Layout/Header"
import Hero from "@/components/sections/Hero"
import Features from "@/components/sections/Features"
import HowItWorks from "@/components/sections/HowItWorks"
import UseCases from "@/components/sections/UsesCases"
import FAQ from "@/components/sections/FAQ"
// import CTA from "@/components/sections/CTA"
import Contact from "@/components/sections/Contact"
import Footer from "@/components/Layout/Footer"
import SplashScreen from "@/components/SplashScreen"
// import { ConnectButton } from '@rainbow-me/rainbowkit'
// import Link from 'next/link'
// import { CreatePlanForm } from '@/components/subscription/CreatePlanForm'
// import { PlanList } from '@/components/subscription/PlanList'
// import { SubscriptionList } from '@/components/subscription/SubscriptionList'
// import { OpenDisputeForm } from '@/components/subscription/OpenDisputeForm'
// import { SubmitEvidenceForm } from '@/components/subscription/SubmitEvidenceForm'
// import { ResolveDisputeForm } from '@/components/subscription/ResolveDisputeForm'
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
// import { Card } from '@/components/ui/card'

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
            className="min-h-screen flex flex-col bg-black text-white"
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
              {/* <CTA /> */}
              <Contact />
            </main>
            <Footer />
          </motion.div>
        )}
      </AnimatePresence>

      {/* <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="flex flex-col items-center justify-center space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <h1 className="text-4xl md:text-6xl font-bold mb-4">
                Welcome to CeloSubPay
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 mb-8">
                DeFi-based subscription payment protocol on the Celo blockchain
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl mt-12"
            >
              <Link href="/subscriber">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gray-800 p-8 rounded-xl border border-gray-700 hover:border-green-500 transition-colors"
                >
                  <h2 className="text-2xl font-bold mb-4">Subscriber</h2>
                  <p className="text-gray-400">
                    Manage your subscriptions and make payments with crypto
                  </p>
                </motion.div>
              </Link>

              <Link href="/business">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gray-800 p-8 rounded-xl border border-gray-700 hover:border-green-500 transition-colors"
                >
                  <h2 className="text-2xl font-bold mb-4">Business</h2>
                  <p className="text-gray-400">
                    Create and manage subscription plans for your services
                  </p>
                </motion.div>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-4">
        <h1 className="text-4xl font-bold mb-8">CeloSubPay</h1>

        <Tabs defaultValue="plans" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
            <TabsTrigger value="subscriptions">My Subscriptions</TabsTrigger>
            <TabsTrigger value="disputes">Disputes</TabsTrigger>
          </TabsList>

          <TabsContent value="plans">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="p-6">
                <h2 className="text-2xl font-semibold mb-4">Create Plan</h2>
                <CreatePlanForm />
              </Card>
              <Card className="p-6">
                <h2 className="text-2xl font-semibold mb-4">Available Plans</h2>
                <PlanList type="subscriber" />
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="subscriptions">
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4">My Subscriptions</h2>
              <SubscriptionList />
            </Card>
          </TabsContent>

          <TabsContent value="disputes">
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="p-6">
                <h2 className="text-2xl font-semibold mb-4">Open Dispute</h2>
                <OpenDisputeForm />
              </Card>
              <Card className="p-6">
                <h2 className="text-2xl font-semibold mb-4">Submit Evidence</h2>
                <SubmitEvidenceForm />
              </Card>
              <Card className="p-6">
                <h2 className="text-2xl font-semibold mb-4">Resolve Dispute</h2>
                <ResolveDisputeForm />
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div> */}
    </>
  )
}

