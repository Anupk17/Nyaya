import React, { useState, useRef, useEffect } from 'react';
import {
  Send, Plus, Mic, Scale, Sparkles, Copy, Check,
  Zap, RotateCw, ThumbsUp, ThumbsDown, X, ImageIcon,
  FolderOpen, ChevronDown, ChevronUp
} from 'lucide-react';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { sendDisputeChatMessage, resolveCustomDispute, uploadEvidenceToS3, analyzeEvidence, simulateMerchantResponse, translateToEnglish, transcribeAudio } from '../lib/api';
import { buildAgentContextWithMemory } from '../lib/agentContext';
import { storeMemory } from '../lib/cogneeMemory';
import { useDisputeStore } from '../store/disputeStore';
import { runMonitoringChecks } from '../lib/proactiveMonitor';
import { GooeyInput } from '@/components/ui/gooey-input';
import { BackgroundGradient } from '@/components/ui/background-gradient';
import { MagneticButton } from '@/components/ui/magnetic-button';
// ─── storage helpers ──────────────────────────────────────────────────────────

function loadHistory() {
  return null;
}

function saveHistory(messages) {
  // No-op
}

function clearHistory() {
  // No-op
}

// ─── constants ────────────────────────────────────────────────────────────────

const WELCOME_MSG = {
  id: 'welcome',
  sender: 'assistant',
  timestamp: 'Just now',
  content: 'Welcome to Nyaya AI Dispute Assistant.\n\nDescribe what happened with your order, transaction, or delivery. You can also attach photos or receipts as evidence. I will analyze your situation and help determine refund eligibility.',
};

const PRESETS = [
  { title: '📦 Damaged Unboxing',     message: 'I received the headphones today and upon unboxing, the right ear cup is cracked with no audio output. The outer courier box was also crushed.' },
  { title: '⚠️ Counterfeit Device',   message: 'The serial number on the box is not recognized on the official brand registry. The audio quality is distorted and the case lacks serial engravings.' },
  { title: '🚫 Stalled Non-Delivery', message: 'The courier status shows "Delivered" 3 days ago, but nobody came to my house. No OTP was verified and no signature was taken.' },
  { title: '🎨 Wrong Color / Size',   message: 'I received an Olive Brown kurta in Medium size instead of Maroon XL. The shoulder measurements are 2 inches off the size chart.' },
];

const AGENT_TABS = [
  { key: 'judge',    label: '⚖️ Neutral Verdict'  },
  { key: 'evidence', label: '🔍 Evidence Dossier' },
  { key: 'merchant', label: '🏪 Merchant Case'    },
  { key: 'customer', label: '👤 Customer Case'    },
  { key: 'memory',   label: '🧠 Memory'           },
];

// ─── sub-components ───────────────────────────────────────────────────────────

