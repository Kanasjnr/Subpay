'use client';

import type React from 'react';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { Mail, Send } from 'lucide-react';

export default function Contact() {
  const [formStatus, setFormStatus] = useState<
    'idle' | 'submitting' | 'success' | 'error'
  >('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus('submitting');

    // Simulate form submission
    setTimeout(() => {
      setFormStatus('success');
    }, 1500);
  };

  return (
    <section id="contact" className="py-16 sm:py-20 md:py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center max-w-3xl mx-auto mb-12 sm:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block py-1 px-3 rounded-full bg-green-100 text-forest text-sm font-medium mb-4 sm:mb-6">
            Get In Touch
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
            Contact Us
          </h2>
          <p className="text-base sm:text-lg text-gray-600">
            Have questions about SubPay? Our team is here to help you implement
            the perfect subscription solution for your business.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 max-w-6xl mx-auto">
          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
              Get in touch
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">
              Our team is ready to answer your questions and discuss how SubPay
              can help your business implement subscription models effectively.
            </p>

            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <Mail className="h-5 w-5 sm:h-6 sm:w-6 text-forest" />
                </div>
                <div className="ml-3 sm:ml-4">
                  <h4 className="text-sm sm:text-base font-medium text-gray-900">
                    Email Us
                  </h4>
                  <p className="mt-1 text-sm sm:text-base text-gray-600">info@subpay.io</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="bg-gray-50 rounded-2xl p-5 sm:p-8 border border-gray-200">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
                Send us a message
              </h3>

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
                  <div>
                    <label
                      htmlFor="first-name"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      First Name
                    </label>
                    <input
                      type="text"
                      id="first-name"
                      name="first-name"
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-forest/50 focus:border-forest text-sm sm:text-base"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="last-name"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Last Name
                    </label>
                    <input
                      type="text"
                      id="last-name"
                      name="last-name"
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-forest/50 focus:border-forest text-sm sm:text-base"
                      required
                    />
                  </div>
                </div>

                <div className="mb-4 sm:mb-6">
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-forest/50 focus:border-forest text-sm sm:text-base"
                    required
                  />
                </div>

                <div className="mb-4 sm:mb-6">
                  <label
                    htmlFor="subject"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-forest/50 focus:border-forest text-sm sm:text-base"
                    required
                  />
                </div>

                <div className="mb-4 sm:mb-6">
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-forest/50 focus:border-forest text-sm sm:text-base"
                    required
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={formStatus === 'submitting'}
                  className="w-full bg-forest hover:bg-forest/90 text-white font-medium py-2.5 sm:py-3 px-4 rounded-lg flex items-center justify-center transition-colors text-sm sm:text-base"
                >
                  {formStatus === 'submitting' ? (
                    <>Sending...</>
                  ) : (
                    <>
                      Send Message
                      <Send className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                    </>
                  )}
                </button>

                {formStatus === 'success' && (
                  <p className="mt-3 sm:mt-4 text-sm sm:text-base text-green-600 text-center">
                    Your message has been sent successfully!
                  </p>
                )}

                {formStatus === 'error' && (
                  <p className="mt-3 sm:mt-4 text-sm sm:text-base text-red-600 text-center">
                    There was an error sending your message. Please try again.
                  </p>
                )}
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
