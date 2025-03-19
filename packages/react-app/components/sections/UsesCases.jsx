"use client"

import { motion } from "framer-motion"
import { MonitorSmartphone, BookOpen, Music, VideoIcon, ShoppingBag, Newspaper } from "lucide-react"

export default function UseCases() {
  const useCases = [
    {
      icon: <MonitorSmartphone className="h-10 w-10" />,
      title: "SaaS Platforms",
      description:
        "Streamline recurring billing for software services with flexible subscription tiers and usage-based pricing.",
    },
    {
      icon: <BookOpen className="h-10 w-10" />,
      title: "Educational Content",
      description: "Monetize educational materials with subscription access to premium courses and resources.",
    },
    {
      icon: <Music className="h-10 w-10" />,
      title: "Media Streaming",
      description:
        "Offer subscription packages for music, podcasts, and audio content with transparent royalty payments.",
    },
    {
      icon: <VideoIcon className="h-10 w-10" />,
      title: "Video Platforms",
      description: "Enable creators to offer subscription-based video content with direct monetization.",
    },
    {
      icon: <ShoppingBag className="h-10 w-10" />,
      title: "Subscription Boxes",
      description: "Manage recurring physical product deliveries with automated billing and shipping coordination.",
    },
    {
      icon: <Newspaper className="h-10 w-10" />,
      title: "Digital Publishing",
      description: "Create sustainable business models for news organizations and individual content creators.",
    },
  ]

  return (
    <section id="use-cases" className="py-24 bg-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-green-50 rounded-bl-full opacity-50"></div>
      <div className="absolute bottom-0 left-0 w-1/4 h-1/4 bg-green-50 rounded-tr-full opacity-50"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block py-1 px-3 rounded-full bg-green-100 text-forest text-sm font-medium mb-6">
              Industry Solutions
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Transforming Businesses Across Industries
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              SubPay empowers a wide range of businesses to implement subscription models efficiently and securely,
              creating new revenue streams and improving customer relationships.
            </p>

            <div className="flex items-center space-x-8">
              <div className="flex flex-col items-center">
                <span className="text-3xl font-bold text-forest">95%</span>
                <span className="text-sm text-gray-500">Cost Reduction</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-3xl font-bold text-forest">24/7</span>
                <span className="text-sm text-gray-500">Availability</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-3xl font-bold text-forest">100+</span>
                <span className="text-sm text-gray-500">Integrations</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="relative w-full h-[400px] rounded-xl shadow-lg bg-gradient-to-br from-green-50 to-white overflow-hidden">
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <motion.div className="grid grid-cols-2 gap-4 p-8 w-full max-w-md">
                  {[
                    { icon: <MonitorSmartphone className="h-10 w-10 text-forest" />, label: "SaaS" },
                    { icon: <BookOpen className="h-10 w-10 text-forest" />, label: "Education" },
                    { icon: <Music className="h-10 w-10 text-forest" />, label: "Media" },
                    { icon: <ShoppingBag className="h-10 w-10 text-forest" />, label: "E-commerce" },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      className="flex flex-col items-center justify-center bg-white p-4 rounded-lg shadow-sm"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <motion.div
                        animate={{
                          scale: [1, 1.1, 1],
                          rotate: [0, 5, 0],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Number.POSITIVE_INFINITY,
                          repeatDelay: 1,
                        }}
                      >
                        {item.icon}
                      </motion.div>
                      <p className="mt-2 font-medium text-gray-700">{item.label}</p>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>

              {/* Animated connection lines */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 500 400" fill="none">
                <motion.path
                  d="M150 200 L350 200"
                  stroke="#35D07F"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.5 }}
                  transition={{ duration: 1.5 }}
                />
                <motion.path
                  d="M250 100 L250 300"
                  stroke="#35D07F"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.5 }}
                  transition={{ duration: 1.5 }}
                />
              </svg>

              {/* Animated circles */}
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full bg-forest opacity-10"
                  style={{
                    width: 100 + i * 50,
                    height: 100 + i * 50,
                    top: "50%",
                    left: "50%",
                    x: "-50%",
                    y: "-50%",
                  }}
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.1, 0.15, 0.1],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Number.POSITIVE_INFINITY,
                    repeatType: "reverse",
                  }}
                />
              ))}
            </div>
            <div className="absolute -bottom-6 -right-6 bg-forest text-white p-4 rounded-xl shadow-lg">
              <p className="font-medium">Trusted by 500+ businesses</p>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {useCases.map((useCase, index) => (
            <motion.div
              key={index}
              className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileHover={{ y: -5, transition: { duration: 0.3 } }}
            >
              <div className="w-16 h-16 rounded-lg flex items-center justify-center text-forest mb-6 bg-green-50">
                {useCase.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{useCase.title}</h3>
              <p className="text-gray-600 mb-4">{useCase.description}</p>
              <a href="#" className="text-forest font-medium flex items-center hover:underline">
                Learn more
                <svg
                  className="ml-2 w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