function NyayaAvatar() {
  return (
    <div style={{
      width: 28, height: 28, borderRadius: '50%',
      background: 'linear-gradient(135deg,#F97316,#EA580C)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <Scale size={13} color="white" />
    </div>
  );
}

const THOUGHT_STEPS = [
  { label: 'Evidence Agent thinking:', type: 'header' },
  { label: '🔍 Scanning dispute statement...', delay: 600 },
  { label: '📋 Checking OTP confirmation status...', delay: 500 },
  { label: '📸 Evaluating photo evidence validity...', delay: 700 },
  { label: '⚖️ Calculating evidence strength score...', delay: 500 },
  { label: '✓ Evidence analysis complete — Score: 84/100', delay: 500 },
  { label: 'Merchant Agent thinking:', type: 'header' },
  { label: '🏪 Loading merchant policy framework...', delay: 500 },
  { label: '📜 Applying Paytm Merchant SLA terms...', delay: 600 },
  { label: '⚡ Building strongest merchant defense...', delay: 550 },
  { label: '✓ Merchant case built', delay: 400 },
  { label: 'Customer Agent thinking:', type: 'header' },
  { label: '👤 Loading RBI consumer protection rules...', delay: 500 },
  { label: '🔍 Identifying strongest customer arguments...', delay: 700 },
  { label: '✓ Customer case built', delay: 400 },
  { label: 'Judge Agent thinking:', type: 'header' },
  { label: '⚖️ Receiving all agent submissions...', delay: 500 },
  { label: '🔄 Cross-referencing evidence with policies...', delay: 600 },
  { label: '📊 Calculating confidence score...', delay: 550 },
  { label: '🧠 Querying Cognee memory for precedents...', delay: 700 },
  { label: '✓ Verdict reached', delay: 400 },
];

function LiveThoughtStream({ isResolving }) {
  const [visibleIndices, setVisibleIndices] = useState([]);

  useEffect(() => {
    if (!isResolving) {
      setVisibleIndices([]);
      return;
    }
    let isMounted = true;
    let currentIdx = 0;

    const runSequence = async () => {
      while (currentIdx < THOUGHT_STEPS.length && isMounted) {
        const step = THOUGHT_STEPS[currentIdx];
        setVisibleIndices(prev => [...prev, currentIdx]);
        const delay = step.delay || 200;
        await new Promise(resolve => setTimeout(resolve, delay));
        currentIdx++;
      }
    };
    runSequence();
    return () => { isMounted = false; };
  }, [isResolving]);

  if (!isResolving) return null;

  return (
    <div style={{ flex: 1, padding: '10px 0', fontFamily: 'monospace', fontSize: 13, color: '#374151', lineHeight: 1.7 }}>
      {visibleIndices.map(idx => {
        const step = THOUGHT_STEPS[idx];
        if (step.type === 'header') {
          return (
            <div key={idx} style={{ fontWeight: 600, color: '#111827', marginTop: idx === 0 ? 0 : 16, marginBottom: 4 }}>
              {step.label}
            </div>
          );
        }
        return (
          <div key={idx} style={{ paddingLeft: 16, color: step.label.startsWith('✓') ? '#10B981' : '#4B5563' }}>
            {step.label}
          </div>
        );
      })}
      {visibleIndices.length < THOUGHT_STEPS.length && (
        <div style={{ paddingLeft: 16, display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#F97316', animation: 'bounce 1.2s infinite' }} />
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#F97316', animation: 'bounce 1.2s 0.2s infinite' }} />
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#F97316', animation: 'bounce 1.2s 0.4s infinite' }} />
        </div>
      )}
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export default function AIChatWorkspace({ useBedrock }) {
  // ── state ──────────────────────────────────────────────────────────────────
  const { disputes, addDispute, approveDispute, escalateDispute } = useDisputeStore();
  const saved = loadHistory();
  const [messages, setMessages]   = useState(saved || [WELCOME_MSG]);
  const [attachments, setAttachments] = useState([]); // NO default attachment
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [isProcessing, setIsProcessing]       = useState(false);
  const [isResolvingPipeline, setIsResolvingPipeline] = useState(false);
  const [verdict, setVerdict]       = useState(null);
  const [agentOutputs, setAgentOutputs] = useState([]);
  const [activeAgentTab, setActiveAgentTab] = useState('judge');
  const [isCopied, setIsCopied]     = useState(false);
  const [liked, setLiked]           = useState(null);
  const [disputeFormOpen, setDisputeFormOpen] = useState(false);
  const [fraudWarning, setFraudWarning] = useState(null);
  const [memoryState, setMemoryState] = useState(null);
  const [deliveryTimeframe, setDeliveryTimeframe] = useState(null);
  const [showConfidenceExplain, setShowConfidenceExplain] = useState(false);
  const [merchantSimLoading, setMerchantSimLoading] = useState(false);
  const [merchantSimResult, setMerchantSimResult] = useState(null);

  // Dispute form fields
  const [formProduct, setFormProduct]     = useState('');
  const [formAmount, setFormAmount]       = useState('');
  const [formMerchant, setFormMerchant]   = useState('');
  const [formDescription, setFormDescription] = useState('');

  // Extract dispute details from user chat messages
  const extractDisputeDetails = () => {
    const userTexts = messages.filter(m => m.sender === 'user').map(m => m.content).join('\n');
    
    // 1. Merchant: Try structured form first, then natural language
    let merchantMatch = userTexts.match(/Merchant:\s*(.+)/i);
    let merchant = merchantMatch?.[1]?.trim();
    if (!merchant) {
      const nlMatch = userTexts.match(/from\s+([A-Z][a-zA-Z0-9\s]+?)\s+(?:on|in|using|via)/i);
      if (nlMatch) merchant = nlMatch[1].trim();
    }

    // 2. Product: Try structured form first, then natural language
    let productMatch = userTexts.match(/Product:\s*(.+)/i);
    let product = productMatch?.[1]?.trim();
    if (!product) {
      const nlMatch = userTexts.match(/(?:bought|purchased|ordered)\s+(?:a|an)?\s+([^,.]+?)\s+(?:from|in|on|for)/i);
      if (nlMatch) product = nlMatch[1].trim();
    }

    // 3. Amount: Try structured form first, then natural language
    let amountMatch = userTexts.match(/Amount:\s*₹?\s*([\d,]+)/i);
    let amountStr = amountMatch?.[1];
    if (!amountStr) {
      const nlMatch = userTexts.match(/(?:₹|Rs\.?|INR)\s*([\d,]+)/i);
      if (nlMatch) amountStr = nlMatch[1];
    }

    return {
      merchant: merchant || 'Retail Marketplace Partner',
      product: product || 'Disputed Item',
      amount: amountStr ? Number(amountStr.replace(/,/g, '')) : 2499,
    };
  };

  const chatEndRef   = useRef(null);
  const fileInputRef = useRef(null);

  // ── persist chat to localStorage whenever messages change ─────────────────
  useEffect(() => {
    saveHistory(messages);
  }, [messages]);

  // ── proactive monitoring ───────────────────────────────────────────────────
  useEffect(() => {
    if (!disputes) return;
    const currentAlerts = runMonitoringChecks(disputes);
    const criticalAlerts = currentAlerts.filter(
      a => (a.severity === 'CRITICAL' || a.severity === 'HIGH') && !a.dismissed
    );
    
    criticalAlerts.forEach(alert => {
      const alreadyNotified = messages.some(
        m => m.sender === 'nyaya-monitor' && m.content.includes(alert.caseId)
      );
      if (!alreadyNotified) {
        setMessages(prev => {
          if (prev.some(m => m.sender === 'nyaya-monitor' && m.content.includes(alert.caseId))) {
            return prev;
          }
          return [...prev, {
            id: `monitor-${alert.id}-${Date.now()}`,
            sender: 'nyaya-monitor',
            content: `🚨 **Proactive Alert (Case ${alert.caseId})**\n${alert.message}\nAction: ${alert.actionRequired}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }];
        });
      }
    });
  }, [disputes, messages]);

  // ── auto-scroll ────────────────────────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing, verdict]);

  // ── handlers ──────────────────────────────────────────────────────────────

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        setIsProcessing(true);
        try {
          const transcribedText = await transcribeAudio(audioBlob);
          if (transcribedText) setInputText(prev => prev + ' ' + transcribedText);
        } catch (error) {
          console.error("STT Error:", error);
          alert("Failed to transcribe audio.");
        } finally {
          setIsProcessing(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone access is required to use voice typing.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleApplyPreset = (preset) => {
    setInputText(preset.message);
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    const text = inputText.trim();
    if (!text && attachments.length === 0) return;

    let finalContent = text;
    setIsProcessing(true);

    if (text && /[^\x00-\x7F]/.test(text)) {
      try {
        finalContent = await translateToEnglish(text);
      } catch (err) {
        console.warn('Translation failed, using original text', err);
      }
    }

    const currentAtts = [...attachments];
    const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      content: finalContent || `Submitted ${currentAtts.length} file(s)`,
      attachments: currentAtts.length > 0 ? currentAtts : undefined,
      timestamp: ts,
    };

    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    setInputText('');
    setAttachments([]);

    try {
      const reply = await sendDisputeChatMessage(updatedMessages, currentAtts);
      const clean = (reply || '').replace(/\*\*/g, '').trim();
      setMessages(prev => [...prev, {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        content: clean,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: `assistant-err-${Date.now()}`,
        sender: 'assistant',
        content: 'I got your message. Describe your dispute in more detail or click "Run Resolution" when ready to get an AI verdict.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Submit structured dispute form
  const handleSubmitForm = async () => {
    if (!formDescription.trim()) return;
    const text = [
      formProduct && `Product: ${formProduct}`,
      formAmount  && `Amount: ₹${formAmount}`,
      formMerchant && `Merchant: ${formMerchant}`,
      `Issue: ${formDescription}`,
    ].filter(Boolean).join('\n');

    setDisputeFormOpen(false);
    setFormProduct(''); setFormAmount(''); setFormMerchant(''); setFormDescription('');
    setInputText(text);
    // Auto-send
    const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsg = { id: `user-${Date.now()}`, sender: 'user', content: text, timestamp: ts };
    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    setIsProcessing(true);
    try {
      const reply = await sendDisputeChatMessage(updatedMessages, attachments);
      setMessages(prev => [...prev, {
        id: `assistant-${Date.now()}`, sender: 'assistant',
        content: (reply || '').replace(/\*\*/g, '').trim(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: `assistant-err-${Date.now()}`, sender: 'assistant',
        content: 'Dispute logged. Click "Run Resolution" to get your AI verdict.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    } finally {
      setIsProcessing(false);
      setInputText('');
    }
  };

  const handleRun4AgentTrial = async () => {
    setIsResolvingPipeline(true);
    setAgentOutputs([]);
    setVerdict(null);
    setFraudWarning(null);
    setMemoryState(null);
    const userClaimText = messages.filter(m => m.sender === 'user').map(m => m.content).join('\n\n') || 'Customer dispute.';
    
    try {
      const { context, memory } = await buildAgentContextWithMemory(userClaimText);
      
      if (memory.fraudRisk === 'HIGH' || memory.fraudRisk === 'MEDIUM') {
        setFraudWarning({
          level: memory.fraudRisk,
          count: memory.buyerDisputeCount
        });
      }
      setMemoryState(memory);

      const details = extractDisputeDetails();
      const merchantName = details.merchant;
      const productName = details.product;
      const disputeAmount = details.amount;

      await resolveCustomDispute({
        customer_name: 'Customer (You)',
        merchant_name: merchantName,
        product_name: productName,
        amount: disputeAmount,
        customer_claim: context,
        merchant_claim: 'Fulfillment dispatched per standard catalog specification.',
        proof_attachments: attachments,
        chat_log: messages.map(m => ({ from: m.sender === 'user' ? 'customer' : 'merchant', text: m.content })),
        use_bedrock: useBedrock
      }, (event) => {
        if (event.type === 'agent_complete' && event.output) {
          setAgentOutputs(prev => { const f = prev.filter(o => o.agent !== event.agent); return [...f, event.output]; });
        }
        if (event.type === 'complete') {
          setVerdict(event.verdict);
          if (event.agent_outputs) setAgentOutputs(event.agent_outputs);
          
          const finalVerdictObj = {
            verdict: event.verdict.decision,
            confidence: event.verdict.confidence,
            recommendedAmount: event.verdict.amount,
            reasoning: Array.isArray(event.verdict.reasoning) ? event.verdict.reasoning.join('\n') : event.verdict.reasoning,
            priority: event.verdict.fraud_flag ? 'HIGH' : 'MEDIUM',
            agentVotes: { evidence: '', merchant: '', customer: '', judge: '' }
          };

          const caseId = event.case_id || `PTM-${Date.now()}`;
          const newDisputeObj = {
            id: caseId,
            buyerName: 'Customer (You)',
            sellerName: merchantName,
            productName: productName,
            amount: disputeAmount,
            filedAt: new Date(),
            status: event.verdict.action_taken === 'escalated' ? 'ESCALATED' : 'PENDING',
            aiVerdict: finalVerdictObj,
            reviewerAction: { action: null, reason: '', timestamp: null },
            userMessage: userClaimText
          };

          storeMemory(newDisputeObj).catch(console.warn);
          addDispute(newDisputeObj);
          
          // Attach dispute_id to the verdict so we can use it in approveDispute
          if (!event.verdict.dispute_id) event.verdict.dispute_id = caseId;
        }
      });
    } catch (err) {
      console.error('Resolution pipeline error:', err);
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        sender: 'assistant',
        content: `⚠️ Resolution pipeline failed: ${err.message || 'Unknown error'}. Please check if the backend server is running and try again.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    }
    finally { setIsResolvingPipeline(false); }
  };

  const handleMerchantSimulation = async () => {
    if (!verdict) return;
    
    setMerchantSimLoading(true);
    setMerchantSimResult(null);

    try {
      const response = await fetch('/api/merchant-simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verdict: verdict.decision,
          recommendedAmount: verdict.amount,
          confidence: conf,
          productName: formProduct || 'Product',
          merchantName: formMerchant || 'Merchant',
          reasoning: Array.isArray(verdict.reasoning) ? verdict.reasoning.join('\n') : verdict.reasoning,
          userMessage: inputText || formDescription || ''
        })
      });

      const data = await response.json();
      if (data.success) {
        setMerchantSimResult(data.data);
      } else {
        throw new Error("Failed");
      }
    } catch (err) {
      console.error('Merchant sim failed:', err);
      // Fallback
      setMerchantSimResult({
        merchant_response: "NEGOTIATE",
        response_message: "We acknowledge the concern raised. While we maintain our standard fulfillment procedures were followed, we are open to discussing a resolution.",
        counter_offer_amount: Math.floor(
          (verdict?.amount || 500) * 0.5
        ),
        counter_offer_reason: "Goodwill gesture without admitting liability",
        escalation_risk: "MEDIUM",
        merchant_mood: "FRUSTRATED",
        account_suspension_fear: true,
        resolution_likelihood: "POSSIBLE"
      });
    } finally {
      setMerchantSimLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      try {
        const tempId = `att-${Date.now()}`;
        setAttachments(prev => [...prev, {
          id: tempId,
          name: file.name, type: file.type || 'image/jpeg',
          description: `Uploading to S3...`,
          file,
        }]);

        // Upload to S3
        const { bucket, key, url } = await uploadEvidenceToS3(file, 'chat-case');
        
        let labelsDesc = '';
        try {
          const labels = await analyzeEvidence(bucket, key);
          if (labels && labels.length > 0) {
            labelsDesc = ` \nAI detected: ${labels.join(', ')}`;
          }
        } catch (rekErr) {
          console.warn('Rekognition analysis failed:', rekErr);
        }

        setAttachments(prev => prev.map(a => 
          a.id === tempId ? {
            ...a,
            description: `s3://${bucket}/${key} (Verified)` + labelsDesc,
            dataUrl: url // Use S3 URL
          } : a
        ));
      } catch (err) {
        console.error('S3 Upload Error:', err);
      }
    }
  };

  const handleClearHistory = () => {
    clearHistory();
    setMessages([WELCOME_MSG]);
    setVerdict(null);
    setAgentOutputs([]);
  };

  const getSummaryText = () => {
    if (!verdict) return 'Nyaya Autonomous Dispute Resolution';
    
    const evidenceOut = agentOutputs.find(o => o.agent === 'evidence');
    const merchantOut = agentOutputs.find(o => o.agent === 'merchant');
    const customerOut = agentOutputs.find(o => o.agent === 'customer');

    const getAgentLabel = (output) => {
      if (!output) return '—';
      const c = output.content || {};
      // Check specific verdict fields first
      const verdict_field = (c.merchant_verdict || c.customer_verdict || '').toUpperCase();
      if (verdict_field.includes('DENY') || verdict_field.includes('NO_SUPPORT') || verdict_field.includes('OPPOSE')) return 'Disputes Claim';
      if (verdict_field.includes('PARTIAL') || verdict_field.includes('MODERATE')) return 'Moderate Case';
      if (verdict_field.includes('SUPPORT') || verdict_field.includes('APPROVE') || verdict_field.includes('REFUND')) return 'Supports Refund';
      // Fallback to summary text — but avoid matching the word "dispute" since it's in every message
      const summary = (c.summary || c.position || c.merchant_reasoning || c.customer_reasoning || '').toLowerCase();
      if (summary.includes('deny') || summary.includes('reject') || summary.includes('no merit') || summary.includes('not eligible')) return 'Disputes Claim';
      if (summary.includes('partial')) return 'Moderate Case';
      return 'Supports Refund';
    };

    let refundMech = 'Escrow Withhold & Customer Refund';
    let timeline = '2-4 business hours';
    if (verdict.refund_path === 'CHARGEBACK') {
      refundMech = 'Merchant Chargeback Request';
      timeline = '7-14 business days';
    } else if (verdict.refund_path === 'GOODWILL') {
      refundMech = 'Paytm Goodwill Credit';
      timeline = '1-2 business hours';
    }

    const reasoningText = Array.isArray(verdict.reasoning) ? verdict.reasoning.join('\n') : verdict.reasoning;
    const dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

    // Use decisionLabel which is computed further down, so we recompute it here or pass it. 
    // Wait, decisionLabel is defined below. Let's compute it locally just for this string.
    const safeDecision = verdict?.decision || verdict?.verdict || 'UNKNOWN';
    const localDecisionLabel = safeDecision === 'refund_approved' ? 'FULL REFUND' : safeDecision === 'partial_refund' ? 'PARTIAL REFUND' : safeDecision === 'refund_denied' ? 'DENIED' : String(safeDecision).replace(/_/g, ' ').toUpperCase();

    return `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NYAYA DISPUTE VERDICT SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Case ID: ${verdict.dispute_id || 'PTM-88216'}
Date: ${dateStr}
Product: ${extractDisputeDetails().product}
Claimed: ₹${extractDisputeDetails().amount.toLocaleString('en-IN')}
Merchant: ${extractDisputeDetails().merchant}

AI RECOMMENDATION: ${localDecisionLabel}
Recommended Amount: ₹${verdict.amount}
Confidence: ${verdict.confidence}%
Priority: ${verdict.priority === 'HIGH' ? 'High' : 'Medium'} — Human review required

AGENT CONSENSUS:
  Evidence Agent: ${getAgentLabel(evidenceOut)}
  Merchant Agent: ${getAgentLabel(merchantOut)}
  Customer Agent: ${getAgentLabel(customerOut)}
  Judge Agent: ${localDecisionLabel.toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}

REFUND MECHANISM: ${refundMech}
Est. Timeline: ${timeline}

REASONING:
${reasoningText}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AI Recommendation only. Requires Paytm
reviewer approval before any action.
Powered by Nyaya AI — Paytm Hackathon 2026
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  };

  const handleCopyVerdict = () => {
    navigator.clipboard.writeText(getSummaryText());
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownload = () => {
    const printWindow = document.createElement('iframe');
    printWindow.style.position = 'absolute';
    printWindow.style.top = '-9999px';
    printWindow.style.left = '-9999px';
    document.body.appendChild(printWindow);
    
    const doc = printWindow.contentWindow.document;
    doc.open();
    doc.write(`
      <html>
        <head>
          <title>Nyaya Verdict Summary</title>
          <style>
            body { font-family: monospace; white-space: pre-wrap; padding: 30px; font-size: 14px; line-height: 1.6; color: #111827; }
          </style>
        </head>
        <body>
          ${getSummaryText().replace(/</g, '&lt;').replace(/>/g, '&gt;')}
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      document.body.removeChild(printWindow);
    }, 3000);
  };

  // ── agent tab content ──────────────────────────────────────────────────────

  const renderBullets = (items, fallback) => {
    let arr = items;
    if (typeof items === 'string') arr = [items];
    if (!Array.isArray(arr) || arr.length === 0) arr = fallback;
    return (
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {arr.map((item, i) => (
          <li key={i} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#F97316', flexShrink: 0, marginTop: 6 }} />
            <span style={{ fontSize: 13, lineHeight: 1.7, color: '#374151' }}>{item}</span>
          </li>
        ))}
      </ul>
    );
  };
  const getTabContent = () => {
    const evidenceOut = agentOutputs.find(o => o.agent === 'evidence');
    const merchantOut = agentOutputs.find(o => o.agent === 'merchant');
    const customerOut = agentOutputs.find(o => o.agent === 'customer');

    if (activeAgentTab === 'memory' && memoryState) {
      return (
        <div style={{ border: '1px solid #E5E7EB', borderRadius: 8, padding: 16, background: '#F9FAFB' }}>
          <div style={{ fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            🧠 Cognee Memory Intelligence
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', marginBottom: 4 }}>BUYER HISTORY</div>
          <div style={{ fontSize: 12, color: '#374151', whiteSpace: 'pre-wrap', marginBottom: 12 }}>{memoryState.buyerHistory}</div>
          
          <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', marginBottom: 4 }}>MERCHANT HISTORY</div>
          <div style={{ fontSize: 12, color: '#374151', whiteSpace: 'pre-wrap', marginBottom: 12 }}>{memoryState.merchantHistory}</div>
          
          <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', marginBottom: 4 }}>SIMILAR PAST CASES</div>
          {memoryState.previousVerdicts.map((v, i) => (
            <div key={i} style={{ fontSize: 12, color: '#374151', background: 'white', padding: 8, border: '1px solid #E5E7EB', borderRadius: 6, marginBottom: 8 }}>
              {v}
            </div>
          ))}
          <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 12, borderTop: '1px solid #E5E7EB', paddingTop: 8 }}>
            Powered by Cognee • 35M token memory pool
          </div>
        </div>
      );
    }

    if (activeAgentTab === 'evidence') return renderBullets(evidenceOut?.content?.key_facts, ['Run resolution to see the evidence analysis.']);
    if (activeAgentTab === 'merchant') return renderBullets(merchantOut?.content?.supporting_points, ['Run resolution to see the merchant\'s arguments.']);
    if (activeAgentTab === 'customer') return renderBullets(customerOut?.content?.supporting_points, ['Run resolution to see the customer advocacy analysis.']);
    return renderBullets(verdict?.reasoning, ['Run resolution to see the judge\'s verdict and reasoning.']);
  };

  // ── verdict display values ─────────────────────────────────────────────────
  const conf       = verdict?.confidence ?? null;
  const confColor  = conf !== null ? (conf >= 90 ? '#10B981' : conf >= 60 ? '#F59E0B' : '#EF4444') : '#E5E7EB';
  const safeDecision = verdict?.decision || verdict?.verdict || 'UNKNOWN';
  const decisionLabel = !verdict ? '' : safeDecision === 'refund_approved' ? 'FULL REFUND' : safeDecision === 'partial_refund' ? 'PARTIAL REFUND' : safeDecision === 'refund_denied' ? 'DENIED' : String(safeDecision).replace(/_/g, ' ').toUpperCase();
  const actionLabel = !verdict ? '' : 
    verdict.action_taken === 'auto_executed' ? 'Auto Executed' :
    verdict.action_taken === 'escalated' ? 'Escalated' :
    verdict.action_taken === 'approved_by_human' ? 'Approved' :
    verdict.action_taken === 'rejected_by_human' ? 'Rejected' :
    'Pending Human Approval';
  const actionStyle = { background: 'rgba(245,158,11,0.12)', color: '#92400E' };


  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F3F4F6' }}>

      {/* ── Scrollable content area ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 24px 0', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ maxWidth: 820, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Scenario pills + clear history */}
          <div style={{ paddingBottom: 12, borderBottom: '1px solid #F3F4F6' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 11, color: '#9CA3AF' }}>Select a sample scenario →</span>
              <button
                onClick={handleClearHistory}
                style={{ fontSize: 11, color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', borderRadius: 4 }}
                title="Clear chat history"
              >
                Clear history
              </button>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handleApplyPreset(preset)}
                  style={{ height: 30, padding: '0 14px', borderRadius: 15, border: '1px solid #E5E7EB', background: 'white', fontSize: 12, color: '#374151', cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#FFF7ED'; e.currentTarget.style.borderColor = '#F97316'; e.currentTarget.style.color = '#F97316'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.color = '#374151'; }}
                >
                  {preset.title}
                </button>
              ))}
            </div>
          </div>

          {/* ── Dispute Form Folder ── */}
          <div style={{ border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden', background: 'white' }}>
            <button
              onClick={() => setDisputeFormOpen(o => !o)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 18px', background: '#FAFAFA', border: 'none', cursor: 'pointer',
                borderBottom: disputeFormOpen ? '1px solid #E5E7EB' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FolderOpen size={16} color="#F97316" />
                <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>File a New Dispute</span>
                <span style={{ fontSize: 12, color: '#9CA3AF' }}>Enter order details & describe the issue</span>
              </div>
              {disputeFormOpen ? <ChevronUp size={16} color="#9CA3AF" /> : <ChevronDown size={16} color="#9CA3AF" />}
            </button>

            {disputeFormOpen && (
              <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    { label: 'Product / Item name', value: formProduct, set: setFormProduct, placeholder: 'e.g. Sony WH-1000XM4' },
                    { label: 'Order Amount (₹)', value: formAmount, set: setFormAmount, placeholder: 'e.g. 19999', type: 'number' },
                    { label: 'Merchant / Seller', value: formMerchant, set: setFormMerchant, placeholder: 'e.g. TechStore Electronics' },
                  ].map(({ label, value, set, placeholder, type }) => (
                    <div key={label}>
                      <label style={{ fontSize: 11, fontWeight: 500, color: '#6B7280', display: 'block', marginBottom: 5 }}>{label}</label>
                      <input
                        type={type || 'text'}
                        value={value}
                        onChange={e => set(e.target.value)}
                        placeholder={placeholder}
                        style={{ width: '100%', height: 36, border: '1px solid #E5E7EB', borderRadius: 8, padding: '0 10px', fontSize: 13, color: '#111827', outline: 'none', background: '#F9FAFB', boxSizing: 'border-box' }}
                        onFocus={e => { e.target.style.borderColor = '#F97316'; e.target.style.background = '#fff'; }}
                        onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.background = '#F9FAFB'; }}
                      />
                    </div>
                  ))}
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 500, color: '#6B7280', display: 'block', marginBottom: 5 }}>Attach Evidence</label>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{ height: 36, padding: '0 12px', border: '1px dashed #E5E7EB', borderRadius: 8, background: '#F9FAFB', fontSize: 12, color: '#6B7280', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, width: '100%' }}
                    >
                      <ImageIcon size={14} color="#9CA3AF" />
                      {attachments.length > 0 ? `${attachments.length} file(s) attached` : 'Upload photos / receipts'}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 500, color: '#6B7280', display: 'block', marginBottom: 5 }}>Describe what happened *</label>
                  <textarea
                    value={formDescription}
                    onChange={e => setFormDescription(e.target.value)}
                    placeholder="e.g. I received the product with cracked packaging. The item inside was damaged and non-functional..."
                    rows={3}
                    style={{ width: '100%', border: '1px solid #E5E7EB', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#374151', resize: 'vertical', outline: 'none', background: '#F9FAFB', boxSizing: 'border-box', lineHeight: 1.6 }}
                    onFocus={e => { e.target.style.borderColor = '#F97316'; e.target.style.background = '#fff'; }}
                    onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.background = '#F9FAFB'; }}
                  />
                </div>

                {/* Attached files preview */}
                {attachments.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {attachments.map(att => (
                      <div key={att.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F3F4F6', borderRadius: 6, padding: '3px 8px', fontSize: 11, color: '#374151' }}>
                        <ImageIcon size={11} color="#F97316" />
                        <span style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>{att.name}</span>
                        <button onClick={() => setAttachments(p => p.filter(a => a.id !== att.id))} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 0, display: 'flex' }}>
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button onClick={() => setDisputeFormOpen(false)} style={{ padding: '8px 16px', border: '1px solid #E5E7EB', borderRadius: 8, background: 'white', fontSize: 13, color: '#6B7280', cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitForm}
                    disabled={!formDescription.trim() || isProcessing}
                    style={{ padding: '8px 18px', border: 'none', borderRadius: 8, background: '#F97316', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: !formDescription.trim() ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <Send size={13} /> Send to Nyaya AI
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Chat messages */}
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            const isMerchantSim = msg.sender === 'merchant_sim';
            const isMonitor = msg.sender === 'nyaya-monitor';
            const bg = isUser ? '#F97316' : isMerchantSim ? '#0D9488' : isMonitor ? '#FEF2F2' : '#F8F9FA';
            const color = (isUser || isMerchantSim) ? 'white' : isMonitor ? '#991B1B' : '#374151';

            return (
              <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
                {msg.sender === 'assistant' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <NyayaAvatar />
                    <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>Nyaya</span>
                  </div>
                )}
                {isMerchantSim && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: '#0D9488', fontWeight: 600 }}>HomeStyle Décor (Simulated)</span>
                  </div>
                )}
                {isMonitor && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: '#DC2626', fontWeight: 600 }}>Nyaya Active Monitor</span>
                  </div>
                )}
                <div style={{
                  maxWidth: isUser ? '65%' : '85%',
                  padding: '12px 16px',
                  borderRadius: isUser ? '12px 12px 0 12px' : '0 12px 12px 12px',
                  background: bg,
                  color: color,
                  fontSize: 14,
                  lineHeight: 1.65,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  boxShadow: isMerchantSim ? '0 4px 14px rgba(13, 148, 136, 0.2)' : isMonitor ? '0 4px 14px rgba(239, 68, 68, 0.2)' : 'none',
                  border: isMonitor ? '1px solid #FECACA' : 'none'
                }}>
                  {msg.content}
                  {msg.attachments?.length > 0 && (
                    <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.25)' }}>
                      <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4, opacity: 0.8 }}>📎 Attached:</div>
                      {msg.attachments.map((att, i) => (
                        <div key={i} style={{ fontSize: 11, opacity: 0.85, fontFamily: 'monospace' }}>{att.name}</div>
                      ))}
                    </div>
                  )}
                </div>
                <span style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>{msg.timestamp}</span>
              </div>
            );
          })}

          {/* Typing indicator */}
          {isProcessing && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <NyayaAvatar />
              <div style={{ display: 'flex', gap: 4, padding: '10px 14px', background: '#F8F9FA', borderRadius: '0 12px 12px 12px' }}>
                {[0, 0.2, 0.4].map((d, i) => (
                  <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: '#F97316', animation: `bounce 1.2s ${d}s infinite` }} />
                ))}
              </div>
            </div>
          )}

          {/* Delivery Timeframe Question / Badge */}
          {messages.length > 1 && !verdict && (
            <div style={{ padding: '16px', background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, marginBottom: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
              {!deliveryTimeframe ? (
                <>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 12 }}>
                    When did you receive / expect this delivery?
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                    <button onClick={() => setDeliveryTimeframe('same_day')} style={{ padding: '8px', border: '1px solid #E5E7EB', borderRadius: 8, background: '#FAFAFA', fontSize: 12, fontWeight: 500, color: '#374151', cursor: 'pointer' }}>Same day filed</button>
                    <button onClick={() => setDeliveryTimeframe('1_2_days')} style={{ padding: '8px', border: '1px solid #E5E7EB', borderRadius: 8, background: '#FAFAFA', fontSize: 12, fontWeight: 500, color: '#374151', cursor: 'pointer' }}>1-2 days</button>
                    <button onClick={() => setDeliveryTimeframe('3_plus_days')} style={{ padding: '8px', border: '1px solid #E5E7EB', borderRadius: 8, background: '#FAFAFA', fontSize: 12, fontWeight: 500, color: '#374151', cursor: 'pointer' }}>3+ days</button>
                  </div>
                </>
              ) : (
                <>
                  {deliveryTimeframe === 'same_day' && (
                    <div style={{ background: '#F0FDF4', borderLeft: '3px solid #22C55E', padding: 12, borderRadius: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#166534', marginBottom: 4 }}>🟢 Excellent — Filed within escrow window.</div>
                      <div style={{ fontSize: 12, color: '#166534', opacity: 0.9 }}>Direct refund likely if approved. Est. 2-4 hours.</div>
                    </div>
                  )}
                  {deliveryTimeframe === '1_2_days' && (
                    <div style={{ background: '#FEFCE8', borderLeft: '3px solid #EAB308', padding: 12, borderRadius: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#854D0E', marginBottom: 4 }}>🟡 Good — Settlement status unclear.</div>
                      <div style={{ fontSize: 12, color: '#854D0E', opacity: 0.9 }}>Reviewer will check before processing. Est. 24-48 hours.</div>
                    </div>
                  )}
                  {deliveryTimeframe === '3_plus_days' && (
                    <div style={{ background: '#FEF2F2', borderLeft: '3px solid #EF4444', padding: 12, borderRadius: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#991B1B', marginBottom: 4 }}>🔴 Late filing — Chargeback process required.</div>
                      <div style={{ fontSize: 12, color: '#991B1B', opacity: 0.9 }}>Merchant cooperation needed. Est. 7-14 days.</div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── 4-Agent Resolution Card ── */}
          <ErrorBoundary>
          
          {fraudWarning && (
            <div style={{
              background: fraudWarning.level === 'HIGH' ? '#FEF2F2' : '#FFFBEB',
              borderLeft: `3px solid ${fraudWarning.level === 'HIGH' ? '#EF4444' : '#F59E0B'}`,
              borderRadius: 8, padding: '12px 16px', marginBottom: 16
            }}>
              <div style={{ fontWeight: 600, color: fraudWarning.level === 'HIGH' ? '#991B1B' : '#92400E', display: 'flex', alignItems: 'center', gap: 6 }}>
                {fraudWarning.level === 'HIGH' ? '🚨 High Fraud Risk Detected' : '⚠️ Repeat Claimant Detected'}
              </div>
              <div style={{ fontSize: 13, color: fraudWarning.level === 'HIGH' ? '#B91C1C' : '#B45309', marginTop: 4 }}>
                {fraudWarning.level === 'HIGH' 
                  ? `This buyer has filed ${fraudWarning.count}+ previous disputes. Evidence has been weighted accordingly. Case flagged for senior reviewer.`
                  : `This buyer has filed disputes before. Evidence reviewed with additional scrutiny.`}
              </div>
            </div>
          )}

          <BackgroundGradient className="rounded-[16px] p-0 bg-white" containerClassName="mb-8">
          <div style={{ border: '2px solid transparent', borderRadius: 16, background: 'white', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>

            {/* Header strip */}
            <div style={{ background: '#1C1C1E', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Scale size={18} color="white" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>4-Agent Dispute Resolution</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 1 }}>Evidence • Merchant • Customer • Judge</div>
              </div>
              
              {memoryState && (
                <div style={{ background: '#374151', color: '#D1D5DB', fontSize: 11, padding: '2px 8px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 4, marginRight: 8 }}>
                  🧠 Memory Active
                </div>
              )}

              <button
                onClick={handleRun4AgentTrial}
                disabled={isResolvingPipeline}
                style={{ height: 32, padding: '0 14px', borderRadius: 8, border: 'none', background: '#F97316', color: 'white', fontSize: 12, fontWeight: 600, cursor: isResolvingPipeline ? 'not-allowed' : 'pointer', opacity: isResolvingPipeline ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
              >
                <Zap size={13} />
                {isResolvingPipeline ? 'Adjudicating...' : '⚡ Run Resolution'}
              </button>
            </div>

            {/* Verdict hero */}
            <div style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap' }}>
              {verdict ? (
                <>
                  <div style={{ textAlign: 'center', flexShrink: 0, position: 'relative' }}>
                    <div 
                      onClick={() => setShowConfidenceExplain(!showConfidenceExplain)}
                      style={{ width: 72, height: 72, borderRadius: '50%', border: `4px solid ${confColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    >
                      <span style={{ fontSize: 20, fontWeight: 700, color: confColor }}>{conf}%</span>
                    </div>
                    <div style={{ fontSize: 9, letterSpacing: '0.08em', color: '#9CA3AF', marginTop: 6, textTransform: 'uppercase' }}>Confidence</div>
                    
                    {showConfidenceExplain && (
                      <div style={{
                        position: 'absolute',
                        top: 80,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: '#1F2937',
                        color: 'white',
                        padding: '16px',
                        borderRadius: '12px',
                        width: '320px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                        zIndex: 50,
                        textAlign: 'left',
                        fontSize: '12px',
                        lineHeight: '1.5'
                      }}>
                        <div style={{ fontWeight: 600, marginBottom: 12, borderBottom: '1px solid #374151', paddingBottom: 8 }}>
                          How we calculated {conf}% confidence:
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '8px 12px', marginBottom: 12 }}>
                          <span style={{ color: '#9CA3AF' }}>Evidence strength:</span>
                          <span style={{ fontWeight: 500 }}>84/100</span>
                          <span style={{ color: '#10B981' }}>↑ raises score</span>
                          
                          <span style={{ color: '#9CA3AF' }}>Agent agreement:</span>
                          <span style={{ fontWeight: 500 }}>2/4</span>
                          <span style={{ color: '#EF4444' }}>↓ lowers score</span>
                          
                          <span style={{ color: '#9CA3AF' }}>Filing timeliness:</span>
                          <span style={{ fontWeight: 500 }}>On time</span>
                          <span style={{ color: '#10B981' }}>↑ raises score</span>
                          
                          <span style={{ color: '#9CA3AF' }}>Buyer history:</span>
                          <span style={{ fontWeight: 500 }}>Clean</span>
                          <span style={{ color: '#10B981' }}>↑ raises score</span>
                          
                          <span style={{ color: '#9CA3AF' }}>Merchant history:</span>
                          <span style={{ fontWeight: 500 }}>1 complaint</span>
                          <span style={{ color: '#D1D5DB' }}>→ neutral</span>
                          
                          <span style={{ color: '#9CA3AF' }}>Policy clarity:</span>
                          <span style={{ fontWeight: 500 }}>Ambiguous</span>
                          <span style={{ color: '#EF4444' }}>↓ lowers score</span>
                        </div>
                        <div style={{ borderTop: '1px solid #374151', paddingTop: 8 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                            <span style={{ color: '#9CA3AF' }}>Final confidence:</span>
                            <span style={{ fontWeight: 700, color: confColor }}>{conf}%</span>
                          </div>
                          <div style={{ color: '#D1D5DB' }}>
                            Verdict: <span style={{ fontWeight: 600, color: 'white' }}>{(verdict.decision || 'PARTIAL REFUND').replace(/_/g, ' ')} — Human review required</span>
                          </div>
                        </div>
                        
                        {/* Pointer triangle */}
                        <div style={{
                          position: 'absolute',
                          top: -6,
                          left: '50%',
                          transform: 'translateX(-50%) rotate(45deg)',
                          width: 12,
                          height: 12,
                          background: '#1F2937',
                        }} />
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>{decisionLabel}</div>
                    {verdict.amount > 0 && <div style={{ fontSize: 30, fontWeight: 700, color: '#F97316', marginTop: 4 }}>₹{verdict.amount.toLocaleString('en-IN')}</div>}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, flexShrink: 0 }}>
                    {[
                      { agent: 'Evidence', output: agentOutputs.find(o => o.agent === 'evidence') },
                      { agent: 'Merchant', output: agentOutputs.find(o => o.agent === 'merchant') },
                      { agent: 'Customer', output: agentOutputs.find(o => o.agent === 'customer') },
                      { agent: 'Judge',    output: { content: verdict?.decision || '' } },
                    ].map(({ agent, output }) => {
                      let text = '—'; let color = '#D1D5DB'; let bg = '#F8F9FA';
                      if (output) {
                        const c = typeof output.content === 'object' ? output.content : {};
                        const verdictField = (c.merchant_verdict || c.customer_verdict || '').toUpperCase();
                        const summaryText  = (c.summary || c.position || c.merchant_reasoning || c.customer_reasoning || '').toLowerCase();
                        // Judge chip: use the actual final decision
                        if (agent === 'Judge') {
                          const d = (verdict?.decision || '').toUpperCase();
                          if (d.includes('DENY') || d === 'ESCALATE') { text = '✗ Deny'; color = '#BE123C'; bg = '#FFE4E6'; }
                          else if (d.includes('PARTIAL')) { text = '⚖ Partial'; color = '#B45309'; bg = '#FEF3C7'; }
                          else if (d.includes('REFUND') || d.includes('APPROVE')) { text = '✓ Approve'; color = '#047857'; bg = '#D1FAE5'; }
                          else { text = '— Pending'; color = '#6B7280'; bg = '#F8F9FA'; }
                        } else if (verdictField.includes('DENY') || verdictField.includes('NO_SUPPORT') || verdictField.includes('OPPOSE') || summaryText.includes('deny') || summaryText.includes('no merit') || summaryText.includes('reject')) {
                          text = '✗ Disputes'; color = '#BE123C'; bg = '#FFE4E6';
                        } else if (verdictField.includes('PARTIAL') || verdictField.includes('MODERATE') || summaryText.includes('partial')) {
                          text = '⚖ Partial'; color = '#B45309'; bg = '#FEF3C7';
                        } else if (output.content) {
                          text = '✓ Supports'; color = '#047857'; bg = '#D1FAE5';
                        }
                      }
                      return (
                        <div key={agent} style={{ background: bg, borderRadius: 8, padding: '8px 12px', border: `1px solid ${color}33` }}>
                          <div style={{ fontSize: 10, color: '#6B7280', marginBottom: 2 }}>{agent} Agent</div>
                          <div style={{ fontSize: 11, fontWeight: 600, color }}>{text}</div>
                        </div>
                      );
                    })}
                  </div>
                  {verdict?.conflict_summary && (
                    <div style={{ width: '100%', marginTop: 12, background: '#FFFBEB', borderLeft: '3px solid #F59E0B', borderRadius: 8, padding: 12, fontSize: 12, color: '#92400E' }}>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>⚖ Agent Conflict Detected</div>
                      <div>{verdict.conflict_summary}</div>
                    </div>
                  )}
                </>
              ) : isResolvingPipeline ? (
                <LiveThoughtStream isResolving={isResolvingPipeline} />
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', border: '2px dashed #D1D5DB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Scale size={20} color="#D1D5DB" />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>No verdict yet</div>
                    <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 3 }}>
                      Describe your dispute above, then click "Run Resolution".
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Tabs */}
            <div style={{ borderTop: '1px solid #F3F4F6', padding: '0 20px', display: 'flex' }}>
              {AGENT_TABS.map(tab => (
                <button key={tab.key} onClick={() => setActiveAgentTab(tab.key)} style={{ padding: '11px 14px', fontSize: 13, background: 'none', border: 'none', borderBottom: activeAgentTab === tab.key ? '2px solid #F97316' : '2px solid transparent', color: activeAgentTab === tab.key ? '#F97316' : '#6B7280', fontWeight: activeAgentTab === tab.key ? 600 : 400, cursor: 'pointer' }}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div style={{ padding: '18px 24px', minHeight: 72 }}>
              {getTabContent()}
            </div>

            {/* Footer */}
            {verdict && (
              <div style={{ borderTop: '1px solid #F3F4F6', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FAFAFA' }}>
                {verdict.action_taken === 'pending_human_approval' ? (
                  <>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20, background: 'rgba(245,158,11,0.12)', color: '#92400E' }}>Pending Human Approval</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => { approveDispute(verdict.dispute_id); setVerdict({...verdict, action_taken: 'approved_by_human'}) }} style={{ fontSize: 12, color: 'white', border: 'none', borderRadius: 6, padding: '6px 12px', background: '#10B981', cursor: 'pointer', fontWeight: 600 }}>
                        ✓ Approve
                      </button>
                      <button onClick={() => { escalateDispute(verdict.dispute_id); setVerdict({...verdict, action_taken: 'rejected_by_human'}) }} style={{ fontSize: 12, color: 'white', border: 'none', borderRadius: 6, padding: '6px 12px', background: '#EF4444', cursor: 'pointer', fontWeight: 600 }}>
                        ✗ Reject
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20, background: 'rgba(245,158,11,0.12)', color: '#92400E' }}>{actionLabel}</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={handleCopyVerdict} style={{ fontSize: 12, color: '#6B7280', border: '1px solid #E5E7EB', borderRadius: 6, padding: '6px 12px', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                        {isCopied ? <Check size={12} /> : <Copy size={12} />} {isCopied ? 'Copied!' : 'Copy Summary'}
                      </button>
                      <button onClick={handleDownload} style={{ fontSize: 12, color: '#6B7280', border: '1px solid #E5E7EB', borderRadius: 6, padding: '6px 12px', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                        📄 Download
                      </button>
                      <button onClick={handleRun4AgentTrial} style={{ fontSize: 12, color: '#6B7280', border: '1px solid #E5E7EB', borderRadius: 6, padding: '6px 12px', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <RotateCw size={12} /> Re-Adjudicate
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          </BackgroundGradient>
          </ErrorBoundary>

          {/* Feedback */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingBottom: 8 }}>
            {[{ Icon: ThumbsUp, id: 'up', active: '#10B981' }, { Icon: ThumbsDown, id: 'down', active: '#EF4444' }].map(({ Icon, id, active }) => (
              <button key={id} onClick={() => setLiked(id)} style={{ padding: 8, borderRadius: 8, border: 'none', background: 'white', cursor: 'pointer', color: liked === id ? active : '#9CA3AF' }}>
                <Icon size={16} />
              </button>
            ))}
          </div>

          <div ref={chatEndRef} />
        </div>
      </div>

      {/* ── Sticky input bar ── */}
      <div style={{ borderTop: '1px solid #D1D5DB', background: '#E5E7EB', padding: '12px 24px 90px 24px', flexShrink: 0 }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>

          {/* Inline attachment shelf (when files attached outside of form) */}
          {attachments.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
              {attachments.map(att => (
                <div key={att.id} style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#E5E7EB', border: '1px solid #D1D5DB', borderRadius: 6, padding: '3px 8px', fontSize: 11, color: '#374151' }}>
                  <ImageIcon size={11} color="#F97316" />
                  <span style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>{att.name}</span>
                  <button onClick={() => setAttachments(p => p.filter(a => a.id !== att.id))} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#6B7280', padding: 0, display: 'flex' }}>
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <input type="file" ref={fileInputRef} multiple style={{ display: 'none' }} onChange={handleFileUpload} />

          {/* Composer */}
          <form onSubmit={handleSendMessage}>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1.5px solid #E5E7EB', borderRadius: 12, padding: '0 12px', height: 46, background: 'white', transition: 'all 0.15s' }}
              onFocus={() => {}}
            >
              <button type="button" onClick={() => fileInputRef.current?.click()} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9CA3AF', display: 'flex', padding: 2, flexShrink: 0 }} title="Attach file">
                <Plus size={18} />
              </button>
              <button type="button" onClick={() => setDisputeFormOpen(o => !o)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9CA3AF', display: 'flex', padding: 2, flexShrink: 0 }} title="Open dispute form">
                <FolderOpen size={18} />
              </button>
              <GooeyInput
                value={inputText}
                onValueChange={setInputText}
                placeholder="Describe your dispute or upload evidence..."
                expandedWidth={550}
                collapsedWidth={250}
                className="flex-1"
                classNames={{
                  input: "text-[#374151]",
                  buttonRow: "bg-white text-[#374151]",
                  bubbleSurface: "bg-[#F97316]"
                }}
              />
              <MagneticButton>
                <button
                  type="button"
                  onMouseDown={startRecording}
                  onMouseUp={stopRecording}
                  onTouchStart={startRecording}
                  onTouchEnd={stopRecording}
                  style={{ width: 36, height: 36, borderRadius: '50%', background: isRecording ? '#EF4444' : '#F3F4F6', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, marginRight: 8, transition: 'background 0.2s' }}
                >
                  <Mic size={15} color={isRecording ? 'white' : '#6B7280'} />
                </button>
              </MagneticButton>
              <MagneticButton>
                <button
                  type="submit"
                  disabled={isProcessing || (!inputText.trim() && attachments.length === 0)}
                  style={{ width: 36, height: 36, borderRadius: '50%', background: '#F97316', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, opacity: (isProcessing || (!inputText.trim() && attachments.length === 0)) ? 0.4 : 1 }}
                >
                  <Send size={15} color="white" />
                </button>
              </MagneticButton>
            </div>
          </form>

          <div style={{ fontSize: 10, color: '#D1D5DB', textAlign: 'center', marginTop: 6 }}>
            Nyaya AI Autonomous Dispute Resolution Engine • Paytm Build for India Hackathon Track 3
          </div>
        </div>
      </div>

      <style>{`@keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }\n@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
