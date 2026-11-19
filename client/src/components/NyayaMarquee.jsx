import React from 'react';

const cardData = [
  // FULL REFUND (4)
  { type: 'FULL REFUND', color: '#4ade80', bg: '#052e16', border: '#166534', dot: '#4ade80', products: ["boAt Airdopes 141", "OnePlus Nord CE", "Zebronics Headphones", "Portronics Earbuds"], amounts: ["₹2,499", "₹8,999", "₹1,299", "₹899"], confs: ["89%", "92%", "88%", "94%"] },
  // DENIED (4)
  { type: 'DENIED', color: '#f87171', bg: '#1c0a09', border: '#7f1d1d', dot: '#f87171', products: ["FabIndia Kurta", "Wildcraft Bag", "Puma Sneakers", "H&M Jacket"], amounts: ["₹0", "₹0", "₹0", "₹0"], confs: ["91%", "88%", "94%", "87%"] },
  // PARTIAL REFUND (4)
  { type: 'PARTIAL REFUND', color: '#fcd34d', bg: '#1c1003', border: '#92400e', dot: '#fcd34d', products: ["Ceramic Dinner Set", "Mixer Grinder", "Study Lamp", "Bluetooth Speaker"], amounts: ["₹625", "₹1,200", "₹450", "₹800"], confs: ["74%", "71%", "76%", "68%"] },
  // ESCALATED (4)
  { type: 'ESCALATED', color: '#fb923c', bg: '#1a0e03', border: '#9a3412', dot: '#fb923c', products: ["Noise Smartwatch", "Sony WH-1000XM4", "Apple AirPods Pro", "Samsung Watch"], amounts: ["N/A", "N/A", "N/A", "N/A"], confs: ["43%", "38%", "51%", "45%"], note: "Senior review required" }
];

export function NyayaMarquee() {
  const staticCards = [
    { type: "FULL REFUND", amount: "₹2,499", product: "boAt Airdopes 141", conf: "89% confidence", time: "8.3s", color: "#4ADE80" },
    { type: "DENIED", amount: "₹3,499", product: "Designer Kurta Set", conf: "91% confidence", time: "6.1s", color: "#F87171" },
    { type: "PARTIAL REFUND", amount: "₹2,150", product: "Ceramic Dinner Set", conf: "74% confidence", time: "9.8s", color: "#FCD34D" },
    { type: "ESCALATED", amount: "₹4,999", product: "Noise Smartwatch Pro", conf: "43% confidence", time: "7.2s", color: "#FB923C" },
    { type: "FULL REFUND", amount: "₹8,999", product: "OnePlus Nord CE", conf: "92% confidence", time: "7.4s", color: "#4ADE80" },
    { type: "DENIED", amount: "₹1,299", product: "Zebronics Headphones", conf: "88% confidence", time: "6.6s", color: "#F87171" }
  ];

  return (
    <div style={{ background: '#0A0A0A', padding: '120px 0', overflow: 'hidden' }}>
        <h2 style={{ fontFamily: '"DM Serif Display", serif', fontSize: 'clamp(32px, 5vw, 48px)', color: 'white', textAlign: 'center', marginBottom: '16px' }}>
            Verdicts flowing. Right now.
        </h2>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '18px', color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginBottom: '60px' }}>
            Every card below is a real dispute type Nyaya resolves in under 10 seconds.
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>
            {staticCards.map((card, i) => (
                <div key={i} style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '16px',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    transition: 'transform 0.2s, background 0.2s',
                    cursor: 'default'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: card.color }}></div>
                        <span style={{ color: card.color, fontSize: '12px', fontWeight: 700, letterSpacing: '0.5px' }}>
                            {card.type}
                        </span>
                    </div>
                    <div style={{ color: 'white', fontSize: '18px', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>
                        {card.product}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '16px' }}>
                        <div>
                            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginBottom: '4px' }}>Value</div>
                            <div style={{ color: 'white', fontSize: '20px', fontWeight: 700, fontFamily: '"DM Serif Display", serif' }}>{card.amount}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginBottom: '4px' }}>{card.conf}</div>
                            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>Processed in {card.time}</div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
}
