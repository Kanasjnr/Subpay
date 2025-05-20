'use client';

import { useState, useEffect } from 'react';
import {
  motion,
  useScroll,
  AnimatePresence,
} from 'framer-motion';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import Logo from '@/components/ui/Logo';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { RoleSelectionModal } from '@/components/Layout/RoleSelectionModal';
import { usePathname } from 'next/navigation';

const navItems = [
  { name: 'Features', href: '#Features' },
  { name: 'How It Works', href: '#HowItWorks' },
  { name: 'Use Cases', href: '#UsesCases' },
  { name: 'Contact', href: '#Contact' },
];

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [hasShownModal, setHasShownModal] = useState(false);
  const { scrollY } = useScroll();
  const { address } = useAccount();
  const pathname = usePathname();
  const isLandingPage = pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Only show the modal if:
    // 1. There's a connected wallet
    // 2. We haven't shown the modal before
    // 3. We're on the home page
    if (address && !hasShownModal && isLandingPage) {
      setShowRoleModal(true);
      setHasShownModal(true);
    }
  }, [address, hasShownModal, isLandingPage]);

  useEffect(() => {
    if (!isLandingPage) {
      setShowRoleModal(false);
    }
  }, [isLandingPage]);

  return (
    <>
      <motion.header
        className={cn(
          'fixed top-0 left-0 right-0 z-50',
          isScrolled
            ? 'bg-white/80 backdrop-blur-md border-b border-gray-100 py-2'
            : 'bg-transparent py-4'
        )}
        initial={{ y: 0, opacity: 1 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <Logo size={28} className="mr-2" animated={false} />
              <motion.span
                className="font-extrabold text-base sm:text-lg md:text-xl text-gray-900"
                initial={{ opacity: 1, x: 0 }}
                animate={{ opacity: 1, x: 0 }}
              >
                SubPay
              </motion.span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-6 xl:space-x-8">
              {navItems.map((item) => (
                <motion.a
                  key={item.name}
                  href={item.href}
                  className="text-sm font-extrabold text-gray-700 hover:text-[#35D07F]"
                  initial={{ opacity: 1, y: 0 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{
                    color: '#35D07F',
                    textShadow: '0 0 8px rgba(53, 208, 127, 0.5)',
                  }}
                >
                  {item.name}
                </motion.a>
              ))}
            </nav>

            {/* Action Button */}
            <div className="hidden lg:block">
              <ConnectButton />
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              className="lg:hidden text-gray-900 p-2 -mr-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden fixed top-[60px] left-0 right-0 bg-white border-t border-gray-100 shadow-lg z-40"
          >
            <div className="container mx-auto px-4 py-4 space-y-4">
              {navItems.map((item) => (
                <motion.a
                  key={item.name}
                  href={item.href}
                  className="block text-gray-700 py-3 font-extrabold text-lg border-b border-gray-100 last:border-0"
                  onClick={() => setMobileMenuOpen(false)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {item.name}
                </motion.a>
              ))}
              <div className="pt-4 border-t border-gray-100">
                <ConnectButton />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Role Selection Modal */}
      {isLandingPage && (
        <RoleSelectionModal 
          isOpen={showRoleModal} 
          onClose={() => setShowRoleModal(false)} 
        />
      )}
    </>
  );
}
