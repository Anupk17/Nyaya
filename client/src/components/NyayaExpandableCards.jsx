import React, { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useOutsideClick } from "@/hooks/use-outside-click";

export function NyayaExpandableCards() {
  const [active, setActive] = useState(null);
  const ref = useRef(null);
  const id = useId();

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === "Escape") {
        setActive(false);
      }
    }

    if (active && typeof active === "object") {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active]);

  useOutsideClick(ref, () => setActive(null));

  return (
    <div style={{ background: 'white', padding: '120px 0' }}>
      <div style={{ textAlign: 'center', marginBottom: '60px' }}>
        <h2 style={{ fontFamily: '"DM Serif Display", serif', fontSize: '48px', color: '#0A0A0A', marginBottom: '12px' }}>
          Four types of dispute. Four different outcomes.
        </h2>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '18px', color: '#3D3D3F' }}>
          Click any case to see exactly how Nyaya reasons through it.
        </p>
      </div>

      <AnimatePresence>
        {active && typeof active === "object" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 h-full w-full z-10"
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {active && typeof active === "object" ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center sm:px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setActive(null)}
            />
            <motion.div
              layoutId={`card-${active.title}-${id}`}
              className="relative w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl z-10 flex flex-col"
              style={{ maxHeight: '90vh' }}
            >
              <div className="p-8 pb-4 flex justify-between items-start border-b border-neutral-100">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: active.dotColor }}></div>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: active.dotColor }}>{active.typeBadge}</span>
                  </div>
                  <motion.h3
                    layoutId={`title-${active.title}-${id}`}
                    className="font-bold text-neutral-900 font-sans text-2xl"
                  >
                    {active.title}
                  </motion.h3>
                  <motion.p
                    layoutId={`description-${active.description}-${id}`}
                    className="text-neutral-500 text-sm font-sans mt-2"
                  >
                    {active.description}
                  </motion.p>
                </div>
                <button
                  onClick={() => setActive(null)}
                  className="w-10 h-10 bg-neutral-100 hover:bg-neutral-200 rounded-full flex items-center justify-center text-neutral-500 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
              <div className="p-8 overflow-y-auto">
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-neutral-600 text-sm font-sans flex flex-col gap-6"
                >
                    <div>
                        <strong className="text-neutral-800">Dispute:</strong>
                        <p className="text-neutral-600 mt-1">{active.expanded.dispute}</p>
                    </div>
                    <div>
                        <strong className="text-neutral-800">Agent findings:</strong>
                        <div className="flex flex-col gap-3 mt-2">
                            {active.expanded.agents.map((agent, i) => (
                                <div key={i} className="flex flex-col gap-1">
                                    <div className="flex gap-2 items-center">
                                        <span className="font-semibold text-neutral-700">{agent.name}</span>
                                    </div>
                                    <p className="text-neutral-600 pl-6">{agent.text}</p>
                                    <div className="pl-6 pt-1">
                                        <span className="px-2 py-1 rounded-md text-[10px] font-bold" style={{ backgroundColor: agent.chipBg, color: agent.chipColor }}>
                                            {agent.chipText}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div style={{ background: active.expanded.verdictBg, borderRadius: '8px', padding: '16px', color: active.expanded.verdictColor, fontWeight: 500, lineHeight: 1.5 }}>
                        {active.expanded.verdictText.split('\n').map((line, i) => <div key={i}>{line}</div>)}
                    </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
      <ul className="max-w-3xl mx-auto w-full gap-4 px-4 flex flex-col items-stretch">
        {cards.map((card) => (
          <motion.div
            layoutId={`card-${card.title}-${id}`}
            key={`card-${card.title}-${id}`}
            onClick={() => setActive(card)}
            className="p-5 flex flex-col md:flex-row justify-between items-center hover:bg-neutral-50 rounded-2xl cursor-pointer transition-all duration-200"
          >
            <div className="flex gap-4 flex-col md:flex-row items-center w-full">
              <div className="flex items-center gap-6 w-full">
                <div style={{ width: '130px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: card.dotColor }}></div>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: card.dotColor }}>{card.typeBadge}</span>
                </div>
                <div className="flex-1 text-left">
                  <motion.h3
                    layoutId={`title-${card.title}-${id}`}
                    className="font-semibold text-neutral-900 font-sans text-lg"
                  >
                    {card.title}
                  </motion.h3>
                  <motion.p
                    layoutId={`description-${card.description}-${id}`}
                    className="text-neutral-500 text-sm font-sans mt-1"
                  >
                    {card.description}
                  </motion.p>
                </div>
              </div>
            </div>
            <motion.button
              layoutId={`button-${card.title}-${id}`}
              className="px-5 py-2 text-sm rounded-full font-semibold text-neutral-900 shrink-0 whitespace-nowrap mt-4 md:mt-0 bg-neutral-100 hover:bg-neutral-200 transition-colors"
            >
              See reasoning
            </motion.button>
          </motion.div>
        ))}
      </ul>
    </div>
  );
}

const CloseIcon = () => {
  return (
    <motion.svg
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.05 } }}
      xmlns="http://www.w3.org/2000/svg"
      width="24" height="24" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className="h-4 w-4 text-black"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M18 6l-12 12" />
      <path d="M6 6l12 12" />
    </motion.svg>
  );
};

