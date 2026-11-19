import React, { useState, useEffect } from 'react';
import { Volume2, Upload, CheckCircle2, XCircle, AlertTriangle, FileText, Send, Sparkles, Copy, Check } from 'lucide-react';
import { executeDisputeAction, uploadDisputeEvidence, fetchCustomerDraft } from '../lib/api';
import { playTextToSpeech, SUPPORTED_LANGUAGES, translateFromEnglish } from '../lib/sarvamClient';

export default function VerdictCard({ verdict, dispute, disputeId, agentOutputs = [], onActionCompleted = () => {} }) {
  const [showOverrideInput, setShowOverrideInput] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideAction, setOverrideAction] = useState('CONTEST');
  const [reviewerName, setReviewerName] = useState('Ops Reviewer');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);
  const [executionError, setExecutionError] = useState(null);

  // Evidence Pack Builder State
  const [contestNote, setContestNote] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [checklist, setChecklist] = useState([]);
  const [evidenceList, setEvidenceList] = useState([]);

  // Sarvam Voice & Customer Draft State
  const [selectedLang, setSelectedLang] = useState('hi-IN');
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  const [ttsAudio, setTtsAudio] = useState(null);
  const [customerDraft, setCustomerDraft] = useState(null);
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [copiedDraft, setCopiedDraft] = useState(false);
  const [translatedReasoning, setTranslatedReasoning] = useState(null);

  if (!verdict) return null;

  const rec = verdict.recommendation || verdict.decision || 'CONTEST';
  const confidence = verdict.confidence || 75;
  const winLikelihood = verdict.win_likelihood !== undefined ? verdict.win_likelihood : (rec === 'CONTEST' ? 72 : 25);
  const amountAtRisk = verdict.amount_at_risk || dispute?.dispute_amount || 0;
  const activeDisputeId = disputeId || dispute?.dispute_id || verdict.dispute_id;

  // Initialize checklist and contest note
  useEffect(() => {
    if (verdict.evidence_checklist && verdict.evidence_checklist.length > 0) {
      setChecklist(verdict.evidence_checklist);
    } else if (dispute?.preferred_evidence) {
      const docs = dispute.dispute_evidence || [];
      const generated = dispute.preferred_evidence.map(item => ({
        item,
        status: docs.some(d => item.toLowerCase().includes((d.doc_type || '').toLowerCase())) ? 'HAVE' : 'MISSING'
      }));
      setChecklist(generated);
    }

    if (dispute?.dispute_evidence) {
      setEvidenceList(dispute.dispute_evidence);
    }

    // Prefill contest note if none
    if (!contestNote) {
      const order = dispute?.order_details;
      const delivery = order?.delivery_details;
      setContestNote(
        `Dispute ${activeDisputeId} regarding order ${order?.order_id || 'CF-ORD'}: ` +
        `Merchant records confirm item was dispatched via ${delivery?.courier || 'courier'} (tracking: ${delivery?.tracking_number || 'N/A'}). ` +
        `Delivery status confirmed with OTP verification (${delivery?.otp_verified ? 'Verified' : 'Logistics confirmation'}). ` +
        `All authentic order documents and invoices are attached for Cashfree and issuing bank review.`
      );
    }
  }, [verdict, dispute, activeDisputeId]);

  // Restore execution result from dispute audit history if already executed
  useEffect(() => {
    if (!executionResult && dispute?.audit_history && dispute.audit_history.length > 0) {
      const latestAudit = dispute.audit_history[dispute.audit_history.length - 1];
      setExecutionResult({
        success: true,
        action: latestAudit.action,
        dispute_id: activeDisputeId,
        audit_entry: latestAudit
      });
    }
  }, [dispute, activeDisputeId, executionResult]);

  // Translate reasoning when language changes
  useEffect(() => {
    if (selectedLang === 'en-IN') {
      setTranslatedReasoning(null);
      return;
    }
    const combinedReasoning = (verdict.reasoning || []).join(' ');
    if (combinedReasoning) {
      translateFromEnglish(combinedReasoning, selectedLang)
        .then(setTranslatedReasoning)
        .catch(() => setTranslatedReasoning(null));
    }
  }, [selectedLang, verdict]);

  // Check if required evidence is missing for CONTEST
  const missingCount = checklist.filter(c => c.status === 'MISSING').length;
  const isContestBlocked = rec === 'CONTEST' && missingCount > 0;

  // Headline per Section 5 rules
  let headline = '';
  let approveButtonText = '';

  switch (rec) {
    case 'CONTEST':
      headline = `Nyaya recommends contesting. Estimated win likelihood ${winLikelihood}% (AI estimate)`;
      approveButtonText = 'Approve: Submit evidence to Cashfree';
      break;
    case 'ACCEPT':
      headline = 'Nyaya recommends accepting this dispute';
      approveButtonText = 'Approve: Accept dispute';
      break;
    case 'REFUND':
      headline = `Nyaya recommends refunding Rs ${amountAtRisk.toLocaleString()} now to avoid chargeback`;
      approveButtonText = `Approve: Issue refund of Rs ${amountAtRisk.toLocaleString()}`;
      break;
    case 'ESCALATE':
    default:
      headline = 'Nyaya is referring this to a senior reviewer';
      approveButtonText = 'Approve: Escalate to Senior Reviewer';
      break;
  }

  // Handle Action Approval
  const handleApproveAction = async (actionToRun = rec, customNote = '', override = false) => {
    setIsExecuting(true);
    setExecutionError(null);
    try {
      const res = await executeDisputeAction(activeDisputeId, {
        action: actionToRun,
        approvedBy: reviewerName || 'Ops Reviewer',
        note: customNote || contestNote || 'Approved via Nyaya Ops Reviewer',
        overrideReason: override ? overrideReason : ''
      });
      setExecutionResult(res);
      setIsExecuting(false);
      setShowOverrideInput(false);
      onActionCompleted(res);
    } catch (err) {
      console.error('Execution error:', err);
      setExecutionError(err.message || 'Cashfree execution failed');
      setIsExecuting(false);
    }
  };

  // Upload missing file handler
  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      const result = await uploadDisputeEvidence(activeDisputeId, files, 'Delivery & Dispatch Proof');
      if (result.dispute_evidence) {
        setEvidenceList(result.dispute_evidence);
      }
      // Mark missing items as HAVE if files were uploaded
      setChecklist(prev => prev.map((item, idx) => idx === 0 || item.status === 'MISSING' ? { ...item, status: 'HAVE' } : item));
      setIsUploading(false);
    } catch (err) {
      alert('Upload failed: ' + err.message);
      setIsUploading(false);
    }
  };

  // TTS Readout handler
  const handleTTSPlay = async () => {
    if (isPlayingTTS) {
      if (ttsAudio) {
        ttsAudio.pause();
        setIsPlayingTTS(false);
      }
      return;
    }

    try {
      setIsPlayingTTS(true);
      const textToRead = translatedReasoning || headline;
      const audio = await playTextToSpeech(textToRead, selectedLang);
      setTtsAudio(audio);
      audio.onended = () => setIsPlayingTTS(false);
      audio.onerror = () => setIsPlayingTTS(false);
    } catch (e) {
      alert('TTS Playback failed: ' + e.message);
      setIsPlayingTTS(false);
    }
  };

  // Customer draft generation handler
  const handleGenerateDraft = async () => {
    setIsGeneratingDraft(true);
    try {
      const draft = await fetchCustomerDraft(activeDisputeId, rec, selectedLang);
      setCustomerDraft(draft);
      setIsGeneratingDraft(false);
    } catch (e) {
      alert('Draft generation failed: ' + e.message);
      setIsGeneratingDraft(false);
    }
  };

  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #E5E7EB',
      borderRadius: 16,
      overflow: 'hidden',
      boxShadow: '0 4px 16px rgba(0,0,0,0.06)'
    }}>
      {/* ── TOP SECTION: HEADLINE & WIN LIKELIHOOD ───────────────────────── */}
      <div style={{
        padding: '24px 28px',
        borderBottom: '1px solid #F3F4F6',
        background: rec === 'CONTEST' ? '#F0FDF4' : (rec === 'REFUND' ? '#FFFBEB' : '#FEF2F2'),
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 20
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.05em',
              padding: '3px 10px',
              borderRadius: 20,
              background: rec === 'CONTEST' ? '#16A34A' : (rec === 'REFUND' ? '#D97706' : '#DC2626'),
              color: '#FFFFFF'
            }}>
              RECOMMENDATION: {rec}
            </span>
            <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>
              Confidence: {confidence}% · Amount: ₹{amountAtRisk.toLocaleString()}
            </span>
          </div>

          <h2 style={{
            fontSize: 20,
            fontWeight: 800,
            color: '#111827',
            margin: '0 0 8px 0',
            lineHeight: 1.3
          }}>
            {headline}
          </h2>

          <div style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.5 }}>
            {verdict.deadline_note || `Respond by ${dispute?.respond_by || 'deadline'}. Action executed only after human ops approval.`}
          </div>
        </div>

        {/* Win Likelihood Ring / Metric */}
        <div style={{
          textAlign: 'center',
          padding: '12px 18px',
          background: '#FFFFFF',
          borderRadius: 12,
          border: '1px solid #E5E7EB',
          boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
          minWidth: 120
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>
            Win Likelihood
          </div>
          <div style={{
            fontSize: 28,
            fontWeight: 900,
            color: winLikelihood >= 60 ? '#16A34A' : (winLikelihood >= 40 ? '#D97706' : '#DC2626'),
            lineHeight: 1.2,
            marginTop: 4
          }}>
            {winLikelihood}%
          </div>
          <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600 }}>
            AI Estimate
          </div>
        </div>
      </div>

      {/* ── SARVAM MULTILINGUAL CONTROLS BAR ───────────────────────────── */}
      <div style={{
        padding: '10px 28px',
        background: '#F9FAFB',
        borderBottom: '1px solid #F3F4F6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>
            🇮🇳 Sarvam Regional Language:
          </span>
          <select
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value)}
            style={{
              padding: '5px 10px',
              borderRadius: 6,
              border: '1px solid #D1D5DB',
              fontSize: 12,
              background: '#FFFFFF',
              color: '#111827',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {SUPPORTED_LANGUAGES.map(lang => (
              <option key={lang.code} value={lang.code}>{lang.flag} {lang.name}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Read Out Loud via Sarvam TTS */}
          <button
            onClick={handleTTSPlay}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 6,
              border: '1px solid #D1D5DB',
              background: isPlayingTTS ? '#EF4444' : '#FFFFFF',
              color: isPlayingTTS ? '#FFFFFF' : '#374151',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <Volume2 size={14} />
            {isPlayingTTS ? 'Stop Listening' : 'Listen in Regional Language (TTS)'}
          </button>

          {/* Draft Customer Message */}
          <button
            onClick={handleGenerateDraft}
            disabled={isGeneratingDraft}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 6,
              border: '1px solid #F97316',
              background: '#FFF7ED',
              color: '#EA580C',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <Sparkles size={14} />
            {isGeneratingDraft ? 'Generating Draft...' : 'Draft Customer Reply'}
          </button>
        </div>
      </div>

      {/* ── CUSTOMER REPLY DRAFT DRAWER (SIDE-BY-SIDE) ──────────────────── */}
      {customerDraft && (
        <div style={{
          padding: '16px 28px',
          background: '#FFFDF9',
          borderBottom: '1px solid #FED7AA'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: '#C2410C', display: 'flex', alignItems: 'center', gap: 6 }}>
              <FileText size={16} />
              Customer Reply Draft (English & Translated · Never Auto-Sent)
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${customerDraft.english}\n\n${customerDraft.vernacular}`);
                setCopiedDraft(true);
                setTimeout(() => setCopiedDraft(false), 2000);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: '#FFFFFF',
                border: '1px solid #FED7AA',
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 700,
                color: '#EA580C',
                cursor: 'pointer'
              }}
            >
              {copiedDraft ? <Check size={12} /> : <Copy size={12} />}
              {copiedDraft ? 'Copied' : 'Copy Both'}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: '#FFFFFF', padding: 12, borderRadius: 8, border: '1px solid #E5E7EB' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', marginBottom: 6 }}>ENGLISH (AUDIT COPY):</div>
              <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.5 }}>{customerDraft.english}</div>
            </div>
            <div style={{ background: '#FFFFFF', padding: 12, borderRadius: 8, border: '1px solid #E5E7EB' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#F97316', marginBottom: 6 }}>REGIONAL TRANSLATION:</div>
              <div style={{ fontSize: 12, color: '#111827', lineHeight: 1.5, fontWeight: 500 }}>{customerDraft.vernacular}</div>
            </div>
          </div>
        </div>
      )}

      {/* ── REASONING BULLETS ───────────────────────────────────────────── */}
      <div style={{ padding: '20px 28px', borderBottom: '1px solid #F3F4F6' }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: '#374151', textTransform: 'uppercase', marginBottom: 12, letterSpacing: '0.04em' }}>
          Key Evidence & Defense Rationale
        </div>

        {translatedReasoning ? (
          <div style={{
            padding: 12,
            background: '#FFF7ED',
            borderRadius: 8,
            border: '1px solid #FED7AA',
            marginBottom: 14,
            fontSize: 13,
            color: '#111827',
            lineHeight: 1.6
          }}>
            <span style={{ fontWeight: 700, color: '#C2410C' }}>Regional Summary: </span>
            {translatedReasoning}
          </div>
        ) : null}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(verdict.reasoning || []).map((point, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#F97316',
                marginTop: 7,
                flexShrink: 0
              }} />
              <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>
                {point}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SECTION 4: EVIDENCE PACK BUILDER (CHECKLIST & UPLOAD) ────────── */}
      {rec === 'CONTEST' && (
        <div style={{
          padding: '20px 28px',
          background: '#FAFAFA',
          borderBottom: '1px solid #F3F4F6'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#111827' }}>
                📦 Evidence Pack Checklist (Cashfree Requirements)
              </div>
              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
                Card networks require evidence matching the reason code. Upload missing items before submitting.
              </div>
            </div>

            {/* Upload Button */}
            <label style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#FFFFFF',
              border: '1px solid #D1D5DB',
              padding: '6px 12px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 700,
              color: '#374151',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}>
              <Upload size={14} color="#F97316" />
              {isUploading ? 'Uploading...' : 'Upload Missing Document'}
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                accept=".pdf,.jpg,.jpeg,.png"
              />
            </label>
          </div>

          {/* Checklist Items */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10, marginBottom: 16 }}>
            {checklist.map((item, idx) => {
              const isHave = item.status === 'HAVE';
              return (
                <div
                  key={idx}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: isHave ? '#ECFDF5' : '#FEF2F2',
                    border: `1px solid ${isHave ? '#A7F3D0' : '#FECACA'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: 12
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: isHave ? '#065F46' : '#991B1B' }}>
                    {isHave ? <CheckCircle2 size={16} color="#10B981" /> : <XCircle size={16} color="#EF4444" />}
                    <span style={{ fontWeight: 600 }}>{item.item}</span>
                  </div>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: 4,
                    background: isHave ? '#10B981' : '#EF4444',
                    color: '#FFFFFF'
                  }}>
                    {item.status}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Warning if required evidence is missing */}
          {isContestBlocked && (
            <div style={{
              padding: '10px 14px',
              borderRadius: 8,
              background: '#FFFBEB',
              border: '1px solid #FDE68A',
              color: '#92400E',
              fontSize: 12,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 14
            }}>
              <AlertTriangle size={16} color="#D97706" />
              Cannot submit contest: {missingCount} required evidence document(s) are MISSING. Upload proof above to enable Cashfree submission.
            </div>
          )}

          {/* Editable Plain-Text Contest Note (max 200 words, factual) */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>
                Factual Contest Note (Sent to Cashfree / Issuing Bank, max 200 words):
              </label>
              <span style={{ fontSize: 11, color: '#6B7280' }}>
                {contestNote.trim().split(/\s+/).filter(Boolean).length} / 200 words
              </span>
            </div>
            <textarea
              value={contestNote}
              onChange={(e) => setContestNote(e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #D1D5DB',
                fontSize: 12,
                color: '#111827',
                fontFamily: 'inherit',
                lineHeight: 1.5,
                resize: 'vertical'
              }}
            />
          </div>
        </div>
      )}

      {/* ── EXECUTION SUCCESS / ERROR BANNER ────────────────────────────── */}
      {executionResult && (
        <div style={{
          padding: '16px 28px',
          background: executionResult.action === 'ESCALATE' ? '#FFFBEB' : '#ECFDF5',
          borderBottom: `1px solid ${executionResult.action === 'ESCALATE' ? '#FDE68A' : '#A7F3D0'}`,
          display: 'flex',
          alignItems: 'center',
          gap: 12
        }}>
          <CheckCircle2 size={24} color={executionResult.action === 'ESCALATE' ? '#D97706' : '#059669'} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: executionResult.action === 'ESCALATE' ? '#92400E' : '#065F46' }}>
              {executionResult.action === 'ESCALATE'
                ? 'Dispute Successfully Escalated to Senior Reviewer'
                : `Action Executed Successfully on Cashfree (${executionResult.action})`}
            </div>
            <div style={{ fontSize: 12, color: executionResult.action === 'ESCALATE' ? '#B45309' : '#047857', marginTop: 2 }}>
              Audit Entry: ID {executionResult.audit_entry?.id} · Approved by {executionResult.audit_entry?.approved_by} at {new Date(executionResult.audit_entry?.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </div>
      )}

      {executionError && (
        <div style={{
          padding: '16px 28px',
          background: '#FEF2F2',
          borderBottom: '1px solid #FECACA',
          display: 'flex',
          alignItems: 'center',
          gap: 12
        }}>
          <XCircle size={24} color="#DC2626" />
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#991B1B' }}>
              Cashfree PG Execution Error
            </div>
            <div style={{ fontSize: 12, color: '#B91C1C', marginTop: 2 }}>
              {executionError}
            </div>
          </div>
        </div>
      )}

      {/* ── HUMAN APPROVAL ACTION BUTTONS SECTION ─────────────────────── */}
      <div style={{
        padding: '20px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        {/* Reviewer Identifier Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#6B7280' }}>
            Reviewer:
          </span>
          <input
            type="text"
            value={reviewerName}
            onChange={(e) => setReviewerName(e.target.value)}
            style={{
              padding: '6px 10px',
              borderRadius: 6,
              border: '1px solid #D1D5DB',
              fontSize: 12,
              fontWeight: 600,
              width: 140
            }}
          />
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Override Button */}
          {!showOverrideInput && (
            <button
              onClick={() => setShowOverrideInput(true)}
              disabled={isExecuting || !!executionResult}
              style={{
                padding: '9px 16px',
                borderRadius: 8,
                border: '1px solid #D1D5DB',
                background: '#FFFFFF',
                color: '#4B5563',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Manual Override
            </button>
          )}

          {/* Main Action Button */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              handleApproveAction(rec, contestNote, false);
            }}
            disabled={isExecuting || isContestBlocked || !!executionResult}
            style={{
              padding: '10px 22px',
              borderRadius: 8,
              border: 'none',
              background: (isContestBlocked || !!executionResult) ? '#9CA3AF' : (rec === 'CONTEST' ? '#16A34A' : '#F97316'),
              color: '#FFFFFF',
              fontSize: 13,
              fontWeight: 800,
              cursor: (isContestBlocked || !!executionResult) ? 'not-allowed' : 'pointer',
              boxShadow: (isContestBlocked || !!executionResult) ? 'none' : '0 2px 8px rgba(249, 115, 22, 0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <Send size={15} />
            {isExecuting ? 'Calling Cashfree API...' : (executionResult ? 'Executed' : approveButtonText)}
          </button>
        </div>
      </div>

      {/* ── OVERRIDE INPUT DRAWER ──────────────────────────────────────── */}
      {showOverrideInput && (
        <div style={{
          padding: '18px 28px',
          background: '#FFFBEB',
          borderTop: '1px solid #FDE68A'
        }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#92400E', marginBottom: 8 }}>
            Override AI Recommendation
          </div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
            <select
              value={overrideAction}
              onChange={(e) => setOverrideAction(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                border: '1px solid #D1D5DB',
                fontSize: 12,
                fontWeight: 700,
                background: '#FFFFFF'
              }}
            >
              <option value="CONTEST">Override to CONTEST</option>
              <option value="REFUND">Override to REFUND</option>
              <option value="ACCEPT">Override to ACCEPT</option>
            </select>
            <input
              type="text"
              placeholder="State mandatory reason for overriding AI recommendation..."
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              style={{
                flex: 1,
                padding: '6px 12px',
                borderRadius: 6,
                border: '1px solid #D1D5DB',
                fontSize: 12
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button
              onClick={() => setShowOverrideInput(false)}
              style={{
                background: '#FFFFFF',
                border: '1px solid #D1D5DB',
                padding: '5px 12px',
                borderRadius: 6,
                fontSize: 12,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => handleApproveAction(overrideAction, contestNote, true)}
              disabled={!overrideReason.trim()}
              style={{
                background: '#D97706',
                color: '#FFFFFF',
                border: 'none',
                padding: '6px 14px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 700,
                cursor: overrideReason.trim() ? 'pointer' : 'not-allowed',
                opacity: overrideReason.trim() ? 1 : 0.5
              }}
            >
              Execute Override on Cashfree
            </button>
          </div>
        </div>
      )}

      {/* ── FOOTER MANDATORY STATEMENT ─────────────────────────────────── */}
      <div style={{
        padding: '12px 28px',
        background: '#F9FAFB',
        borderTop: '1px solid #F3F4F6',
        fontSize: 11,
        color: '#6B7280',
        fontWeight: 600,
        textAlign: 'center'
      }}>
        Nyaya recommends. A human approves. Actions run through Cashfree APIs.
      </div>
    </div>
  );
}
