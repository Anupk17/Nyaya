import React, { useState, useEffect, useRef } from 'react';
import './NewLanding.css';
import { Link } from 'react-router-dom';
import { NyayaMarquee } from '../components/NyayaMarquee';
import { NyayaMacbook } from '../components/NyayaMacbook';
import { Nyaya3DCards } from '../components/Nyaya3DCards';
import { NyayaExpandableCards } from '../components/NyayaExpandableCards';
import { NyayaGlobe } from '../components/NyayaGlobe';

const cases = [
    { 
        headline: 'AI recommends full refund',
        amount: '₹2,499 to buyer', 
        confidence: 89, 
        color: 'var(--verified)',
        votes: [
            { name: 'Evidence Agent', text: '✓ Supports Refund', type: 'vote-green' },
            { name: 'Merchant Agent', text: '✗ Disputes Claim', type: 'vote-red' },
            { name: 'Customer Agent', text: '✓ Strong Case', type: 'vote-green' },
            { name: 'Judge Agent', text: '✓ Full Refund', type: 'vote-green' }
        ],
        btnText: '✓ Approve — Withhold from payout'
    },
    { 
        headline: 'AI recommends denial',
        amount: '₹0 to buyer', 
        confidence: 91, 
        color: 'var(--flagged)',
        votes: [
            { name: 'Evidence Agent', text: '✗ No Evidence', type: 'vote-red' },
            { name: 'Merchant Agent', text: '✓ Strong Proof', type: 'vote-green' },
            { name: 'Customer Agent', text: '✗ Weak Claim', type: 'vote-red' },
            { name: 'Judge Agent', text: '✗ Deny Claim', type: 'vote-red' }
        ],
        btnText: '✓ Approve — Deny customer claim'
    },
    { 
        headline: 'AI recommends partial refund',
        amount: '₹625 to buyer', 
        confidence: 74, 
        color: 'var(--amber)',
        votes: [
            { name: 'Evidence Agent', text: '⚠ Mixed Proof', type: 'vote-red' },
            { name: 'Merchant Agent', text: '⚠ Partial Fault', type: 'vote-red' },
            { name: 'Customer Agent', text: '✓ Valid Delay', type: 'vote-green' },
            { name: 'Judge Agent', text: '⚠ Split Liability', type: 'vote-red' }
        ],
        btnText: '✓ Approve — Process partial refund'
    }
];

