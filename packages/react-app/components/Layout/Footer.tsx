import Link from "next/link"
import Image from "next/image"
import { Facebook, Twitter, Linkedin, Github } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="flex items-center">
              <Image src="/subpay-logo.svg" alt="SubPay Logo" width={40} height={40} className="mr-2" />
              <span className="font-bold text-xl text-gray-900">SubPay</span>
            </Link>
            <p className="mt-4 text-sm text-gray-600 max-w-xs">
              The future of subscription payments on the blockchain. Empowering businesses with automated recurring
              transactions.
            </p>
            <div className="mt-6 flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-forest transition-colors" aria-label="Twitter">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-forest transition-colors" aria-label="LinkedIn">
                <Linkedin size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-forest transition-colors" aria-label="GitHub">
                <Github size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-forest transition-colors" aria-label="Facebook">
                <Facebook size={20} />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">Product</h3>
            <ul className="space-y-3">
              {["Features", "Integrations", "Pricing", "FAQ", "Roadmap"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-gray-600 hover:text-forest transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">Company</h3>
            <ul className="space-y-3">
              {["About", "Blog", "Jobs", "Press", "Partners"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-gray-600 hover:text-forest transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">Legal</h3>
            <ul className="space-y-3">
              {["Privacy", "Terms", "Security", "Licenses"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-gray-600 hover:text-forest transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <a href="#" className="inline-flex items-center text-sm font-medium text-forest hover:text-forest/80">
                Documentation
                <svg
                  className="ml-1 w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  ></path>
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} SubPay Protocol. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