const cards = [
  {
    typeBadge: "FULL REFUND",
    dotColor: "#4ADE80",
    title: "boAt Airdopes 141 · ₹2,499",
    description: "89% confidence · 8.3 seconds",
    expanded: {
        dispute: "Customer ordered boAt Airdopes 141 wireless earbuds for ₹2,499. Delivery marked delivered but no OTP confirmation exists. Photo filed within 3 hours. Invoice present.",
        agents: [
            { name: "🔍 Evidence Agent", text: "No OTP proof. Photo valid. Evidence score: 84/100", chipText: "REFUND LIKELY", chipBg: "#DCFCE7", chipColor: "#166534" },
            { name: "🏪 Merchant Agent", text: "Delivery records show fulfillment but no OTP captured.", chipText: "PARTIAL CONCEDE", chipBg: "#FEF3C7", chipColor: "#92400E" },
            { name: "👤 Customer Agent", text: "RBI §10.4 applies. Filed within 3hrs. Strong case.", chipText: "STRONG", chipBg: "#DCFCE7", chipColor: "#166534" },
            { name: "⚖ Judge Agent", text: "No proof of delivery. Escrow window open. Recommend full refund via escrow withhold.", chipText: "FULL REFUND", chipBg: "#DCFCE7", chipColor: "#166534" }
        ],
        verdictBg: "#052e16",
        verdictColor: "#4ADE80",
        verdictText: "AI recommends full refund of ₹2,499\nMechanism: Escrow withhold\nTimeline: 2-4 hours after approval"
    }
  },
  {
    typeBadge: "DENIED",
    dotColor: "#F87171",
    title: "Designer Kurta Set · ₹3,499",
    description: "91% confidence · 6.1 seconds",
    expanded: {
        dispute: "Customer bought FashionHub kurta. OTP confirmed 6 days ago. Item received in perfect condition. Customer wants return because color looks different IRL.",
        agents: [
            { name: "🔍 Evidence Agent", text: "OTP confirmed. No photos. Report after 6 days. Score: 18/100", chipText: "DENY LIKELY", chipBg: "#FEE2E2", chipColor: "#991B1B" },
            { name: "🏪 Merchant Agent", text: "OTP confirms delivery. Buyer remorse. Not liable under §3.2", chipText: "DEFEND", chipBg: "#FEE2E2", chipColor: "#991B1B" },
            { name: "👤 Customer Agent", text: "Color variance claim without evidence. Filed too late.", chipText: "WEAK", chipBg: "#FEE2E2", chipColor: "#991B1B" },
            { name: "⚖ Judge Agent", text: "OTP confirmed delivery. Buyer remorse not covered. No evidence of product defect.", chipText: "DENY", chipBg: "#FEE2E2", chipColor: "#991B1B" }
        ],
        verdictBg: "#1c0a09",
        verdictColor: "#F87171",
        verdictText: "Claim denied — no refund recommended\nReason: OTP confirmed, late report, buyer remorse\nMerchant: No action required"
    }
  },
  {
    typeBadge: "PARTIAL REFUND",
    dotColor: "#FCD34D",
    title: "Ceramic Dinner Set · ₹2,150",
    description: "74% confidence · 9.8 seconds",
    expanded: {
        dispute: "12-piece dinner set delivered with OTP. 3 plates found cracked within 1 hour of unpacking. Photos taken immediately. 9 pieces in perfect condition.",
        agents: [
            { name: "🔍 Evidence Agent", text: "OTP confirmed but damage photo within 1hr is valid. Score: 68/100", chipText: "PARTIAL LIKELY", chipBg: "#FEF3C7", chipColor: "#92400E" },
            { name: "🏪 Merchant Agent", text: "Delivery OTP confirmed. Packaging met standard spec.", chipText: "PARTIAL CONCEDE", chipBg: "#FEF3C7", chipColor: "#92400E" },
            { name: "👤 Customer Agent", text: "Damage documented promptly. Proportional claim only.", chipText: "MODERATE", chipBg: "#FEF3C7", chipColor: "#92400E" },
            { name: "⚖ Judge Agent", text: "3 of 12 pieces damaged. Proportional compensation. 25% of order value.", chipText: "PARTIAL", chipBg: "#FEF3C7", chipColor: "#92400E" }
        ],
        verdictBg: "#1c1003",
        verdictColor: "#FCD34D",
        verdictText: "Partial refund of ₹538 recommended\n(25% of ₹2,150 — 3 of 12 pieces)\nMechanism: Escrow withhold\nAgent conflict: Yes (OTP vs damage)"
    }
  },
  {
    typeBadge: "ESCALATED",
    dotColor: "#FB923C",
    title: "Noise Smartwatch Pro · ₹4,999",
    description: "43% confidence · 7.2 seconds",
    expanded: {
        dispute: "OTP confirmed 2 days ago. Serial number on device doesn't match box. Scratches suggest prior use. Blurry photo provided. Invoice missing.",
        agents: [
            { name: "🔍 Evidence Agent", text: "Serial mismatch — potential counterfeit. Photo quality poor. Invoice absent. Score: 35/100", chipText: "ESCALATE", chipBg: "#FFEDD5", chipColor: "#C2410C" },
            { name: "🏪 Merchant Agent", text: "OTP confirmed. Standard dispatch procedures followed.", chipText: "DEFEND", chipBg: "#FEE2E2", chipColor: "#991B1B" },
            { name: "👤 Customer Agent", text: "Fraud allegation serious but evidence quality is low.", chipText: "MODERATE", chipBg: "#FEF3C7", chipColor: "#92400E" },
            { name: "⚖ Judge Agent", text: "Confidence 43% — below 65% threshold. Possible fraud. Cannot rule fairly without better evidence. Escalating.", chipText: "ESCALATE", chipBg: "#FFEDD5", chipColor: "#C2410C" }
        ],
        verdictBg: "#1a0e03",
        verdictColor: "#FB923C",
        verdictText: "Case escalated to senior reviewer\nReason: Potential counterfeit, confidence below threshold (43%)\nExpected response: 24-48 hours"
    }
  }
];