export default function NewLanding() {
    const [navScrolled, setNavScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [caseIdx, setCaseIdx] = useState(0);
    const [phase, setPhase] = useState(1);
    
    const [stats, setStats] = useState({ resolution: 0, cost: 0, money: 0, reasoning: 0 });
    const statsRef = useRef(null);
    const [statsAnimated, setStatsAnimated] = useState(false);
    const [heroVisible, setHeroVisible] = useState(false);

    // Enable window scrolling on mount, restore on unmount
    useEffect(() => {
        const rootEl = document.getElementById('root');
        const originals = {
            htmlOverflow: document.documentElement.style.overflow,
            bodyOverflow: document.body.style.overflow,
            rootOverflow: rootEl ? rootEl.style.overflow : '',
            rootHeight: rootEl ? rootEl.style.height : ''
        };

        document.documentElement.style.overflow = 'auto';
        document.body.style.overflow = 'auto';
        if (rootEl) {
            rootEl.style.overflow = 'auto';
            rootEl.style.height = 'auto';
        }

        return () => {
            document.documentElement.style.overflow = originals.htmlOverflow;
            document.body.style.overflow = originals.bodyOverflow;
            if (rootEl) {
                rootEl.style.overflow = originals.rootOverflow;
                rootEl.style.height = originals.rootHeight;
            }
        };
    }, []);

    // Nav scroll and hero entrance
    useEffect(() => {
        const handleScroll = () => setNavScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        setTimeout(() => setHeroVisible(true), 100);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Verdict card cycle
    useEffect(() => {
        let timeout;
        const cycleVerdict = () => {
            setPhase(1);
            timeout = setTimeout(() => {
                setCaseIdx(prev => (prev + 1) % cases.length);
                setPhase(2);
            }, 2000);
        };
        
        cycleVerdict();
        const interval = setInterval(cycleVerdict, 6000);
        return () => { clearInterval(interval); clearTimeout(timeout); };
    }, []);

    // Intersection observer for stats
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !statsAnimated) {
                setStatsAnimated(true);
                const duration = 1500;
                const startTime = performance.now();
                const easeOutQuart = x => 1 - Math.pow(1 - x, 4);
                
                const updateNumbers = (currentTime) => {
                    const elapsed = currentTime - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    const easeProgress = easeOutQuart(progress);
                    
                    setStats({
                        resolution: easeProgress * 8.4,
                        cost: easeProgress * 98,
                        money: easeProgress * 0,
                        reasoning: easeProgress * 100
                    });
                    
                    if (progress < 1) {
                        requestAnimationFrame(updateNumbers);
                    } else {
                        setStats({ resolution: 8.4, cost: 98, money: 0, reasoning: 100 });
                    }
                };
                requestAnimationFrame(updateNumbers);
            }
        }, { threshold: 0.3 });

        if (statsRef.current) observer.observe(statsRef.current);
        return () => observer.disconnect();
    }, [statsAnimated]);

    const activeCase = cases[caseIdx];

    const scrollToId = (e, id) => {
        e.preventDefault();
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
        setMobileMenuOpen(false);
    };

    return (
        <div id="new-landing-wrapper">
            <nav className={navScrolled ? 'scrolled' : ''}>
                <div className="container nav-inner">
                    <div className="nav-left">
                        <span className="icon">⚖</span> Nyaya
                    </div>
                    <div className="nav-center">
                        <a href="#how" onClick={(e) => scrollToId(e, 'how')}>How it works</a>


                    </div>
                    <div className="nav-right">
                        <Link to="/chat" className="sign-in desktop-only">Sign in</Link>
                        <Link to="/chat" className="start-free desktop-only">Start free</Link>
                        <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>☰</button>
                    </div>
                </div>
                <div className={`mobile-nav ${mobileMenuOpen ? 'open' : ''}`}>
                    <a href="#how" onClick={(e) => scrollToId(e, 'how')}>How it works</a>


                    <Link to="/chat">Sign in</Link>
                    <Link to="/chat" style={{ color: 'var(--signal)' }}>Start free</Link>
                </div>
            </nav>

            <section className="hero">
                <div className="container hero-inner">
                    <div className="hero-left">
                        <div className="status-badge">
                            <div className="status-dot"></div>
                            Live · 4 agents active
                        </div>
                        <h1 className={`hero-headline ${heroVisible ? 'visible' : ''}`}>
                            Disputes resolved.<br/>
                            Not just reviewed.
                        </h1>
                        <p className="hero-subheadline">
                            Nyaya's four AI agents investigate every dispute, argue both sides, and deliver a reasoned verdict in under 10 seconds. Your team approves — not investigates.
                        </p>
                        <div className="hero-cta">
                            <Link to="/chat" className="btn-primary">See it resolve a dispute</Link>
                            <a href="#how" onClick={(e) => scrollToId(e, 'how')} className="btn-secondary">How it works</a>
                        </div>
                        <div className="social-proof">
                            <p>Trusted by dispute teams at</p>
                            <div className="logos">
                                <div className="logo-placeholder"></div>
                                <div className="logo-placeholder"></div>
                                <div className="logo-placeholder"></div>
                                <div className="logo-placeholder"></div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="hero-right">
                        <div className="verdict-card">
                            <div className="vc-header">
                                <div className="vc-title">⚖ Nyaya Verdict</div>
                                <div className="vc-status">
                                    {phase === 1 ? (
                                        <>
                                            <div className="vc-dots">
                                                <div className="vc-dot pulse"></div>
                                                <div className="vc-dot pulse"></div>
                                                <div className="vc-dot pulse"></div>
                                            </div>
                                            <span className="vc-status-text">analyzing</span>
                                        </>
                                    ) : (
                                        <span className="vc-status-complete" style={{ display: 'block', color: activeCase.color }}>Complete</span>
                                    )}
                                </div>
                            </div>
                            <div className="vc-body">
                                <div className={`vc-phase-1 ${phase !== 1 ? 'hidden' : ''}`}>
                                    <div className="vc-p1-title">4 agents analyzing...</div>
                                    <div className="vc-agent-row">
                                        <span>🔍 Evidence Agent</span>
                                        <span className="vc-shimmer"><span className="vc-shimmer-fill">████████</span>░░</span>
                                    </div>
                                    <div className="vc-agent-row">
                                        <span>🏪 Merchant Agent</span>
                                        <span className="vc-shimmer"><span className="vc-shimmer-fill">████</span>░░░░░░</span>
                                    </div>
                                    <div className="vc-agent-row">
                                        <span>👤 Customer Agent</span>
                                        <span className="vc-shimmer"><span className="vc-shimmer-fill">██████</span>░░░░</span>
                                    </div>
                                    <div className="vc-agent-row">
                                        <span>⚖ Judge Agent</span>
                                        <span className="vc-shimmer">░░░░░░░░░░</span>
                                    </div>
                                </div>

                                <div className={`vc-phase-2 ${phase === 2 ? 'visible' : ''}`}>
                                    <div className="vc-priority">⚡ High Priority — Fast-track review</div>
                                    <h2 className="vc-verdict-headline">{activeCase.headline}</h2>
                                    <div className="vc-amount">{activeCase.amount}</div>
                                    
                                    <div className="vc-grid">
                                        <div className="vc-cell">
                                            <div className="vc-cell-name">Evidence Agent</div>
                                            <div className={`vc-cell-vote ${activeCase.votes[0].type}`}>{activeCase.votes[0].text}</div>
                                        </div>
                                        <div className="vc-cell">
                                            <div className="vc-cell-name">Merchant Agent</div>
                                            <div className={`vc-cell-vote ${activeCase.votes[1].type}`}>{activeCase.votes[1].text}</div>
                                        </div>
                                        <div className="vc-cell">
                                            <div className="vc-cell-name">Customer Agent</div>
                                            <div className={`vc-cell-vote ${activeCase.votes[2].type}`}>{activeCase.votes[2].text}</div>
                                        </div>
                                        <div className="vc-cell">
                                            <div className="vc-cell-name">Judge Agent</div>
                                            <div className={`vc-cell-vote ${activeCase.votes[3].type}`}>{activeCase.votes[3].text}</div>
                                        </div>
                                    </div>
                                    
                                    <div className="vc-confidence">
                                        <div className="vc-conf-header">
                                            <span>Confidence</span>
                                            <span>{activeCase.confidence}%</span>
                                        </div>
                                        <div className="vc-conf-bar">
                                            <div className="vc-conf-fill" style={{ width: phase === 2 ? `${activeCase.confidence}%` : '0%', background: activeCase.color }}></div>
                                        </div>
                                    </div>
                                    
                                    <div className="vc-actions">
                                        <button className="vc-btn-approve" style={{ background: activeCase.color }}>{activeCase.btnText}</button>
                                        <button className="vc-btn-override">✗ Override</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <div className="section-separator"></div>

            <section className="problem-section">
                <div className="container">
                    <div className="eyebrow">The problem with disputes today</div>
                    <h2 className="section-headline">
                        Every dispute costs you time,<br/>
                        money, and a customer.
                    </h2>
                    <div className="problem-stats">
                        <div className="problem-stat">
                            <div className="p-number">48–72</div>
                            <div className="p-label">hours per dispute, on average</div>
                            <div className="p-desc">A support agent chases logs, pings the merchant, then decides. By hand. For every case.</div>
                        </div>
                        <div className="problem-stat">
                            <div className="p-number">₹1,000+</div>
                            <div className="p-label">cost per resolved ticket</div>
                            <div className="p-desc">At scale, manual dispute handling is one of the largest hidden costs in fintech operations.</div>
                        </div>
                        <div className="problem-stat">
                            <div className="p-number">0</div>
                            <div className="p-label">visibility for customers</div>
                            <div className="p-desc">"Under review" is all they see. No reasoning, no timeline, no confidence they'll be heard.</div>
                        </div>
                    </div>
                </div>
            </section>

            <div className="section-separator"></div>

            <section className="how-it-works" id="how">
                <div className="container">
                    <h2 className="section-headline" style={{ marginBottom: 0 }}>
                        Four agents. One verdict.<br/>
                        Under ten seconds.
                    </h2>
                    <div className="hiw-subheadline">
                        Not a chatbot. A panel of specialised AI agents that investigate, argue, and judge — the way a good arbitration should work.
                    </div>

                    <div className="hiw-row">
                        <div className="hiw-content">
                            <h3><div className="hiw-agent-icon">🔍</div> Evidence Agent</h3>
                            <div className="hiw-model-label">Groq Llama3 8B</div>
                            <div className="hiw-body">
                                Reads the dispute statement and weighs every fact objectively. OTP status, photo validity, invoice match, filing time. No bias. Just evidence.
                            </div>
                            <div className="hiw-pills">
                                <span className="hiw-pill">Evidence: 84/100</span>
                                <span className="hiw-pill">OTP: Not found</span>
                                <span className="hiw-pill">Photo: Valid</span>
                            </div>
                        </div>
                        <div className="hiw-visual-code">
{`{
  "evidence_strength": 84,
  "otp_status": "NOT_FOUND",
  "photo_validity": "VALID",
  "verdict_suggestion": "REFUND_LIKELY"
}`}
                        </div>
                    </div>

                    <div className="hiw-row">
                        <div className="hiw-advocate-cards">
                            <div className="advocate-card adv-merchant">
                                <div className="adv-title">🏪 Merchant Advocate</div>
                                <div className="adv-text">OTP delivery log absent — merchant position is weak</div>
                            </div>
                            <div className="advocate-card adv-customer">
                                <div className="adv-title">👤 Customer Advocate</div>
                                <div className="adv-text">Filed within 3 hours.<br/>RBI Section 10.4 applies.</div>
                            </div>
                        </div>
                        <div className="hiw-content">
                            <h3 style={{ fontSize: '24px', fontFamily: "'DM Serif Display', serif", marginBottom: '16px', display: 'block' }}>The adversarial layer</h3>
                            <div className="hiw-body">
                                Each side gets a dedicated advocate. The merchant's best case. The customer's best case. Built by AI, weighed by the Judge. No human has to chase either party.
                            </div>
                        </div>
                    </div>

                    <div className="hiw-row">
                        <div className="hiw-content">
                            <h3><div className="hiw-agent-icon">⚖</div> Judge Agent</h3>
                            <div className="hiw-model-label">Llama3 70B</div>
                            <div className="hiw-body">
                                The most powerful model in the chain. It receives all three agent outputs, applies RBI Consumer Protection Guidelines, and issues a verdict with a confidence score and full written reasoning.
                                <br/><br/>
                                Below 65% confidence? It always escalates. The system knows what it doesn't know.
                            </div>
                        </div>
                        <div className="verdict-card" style={{ boxShadow: '0 12px 32px rgba(0,0,0,0.06)' }}>
                            <div className="vc-header">
                                <div className="vc-title">⚖ Nyaya Verdict</div>
                                <div className="vc-status">
                                    <span className="vc-status-complete" style={{ display: 'block', color: 'var(--verified)' }}>Complete</span>
                                </div>
                            </div>
                            <div className="vc-body" style={{ minHeight: 'auto' }}>
                                <div className="vc-priority">⚡ High Priority — Fast-track review</div>
                                <h2 className="vc-verdict-headline">AI recommends full refund</h2>
                                <div className="vc-amount">₹2,499 to buyer</div>
                                
                                <div className="vc-grid">
                                    <div className="vc-cell">
                                        <div className="vc-cell-name">Evidence Agent</div>
                                        <div className="vc-cell-vote vote-green">✓ Supports Refund</div>
                                    </div>
                                    <div className="vc-cell">
                                        <div className="vc-cell-name">Merchant Agent</div>
                                        <div className="vc-cell-vote vote-red">✗ Disputes Claim</div>
                                    </div>
                                    <div className="vc-cell">
                                        <div className="vc-cell-name">Customer Agent</div>
                                        <div className="vc-cell-vote vote-green">✓ Strong Case</div>
                                    </div>
                                    <div className="vc-cell">
                                        <div className="vc-cell-name">Judge Agent</div>
                                        <div className="vc-cell-vote vote-green">✓ Full Refund</div>
                                    </div>
                                </div>
                                
                                <div className="vc-confidence">
                                    <div className="vc-conf-header">
                                        <span>Confidence</span>
                                        <span>89%</span>
                                    </div>
                                    <div className="vc-conf-bar">
                                        <div className="vc-conf-fill" style={{ width: '89%', background: 'var(--verified)' }}></div>
                                    </div>
                                </div>
                                
                                <div className="vc-actions">
                                    <button className="vc-btn-approve" style={{ background: 'var(--verified)' }}>✓ Approve — Withhold from payout</button>
                                    <button className="vc-btn-override">✗ Override</button>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </section>

            <NyayaMarquee />
            <NyayaMacbook />
            <Nyaya3DCards />
            <NyayaExpandableCards />
            <NyayaGlobe />

            <section className="stats-section" id="stats-section" ref={statsRef}>
                <div className="container stats-grid">
                    <div className="stat-item">
                        <div className="stat-num">{stats.resolution.toFixed(1)}s</div>
                        <div className="stat-label">Average resolution</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-num">{Math.round(stats.cost)}%</div>
                        <div className="stat-label">Cost reduction</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-num">{Math.round(stats.money)}</div>
                        <div className="stat-label">Autonomous money moves</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-num">{Math.round(stats.reasoning)}%</div>
                        <div className="stat-label">Cases with full reasoning</div>
                    </div>
                </div>
            </section>

            <section className="features">
                <div className="container">
                    <h2 className="section-headline">Built for trust, not just speed.</h2>
                    
                    <div className="feat-layout">
                        <div className="feat-left">
                            <h3 className="feat-title">Escrow-aware refund logic</h3>
                            <div className="feat-diagram">
                                <div className="diagram-node">Customer pays ₹2,499</div>
                                <div className="diagram-arrow">↓</div>
                                <div className="diagram-node">Nodal Account — ESCROW</div>
                                <div className="diagram-arrow">↓</div>
                                <div style={{ fontSize: '13px', textAlign: 'center', color: 'var(--slate)' }}>Dispute filed within 48hrs?</div>
                                <div className="diagram-branch">
                                    <div className="d-yes">YES → Withhold payout → Refund</div>
                                    <div className="d-no">NO → Chargeback process</div>
                                </div>
                            </div>
                            <div className="feat-body">
                                Nyaya knows whether funds are still in escrow or already settled — and recommends the legally correct refund path. Not every resolution team knows this. Nyaya always does.
                            </div>
                        </div>
                        
                        <div className="feat-right">
                            <div className="feat-card dark">
                                <div className="fc-title">🧠 Cognee Memory</div>
                                <div className="fc-desc">Every resolved case is remembered. Repeat claimants are flagged. Merchant patterns surface automatically.</div>
                            </div>
                            <div className="feat-card light">
                                <div className="fc-title">🔔 Proactive Monitoring</div>
                                <div className="fc-desc">Nyaya watches the queue silently. Aging cases, fraud patterns, high-value disputes — flagged before you ask.</div>
                            </div>
                            <div className="feat-card light">
                                <div className="fc-title">🌐 8 Indian Languages</div>
                                <div className="fc-desc">Customers file in Hindi, Tamil, Telugu, Kannada, Bengali, Marathi, Gujarati. Agents process in English. Verdicts return in the customer's language.</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <div className="section-separator"></div>

            <section className="approval">
                <div className="container approval-layout">
                    <div className="approval-left">
                        <h2 className="section-headline" style={{ marginBottom: '24px' }}>
                            AI recommends.<br/>Humans decide.
                        </h2>
                        <div className="approval-body">
                            Nyaya never moves money on its own. Every verdict is a recommendation that requires a human reviewer to authorise.<br/><br/>
                            What changes: your reviewer spends 30 seconds approving a pre-packaged analysis — not 3 hours building one.
                        </div>
                        <div className="trust-marker">
                            <span className="trust-check">✓</span> RBI PA/PG Guideline compliant
                        </div>
                        <div className="trust-marker">
                            <span className="trust-check">✓</span> Full audit trail on every decision
                        </div>
                    </div>
                    <div className="approval-right">
                        <div className="approval-card-wrap">
                            <div className="ac-warning">
                                ⚠ Awaiting Reviewer Decision<br/>
                                No funds move without your authorisation.
                            </div>
                            <button className="vc-btn-approve" style={{ background: 'var(--verified)' }}>✓ Approve — Withhold ₹2,499 from payout</button>
                            <button className="vc-btn-override">✗ Override AI Decision</button>
                            <div className="ac-footer-note">
                                Nyaya AI provides recommendations only. All actions require reviewer authorisation before execution.
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <div className="section-separator"></div>

            <section className="final-cta">
                <div className="container">
                    <h2 className="fc-headline">
                        Your next dispute is<br/>already in the queue.
                    </h2>
                    <div className="fc-sub">
                        See Nyaya resolve it — before your reviewer even opens their laptop.
                    </div>
                    <div className="fc-btns">
                        <Link to="/chat" className="btn-fc-pri">See a live resolution</Link>
                        <a href="#" className="btn-fc-sec">Read the docs</a>
                    </div>
                </div>
            </section>

            <footer>
                <div className="container">
                    <div className="footer-grid">
                        <div>
                            <div className="f-logo"><span className="icon">⚖</span> Nyaya</div>
                            <div className="f-desc">Autonomous dispute resolution for payment platforms.</div>
                        </div>
                        <div>
                            <div className="f-col-title">Product</div>
                            <ul className="f-links">
                                <li><a href="#how" onClick={(e) => scrollToId(e, 'how')}>How it works</a></li>
                                <li><a href="#training" onClick={(e) => scrollToId(e, 'training')}>Training Studio</a></li>
                                <li><a href="#pricing" onClick={(e) => scrollToId(e, 'pricing')}>Pricing</a></li>
                                <li><a href="#">Changelog</a></li>
                            </ul>
                        </div>
                        <div>
                            <div className="f-col-title">Legal</div>
                            <ul className="f-links">
                                <li><a href="#">Privacy Policy</a></li>
                                <li><a href="#">Terms</a></li>
                                <li><a href="#">RBI Compliance</a></li>
                                <li><a href="#">Security</a></li>
                            </ul>
                        </div>
                        <div>
                            <div className="f-col-title">Connect</div>
                            <ul className="f-links">
                                <li><a href="#">GitHub</a></li>
                                <li><a href="#">Documentation</a></li>
                                <li><a href="#">Contact</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="f-bottom">
                        © 2026 Nyaya. Built for Indian fintech.
                    </div>
                </div>
            </footer>
        </div>
    );
}
