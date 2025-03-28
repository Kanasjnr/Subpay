'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function CTA() {
  return (
    <section className="py-20 bg-gradient-to-r from-black to-gray-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-[#35D07F]/30"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, Math.random() * 100 - 50],
              opacity: [0.3, 0.7, 0.3],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 3,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: 'reverse',
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <motion.div
              className="mb-8 md:mb-0 md:mr-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3 }}
            >
              <motion.h2
                className="text-3xl md:text-4xl font-bold text-white mb-4"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3 }}
              >
                Ready to Transform Your Subscription Business?
              </motion.h2>
              <motion.p
                className="text-lg text-gray-400"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3 }}
              >
                Join thousands of businesses already using SubPay to manage
                their subscription payments efficiently on the blockchain.
              </motion.p>
            </motion.div>

            <div className="flex flex-col sm:flex-row gap-4">
              <motion.button
                onClick={() => window.location.href = '#get-started'}
                className="connect-wallet-button bg-[#35D07F] hover:bg-[#35D07F]/90 text-black rounded-lg px-6 py-3 font-medium transition-colors"
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 0 15px rgba(53, 208, 127, 0.5)",
                }}
                whileTap={{ scale: 0.95 }}
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </motion.button>
              <motion.button
                onClick={() => window.location.href = '#demo'}
                className="connect-wallet-button border border-[#35D07F] text-[#35D07F] hover:bg-[#35D07F]/10 font-medium rounded-lg px-6 py-3 transition-colors"
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 0 15px rgba(53, 208, 127, 0.3)",
                }}
                whileTap={{ scale: 0.95 }}
              >
                Schedule Demo
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
