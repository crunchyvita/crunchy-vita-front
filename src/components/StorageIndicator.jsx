/**
 * StorageIndicator Component
 * 
 * Visual indicator to show when pack configuration is
 * loaded from or saved to localStorage
 */

"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Save, RefreshCw } from "lucide-react";

export function StorageIndicator({ action, show, duration = 2000 }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration]);

  const config = {
    save: {
      icon: Save,
      text: "Configuration sauvegardée",
      color: "bg-green-500",
    },
    restore: {
      icon: RefreshCw,
      text: "Configuration restaurée",
      color: "bg-blue-500",
    },
  };

  const current = config[action] || config.save;
  const Icon = current.icon;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-24 right-4 z-50"
        >
          <div
            className={`${current.color} text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2`}
          >
            <Icon size={16} className="animate-pulse" />
            <span className="text-sm font-bold">{current.text}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default StorageIndicator;
