"use client"

import { useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { CreditCard, Shield, Zap, Globe, BarChart, UserCheck, Repeat, Wallet } from "lucide-react"

export default function Features() {
  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  })

  const features = [
    {
      icon: <CreditCard className="h-6 w-6" />,
      title: "Smart Contract Subscriptions",
      description: "Automate recurring payments with customizable parameters for frequency, amount, and duration.",
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Stablecoin Integration",
      description: "Eliminate volatility concerns with stablecoins for reliable subscription payments.",
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "AI-Powered Risk Management",
      description: "Advanced algorithms analyze on-chain data to create credit risk profiles and detect fraud.",
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: "Global Accessibility",
      description: "Borderless payments with minimal fees, allowing businesses to reach customers worldwide.",
    },
    {
      icon: <BarChart className="h-6 w-6" />,
      title: "Business Dashboard",
      description: "Comprehensive tools for creating subscription plans and monitoring subscriber metrics.",
    },
    {
      icon: <UserCheck className="h-6 w-6" />,
      title: "User Control",
      description: "Subscribers maintain complete control over payment authorizations with easy modification options.",
    },
    {
      icon: <Repeat className="h-6 w-6" />,
      title: "Flexible Billing Cycles",
      description: "Configure daily, weekly, monthly, or custom billing cycles to match your business needs.",
    },
    {
      icon: <Wallet className="h-6 w-6" />,
      title: "Multi-wallet Support",
      description: "Compatible with popular blockchain wallets for seamless integration with existing infrastructure.",
    },
  ]

  return (
    <section ref={containerRef} id="features" className="py-24 bg-gray-50 relative overflow-hidden">
      {/* Animated background elements */}
      <motion.div
        className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-forest opacity-5"
        style={{
          x: useTransform(scrollYProgress, [0, 1], [100, -100]),
          y: useTransform(scrollYProgress, [0, 1], [-100, 100]),
        }}
      />
      <motion.div
        className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-forest opacity-5"
        style={{
          x: useTransform(scrollYProgress, [0, 1], [-100, 100]),
          y: useTransform(scrollYProgress, [0, 1], [100, -100]),
        }}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          className="text-center max-w-3xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <motion.span
            className="inline-block py-1 px-3 rounded-full bg-green-100 text-forest text-sm font-medium mb-6"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            Powerful Features
          </motion.span>
          <motion.h2
            className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Advanced Features for Modern Businesses
          </motion.h2>
          <motion.p
            className="text-lg text-gray-600"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            // viewport={{ onceopacity: 0, y: 20 }}
            // whileInView={{ opacity: 1, y: 0 }}
            // viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            SubPay combines cutting-edge blockchain technology with user-friendly design to create the ultimate
            subscription payment solution.
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 relative z-10"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <motion.div
                className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-forest mb-6"
                animate={{
                  rotate: [0, 0, 10, -10, 0],
                  scale: [1, 1, 1.1, 1.1, 1],
                }}
                transition={{
                  duration: 4,
                  times: [0, 0.7, 0.8, 0.9, 1],
                  repeat: Number.POSITIVE_INFINITY,
                  repeatDelay: index * 0.5,
                }}
              >
                {feature.icon}
              </motion.div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>

              {/* Animated corner accent */}
              <motion.div
                className="absolute top-0 right-0 w-0 h-0 border-t-[20px] border-r-[20px] border-t-forest border-r-transparent opacity-0"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 0.7 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 + index * 0.1, duration: 0.3 }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

