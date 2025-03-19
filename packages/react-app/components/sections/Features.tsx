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
    <section ref={containerRef} id="features" className="py-24 bg-white relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMzNUQwN0YiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0aDR2MWgtNHYtMXptMC0yaDF2NGgtMXYtNHptMi0yaDF2MWgtMXYtMXptLTIgMmgxdjFoLTF2LTF6bS0yLTJoMXYxaC0xdi0xem0yLTJoMXYxaC0xdi0xem0tMiAyaDF2MWgtMXYtMXptLTItMmgxdjFoLTF2LTF6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />

      <motion.div
        className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-[#35D07F] opacity-5"
        style={{
          x: useTransform(scrollYProgress, [0, 1], [100, -100]),
          y: useTransform(scrollYProgress, [0, 1], [-100, 100]),
        }}
      />
      <motion.div
        className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-[#35D07F] opacity-5"
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
            className="inline-block py-1 px-3 rounded-full bg-[#35D07F]/20 text-[#35D07F] text-sm font-medium mb-6"
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
            transition={{ duration: 0.4 }}
          >
            Advanced Web3 Subscription Technology
          </motion.h2>
          <motion.p
            className="text-lg text-gray-600"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            SubPay combines cutting-edge blockchain technology with user-friendly design to create the ultimate
            subscription payment solution.
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm relative z-10 h-full"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileHover={{
                y: -10,
                boxShadow: "0 20px 30px rgba(53, 208, 127, 0.2)",
                borderColor: "rgba(53, 208, 127, 0.5)",
                transition: { duration: 0.3 },
              }}
            >
              <motion.div
                className="w-12 h-12 bg-[#35D07F]/10 rounded-lg flex items-center justify-center text-[#35D07F] mb-6"
                animate={{
                  boxShadow: [
                    "0px 0px 0px rgba(53, 208, 127, 0)",
                    "0px 0px 20px rgba(53, 208, 127, 0.3)",
                    "0px 0px 0px rgba(53, 208, 127, 0)",
                  ],
                }}
                transition={{
                  duration: 3,
                  delay: index * 0.5,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatDelay: 1,
                }}
              >
                {feature.icon}
              </motion.div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>

              {/* Animated corner accent */}
              <motion.div
                className="absolute top-0 right-0 w-0 h-0 border-t-[20px] border-r-[20px] border-t-[#35D07F] border-r-transparent opacity-0"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 0.7 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3 }}
              />

              {/* Animated glow effect on hover */}
              <motion.div
                className="absolute inset-0 rounded-xl bg-[#35D07F] opacity-0 z-[-1]"
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 0.05 }}
                transition={{ duration: 0.3 }}
              />
            </motion.div>
          ))}
        </div>

        {/* Animated connection lines */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 800" fill="none" preserveAspectRatio="none">
          {[...Array(6)].map((_, i) => (
            <motion.path
              key={i}
              d={`M${200 + i * 150},200 C${300 + i * 100},400 ${400 + i * 100},300 ${500 + i * 150},600`}
              stroke="#35D07F"
              strokeWidth="1"
              strokeDasharray="5,5"
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 0.2 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
            />
          ))}
        </svg>
      </div>
    </section>
  )
}

