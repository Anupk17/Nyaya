import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Paperclip,
  Image as ImageIcon,
  X,
  Sparkles,
  Scale,
  FileText,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Zap,
  ShoppingBag
} from 'lucide-react';
import { sendDisputeChatMessage, resolveCustomDispute, uploadEvidenceToS3, analyzeEvidence } from '../lib/api';
import Stepper from '../components/Stepper';
import AgentMessage from '../components/AgentMessage';
import VerdictCard from '../components/VerdictCard';
import { useDisputeStore } from '../store/disputeStore';
import { AnimatePresence, motion } from 'framer-motion';
import { GooeyInput } from '@/components/ui/gooey-input';
import { MagneticButton } from '@/components/ui/magnetic-button';

function extractAmount(text) {
  const match = text.match(/₹[\s]?([\d,]+)/)
  if (match) return parseInt(match[1].replace(',', ''))
  const wordMatch = text.match(/(\d+(?:,\d+)?)\s*(?:rupees|rs|inr)/i)
  if (wordMatch) return parseInt(wordMatch[1].replace(',', ''))
  return 0
}

function extractProductName(text) {
  const patterns = [
    /ordered\s+([^,\.]+)/i,
    /bought\s+(?:a\s+)?([^,\.]+)/i,
    /purchased\s+([^,\.]+)/i,
  ]
  for (const p of patterns) {
    const m = text.match(p)
    if (m) return m[1].trim().substring(0, 40)
  }
  return "Disputed Item"
}

function extractSellerName(text) {
  return "Merchant";
}


const PRESETS = [
  {
    title: '📦 Damaged Unboxing',
    product: 'Sony WH-1000XM4 Headphones',
    amount: 19999,
    merchant: 'TechStore Electronics',
    message: 'I received the package today and upon unboxing, the right ear cup is cracked and there is no sound output. The outer courier box was crushed.',
    proofName: 'damaged_headphone_unboxing.jpg',
    proofDesc: 'Photo showing cracked plastic casing on right hinge and dented outer box with courier label.'
  },
  {
    title: '⚠️ Counterfeit Device',
    product: 'Apple AirPods Pro (2nd Gen)',
    amount: 18900,
    merchant: 'GadgetWorld Delhi',
    message: "The serial number on the box is not recognized on Apple's coverage check site. The audio quality is terrible and the case lacks serial engravings.",
    proofName: 'apple_serial_check_error.png',
    proofDesc: 'Screenshot of Apple warranty portal showing "Serial number unrecognized" and photo of box typography errors.'
  },
  {
    title: '🚫 Stalled Non-Delivery',
    product: 'Nike Air Max 90 Sneakers',
    amount: 8499,
    merchant: 'KickZone Hub',
    message: 'The courier tracking shows "Out for Delivery" 4 days ago with zero progress. Nobody came to my house, and the seller stopped responding.',
    proofName: 'courier_stalled_tracking.png',
    proofDesc: 'Tracking timeline showing 96 hours without scan progression and chat log with uncooperative seller.'
  },
  {
    title: '🎨 Wrong Color / Sizing',
    product: 'FabIndia Silk Kurta (Maroon / XL)',
    amount: 3299,
    merchant: 'Ethnic Fashions Ltd',
    message: 'I received an Olive Green kurta in Medium size instead of Maroon XL. The seller claims it is within normal color variation, but this is a completely wrong product.',
    proofName: 'delivered_item_vs_listing.jpg',
    proofDesc: 'Side-by-side comparison photo showing delivered Olive Green tag vs order receipt for Maroon XL.'
  }
];

