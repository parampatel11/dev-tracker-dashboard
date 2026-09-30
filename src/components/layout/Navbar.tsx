'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed top-6 left-0 right-0 z-50 flex justify-center w-full px-4 sm:px-8">
      <motion.nav 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-5xl bg-zinc-900/60 backdrop-blur-xl border border-white/5 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.4)]"
      >
        <div className="px-6 py-4 flex justify-between items-center">
          
          {/* Enhanced Logo */}
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex-shrink-0"
          >
            <Link href="/" className="text-3xl font-extrabold tracking-widest bg-gradient-to-br from-orange-500 via-orange-400 to-yellow-400 bg-clip-text text-transparent drop-shadow-sm">
              PARAM
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-3 lg:space-x-6">
            <NavBox href="#today" text="Today's work" />
            <NavBox href="#weekly" text="Weekly graph" />
            <NavBox href="#git" text="Git repo" />
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-400 hover:text-orange-400 focus:outline-none transition-colors duration-300"
            >
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden overflow-hidden border-t border-white/5"
            >
              <div className="px-6 pt-4 pb-6 flex flex-col gap-3">
                <NavBox href="#today" text="Today's work" />
                <NavBox href="#weekly" text="Weekly graph" />
                <NavBox href="#git" text="Git repo" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </div>
  );
}

function NavBox({ href, text }: { href: string; text: string }) {
  return (
    <Link href={href} className="block">
      <motion.div
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        className="px-5 py-2.5 rounded-xl border border-white/5 bg-white/5 text-sm font-semibold text-gray-300 transition-colors duration-300 hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-white hover:shadow-[0_0_15px_rgba(249,115,22,0.15)] flex justify-center items-center"
      >
        {text}
      </motion.div>
    </Link>
  );
}