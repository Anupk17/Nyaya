import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Upload, Zap, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const seen = localStorage.getItem('nyaya_welcome_seen');
    if (!seen) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('nyaya_welcome_seen', 'true');
    setIsOpen(false);
  };

  const handleStart = () => {
    handleClose();
    navigate('/chat');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 z-[1000] border border-gray-100"
          >
            <button 
              onClick={handleClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⚖️</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Nyaya</h2>
              <p className="text-gray-500">AI-powered dispute resolution platform.</p>
            </div>

            <div className="space-y-6 mb-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">1. Describe your dispute</h3>
                  <p className="text-sm text-gray-500">Tell the AI what went wrong in the chat.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">2. Upload any evidence</h3>
                  <p className="text-sm text-gray-500">Attach photos, invoices, or screenshots.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">3. Click Run Resolution</h3>
                  <p className="text-sm text-gray-500">Get a 4-agent consensus verdict in under 10s.</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleStart}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors shadow-lg shadow-orange-500/25"
            >
              Start Resolving
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
