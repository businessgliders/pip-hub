import React from 'react';
import { LogOut } from 'lucide-react';
import { motion } from 'framer-motion';

// Floating "End Your Shift" button.
// On mobile it sits above the bottom tab bar; on desktop it floats bottom-right
// above the MacDock area.
export default function EndShiftButton({ onClick }) {
  return (
    <motion.button
      onClick={onClick}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.4 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="fixed z-40 right-4 bottom-[88px] lg:bottom-28 flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-[#f1889b] to-[#f7b1bd] text-white shadow-lg shadow-[#f1889b]/40 hover:shadow-xl hover:shadow-[#f1889b]/50 transition-shadow border border-white/40 backdrop-blur-sm"
      title="End of day"
      aria-label="End of day"
    >
      <LogOut className="w-4 h-4" />
      <span className="text-sm font-semibold tracking-tight">End of Day</span>
    </motion.button>
  );
}