import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] overflow-hidden flex flex-col relative text-white">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-orange-500/20 blur-[120px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="absolute top-0 left-0 w-full p-6 md:p-8 flex justify-between items-center z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center text-xl shadow-lg shadow-orange-500/20">
            ⚖️
          </div>
          <span className="text-2xl font-bold tracking-tight">Nyaya AI</span>
        </div>
        <Link 
          to="/chat"
          className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/10 px-6 py-2.5 rounded-full font-medium transition-all"
        >
          Sign In
        </Link>
      </header>

      {/* Hero Content */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 font-medium text-sm mb-8">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            Nyaya v1.0 is now live
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1]">
            Resolve Disputes <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
              In Seconds, Not Days.
            </span>
          </h1>

          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
            The world's first autonomous AI dispute resolution platform. 
            Powered by a 4-Agent consensus architecture to adjudicate e-commerce claims instantly with 98% accuracy.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              to="/chat"
              className="group relative px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-full text-lg transition-all shadow-[0_0_40px_-10px_rgba(249,115,22,0.5)] hover:shadow-[0_0_60px_-10px_rgba(249,115,22,0.6)]"
            >
              Launch Live Demo
              <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>
        </motion.div>

        {/* Feature Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-24"
        >
          {[
            { title: '4-Agent Consensus', desc: 'Judge, Merchant, Customer, and Evidence agents work in parallel to ensure unbiased verdicts.' },
            { title: 'AI Vision Evidence', desc: 'Automatically analyzes uploaded images to detect damaged goods and fraudulent claims.' },
            { title: 'Zero Human Dependency', desc: 'End-to-end resolution pipeline that fully processes and closes tickets in under 10 seconds.' }
          ].map((feature, i) => (
            <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm text-left hover:bg-white/[0.07] transition-colors">
              <h3 className="text-xl font-bold text-gray-100 mb-3">{feature.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </motion.div>
      </main>

      {/* Grid Pattern Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
      />
    </div>
  );
}
