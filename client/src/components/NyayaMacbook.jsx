
import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="768" viewBox="0 0 1024 768">
  <rect width="1024" height="768" fill="#FFFFFF"/>
  
  <!-- Left Sidebar -->
  <rect width="220" height="768" fill="#1C1C1E"/>
  <text x="30" y="40" font-family="sans-serif" font-size="20" font-weight="bold" fill="#FFFFFF">⚖ Nyaya</text>
  
  <rect x="20" y="80" width="180" height="40" rx="8" fill="#2C2C2E"/>
  <text x="40" y="105" font-family="sans-serif" font-size="14" fill="#FFFFFF">AI Dispute Assistant</text>
  <text x="40" y="155" font-family="sans-serif" font-size="14" fill="#8E95AA">Dispute Queue</text>
  <text x="40" y="205" font-family="sans-serif" font-size="14" fill="#8E95AA">Analytics</text>
  <text x="40" y="255" font-family="sans-serif" font-size="14" fill="#8E95AA">Settings</text>
  
  <circle cx="40" cy="720" r="4" fill="#22C55E"/>
  <text x="55" y="724" font-family="sans-serif" font-size="12" fill="#8E95AA">Systems Nominal</text>

  <!-- Right Panel -->
  <rect x="800" y="0" width="224" height="768" fill="#1C1C1E"/>
  <text x="820" y="40" font-family="sans-serif" font-size="12" font-weight="bold" fill="#8E95AA">DISPUTE HISTORY</text>
  
  <!-- History Items -->
  <rect x="820" y="70" width="184" height="70" rx="8" fill="#2C2C2E"/>
  <text x="835" y="95" font-family="sans-serif" font-size="13" font-weight="bold" fill="#FFFFFF">Nike Air Max</text>
  <text x="835" y="115" font-family="sans-serif" font-size="11" fill="#4ADE80">Full Refund · ₹8,499</text>

  <rect x="820" y="150" width="184" height="70" rx="8" fill="#2C2C2E"/>
  <text x="835" y="175" font-family="sans-serif" font-size="13" font-weight="bold" fill="#FFFFFF">Zara Jacket</text>
  <text x="835" y="195" font-family="sans-serif" font-size="11" fill="#F87171">Denied · ₹3,990</text>
  
  <rect x="820" y="230" width="184" height="70" rx="8" fill="#2C2C2E"/>
  <text x="835" y="255" font-family="sans-serif" font-size="13" font-weight="bold" fill="#FFFFFF">MacBook Charger</text>
  <text x="835" y="275" font-family="sans-serif" font-size="11" fill="#FCD34D">Partial Refund · ₹2,500</text>

  <!-- Main Panel -->
  <rect x="220" y="0" width="580" height="60" fill="#FFFFFF"/>
  <line x1="220" y1="60" x2="800" y2="60" stroke="#E5E7EB" stroke-width="1"/>
  <text x="250" y="38" font-family="sans-serif" font-size="16" font-weight="bold" fill="#1C1C1E">Case #NY-4892 · boAt Airdopes 141</text>

  <!-- Chat Messages -->
  <rect x="250" y="100" width="380" height="50" rx="12" fill="#FFF7ED"/>
  <text x="270" y="130" font-family="sans-serif" font-size="14" fill="#9A3412">User: I ordered boAt Airdopes 141, no OTP was asked.</text>

  <rect x="250" y="170" width="400" height="50" rx="12" fill="#F3F4F6"/>
  <text x="270" y="200" font-family="sans-serif" font-size="14" fill="#374151">Nyaya: Investigating with Evidence Agent...</text>

  <!-- Verdict Card in UI -->
  <rect x="250" y="250" width="500" height="280" rx="16" fill="#0A0A0A"/>
  <text x="280" y="290" font-family="serif" font-size="20" fill="#FFFFFF">4-Agent Dispute Resolution</text>
  
  <circle cx="710" cy="285" r="16" fill="#052E16"/>
  <text x="700" y="290" font-family="sans-serif" font-size="12" font-weight="bold" fill="#4ADE80">89</text>
  
  <text x="280" y="350" font-family="sans-serif" font-size="32" font-weight="bold" fill="#4ADE80">FULL REFUND</text>
  <text x="280" y="390" font-family="sans-serif" font-size="24" fill="#FFFFFF">₹2,499</text>

  <!-- Agent chips -->
  <rect x="280" y="440" width="100" height="30" rx="15" fill="#1C1C1E" stroke="#2C2C2E" stroke-width="1"/>
  <text x="295" y="460" font-family="sans-serif" font-size="12" fill="#FFFFFF">🔍 Evidence</text>
  
  <rect x="390" y="440" width="100" height="30" rx="15" fill="#1C1C1E" stroke="#2C2C2E" stroke-width="1"/>
  <text x="405" y="460" font-family="sans-serif" font-size="12" fill="#FFFFFF">🏪 Merchant</text>

  <rect x="280" y="480" width="100" height="30" rx="15" fill="#1C1C1E" stroke="#2C2C2E" stroke-width="1"/>
  <text x="295" y="500" font-family="sans-serif" font-size="12" fill="#FFFFFF">👤 Customer</text>

  <rect x="390" y="480" width="100" height="30" rx="15" fill="#1C1C1E" stroke="#E8732A" stroke-width="1"/>
  <text x="405" y="500" font-family="sans-serif" font-size="12" fill="#E8732A">⚖ Judge</text>