export default function LiveDispute({ useBedrock }) {
  const [productName, setProductName]       = useState('Sony WH-1000XM4 Headphones');
  const [amount, setAmount]                 = useState(19999);
  const [merchantName, setMerchantName]     = useState('TechStore Electronics');
  const [deliveryPartner, setDeliveryPartner] = useState('BlueDart Express');

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'assistant',
      content: '👋 Hello! I am Nyaya Dispute Copilot.\n\nTell me what went wrong with your order or transaction, and attach photos or receipts as proof. I will analyze your evidence and bring your case before our 4-Agent Court for an instant resolution.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputMessage, setInputMessage]   = useState('');
  const [disputeContext, setDisputeContext] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [attachments, setAttachments]     = useState([
    {
      id: 'default-1',
      name: 'damaged_headphone_unboxing.jpg',
      type: 'image/jpeg',
      description: 'Photo showing cracked plastic casing on right hinge and dented outer box with courier label.',
      dataUrl: null
    }
  ]);

  const [isResolving, setIsResolving]         = useState(false);
  const [currentStep, setCurrentStep]         = useState(-1);
  const [agentOutputs, setAgentOutputs]       = useState([]);
  const [verdict, setVerdict]                 = useState(null);
  const [createdCaseId, setCreatedCaseId]     = useState(null);
  const [resolutionError, setResolutionError] = useState(null);

  const chatEndRef  = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isChatLoading]);

  const handleApplyPreset = (preset) => {
    setProductName(preset.product);
    setAmount(preset.amount);
    setMerchantName(preset.merchant);
    setInputMessage(preset.message);
    setAttachments([{
      id: `preset-${Date.now()}`,
      name: preset.proofName,
      type: 'image/jpeg',
      description: preset.proofDesc,
      dataUrl: null
    }]);
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputMessage.trim() && attachments.length === 0) return;

    const userText = inputMessage.trim();
    const newMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      content: userText || `[Submitted ${attachments.length} proof attachment(s)]`,
      attachments: [...attachments],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    setInputMessage('');
    setIsChatLoading(true);

    if (!disputeContext) {
      setDisputeContext(userText);
    }

    const newDisputeId = `PTM-${Math.floor(10000 + Math.random() * 90000)}`;
    const newDispute = {
      id: newDisputeId,
      productName: extractProductName(userText) || productName || "Disputed Item",
      buyerName: "Customer (You)",
      sellerName: extractSellerName(userText) || merchantName || "Merchant",
      amount: extractAmount(userText) || amount || 0,
      filedAt: new Date(),
      status: 'PENDING',
      aiVerdict: null,
      reviewerAction: { action: null, reason: '', timestamp: null },
      userMessage: userText
    };
    useDisputeStore.getState().addDispute(newDispute);
    setCreatedCaseId(newDisputeId);

    try {
      const reply = await sendDisputeChatMessage(updatedMessages, attachments, { productName, amount, merchantName });
      setMessages(prev => [...prev, {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        content: reply.replace(/\*\*/g, ''),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: `assistant-err-${Date.now()}`,
        sender: 'assistant',
        content: `I've logged your claim. Click "Run 4-Agent Resolution" to have the agents adjudicate immediately.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      try {
        // Optimistic UI update
        const tempId = `att-${Date.now()}`;
        setAttachments(prev => [...prev, {
          id: tempId,
          name: file.name,
          type: file.type || 'image/jpeg',
          description: `Uploading to S3: ${file.name}...`,
          dataUrl: null
        }]);

        // Upload to S3
        const { bucket, key, url } = await uploadEvidenceToS3(file, 'new-case');
        
        let labelsDesc = '';
        try {
          // Analyze with Rekognition
          const labels = await analyzeEvidence(bucket, key);
          if (labels && labels.length > 0) {
            labelsDesc = ` \nRekognition AI detected: ${labels.join(', ')}`;
          }
        } catch (rekErr) {
          console.warn('Rekognition analysis failed:', rekErr);
        }

        setAttachments(prev => prev.map(a => 
          a.id === tempId ? {
            ...a,
            description: `S3 Object: s3://${bucket}/${key} (Verified)` + labelsDesc,
            dataUrl: url // Use S3 URL
          } : a
        ));
      } catch (err) {
        console.error('S3 Upload Error:', err);
      }
    }
  };

  const handleRemoveAttachment = (id) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handleRunResolution = async () => {
    setIsResolving(true);
    setCurrentStep(0);
    setAgentOutputs([]);
    setVerdict(null);
    setResolutionError(null);

    const payload = {
      customer_name: 'Live User (You)',
      merchant_name: merchantName,
      product_name: productName,
      amount: Number(amount) || 1500,
      customer_claim: disputeContext || inputMessage || 'Item arrived damaged / defective with unboxing proof attached.',
      merchant_claim: `The merchant dispatched ${productName} per order specifications via ${deliveryPartner}. Standard fulfillment protocols were observed.`,
      proof_attachments: attachments,
      chat_log: messages.map(m => ({ from: m.sender === 'user' ? 'customer' : 'merchant', text: m.content })),
      delivery_partner: deliveryPartner,
      delivery_status: 'Delivered',
      merchant_dispute_history_count: 2,
      use_bedrock: useBedrock
    };

    try {
      await resolveCustomDispute(payload, (event) => {
        if (event.type === 'start') {
          if (event.case_id) setCreatedCaseId(event.case_id);
          setCurrentStep(0);
        } else if (event.type === 'agent_start') {
          setCurrentStep(event.step);
        } else if (event.type === 'agent_complete') {
          setCurrentStep(event.step);
          if (event.output) {
            setAgentOutputs(prev => {
              const filtered = prev.filter(o => o.agent !== event.agent);
              return [...filtered, event.output];
            });
          }
        } else if (event.type === 'complete') {
          setCurrentStep(4);
          setVerdict(event.verdict);
          if (event.agent_outputs) setAgentOutputs(event.agent_outputs);
          
          let judgeOutput = event.agent_outputs?.find(o => o.agent === 'judge')?.content;
          let evidenceOutput = event.agent_outputs?.find(o => o.agent === 'evidence')?.content;
          let merchantOutput = event.agent_outputs?.find(o => o.agent === 'merchant')?.content;
          let customerOutput = event.agent_outputs?.find(o => o.agent === 'customer')?.content;

          if (createdCaseId && judgeOutput) {
            useDisputeStore.getState().updateDisputeVerdict(createdCaseId, {
              verdict: event.verdict.decision,
              confidence: event.verdict.confidence,
              recommendedAmount: event.verdict.amount,
              reasoning: event.verdict.reasoning?.[0] || judgeOutput.reasoning?.[0] || '',
              priority: event.verdict.fraud_flag ? "HIGH" : "MEDIUM",
              agentVotes: {
                evidence: "ANALYZED",
                merchant: merchantOutput?.position?.substring(0, 30) + '...',
                customer: customerOutput?.position?.substring(0, 30) + '...',
                judge: event.verdict.decision
              }
            });
          }
        } else if (event.type === 'error') {
          setResolutionError(event.error);
        }
      });
    } catch (err) {
      setResolutionError(err.message || 'Resolution pipeline encountered an error');
    } finally {
      setIsResolving(false);
    }
  };

  const handleReset = () => {
    setCurrentStep(-1);
    setAgentOutputs([]);
    setVerdict(null);
    setResolutionError(null);
  };

  return (
    <div className="h-full overflow-y-auto px-8 py-6 space-y-6 pb-12">

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[22px] font-semibold text-[#111827]">File a Dispute & Chat with Proof</h2>
          <p className="text-[13px] text-[#6B7280] mt-1">
            Type your grievance, attach proof, and trigger the 4 AI agents to evaluate evidence and deliver a verdict.
          </p>
        </div>
        <button
          onClick={handleRunResolution}
          disabled={isResolving}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#F97316] hover:bg-[#EA580C] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-colors shrink-0"
        >
          <Scale className="w-4 h-4" />
          {isResolving ? 'Agents Adjudicating...' : 'Run 4-Agent Resolution'}
        </button>
      </div>

      {/* ── Scenario preset pills ────────────────────────────────────────────── */}
      <div className="space-y-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280] flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#F97316]" /> Try a sample scenario:
        </span>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handleApplyPreset(preset)}
              className="h-7 px-3.5 rounded-full text-xs font-medium border border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#F97316] hover:text-[#F97316] transition-all"
            >
              {preset.title}
              <span className="ml-1.5 text-[#94A3B8]">₹{preset.amount.toLocaleString('en-IN')}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Main two-column grid ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* Left: Case inputs + Chat (5 cols) */}
        <div className="lg:col-span-5 space-y-4">

          {/* Case metadata card */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-1.5 mb-1">
              <ShoppingBag className="w-3.5 h-3.5 text-[#F97316]" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
                Order & Transaction Details
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Product Name',    value: productName,      setter: setProductName,      type: 'text'   },
                { label: 'Amount (₹ INR)',  value: amount,           setter: setAmount,           type: 'number' },
                { label: 'Merchant / Seller', value: merchantName,   setter: setMerchantName,     type: 'text'   },
                { label: 'Courier Partner', value: deliveryPartner,  setter: setDeliveryPartner,  type: 'text'   },
              ].map(({ label, value, setter, type }) => (
                <div key={label}>
                  <label className="text-[11px] text-[#6B7280] font-medium block mb-1">{label}</label>
                  <input
                    type={type}
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-2.5 py-1.5 text-[13px] text-[#111827] font-medium focus:border-[#F97316] focus:bg-white outline-none transition-colors"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Chat window */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl flex flex-col h-[480px] overflow-hidden">
            {/* Chat header */}
            <div className="px-4 py-3 border-b border-[#E5E7EB] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[13px] font-semibold text-[#111827]">Nyaya Copilot</span>
              </div>
              <span className="text-[11px] text-[#6B7280]">Explain your issue & attach proof</span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[85%] rounded-xl p-3 text-[13px] leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-[#111827] text-white rounded-br-none'
                      : 'bg-[#F9FAFB] text-[#374151] border border-[#E5E7EB] rounded-bl-none'
                  }`}>
                    <div className="whitespace-pre-wrap">{msg.content.replace(/\*\*/g, '')}</div>
                    {msg.attachments?.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-white/20 space-y-1">
                        <div className="text-[10px] font-semibold text-[#F97316] flex items-center gap-1">
                          <Paperclip className="w-3 h-3" /> Attached Proofs:
                        </div>
                        {msg.attachments.map((att, i) => (
                          <div key={i} className="text-[11px] bg-black/10 rounded px-2 py-1 flex items-center gap-1.5">
                            <FileText className="w-3 h-3 shrink-0" />
                            <span className="truncate font-mono">{att.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-[#94A3B8] mt-1 px-1">{msg.timestamp}</span>
                </div>
              ))}
              {isChatLoading && (
                <div className="flex items-center gap-2 text-[13px] text-[#6B7280] bg-[#F9FAFB] p-3 rounded-xl border border-[#E5E7EB] w-fit">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#F97316] animate-bounce" />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#F97316] animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#F97316] animate-bounce [animation-delay:0.4s]" />
                  <span>Analyzing your situation...</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Attachments shelf */}
            {attachments.length > 0 && (
              <div className="px-3 py-2 border-t border-[#E5E7EB] bg-[#F9FAFB] flex flex-wrap gap-2 max-h-20 overflow-y-auto">
                {attachments.map((att) => (
                  <div key={att.id} className="flex items-center gap-1.5 bg-white border border-[#E5E7EB] rounded-lg px-2.5 py-1 text-[11px] text-[#374151]">
                    <ImageIcon className="w-3 h-3 text-[#F97316] shrink-0" />
                    <span className="max-w-[140px] truncate font-mono">{att.name}</span>
                    <button onClick={() => handleRemoveAttachment(att.id)} className="text-[#94A3B8] hover:text-rose-500 transition-colors ml-1">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-3 pb-[90px] border-t border-[#E5E7EB] flex items-center gap-2">
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} multiple accept="image/*,.pdf" className="hidden" />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-lg bg-[#F9FAFB] hover:bg-[#F3F4F6] text-[#6B7280] border border-[#E5E7EB] transition-colors shrink-0"
                title="Attach proof"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <GooeyInput
                value={inputMessage}
                onValueChange={setInputMessage}
                placeholder="Explain what happened..."
                expandedWidth={500}
                collapsedWidth={200}
                className="flex-1"
                classNames={{
                  input: "text-[#374151]",
                  buttonRow: "bg-white text-[#374151]",
                  bubbleSurface: "bg-[#F97316]"
                }}
              />
              <MagneticButton>
                <button
                  type="submit"
                  disabled={!inputMessage.trim()}
                  style={{ width: 36, height: 36, borderRadius: '50%', background: '#F97316', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, opacity: !inputMessage.trim() ? 0.4 : 1 }}
                >
                  <Send size={15} color="white" />
                </button>
              </MagneticButton>
            </form>
          </div>
        </div>

        {/* Right: 4-Agent Chamber (7 cols) */}
        <div className="lg:col-span-7 space-y-4">

          {/* Stepper card */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-[#F97316]" />
                <h2 className="text-[14px] font-semibold text-[#111827]">Autonomous Multi-Agent Deliberation</h2>
              </div>
              {createdCaseId && (
                <span className="text-[11px] font-mono bg-[#F9FAFB] text-[#6B7280] px-2.5 py-1 rounded-md border border-[#E5E7EB]">
                  Case ID: {createdCaseId}
                </span>
              )}
            </div>
            <Stepper currentStep={currentStep} isProcessing={isResolving} />
          </div>

          {/* Error */}
          {resolutionError && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-[13px] font-semibold text-rose-700">Adjudication Pipeline Error</p>
                <p className="text-[12px] text-rose-600 mt-1">{resolutionError}</p>
              </div>
            </div>
          )}

          {/* Empty state */}
          {currentStep === -1 && !resolutionError && (
            <div className="bg-white border border-dashed border-[#E5E7EB] rounded-xl p-10 text-center space-y-4">
              <div className="w-14 h-14 rounded-xl bg-[#FFF7ED] border border-[#FED7AA] text-[#F97316] mx-auto flex items-center justify-center">
                <Sparkles className="w-7 h-7" />
              </div>
              <div className="max-w-sm mx-auto space-y-1.5">
                <h3 className="text-[14px] font-semibold text-[#111827]">Ready to Arbitrate Your Dispute</h3>
                <p className="text-[13px] text-[#6B7280] leading-relaxed">
                  Add your claim and proof in the chat, or choose a preset scenario. Then click the button above to start the 4 AI agents.
                </p>
              </div>
              <button
                onClick={handleRunResolution}
                disabled={isResolving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm bg-[#F97316] hover:bg-[#EA580C] text-white transition-colors"
              >
                <Zap className="w-4 h-4" /> Start Multi-Agent Trial
              </button>
            </div>
          )}

          {/* Agent outputs */}
          {agentOutputs.length > 0 && (
            <div className="space-y-2">
              {agentOutputs.map((output, idx) => (
                <AgentMessage key={idx} output={output} />
              ))}
            </div>
          )}

          {/* Verdict */}
          {verdict && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#111827]">
                    Official Binding Verdict
                  </span>
                </div>
                <button
                  onClick={handleReset}
                  className="text-[12px] text-[#6B7280] hover:text-[#111827] flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Start Another Case
                </button>
              </div>
              <VerdictCard verdict={verdict} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
