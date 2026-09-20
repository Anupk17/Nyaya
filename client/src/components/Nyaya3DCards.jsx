import React from "react";
import { CardContainer, CardBody, CardItem } from "./ui/3d-card";

export function Nyaya3DCards() {
  const agents = [
    {
      icon: "🔍",
      name: "Evidence Agent",
      model: "Groq Llama3 8B",
      desc: "Scores OTP status, photo validity, invoice match, and filing time. No bias. Just evidence.",
      tags: ["84/100", "OTP ✗", "Photo ✓"],
      bias: "Bias: None",
      biasColor: "#9CA3AF",
      bg: "white",
      text: "#0A0A0A",
      tagBg: "#F2F2F0",
      tagText: "#0A0A0A",
      border: "1px solid #E5E5E3"
    },
    {
      icon: "🏪",
      name: "Merchant Advocate",
      model: "Groq Llama3 8B",
      desc: "Builds the strongest possible defense for the seller using Paytm Merchant SLA terms. Advocates only.",
      tags: ["DEFEND", "OTP Confirmed", "Policy: §4.2"],
      bias: "Bias: Pro-Merchant",
      biasColor: "#F87171",
      bg: "#1C1C1E",
      text: "white",
      tagBg: "rgba(255,255,255,0.1)",
      tagText: "white",
      border: "none"
    },
    {
      icon: "👤",
      name: "Customer Advocate",
      model: "Groq Llama3 8B",
      desc: "Builds the strongest case for the buyer using RBI Consumer Protection Guidelines. Advocates, doesn't judge.",
      tags: ["RBI §10.4", "Filed: 3hrs", "Invoice ✓"],
      bias: "Bias: Pro-Customer",
      biasColor: "#F87171",
      bg: "white",
      text: "#0A0A0A",
      tagBg: "#F2F2F0",
      tagText: "#0A0A0A",
      border: "1px solid #E5E5E3"
    },
    {
      icon: "⚖",
      name: "Judge Agent",
      model: "Groq Llama3 70B",
      desc: "Receives all three agent outputs. Applies evidence + policy + memory. Below 65% confidence? Always escalates.",
      tags: ["89% Confidence", "FULL REFUND", "₹2,499"],
      bias: "Bias: None — Neutral arbiter",
      biasColor: "#4ADE80",
      bg: "#0A0A0A",
      text: "white",
      tagBg: "rgba(232, 115, 42, 0.2)",
      tagText: "#E8732A",
      border: "2px solid #E8732A"
    }
  ];

  return (
    <div style={{ background: '#F2F2F0', padding: '100px 0' }}>
      <div style={{ textAlign: 'center', marginBottom: '60px', padding: '0 20px' }}>
        <h2 style={{ fontFamily: '"DM Serif Display", serif', fontSize: 'clamp(32px, 4vw, 48px)', color: '#0A0A0A', marginBottom: '12px' }}>
          Meet the four agents.
        </h2>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '18px', color: '#3D3D3F' }}>
          Each one specialised. None of them neutral except the Judge.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', maxWidth: '1200px', margin: '0 auto', padding: '0 24px', overflowX: 'auto' }}>
        {agents.map((agent, i) => (
          <div key={i} style={{
            background: agent.bg,
            borderRadius: '24px',
            padding: '32px 24px',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 10px 40px rgba(0,0,0,0.04)',
            position: 'relative',
            minHeight: '360px',
            minWidth: '260px'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '20px' }}>{agent.icon}</div>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: agent.text, fontFamily: 'Inter, sans-serif', marginBottom: '12px' }}>
              {agent.name}
            </h3>
            <div style={{ alignSelf: 'flex-start', background: agent.tagBg, color: agent.tagText, fontSize: '11px', fontWeight: '700', padding: '6px 12px', borderRadius: '100px', marginBottom: '20px', letterSpacing: '0.5px' }}>
              {agent.model}
            </div>
            <p style={{ fontSize: '14px', color: agent.text === 'white' ? 'rgba(255,255,255,0.7)' : '#6B7280', lineHeight: '1.6', fontFamily: 'Inter, sans-serif', flexGrow: 1 }}>
              {agent.desc}
            </p>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '24px', marginBottom: '32px' }}>
              {agent.tags.map((tag, j) => (
                <span key={j} style={{ background: agent.bg === 'white' ? '#F3F4F6' : 'rgba(255,255,255,0.05)', color: agent.text, fontSize: '11px', fontWeight: '600', padding: '6px 12px', borderRadius: '100px' }}>
                  {tag}
                </span>
              ))}
            </div>

            <div style={{ position: 'absolute', bottom: '24px', fontSize: '12px', color: agent.biasColor, fontFamily: 'Inter, sans-serif', fontWeight: '600' }}>
              {agent.bias}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