</svg>
`;

const svgDataUri = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgContent)))}`;

export function NyayaMacbook() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end end"]
  });

  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1, 1]);
  const translateY = useTransform(scrollYProgress, [0, 0.5, 1], [100, 0, 0]);

  return (
    <div ref={containerRef} style={{ background: 'white', padding: '120px 0 80px', overflow: 'hidden' }}>
      <div style={{ textAlign: 'center', marginBottom: '80px', padding: '0 20px' }}>
        <h2 style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 600, color: '#E8732A', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          The product
        </h2>
        <h3 style={{ fontFamily: '"DM Serif Display", serif', fontSize: 'clamp(32px, 5vw, 56px)', color: '#0A0A0A', maxWidth: '800px', margin: '0 auto 24px', lineHeight: 1.1 }}>
          Everything your dispute team needs. In one screen.
        </h3>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '20px', color: '#3D3D3F', maxWidth: '640px', margin: '0 auto', lineHeight: 1.6 }}>
          As you scroll, see how Nyaya's three panels work together — chat, queue, and analytics in one unified workspace.
        </p>
      </div>

      <motion.div style={{ scale, y: translateY, transformOrigin: "top center", maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>
        <div style={{ 
            background: '#E5E5E5', 
            padding: '16px 16px 0', 
            borderRadius: '24px 24px 0 0',
            boxShadow: '0 30px 60px rgba(0,0,0,0.15)'
        }}>
          <div style={{ 
              background: '#0A0A0A', 
              borderRadius: '12px 12px 0 0',
              overflow: 'hidden',
              aspectRatio: '16/11.5',
              position: 'relative',
              border: '6px solid #0A0A0A',
              borderBottom: 'none'
          }}>
            <img 
              src={svgDataUri} 
              alt="Nyaya Platform Interface" 
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top left' }} 
            />
          </div>
        </div>
        {/* Macbook Base Component */}
        <div style={{
            background: 'linear-gradient(to bottom, #d4d4d8, #a1a1aa)',
            height: '24px',
            borderRadius: '0 0 24px 24px',
            position: 'relative',
            boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.5)'
        }}>
            {/* Indent for thumb */}
            <div style={{ 
              position: 'absolute', 
              left: '50%', 
              top: 0, 
              transform: 'translateX(-50%)', 
              width: '140px', 
              height: '10px', 
              background: '#a1a1aa', 
              borderRadius: '0 0 10px 10px',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
            }}></div>
        </div>
      </motion.div>
    </div>
  );
}
