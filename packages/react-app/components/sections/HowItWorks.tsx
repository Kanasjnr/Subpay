"use client"

import { useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { CheckCircle2, Wallet, FileText, CreditCard, BarChart4 } from "lucide-react"
import Logo from "@/components/ui/Logo"

export default function HowItWorks() {
  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  })

  const y = useTransform(scrollYProgress, [0, 1], [100, -100])

  const steps = [
    {
      icon: <Wallet className="h-6 w-6" />,
      title: "Connect Wallet",
      description: "Connect your blockchain wallet to the SubPay platform to get started.",
      color: "bg-blue-100 text-blue-600",
    },
    {
      icon: <FileText className="h-6 w-6" />,
      title: "Create Subscription",
      description: "Businesses create subscription plans with customizable parameters.",
      color: "bg-purple-100 text-purple-600",
    },
    {
      icon: <CreditCard className="h-6 w-6" />,
      title: "Authorize Payment",
      description: "Users authorize recurring payments with full control over terms.",
      color: "bg-amber-100 text-amber-600",
    },
    {
      icon: <BarChart4 className="h-6 w-6" />,
      title: "Automated Billing",
      description: "Smart contracts execute scheduled payments based on subscription terms.",
      color: "bg-green-100 text-green-600",
    },
  ]

  return (
    <section ref={containerRef} id="how-it-works" className="py-24 bg-white relative overflow-hidden">
      {/* Animated background elements */}
      <motion.div
        className="absolute top-0 right-0 w-1/3 h-1/3 bg-green-50 rounded-bl-full opacity-50"
        style={{ y: useTransform(scrollYProgress, [0, 1], [-50, 50]) }}
      />
      <motion.div
        className="absolute bottom-0 left-0 w-1/4 h-1/4 bg-green-50 rounded-tr-full opacity-50"
        style={{ y: useTransform(scrollYProgress, [0, 1], [50, -50]) }}
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
            Simple Process
          </motion.span>
          <motion.h2
            className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            How SubPay Works
          </motion.h2>
          <motion.p
            className="text-lg text-gray-600"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Our protocol simplifies subscription management on the blockchain with a straightforward process for both
            businesses and subscribers.
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          {/* Left - Steps */}
          <div className="space-y-10">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                className="flex gap-4"
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
              >
                <motion.div
                  className={`h-14 w-14 shrink-0 rounded-full ${step.color} flex items-center justify-center`}
                  animate={{
                    boxShadow: [
                      "0px 0px 0px rgba(0,0,0,0)",
                      "0px 0px 20px rgba(0,0,0,0.1)",
                      "0px 0px 0px rgba(0,0,0,0)",
                    ],
                  }}
                  transition={{
                    duration: 3,
                    delay: index * 1,
                    repeat: Number.POSITIVE_INFINITY,
                    repeatDelay: 2,
                  }}
                >
                  {step.icon}
                </motion.div>
                <div>
                  <div className="flex items-center">
                    <motion.span
                      className="bg-gray-200 text-gray-800 font-bold text-xs rounded-full h-6 w-6 flex items-center justify-center mr-2"
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + index * 0.1, type: "spring", stiffness: 300 }}
                    >
                      {index + 1}
                    </motion.span>
                    <h3 className="font-semibold text-xl text-gray-900">{step.title}</h3>
                  </div>
                  <p className="mt-2 text-gray-600">{step.description}</p>
                </div>
              </motion.div>
            ))}

            {/* Connecting lines between steps */}
            <motion.div
              className="absolute left-[7px] top-0 bottom-0 w-0.5 bg-gray-200 hidden md:block"
              style={{
                height: "calc(100% - 120px)",
                top: "60px",
                left: "calc(50% - 150px)",
              }}
              initial={{ height: 0 }}
              whileInView={{ height: "calc(100% - 120px)" }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.5 }}
            />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="mt-8"
            >
              <motion.a
                href="#"
                className="inline-flex items-center bg-forest hover:bg-forest/90 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                whileHover={{ scale: 1.05, x: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                Learn More About the Process
                <motion.svg
                  className="ml-2 w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </motion.svg>
              </motion.a>
            </motion.div>
          </div>

          {/* Right - Illustration */}
          <motion.div
            className="relative"
            style={{ y }}
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 relative z-10"
              animate={{
                y: [0, -10, 0],
                boxShadow: [
                  "0px 10px 30px rgba(0,0,0,0.1)",
                  "0px 30px 40px rgba(0,0,0,0.2)",
                  "0px 10px 30px rgba(0,0,0,0.1)",
                ],
              }}
              transition={{
                duration: 6,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "reverse",
              }}
            >
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center">
                  <Logo size={36} className="mr-3" animated={false} />
                  <h3 className="text-xl font-bold text-gray-900">SubPay Dashboard</h3>
                </div>
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
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  <span className="text-sm text-green-600 font-medium">Live</span>
                </motion.div>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-3">Active Subscription Plans</h4>
                  <div className="space-y-3">
                    {[
                      { name: "Basic Plan", price: "9.99 cUSD", status: "Active", users: 842 },
                      { name: "Pro Plan", price: "29.99 cUSD", status: "Active", users: 367 },
                      { name: "Enterprise", price: "99.99 cUSD", status: "Active", users: 124 },
                    ].map((plan, i) => (
                      <motion.div
                        key={i}
                        className="flex justify-between items-center bg-gray-50 p-3 rounded-lg"
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 + i * 0.2, duration: 0.5 }}
                        animate={{
                          backgroundColor:
                            i === 0 ? ["rgb(249 250 251)", "rgb(240 253 244)", "rgb(249 250 251)"] : "rgb(249 250 251)",
                        }}
                        // transition={{
                        //   duration: 3,
                        //   repeat: Number.POSITIVE_INFINITY,
                        //   repeatDelay: 2,
                        // }}
                      >
                        <div>
                          <p className="font-medium text-gray-900">{plan.name}</p>
                          <p className="text-sm text-gray-500">{plan.price} / month</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-green-600">{plan.status}</p>
                          <p className="text-xs text-gray-500">{plan.users} subscribers</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <div className="flex justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-500">Monthly Revenue</h4>
                    <motion.span
                      className="text-sm font-medium text-green-600"
                      animate={{
                        y: [0, -3, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Number.POSITIVE_INFINITY,
                      }}
                    >
                      +12.5%
                    </motion.span>
                  </div>
                  <div className="h-12 bg-gray-100 rounded-lg overflow-hidden">
                    <motion.div
                      className="bg-gradient-to-r from-green-400 to-forest h-full"
                      initial={{ width: 0 }}
                      whileInView={{ width: "75%" }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Decoration elements */}
            <motion.div
              className="absolute -top-10 -left-10 h-32 w-32 bg-green-100 rounded-full opacity-60"
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 10, 0],
              }}
              transition={{
                duration: 8,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "reverse",
              }}
            />
            <motion.div
              className="absolute -bottom-10 -right-10 h-40 w-40 bg-green-100 rounded-full opacity-60"
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, -10, 0],
              }}
              transition={{
                duration: 10,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "reverse",
              }}
            />
            <motion.div
              className="absolute top-1/2 -right-6 transform -translate-y-1/2"
              animate={{
                y: [0, -10, 0],
                rotate: [0, 5, 0],
              }}
              transition={{
                duration: 4,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "reverse",
              }}
            >
              <CheckCircle2 className="h-12 w-12 text-forest" />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

