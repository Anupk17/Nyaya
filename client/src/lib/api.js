const API_BASE = import.meta.env.VITE_API_URL || '/api';

/**
 * Fetch all cases
 */
export async function fetchCases() {
  const res = await fetch(`${API_BASE}/cases`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch cases');
  return data.cases;
}

/**
 * Fetch a single case by ID
 */
export async function fetchCase(caseId) {
  const res = await fetch(`${API_BASE}/cases/${caseId}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch case');
  return data;
}

/**
 * Run the resolution pipeline for a case via SSE
 * Returns an EventSource-like interface
 */
export function resolveCase(caseId, onEvent) {
  return new Promise((resolve, reject) => {
    // Use fetch with streaming for POST + SSE
    fetch(`${API_BASE}/cases/${caseId}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
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
          buffer = lines.pop(); // Keep incomplete line in buffer

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
 * Approve a medium-confidence verdict
 */
export async function approveCase(caseId) {
  const res = await fetch(`${API_BASE}/cases/${caseId}/approve`, { method: 'POST' });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to approve case');
  return data;
}

/**
 * Reject a verdict
 */
export async function rejectCase(caseId) {
  const res = await fetch(`${API_BASE}/cases/${caseId}/reject`, { method: 'POST' });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to reject case');
  return data;
}

/**
 * Fetch aggregate stats for the Impact dashboard
 */
export async function fetchStats() {
  const res = await fetch(`${API_BASE}/stats`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch stats');
  return data.stats;
}

/**
 * Send chat message and attachments to Nyaya AI Dispute Copilot
 */
export async function sendDisputeChatMessage(messages, attachments = [], draftCase = {}) {
  const res = await fetch(`${API_BASE}/chat-assistant`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, attachments, draftCase })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to send message');
  return data.reply;
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
 * Upload a file directly to S3 using a presigned URL
 */
export async function uploadEvidenceToS3(file, disputeId) {
  try {
    // 1. Get presigned URL
    const res = await fetch(`${API_BASE}/evidence/upload-url?filename=${encodeURIComponent(file.name)}&contentType=${encodeURIComponent(file.type)}&disputeId=${disputeId || ''}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to get upload URL');

    // 2. Upload to S3
    const formData = new FormData();
    Object.keys(data.fields).forEach(key => formData.append(key, data.fields[key]));
    formData.append('file', file);

    const uploadRes = await fetch(data.url, {
      method: 'POST',
      body: formData
    });

    if (!uploadRes.ok) throw new Error('Failed to upload file to S3');

    return { bucket: data.bucket, key: data.key, url: `${data.url}/${data.key}` };
  } catch (e) {
    console.warn("S3 Upload Failed (AWS not configured). Using Mock Demo Upload:", e);
    // Return a fake bucket/key so analyzeEvidence can proceed
    return { 
      bucket: 'nyaya-demo-bucket', 
      key: `mock/${file.name}`, 
      url: URL.createObjectURL(file) 
    };
  }
}

/**
 * Trigger Rekognition analysis on uploaded S3 object
 */
export async function analyzeEvidence(bucket, key) {
  const res = await fetch(`${API_BASE}/evidence/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bucket, key })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to analyze evidence');
  return data.labels;
}

/**
 * Simulate merchant response
 */
export async function simulateMerchantResponse(verdict, reasoning) {
  const res = await fetch(`${API_BASE}/simulate-merchant-response`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ verdict, reasoning })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to simulate merchant response');
  return data.data;
}
/**
 * Translate text to English using Sarvam AI
 */
export async function translateToEnglish(text) {
  const res = await fetch(`${API_BASE}/sarvam/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to translate');
  return data.translated;
}

/**
 * Transcribe audio to text using Sarvam AI STT
 */
export async function transcribeAudio(audioBlob) {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'audio.webm');
  
  const res = await fetch(`${API_BASE}/sarvam/stt`, {
    method: 'POST',
    body: formData
  });
  
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to transcribe audio');
  return data.text;
}
