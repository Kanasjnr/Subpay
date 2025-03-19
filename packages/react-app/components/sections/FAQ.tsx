"use client"

import { motion } from "framer-motion"
import { useState } from "react"
import { ChevronDown } from "lucide-react"

export default function FAQ() {
  const faqs = [
    {
      question: "How does SubPay work for businesses?",
      answer:
        "SubPay provides businesses with tools to create and manage subscription plans on the blockchain. You can set up customizable billing cycles, pricing tiers, and payment terms. Our smart contracts automatically execute recurring payments based on the subscription parameters, while our dashboard gives you real-time analytics on subscriber metrics.",
    },
    {
      question: "What are the benefits of blockchain-based subscriptions?",
      answer:
        "Blockchain-based subscriptions offer several advantages: significantly lower transaction fees (0.5-2% vs 5-10% with traditional processors), transparent and immutable payment records, global accessibility without currency conversion issues, and enhanced security through decentralized architecture.",
    },
    {
      question: "Which cryptocurrencies does SubPay support?",
      answer:
        "SubPay primarily uses stablecoins like USDC, DAI, and USDT to eliminate volatility concerns for both businesses and subscribers. This ensures that subscription amounts remain consistent regardless of crypto market fluctuations.",
    },
    {
      question: "How do users manage their subscriptions?",
      answer:
        "Subscribers have complete control over their payments through our user dashboard. They can view active subscriptions, modify payment terms, pause subscriptions, and cancel at any time with full transparency. All changes are recorded on the blockchain for verification.",
    },
    {
      question: "Is SubPay compatible with my existing business tools?",
      answer:
        "Yes, SubPay offers API integrations with popular business tools including CRM systems, accounting software, and e-commerce platforms. We also provide developer tools to build custom integrations for specific business requirements.",
    },
    {
      question: "How secure is SubPay?",
      answer:
        "Security is our top priority. SubPay's smart contracts undergo rigorous security audits by independent firms, and we employ multi-signature protocols for transaction verification. Our risk management system uses AI to detect and prevent fraudulent activities in real-time.",
    },
  ]

  const [activeIndex, setActiveIndex] = useState<number | null>(0)

  const toggleFAQ = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index)
  }

  return (
    <section id="faq" className="py-24 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center max-w-3xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block py-1 px-3 rounded-full bg-green-100 text-forest text-sm font-medium mb-6">
            FAQs
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
          <p className="text-lg text-gray-600">
            Everything you need to know about SubPay and blockchain-based subscription payments.
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              className="mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
            >
              <button
                className={`w-full flex justify-between items-center text-left p-5 rounded-lg ${
                  activeIndex === index ? "bg-white shadow-md" : "bg-white border border-gray-200 hover:bg-gray-50"
                }`}
                onClick={() => toggleFAQ(index)}
              >
                <span className="font-medium text-gray-900">{faq.question}</span>
                <ChevronDown
                  className={`h-5 w-5 text-gray-500 transition-transform ${
                    activeIndex === index ? "transform rotate-180" : ""
                  }`}
                />
              </button>
              {activeIndex === index && (
                <div className="bg-white px-5 pb-5 pt-2 rounded-b-lg shadow-md -mt-2">
                  <p className="text-gray-600">{faq.answer}</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        <motion.div
          className="mt-16 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <p className="text-gray-600 mb-4">Still have questions?</p>
          <a
            href="#contact"
            className="inline-flex items-center bg-forest hover:bg-forest/90 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Contact Support
          </a>
        </motion.div>
      </div>
    </section>
  )
}

