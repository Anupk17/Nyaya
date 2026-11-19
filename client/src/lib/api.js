const API_BASE = import.meta.env.VITE_API_URL || '/api';

/**
 * Fetch current Cashfree mode (mock or sandbox)
 */
export async function fetchMode() {
  try {
    const res = await fetch(`${API_BASE}/mode`);
    const data = await res.json();
    return data;
  } catch (e) {
    return { success: true, mode: 'mock', hasCredentials: false };
  }
}

/**
 * Fetch all disputes from Cashfree adapter
 */
export async function fetchDisputes() {
  const res = await fetch(`${API_BASE}/disputes`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch disputes');
  return data.disputes;
}

// Backward compatibility alias
export async function fetchCases() {
  return fetchDisputes();
}

/**
 * Fetch a single dispute by ID
 */
export async function fetchDispute(disputeId) {
  const res = await fetch(`${API_BASE}/disputes/${disputeId}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch dispute');
  return data;
}

// Backward compatibility alias
export async function fetchCase(caseId) {
  return fetchDispute(caseId);
}

/**
 * Resolve a custom user-submitted dispute with real-time SSE streaming
 */
export function resolveCustomDispute(payload, onEvent) {
  return new Promise((resolve, reject) => {
    fetch(`${API_BASE}/custom-dispute/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(response => {
      if (!response.ok) {
        reject(new Error(`HTTP ${response.status}`));
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      function read() {
        reader.read().then(({ done, value }) => {
          if (done) {
            resolve();
            return;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop();

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                onEvent(data);
                if (data.type === 'complete') {
                  resolve(data);
                }
                if (data.type === 'error') {
                  reject(new Error(data.error));
                }
              } catch (e) {
                console.error('Failed to parse SSE event:', line);
              }
            }
          }

          read();
        }).catch(reject);
      }

      read();
    }).catch(reject);
  });
}

/**
 * Run the 4-Agent Defense Pipeline for a dispute via SSE
 */
export function analyzeDispute(disputeId, onEvent, memoryPrecedents = null) {
  return new Promise((resolve, reject) => {
    fetch(`${API_BASE}/disputes/${disputeId}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memoryPrecedents })
    }).then(response => {
      if (!response.ok) {
        reject(new Error(`HTTP ${response.status}`));
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      function read() {
        reader.read().then(({ done, value }) => {
          if (done) {
            resolve();
            return;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop();

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                onEvent(data);
                if (data.type === 'complete') {
                  resolve(data);
                }
                if (data.type === 'error') {
                  reject(new Error(data.error));
                }
              } catch (e) {
                console.error('Failed to parse SSE event:', line);
              }
            }
          }

          read();
        }).catch(reject);
      }

      read();
    }).catch(reject);
  });
}

// Backward compatibility alias
export function resolveCase(caseId, onEvent) {
  return analyzeDispute(caseId, onEvent);
}

/**
 * Execute a human-approved action via Cashfree PG API
 */
export async function executeDisputeAction(disputeId, { action, approvedBy, note = '', overrideReason = '' }) {
  const res = await fetch(`${API_BASE}/disputes/${disputeId}/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, approvedBy, note, overrideReason })
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to execute action via Cashfree');
  }
  return data;
}

/**
 * Upload local evidence documents to the dispute evidence pack
 */
export async function uploadDisputeEvidence(disputeId, fileList, docType = 'Merchant Proof') {
  const formData = new FormData();
  formData.append('doc_type', docType);
  for (let i = 0; i < fileList.length; i++) {
    formData.append('files', fileList[i]);
  }

  const res = await fetch(`${API_BASE}/disputes/${disputeId}/upload`, {
    method: 'POST',
    body: formData
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Upload failed');
  return data;
}

/**
 * Fetch audit trail logs
 */
export async function fetchAuditLog() {
  const res = await fetch(`${API_BASE}/audit-log`);
  const data = await res.json();
  return data.logs || [];
}

/**
 * Fetch computed resolution analytics
 */
export async function fetchAnalytics() {
  const res = await fetch(`${API_BASE}/analytics`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch analytics');
  return data.stats;
}

// Backward compatibility alias
export async function fetchStats() {
  return fetchAnalytics();
}

/**
 * Generate customer communication draft via Sarvam
 */
export async function fetchCustomerDraft(disputeId, action, customerLang = 'hi-IN') {
  const res = await fetch(`${API_BASE}/sarvam/customer-draft`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ disputeId, action, customerLang })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to generate customer draft');
  return data;
}

/**
 * Transcribe audio using backend Sarvam STT route
 */
export async function transcribeAudio(audioBlob, languageCode = 'auto') {
  const mimeType = audioBlob.type || 'audio/webm';
  const ext = mimeType.includes('wav') ? 'wav' : (mimeType.includes('mp4') ? 'mp4' : 'webm');
  const formData = new FormData();
  formData.append('audio', audioBlob, `recording.${ext}`);
  if (languageCode) formData.append('language', languageCode);
  
  const res = await fetch(`${API_BASE}/sarvam/stt`, {
    method: 'POST',
    body: formData
  });
  
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to transcribe audio');
  return data.text;
}

/**
 * Chat assistant for merchant copilot
 */
export async function sendDisputeChatMessage(messages, disputeId = null, draftCase = {}) {
  const lastMsg = Array.isArray(messages) ? messages[messages.length - 1]?.text || '' : messages;
  const res = await fetch(`${API_BASE}/chat-assistant`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: lastMsg, disputeId, draftCase })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to chat with assistant');
  return data.reply;
}

// Mock demo compatibility wrappers
export async function uploadEvidenceToS3(file, disputeId) {
  try {
    const data = await uploadDisputeEvidence(disputeId || 'temp', [file], 'Customer Proof');
    return { url: data.dispute_evidence?.[0]?.file_url || '/uploads/mock.pdf' };
  } catch (e) {
    return { url: URL.createObjectURL(file) };
  }
}

export async function analyzeEvidence(bucket, key) {
  return [{ Name: 'Document Verified' }, { Name: 'Invoice Legitimate' }];
}

export async function simulateMerchantResponse(verdict, reasoning) {
  return {
    response: "Merchant will comply with Cashfree dispute determination.",
    willingness: "Accepts final evidence review"
  };
}
